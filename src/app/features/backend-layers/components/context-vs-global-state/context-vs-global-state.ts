import { Component, computed, signal } from '@angular/core';
import { SAMPLE_CONTEXTS } from '../../engine/backend-simulator';

@Component({
  selector: 'app-context-vs-global-state',
  standalone: true,
  template: `
    <section class="lab-section" id="context-vs-global">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 17 — REQUEST CONTEXT vs GLOBAL STATE</p>
        <h2 class="lab-title">Two requests. Two contexts. Never mixed.</h2>

        <div class="lab-panel">
          <div class="compare-grid">
            <div class="compare-col is-bad">
              <p class="compare-title mono">GLOBAL STATE</p>
              <p class="compare-item">✕ shared across requests</p>
              <p class="compare-item">✕ concurrency problems</p>
              <p class="compare-item">✕ accidental leakage</p>
              <p class="compare-item">✕ difficult reasoning</p>
            </div>
            <div class="compare-col is-good">
              <p class="compare-title mono">REQUEST CONTEXT</p>
              <p class="compare-item">✓ scoped to one request</p>
              <p class="compare-item">✓ tied to the request lifecycle</p>
              <p class="compare-item">✓ useful for metadata</p>
              <p class="compare-item">✓ isolated between requests</p>
            </div>
          </div>

          <p class="lab-index" style="margin-top:32px">TWO CONCURRENT REQUESTS — REQUEST CONTEXT</p>
          <div class="ctx-pair mono">
            @for (c of contexts; track c.requestId) {
              <div class="ctx-card">
                <p class="ctx-req">{{ c.requestId }}</p>
                <p class="ctx-field">userId: {{ c.userId }}</p>
                <p class="ctx-field">role: {{ c.role }}</p>
              </div>
            }
          </div>
          <p class="lab-note">Each request gets its own isolated context object. Alice's request never sees Bob's userId, even running concurrently on the same server.</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="simulateRace()">Simulate a Global Variable Instead</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          @if (racing()) {
            <div class="race-box mono">
              <p class="race-line">currentUser = {{ globalUser() }}</p>
              <p class="race-warn">⚠ Request A read currentUser expecting "Alice" — but Request B just overwrote it with "{{ globalUser() }}". Request A now acts on the wrong identity.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .compare-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 700px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-title { font-size: 0.6875rem; letter-spacing: 0.06em; margin-bottom: 10px; }
    .compare-col.is-bad .compare-title { color: var(--danger); }
    .compare-col.is-good .compare-title { color: var(--accent-2); }
    .compare-item { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }

    .ctx-pair { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
    .ctx-card { padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); min-width: 160px; }
    .ctx-req { font-size: 0.8125rem; color: var(--accent-strong); font-weight: 700; }
    .ctx-field { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

    .race-box { margin-top: 20px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--danger); border-radius: var(--radius-md); }
    .race-line { font-size: 0.8125rem; color: var(--text); }
    .race-warn { font-size: 0.8125rem; color: var(--danger); margin-top: 8px; line-height: 1.5; }
  `,
})
export class ContextVsGlobalState {
  protected readonly contexts = SAMPLE_CONTEXTS;
  protected readonly racing = signal(false);
  protected readonly globalUser = signal('Alice');
  private timer: ReturnType<typeof setTimeout> | null = null;

  simulateRace(): void {
    this.racing.set(true);
    this.globalUser.set('Alice');
    this.timer = setTimeout(() => this.globalUser.set('Bob'), 900);
  }

  reset(): void {
    if (this.timer) clearTimeout(this.timer);
    this.racing.set(false);
    this.globalUser.set('Alice');
  }
}
