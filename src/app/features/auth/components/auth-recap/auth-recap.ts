import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-auth-recap',
  standalone: true,
  template: `
    <section class="lab-section" id="auth-matrix">
      <div class="container">
        <p class="lab-index">AUTH / 45 — AUTHENTICATION VS. AUTHORIZATION MATRIX</p>
        <h2 class="lab-title">Click a row to see which gate it belongs to.</h2>

        <div class="matrix-list">
          @for (row of rows; track row.question; let i = $index) {
            <button type="button" class="matrix-row" [class.is-active]="activeRow() === i" (click)="activeRow.set(activeRow() === i ? null : i)">
              <span class="row-question">{{ row.question }}</span>
              <span class="row-tag mono" [class.is-authn]="row.column === 'authn'" [class.is-authz]="row.column === 'authz'">
                {{ row.column === 'authn' ? 'AUTHENTICATION' : 'AUTHORIZATION' }}
              </span>
            </button>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="misconceptions">
      <div class="container">
        <p class="lab-index">AUTH / 46 — COMMON MISCONCEPTIONS</p>
        <h2 class="lab-title">Myth vs. reality.</h2>

        <div class="myth-grid">
          @for (m of myths; track m.myth) {
            <div class="myth-card">
              <p class="myth-label mono">MYTH</p>
              <p class="myth-text">"{{ m.myth }}"</p>
              <p class="reality-label mono">REALITY</p>
              <p class="reality-text">{{ m.reality }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="security-checklist">
      <div class="container">
        <p class="lab-index">AUTH / 47 — SECURITY CHECKLIST</p>
        <h2 class="lab-title">What a serious implementation actually covers.</h2>

        <div class="checklist-grid">
          @for (group of checklistGroups; track group.title) {
            <div class="checklist-card">
              <p class="checklist-title mono">{{ group.title }}</p>
              <ul>
                @for (item of group.items; track item) {
                  <li><span class="check-mark">✓</span> {{ item }}</li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .matrix-list { margin-top: 28px; display: flex; flex-direction: column; gap: 8px; }
    .matrix-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      text-align: left;
    }
    .matrix-row.is-active { border-color: var(--accent); }
    .row-question { font-size: 0.9375rem; color: var(--text); }
    .row-tag { font-size: 0.6875rem; padding: 4px 10px; border-radius: 999px; flex-shrink: 0; }
    .row-tag.is-authn { color: var(--accent-2); border: 1px solid var(--accent-2-dim); }
    .row-tag.is-authz { color: var(--accent); border: 1px solid var(--accent-dim); }

    .myth-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 800px) { .myth-grid { grid-template-columns: 1fr 1fr; } }
    .myth-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .myth-label { font-size: 0.6875rem; color: var(--danger); letter-spacing: 0.06em; }
    .myth-text { margin-top: 6px; font-size: 0.9375rem; color: var(--text); font-style: italic; }
    .reality-label { margin-top: 14px; font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; }
    .reality-text { margin-top: 6px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .checklist-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 800px) { .checklist-grid { grid-template-columns: repeat(2, 1fr); } }
    .checklist-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .checklist-title { font-size: 0.8125rem; color: var(--accent-2); margin-bottom: 12px; }
    .checklist-card ul { display: flex; flex-direction: column; gap: 8px; }
    .checklist-card li { font-size: 0.8125rem; color: var(--text-muted); display: flex; gap: 8px; }
    .check-mark { color: var(--accent-2); flex-shrink: 0; }
  `,
})
export class AuthRecap {
  protected readonly activeRow = signal<number | null>(null);

  protected readonly rows: { question: string; column: 'authn' | 'authz' }[] = [
    { question: 'Who are you?', column: 'authn' },
    { question: 'Are your credentials valid?', column: 'authn' },
    { question: 'What can you access?', column: 'authz' },
    { question: 'Can you delete this resource?', column: 'authz' },
    { question: 'Which identity is making the request?', column: 'authn' },
    { question: 'Is this action allowed?', column: 'authz' },
  ];

  protected readonly myths = [
    { myth: 'Authentication and authorization are the same.', reality: 'Authentication identifies the requester. Authorization determines the allowed actions.' },
    { myth: 'JWT means authentication.', reality: 'JWT is a token format — how it is issued and validated is what determines any security guarantee.' },
    { myth: 'The JWT payload is encrypted.', reality: 'Typical JWT payloads are encoded and signed, not inherently encrypted.' },
    { myth: 'OAuth is authentication.', reality: 'OAuth is primarily an authorization/delegation framework. OIDC adds an identity/authentication layer on top.' },
    { myth: 'If a user is authenticated, they can access the resource.', reality: 'Every protected operation still requires its own authorization check.' },
    { myth: '403 means "not logged in."', reality: '401 generally indicates missing or invalid authentication. 403 indicates insufficient permission for an authenticated request.' },
    { myth: 'Encrypting passwords is enough.', reality: 'Passwords should generally be protected with dedicated password hashing, not reversible encryption.' },
  ];

  protected readonly checklistGroups = [
    { title: 'Authentication', items: ['Strong password hashing', 'Unique salts', 'MFA where appropriate', 'Secure credential handling', 'Generic authentication errors', 'Rate limiting / abuse protection'] },
    { title: 'Sessions', items: ['Secure & HttpOnly cookies', 'SameSite where appropriate', 'Expiration & idle timeout', 'Rotation on login', 'Invalidation on logout'] },
    { title: 'Tokens', items: ['Short-lived access tokens where appropriate', 'Correct audience/issuer checks', 'Appropriate key management', 'Refresh token protection', 'A revocation strategy'] },
    { title: 'Authorization', items: ['Server-side authorization on every request', 'Resource-level checks (not just role checks)', 'Least privilege by default', 'Policy enforcement, not just role lookup'] },
  ];
}
