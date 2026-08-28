import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-token-lifecycle',
  standalone: true,
  template: `
    <section class="lab-section" id="jwt-revocation">
      <div class="container">
        <p class="lab-index">AUTH / 22 — THE JWT REVOCATION PROBLEM</p>
        <h2 class="lab-title">A token issued at 10:00 doesn't know it was supposed to stop working at 10:10.</h2>

        <div class="lab-panel revocation-panel">
          <div class="timeline-track mono">
            <div class="tl-event"><span class="tl-time">10:00</span><span class="tl-label">Alice logs in — token issued, expires in 1 hour</span></div>
            <div class="tl-event"><span class="tl-time">10:10</span><span class="tl-label">Admin disables Alice's account</span></div>
            <div class="tl-event"><span class="tl-time">10:15</span><span class="tl-label">Alice's browser sends a request with the same token</span></div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="reveal.set(true)">What happens to the request?</button>
          </div>

          @if (reveal()) {
            <div class="revocation-result">
              <p class="result-line">A purely stateless token is still cryptographically valid — the signature still checks out, and the token has not expired yet.</p>
              <p class="result-line is-warn">Without an additional mechanism, the request may still succeed until the token's natural expiration.</p>
            </div>
          }

          <p class="lab-note">Common strategies: short-lived access tokens, refresh tokens that can be revoked server-side, token revocation lists, and token/session versioning. No single approach is universally correct.</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="access-vs-refresh">
      <div class="container">
        <p class="lab-index">AUTH / 23 — ACCESS TOKEN VS. REFRESH TOKEN</p>
        <h2 class="lab-title">A short-lived key, and a longer-lived way to get a new one.</h2>

        <div class="lifecycle-diagram mono">
          <div class="lc-node">Login</div>
          <div class="lc-arrow">↓</div>
          <div class="lc-pair">
            <div class="lc-node accent">Access Token<span class="lc-sub">short lifetime · used for API calls</span></div>
            <div class="lc-node accent2">Refresh Token<span class="lc-sub">longer lifetime · used to get a new access token</span></div>
          </div>
          <div class="lc-arrow">↓ access token expires</div>
          <div class="lc-node">Refresh Token → Authorization Server</div>
          <div class="lc-arrow">↓</div>
          <div class="lc-node accent">New Access Token</div>
        </div>

        <p class="lab-note">Exact implementations vary considerably between systems — this is the shape of the idea, not a fixed standard.</p>
      </div>
    </section>

    <section class="lab-section" id="token-storage">
      <div class="container">
        <p class="lab-index">AUTH / 24 — TOKEN STORAGE TRADEOFFS</p>
        <h2 class="lab-title">"Where should a token live?" has no single right answer.</h2>

        <div class="storage-grid">
          @for (opt of storageOptions; track opt.name) {
            <div class="storage-card">
              <p class="storage-name mono">{{ opt.name }}</p>
              <p class="storage-risk"><strong>Main risk:</strong> {{ opt.risk }}</p>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          The right choice depends on browser architecture, the threat model, same-site vs. cross-site
          requirements, and overall API design — not a single universal rule.
        </p>
      </div>
    </section>
  `,
  styles: `
    .revocation-panel { margin-top: 24px; }
    .timeline-track { display: flex; flex-direction: column; gap: 10px; }
    .tl-event { display: flex; gap: 14px; align-items: baseline; }
    .tl-time { color: var(--accent-2); font-size: 0.75rem; flex: 0 0 50px; }
    .tl-label { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-sans); }

    .revocation-result { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .result-line { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
    .result-line.is-warn { color: var(--accent); font-weight: 600; }

    .lifecycle-diagram { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
    .lc-node { padding: 10px 20px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); font-size: 0.8125rem; background: var(--surface-raised); }
    .lc-node.accent { border-color: var(--accent-dim); color: var(--accent-strong); }
    .lc-node.accent2 { border-color: var(--accent-2-dim); color: var(--accent-2); }
    .lc-sub { display: block; font-size: 0.625rem; color: var(--text-faint); margin-top: 4px; font-family: var(--font-sans); }
    .lc-pair { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
    .lc-arrow { color: var(--text-faint); font-size: 0.75rem; }

    .storage-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 800px) { .storage-grid { grid-template-columns: repeat(3, 1fr); } }
    .storage-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .storage-name { font-size: 0.8125rem; color: var(--accent-2); margin-bottom: 10px; }
    .storage-risk { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class TokenLifecycle {
  protected readonly reveal = signal(false);

  protected readonly storageOptions = [
    { name: 'HttpOnly Cookie', risk: 'Not directly readable by scripts, but can be a CSRF vector if not paired with defenses like SameSite.' },
    { name: 'In-memory application state', risk: 'Lost on page refresh; reduces persistence but limits some theft vectors.' },
    { name: 'Browser storage (localStorage/sessionStorage)', risk: 'Persists across reloads, but is readable by any script running on the page — a bigger concern if XSS occurs.' },
  ];
}
