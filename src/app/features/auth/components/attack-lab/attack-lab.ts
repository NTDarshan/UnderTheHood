import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-attack-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="attack-lab">
      <div class="container">
        <p class="lab-index">AUTH / 39 — HOW AUTHENTICATION FAILS</p>
        <h2 class="lab-title">Understanding the shape of common failures — not how to exploit them.</h2>

        <div class="attack-grid">
          @for (a of attacks; track a.name) {
            <div class="attack-card">
              <p class="attack-name mono">{{ a.name }}</p>
              <p class="attack-text">{{ a.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="idor">
      <div class="container">
        <p class="lab-index">AUTH / 40 — BROKEN AUTHORIZATION / IDOR</p>
        <h2 class="lab-title">Authenticated ≠ authorized for this specific resource.</h2>

        <div class="lab-panel idor-panel">
          <p class="idor-line mono">GET /users/123/orders</p>
          <p class="idor-check"><span class="ok">✓</span> Is Alice authenticated? Yes.</p>
          <p class="idor-check"><span class="fail">✕</span> Does Alice own user 123? Never checked.</p>
          <p class="idor-result">Result: broken authorization — Alice can read another user's orders just by changing the ID in the URL.</p>
        </div>
        <p class="lab-note">Authentication alone does not establish permission to access every resource — each protected operation needs its own resource-level check.</p>
      </div>
    </section>

    <section class="lab-section" id="csrf">
      <div class="container">
        <p class="lab-index">AUTH / 41 — CSRF</p>
        <h2 class="lab-title">The browser attaches your cookie — even to a request you didn't mean to send.</h2>

        <div class="flow-chain mono">
          <span>User logged into bank.example</span><span class="arrow">↓</span>
          <span>Malicious site triggers POST /transfer</span><span class="arrow">↓</span>
          <span>Browser automatically attaches the auth cookie</span><span class="arrow">↓</span>
          <span>Bank request appears legitimate</span>
        </div>

        <p class="lab-note lab-note-warn">
          Cookie-based authentication can create CSRF considerations because browsers automatically
          attach cookies under applicable conditions — not because cookies are inherently unsafe.
        </p>
        <p class="lab-note">Common defenses: SameSite cookies, CSRF tokens, and origin/referer validation where appropriate.</p>
      </div>
    </section>

    <section class="lab-section" id="xss-vs-csrf">
      <div class="container">
        <p class="lab-index">AUTH / 42 — XSS VS. CSRF</p>
        <h2 class="lab-title">Different attack surfaces — don't conflate them.</h2>

        <div class="compare-grid">
          <div class="compare-card"><p class="compare-title mono">XSS</p><p class="compare-text">The attacker gets script execution running inside the application's own context.</p></div>
          <div class="compare-card"><p class="compare-title mono">CSRF</p><p class="compare-text">The attacker causes the victim's browser to send an unwanted request — no script execution in the app required.</p></div>
        </div>
      </div>
    </section>

    <section class="lab-section" id="session-fixation">
      <div class="container">
        <p class="lab-index">AUTH / 43 — SESSION FIXATION</p>
        <h2 class="lab-title">Don't let a pre-login session ID survive login.</h2>

        <div class="bad-good">
          <div class="flow-card is-bad">
            <p class="flow-label mono">BAD</p>
            <p class="flow-text">Attacker obtains a session ID → victim logs in using that same ID → the session remains attacker-known.</p>
          </div>
          <div class="flow-card is-good">
            <p class="flow-label mono">GOOD</p>
            <p class="flow-text">Authentication → rotate the session identifier → a fresh, authenticated session the attacker never saw.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section" id="logout-lifetime">
      <div class="container">
        <p class="lab-index">AUTH / 44 — LOGOUT &amp; TOKEN LIFETIME</p>
        <h2 class="lab-title">"Logging out" means something different for sessions and tokens.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="!statelessMode()" (click)="statelessMode.set(false)">Stateful session</button>
          <button type="button" class="lab-btn" [class.is-active]="statelessMode()" (click)="statelessMode.set(true)">Stateless token</button>
        </div>

        <div class="lab-panel logout-panel">
          @if (!statelessMode()) {
            <div class="flow-chain mono"><span>Logout</span><span class="arrow">↓</span><span>Invalidate server-side session</span><span class="arrow">↓</span><span>Session ID no longer works</span></div>
            <p class="lab-note">Effective immediately — the server simply stops recognizing the identifier.</p>
          } @else {
            <div class="flow-chain mono"><span>Logout</span><span class="arrow">↓</span><span>Client discards the token</span><span class="arrow">↓</span><span>Token may remain cryptographically valid</span></div>
            <p class="lab-note">Immediate revocation requires an additional mechanism — this connects directly back to the JWT revocation problem above.</p>
          }
        </div>

        <div class="lifetime-track mono">
          <span class="lt-label">Access token</span>
          <span class="lt-bar">issued ───────────────── expires</span>
        </div>
        <p class="lab-note">Longer lifetime: more convenient, larger exposure window if stolen. Shorter lifetime: smaller exposure window, more frequent renewal. There is no universal "correct" duration.</p>
      </div>
    </section>
  `,
  styles: `
    .attack-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 700px) { .attack-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .attack-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .attack-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .attack-name { font-size: 0.8125rem; color: var(--danger); margin-bottom: 8px; }
    .attack-text { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .idor-panel { margin-top: 24px; }
    .idor-line { color: var(--accent-strong); font-size: 0.875rem; margin-bottom: 14px; }
    .idor-check { font-size: 0.875rem; color: var(--text-muted); margin-top: 6px; }
    .ok { color: var(--accent-2); }
    .fail { color: var(--danger); }
    .idor-result { margin-top: 14px; font-size: 0.875rem; color: var(--danger); font-weight: 600; }

    .flow-chain { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .compare-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .compare-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 8px; }
    .compare-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .bad-good { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 800px) { .bad-good { grid-template-columns: 1fr 1fr; } }
    .flow-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .flow-card.is-bad { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .flow-card.is-good { border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }
    .flow-label { font-size: 0.6875rem; letter-spacing: 0.1em; }
    .is-bad .flow-label { color: var(--danger); }
    .is-good .flow-label { color: var(--accent-2); }
    .flow-text { margin-top: 10px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .logout-panel { margin-top: 24px; }

    .lifetime-track { margin-top: 28px; display: flex; align-items: center; gap: 14px; font-size: 0.8125rem; }
    .lt-label { color: var(--accent-2); flex-shrink: 0; }
    .lt-bar { color: var(--text-faint); }
  `,
})
export class AttackLab {
  protected readonly statelessMode = signal(false);

  protected readonly attacks = [
    { name: 'Username enumeration', text: 'Distinguishing "no such user" from "wrong password" lets an attacker map which accounts exist.' },
    { name: 'Credential stuffing', text: 'Reusing leaked username/password pairs from other breaches against this system.' },
    { name: 'Session fixation', text: 'Forcing a victim to authenticate under a session ID the attacker already knows.' },
    { name: 'Stolen session', text: 'An intercepted session identifier lets an attacker act as the victim until it expires or is revoked.' },
    { name: 'Token theft', text: 'An access or refresh token captured via XSS, logs, or insecure storage grants the attacker its full lifetime of access.' },
    { name: 'CSRF', text: 'The victim\'s browser is tricked into sending an authenticated request the victim never intended.' },
    { name: 'XSS impact on token access', text: 'Script injection can read tokens stored somewhere JavaScript can reach.' },
    { name: 'Broken authorization / IDOR', text: 'Authentication succeeds but the specific resource-level permission check is missing.' },
    { name: 'Excessive token lifetime', text: 'A very long-lived token widens the window an attacker can use a stolen credential.' },
  ];
}
