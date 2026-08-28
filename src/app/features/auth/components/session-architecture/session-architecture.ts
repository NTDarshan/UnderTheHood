import { Component, signal } from '@angular/core';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

@Component({
  selector: 'app-session-architecture',
  standalone: true,
  imports: [TermTip],
  template: `
    <section class="lab-section" id="sessions">
      <div class="container">
        <p class="lab-index">AUTH / 11 — STATEFUL AUTHENTICATION</p>
        <h2 class="lab-title">The server remembers you, so you don't have to prove it twice.</h2>

        <div class="flow-chain mono">
          <span>Client</span><span class="arrow">↓</span>
          <span>Login</span><span class="arrow">↓</span>
          <span>Server creates session</span><span class="arrow">↓</span>
          <span>Session ID</span><span class="arrow">→</span>
          <span>Client</span>
        </div>
        <div class="flow-chain mono">
          <span>Subsequent request</span><span class="arrow">→</span>
          <span>Session ID</span><span class="arrow">↓</span>
          <span>Server</span><span class="arrow">↓</span>
          <span>Session Store</span><span class="arrow">↓</span>
          <span>User Identity</span>
        </div>

        <div class="lab-panel session-record">
          <p class="session-id mono">SESSION ID: abc123xyz</p>
          <p class="arrow-down mono">↓ (looked up server-side)</p>
          <p class="session-data mono">user = Alice<br />role = Editor</p>
        </div>

        <p class="lab-note">The important concept: <strong>the server maintains authentication state</strong> — the session ID is only useful because the server can look it up.</p>
      </div>
    </section>

    <section class="lab-section" id="session-scaling">
      <div class="container">
        <p class="lab-index">AUTH / 12 — SESSION STORAGE EVOLUTION</p>
        <h2 class="lab-title">Where does that session actually live?</h2>

        <div class="evolution-chain mono">
          <span>File-based sessions</span><span class="arrow">↓</span>
          <span>Process memory</span><span class="arrow">↓</span>
          <span>Shared session store</span><span class="arrow">↓</span>
          <span>Redis / distributed cache</span>
        </div>

        <div class="lab-panel scaling-panel">
          <div class="scaling-controls lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!shared()" (click)="shared.set(false)">In-memory sessions</button>
            <button type="button" class="lab-btn" [class.is-active]="shared()" (click)="shared.set(true)">Shared session store</button>
          </div>

          <div class="scaling-diagram mono">
            <div class="req-row">
              <span class="server-box">Request 1 → Server A</span>
              <span class="server-box">Request 2 → Server B</span>
            </div>
            @if (!shared()) {
              <p class="scaling-result is-fail">Server B: "Who is this?" — the session only exists in Server A's memory.</p>
            } @else {
              <div class="shared-store">
                <span>Server A</span><span>Server B</span><span>Server C</span>
              </div>
              <p class="arrow-down mono">↓ ↓ ↓</p>
              <p class="scaling-result is-ok">Shared Session Store — every server can resolve the same session ID to the same identity.</p>
            }
          </div>

          <p class="lab-note">Distributed applications running server-side sessions typically need a shared store precisely because any request can land on any server.</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="session-vs-user-id">
      <div class="container">
        <p class="lab-index">AUTH / 13 — SESSION ID VS. USER ID</p>
        <h2 class="lab-title">An opaque handle, not an identity card.</h2>
        <div class="flow-chain mono">
          <span>Session ID</span><span class="arrow">↓</span>
          <span>Server-side record</span><span class="arrow">↓</span>
          <span>User identity + session metadata</span>
        </div>
        <p class="lab-note">A <app-term def="A random, meaningless-on-its-own identifier that only gains meaning through a server-side lookup.">session ID</app-term> is not the same thing as a user ID — it should be an opaque reference, not a container for sensitive identity information.</p>
      </div>
    </section>

    <section class="lab-section" id="session-security">
      <div class="container">
        <p class="lab-index">AUTH / 14 — SESSION SECURITY</p>
        <h2 class="lab-title">What a well-formed session cookie actually needs.</h2>

        <div class="lab-panel cookie-checklist">
          <p class="cookie-mock mono">Browser Cookie</p>
          @for (item of checklist; track item.name) {
            <div class="check-row">
              <span class="check-name mono">{{ item.name }}</span>
              <span class="check-detail">{{ item.detail }}</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .flow-chain { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .session-record { margin-top: 24px; text-align: center; }
    .session-id { color: var(--accent-strong); font-size: 0.9375rem; }
    .arrow-down { color: var(--text-faint); margin: 8px 0; }
    .session-data { color: var(--accent-2); font-size: 0.875rem; }

    .evolution-chain { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .evolution-chain .arrow { color: var(--text-faint); }

    .scaling-panel { margin-top: 20px; }
    .scaling-diagram { margin-top: 20px; text-align: center; }
    .req-row { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
    .server-box { padding: 8px 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-muted); }
    .shared-store { display: flex; justify-content: center; gap: 24px; margin-top: 10px; color: var(--text-faint); font-size: 0.75rem; }
    .scaling-result { margin-top: 14px; font-size: 0.875rem; font-weight: 600; }
    .scaling-result.is-fail { color: var(--danger); }
    .scaling-result.is-ok { color: var(--accent-2); }

    .cookie-checklist { margin-top: 24px; }
    .cookie-mock { color: var(--accent-strong); font-size: 0.875rem; margin-bottom: 16px; }
    .check-row { display: grid; grid-template-columns: 1fr; gap: 2px; padding: 10px 0; border-top: 1px solid var(--border); }
    @media (min-width: 700px) { .check-row { grid-template-columns: 160px 1fr; align-items: baseline; } }
    .check-name { color: var(--accent-2); font-size: 0.8125rem; }
    .check-detail { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class SessionArchitecture {
  protected readonly shared = signal(false);

  protected readonly checklist = [
    { name: 'Secure', detail: 'Cookie is only sent over HTTPS connections.' },
    { name: 'HttpOnly', detail: 'Client-side scripts cannot directly read the cookie value.' },
    { name: 'SameSite', detail: 'Controls whether the cookie is sent on cross-site requests.' },
    { name: 'Expiration', detail: 'A session should not remain valid forever.' },
    { name: 'Idle timeout', detail: 'A session left untouched for too long is invalidated.' },
    { name: 'Rotation', detail: 'The session identifier changes after a privilege change, such as login.' },
    { name: 'Logout / invalidation', detail: 'Logging out actually destroys the server-side record, not just the cookie.' },
    { name: 'Fixation protection', detail: 'A pre-login session ID is never reused as the authenticated session ID.' },
  ];
}
