import { Component, computed, signal } from '@angular/core';
import { checkAccess } from '../../engine/auth-simulator';

type Case = 'no-auth' | 'viewer-delete';

@Component({
  selector: 'app-request-pipeline',
  standalone: true,
  template: `
    <section class="lab-section" id="401-vs-403">
      <div class="container">
        <p class="lab-index">AUTH / 36 — 401 VS. 403</p>
        <h2 class="lab-title">"You're not who I can verify" vs. "I know who you are — but no."</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="activeCase() === 'no-auth'" (click)="activeCase.set('no-auth')">Request A — no credential</button>
          <button type="button" class="lab-btn" [class.is-active]="activeCase() === 'viewer-delete'" (click)="activeCase.set('viewer-delete')">Request B — authenticated Viewer tries DELETE</button>
        </div>

        <div class="lab-panel status-panel">
          <p class="status-code mono" [class.is-401]="result().status === 401" [class.is-403]="result().status === 403">{{ result().statusLabel }}</p>
          <p class="status-reason">{{ result().reason }}</p>
        </div>

        <div class="definition-grid">
          <div class="definition-card">
            <p class="def-title mono">401 UNAUTHORIZED</p>
            <p class="def-text">The request lacks valid authentication. Conceptually: "You are not successfully authenticated."</p>
          </div>
          <div class="definition-card">
            <p class="def-title mono">403 FORBIDDEN</p>
            <p class="def-text">The identity is known, but the action is not allowed. Conceptually: "I know who you are, but you cannot do this."</p>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section" id="complete-pipeline">
      <div class="container">
        <p class="lab-index">AUTH / 37 — THE COMPLETE REQUEST PIPELINE</p>
        <h2 class="lab-title">DELETE /documents/123 — followed end to end.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="runPipeline(true)" [disabled]="playing()">▶ Run as Admin (allowed)</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="runPipeline(false)" [disabled]="playing()">▶ Run as Viewer (denied)</button>
        </div>

        <div class="pipeline mono">
          <div class="pl-node" [class.is-active]="stage() >= 0">CLIENT</div>
          <div class="pl-arrow">↓</div>
          <div class="pl-node" [class.is-active]="stage() >= 1">HTTP REQUEST</div>
          <div class="pl-arrow">↓</div>
          <div class="pl-node gate" [class.is-active]="stage() >= 2">
            <span>Authentication</span><span class="pl-sub">Who are you?</span>
          </div>
          <div class="pl-arrow">↓</div>
          <div class="pl-node" [class.is-active]="stage() >= 3">Identity / Claims</div>
          <div class="pl-arrow">↓</div>
          <div class="pl-node gate" [class.is-active]="stage() >= 4">
            <span>Authorization</span><span class="pl-sub">Can you do this?</span>
          </div>
          <div class="pl-branches">
            <div class="pl-branch">
              <div class="pl-arrow">↙</div>
              <div class="pl-node outcome allow" [class.is-active]="stage() >= 5 && allowed()">ALLOW</div>
              <div class="pl-arrow">↓</div>
              <div class="pl-node" [class.is-active]="stage() >= 6 && allowed()">Business Logic</div>
              <div class="pl-arrow">↓</div>
              <div class="pl-node" [class.is-active]="stage() >= 7 && allowed()">Database</div>
            </div>
            <div class="pl-branch">
              <div class="pl-arrow">↘</div>
              <div class="pl-node outcome deny" [class.is-active]="stage() >= 5 && !allowed()">403</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .status-panel { margin-top: 24px; text-align: center; }
    .status-code { font-size: 1.25rem; font-weight: 700; }
    .status-code.is-401 { color: var(--danger); }
    .status-code.is-403 { color: var(--accent); }
    .status-reason { margin-top: 10px; font-size: 0.9375rem; color: var(--text-muted); }

    .definition-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .definition-grid { grid-template-columns: 1fr 1fr; } }
    .definition-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .def-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 8px; }
    .def-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .pipeline { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .pl-node {
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-faint);
      font-size: 0.75rem;
      transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .pl-node.is-active { color: var(--text); border-color: var(--accent); box-shadow: 0 0 16px var(--glow-accent); }
    .pl-node.gate span { display: block; }
    .pl-sub { font-size: 0.625rem; color: var(--text-faint); margin-top: 2px; }
    .pl-arrow { color: var(--border-strong); font-size: 0.75rem; }

    .pl-branches { display: flex; gap: 50px; margin-top: 4px; }
    .pl-branch { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .pl-node.outcome.allow.is-active { border-color: var(--accent-2); color: var(--accent-2); }
    .pl-node.outcome.deny.is-active { border-color: var(--danger); color: var(--danger); }
  `,
})
export class RequestPipeline {
  protected readonly activeCase = signal<Case>('no-auth');
  protected readonly result = computed(() =>
    this.activeCase() === 'no-auth'
      ? checkAccess(null, 'read')
      : checkAccess({ name: 'Alice', role: 'viewer', department: 'finance' }, 'delete'),
  );

  protected readonly stage = signal(-1);
  protected readonly playing = signal(false);
  protected readonly allowed = signal(true);

  async runPipeline(admin: boolean): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    this.allowed.set(admin);
    this.stage.set(-1);
    const steps = admin ? 8 : 6;
    for (let i = 0; i < steps; i++) {
      this.stage.set(i);
      await wait(500);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
