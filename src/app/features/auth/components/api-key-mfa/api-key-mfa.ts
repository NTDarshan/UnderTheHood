import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-api-key-mfa',
  standalone: true,
  template: `
    <section class="lab-section" id="api-keys">
      <div class="container">
        <p class="lab-index">AUTH / 30 — API KEY AUTHENTICATION</p>
        <h2 class="lab-title">When the caller is a machine, not a human.</h2>

        <div class="flow-chain mono">
          <span>Service A</span><span class="arrow">↓</span>
          <span>API Key</span><span class="arrow">↓</span>
          <span>Service B</span>
        </div>

        <div class="compare-grid">
          <div class="compare-card">
            <p class="compare-title mono">HUMAN AUTHENTICATION</p>
            <p class="compare-text">Interactive login, sessions, MFA, short-lived tokens tied to a person.</p>
          </div>
          <div class="compare-card">
            <p class="compare-title mono">MACHINE AUTHENTICATION</p>
            <p class="compare-text">A long-lived key configured once, used programmatically without a login step.</p>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          API keys are convenient but come with real limitations: they are long-lived credentials,
          leakage is a serious risk, permissions are often coarse-grained, and rotation has to be
          handled deliberately. An API key is not automatically equivalent to a user's identity.
        </p>
      </div>
    </section>

    <section class="lab-section" id="mfa">
      <div class="container">
        <p class="lab-index">AUTH / 31 — MULTI-FACTOR AUTHENTICATION</p>
        <h2 class="lab-title">One secret is fragile. Combine categories of proof.</h2>

        <div class="factor-grid">
          <div class="factor-card"><p class="factor-title mono">SOMETHING YOU KNOW</p><p class="factor-example">Password</p></div>
          <div class="factor-plus">+</div>
          <div class="factor-card"><p class="factor-title mono">SOMETHING YOU HAVE</p><p class="factor-example">Security key / authenticator code</p></div>
          <div class="factor-plus">+</div>
          <div class="factor-card"><p class="factor-title mono">SOMETHING YOU ARE</p><p class="factor-example">Biometric</p></div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="!mfaEnabled()" (click)="mfaEnabled.set(false)">Password only</button>
          <button type="button" class="lab-btn" [class.is-active]="mfaEnabled()" (click)="mfaEnabled.set(true)">Password + security key</button>
        </div>

        <div class="lab-panel mfa-flow mono">
          @if (!mfaEnabled()) {
            <p class="flow-step">Login → Password check → ✓ Authenticated</p>
            <p class="lab-note">A single compromised password is enough to authenticate.</p>
          } @else {
            <p class="flow-step">Login → Password check → Security key challenge → ✓ Authenticated</p>
            <p class="lab-note">A stolen password alone is no longer sufficient — the attacker would also need the physical second factor.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .flow-chain { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .compare-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .compare-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 8px; }
    .compare-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .factor-grid { margin-top: 28px; display: flex; flex-wrap: wrap; align-items: stretch; gap: 12px; justify-content: center; }
    .factor-card { flex: 1 1 180px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; text-align: center; }
    .factor-title { font-size: 0.6875rem; color: var(--accent-2); }
    .factor-example { margin-top: 10px; font-size: 0.9375rem; color: var(--text); }
    .factor-plus { align-self: center; color: var(--text-faint); font-size: 1.25rem; }

    .mfa-flow { margin-top: 24px; }
    .flow-step { font-size: 0.8125rem; color: var(--accent-strong); }
  `,
})
export class ApiKeyMfa {
  protected readonly mfaEnabled = signal(false);
}
