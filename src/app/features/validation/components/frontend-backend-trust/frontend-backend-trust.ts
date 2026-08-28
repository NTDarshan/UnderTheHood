import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-frontend-backend-trust',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="frontend-vs-backend">
      <div class="container">
        <p class="lab-index">VALIDATION / 16 — FRONTEND VS. BACKEND VALIDATION</p>
        <h2 class="lab-title">Two validations, two different jobs.</h2>

        <div class="split-grid">
          <div class="split-card">
            <p class="split-title mono">FRONTEND</p>
            <p class="split-purpose">Purpose: User Experience</p>
            <div class="flow-chain mono"><span>Email field</span><span class="arrow">↓</span><span>Immediate feedback</span><span class="arrow">↓</span><span>"Enter a valid email"</span></div>
          </div>
          <div class="split-card">
            <p class="split-title mono">BACKEND</p>
            <p class="split-purpose">Purpose: Security + Data Integrity</p>
            <div class="flow-chain mono"><span>HTTP Request</span><span class="arrow">↓</span><span>Validate</span><span class="arrow">↓</span><span>Accept / Reject</span></div>
          </div>
        </div>

        <p class="lab-note lab-note-warn">Frontend validation improves UX. Backend validation establishes the trust boundary.</p>
      </div>
    </section>

    <section class="lab-section" id="never-trust-client">
      <div class="container">
        <p class="lab-index">VALIDATION / 17 — "NEVER TRUST THE CLIENT"</p>
        <h2 class="lab-title">The backend can't know — or assume — where a request came from.</h2>

        <div class="clients-diagram mono">
          <div class="client-node">Browser</div>
          <div class="client-node">Postman</div>
          <div class="client-node">Malicious Script</div>
        </div>
        <p class="clients-arrow">↘ ↓ ↙</p>
        <div class="backend-node mono">SAME BACKEND VALIDATION BOUNDARY</div>

        <p class="lab-note">The backend must never assume "this request came from my own frontend, therefore it must be valid."</p>
      </div>
    </section>

    <section class="lab-section" id="bypass-simulator">
      <div class="container">
        <p class="lab-index">VALIDATION / 18 — FRONTEND BYPASS SIMULATOR</p>
        <h2 class="lab-title">What the UI allows says nothing about what the API allows.</h2>

        <div class="lab-panel bypass-panel">
          <div class="lab-field">
            <label for="qty-input">Quantity (frontend UI limits: 1–10)</label>
            <input id="qty-input" type="number" [ngModel]="quantity()" (ngModelChange)="quantity.set(+$event)" />
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="frontendPath()">Submit through the UI</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="bypassPath()">Bypass UI — send raw request with quantity = 999999</button>
          </div>

          @if (mode()) {
            <div class="bypass-result">
              <p>Frontend validation: <span [class.is-fail]="mode() === 'bypass'">{{ mode() === 'bypass' ? 'BYPASSED' : 'PASSED' }}</span></p>
              <p>Backend validation: <span [class.is-ok]="backendPasses()" [class.is-fail]="!backendPasses()">{{ backendPasses() ? '✓' : '✕ rejected — quantity outside 1–10' }}</span></p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="trust-boundary">
      <div class="container">
        <p class="lab-index">VALIDATION / 19 — THE TRUST BOUNDARY</p>
        <h2 class="lab-title">This chapter's signature visual.</h2>

        <div class="boundary-diagram mono">
          <p class="boundary-label">CLIENT</p>
          <p class="boundary-line">────────────────────────</p>
          <p class="boundary-warn">UNTRUSTED INPUT</p>
          <p class="boundary-line">────────────────────────</p>
          <div class="boundary-arrow">↓</div>
          <div class="boundary-box">
            <p class="box-title">BACKEND BOUNDARY</p>
            <p>Parse</p><p>Transform</p><p>Validate</p><p>Authorize</p>
          </div>
          <div class="boundary-arrow">↓</div>
          <p class="boundary-trusted">TRUSTED DATA</p>
          <div class="boundary-arrow">↓</div>
          <div class="boundary-box accent">
            <p class="box-title">APPLICATION BUSINESS LOGIC</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .split-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 800px) { .split-grid { grid-template-columns: 1fr 1fr; } }
    .split-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .split-title { font-size: 0.8125rem; color: var(--accent-2); }
    .split-purpose { margin-top: 6px; font-size: 0.875rem; color: var(--text-muted); }
    .flow-chain { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .clients-diagram { margin-top: 28px; display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
    .client-node { padding: 10px 20px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); color: var(--text-muted); font-size: 0.8125rem; }
    .clients-arrow { text-align: center; color: var(--text-faint); margin-top: 8px; }
    .backend-node { margin-top: 8px; text-align: center; padding: 12px 20px; border-radius: var(--radius-md); border: 1px solid var(--accent-dim); color: var(--accent-strong); font-size: 0.8125rem; }

    .bypass-panel { margin-top: 24px; }
    .bypass-result { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem; color: var(--text-muted); }
    .bypass-result .is-fail { color: var(--danger); font-weight: 600; }
    .bypass-result .is-ok { color: var(--accent-2); font-weight: 600; }

    .boundary-diagram { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .boundary-label { color: var(--text-faint); font-size: 0.8125rem; }
    .boundary-line { color: var(--border-strong); font-size: 0.75rem; }
    .boundary-warn { color: var(--danger); font-size: 0.75rem; }
    .boundary-arrow { color: var(--border-strong); }
    .boundary-box { margin-top: 4px; padding: 14px 24px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-raised); }
    .boundary-box.accent { border-color: var(--accent-dim); box-shadow: 0 0 16px var(--glow-accent); }
    .box-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 6px; }
    .boundary-trusted { color: var(--accent-2); font-size: 0.8125rem; }
  `,
})
export class FrontendBackendTrust {
  protected readonly quantity = signal(5);
  protected readonly mode = signal<'frontend' | 'bypass' | null>(null);

  protected readonly backendPasses = computed(() => {
    const q = this.mode() === 'bypass' ? 999999 : this.quantity();
    return q >= 1 && q <= 10;
  });

  frontendPath(): void {
    this.mode.set('frontend');
  }

  bypassPath(): void {
    this.mode.set('bypass');
  }
}
