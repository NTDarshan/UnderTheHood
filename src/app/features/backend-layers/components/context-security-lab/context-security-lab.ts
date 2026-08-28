import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-context-security-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="context-security">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 14 — REQUEST CONTEXT SECURITY LAB</p>
        <h2 class="lab-title">Client-supplied data is not the same as authenticated identity.</h2>

        <div class="lab-panel">
          <div class="attack-grid mono">
            <div class="attack-col">
              <p class="attack-title">CLIENT PAYLOAD</p>
              <pre class="lab-code mono">{{ '{' }}
  "userId": {{ claimedUserId() }},
  "amount": 100
{{ '}' }}</pre>
              <p class="attack-note is-danger">✕ Attacker-controlled — never trust this for identity.</p>
            </div>
            <div class="attack-col">
              <p class="attack-title">TRUSTED AUTHENTICATION</p>
              <pre class="lab-code mono">Authorization: Bearer •••
verified → userId = {{ trustedUserId }}</pre>
              <p class="attack-note is-good">✓ Derived from a verified token — this is truth.</p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="claimedUserId.set(999)">Set Payload userId = 999</button>
            <button type="button" class="lab-btn" (click)="claimedUserId.set(42)">Reset Payload userId = 42</button>
          </div>

          <div class="resolution mono">
            <p class="resolution-label">request context used by the service:</p>
            <p class="resolution-value">context.userId = {{ trustedUserId }}</p>
          </div>
          <p class="lab-note">
            Notice the payload's <code class="mono">userId</code> changed — but <code class="mono">context.userId</code> never did.
            Authorization decisions read the identity <em>authentication established</em>, never a field the client happened to send.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .attack-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .attack-grid { grid-template-columns: 1fr 1fr; } }
    .attack-title { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 8px; }
    .attack-note { font-size: 0.75rem; margin-top: 8px; }
    .attack-note.is-danger { color: var(--danger); }
    .attack-note.is-good { color: var(--accent-2); }

    .resolution { margin-top: 24px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--accent-dim); border-radius: var(--radius-md); }
    .resolution-label { font-size: 0.6875rem; color: var(--text-faint); }
    .resolution-value { font-size: 0.9375rem; color: var(--accent-strong); font-weight: 700; margin-top: 4px; }
  `,
})
export class ContextSecurityLab {
  protected readonly claimedUserId = signal(999);
  protected readonly trustedUserId = 42;
}
