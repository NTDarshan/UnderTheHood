import { Component, computed, signal } from '@angular/core';

type StoreBackend = 'file' | 'memory' | 'distributed';
type SameSite = 'Strict' | 'Lax' | 'None';

interface LifecycleEvent {
  id: string;
  label: string;
  desc: string;
}

const LIFECYCLE_EVENTS: LifecycleEvent[] = [
  { id: 'expire', label: 'Session expiration', desc: 'Time-based — the session stops being valid after a fixed lifetime, regardless of activity.' },
  { id: 'logout', label: 'Logout', desc: 'Explicit invalidation — the user asks the server to end the session right now.' },
  { id: 'revoke', label: 'Revocation', desc: 'Server-side kill-switch — e.g. after a password change, the server invalidates the session without the user asking.' },
  { id: 'idle', label: 'Idle timeout', desc: 'The session expires after a period of inactivity, even if its absolute lifetime hasn’t passed yet.' },
];

function randomId(len = 12): string {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

@Component({
  selector: 'app-sessions-cookies',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="sessions-cookies">
      <div class="container">
        <p class="lab-index">11 — SESSIONS &amp; COOKIES</p>
        <h2 class="lab-title">A session is server memory. A cookie is how the browser proves it.</h2>
        <p class="lab-lede">
          Three related mechanics: how sessions are created and looked up, how cookie attributes control what
          gets exposed, and how a session's identifier should change over its lifetime.
        </p>

        <!-- PART A -->
        <div class="lab-panel">
          <p class="lab-node">PART A — HOW A SESSION WORKS</p>
          <div class="session-flow">
            <div class="flow-node"><span class="mono node-label">LOGIN</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-server"><span class="mono node-label">SERVER CREATES SESSION</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-db"><span class="mono node-label">SESSION STORE</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node"><span class="mono node-label">SESSION ID</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-client"><span class="mono node-label">BROWSER COOKIE</span></div>
          </div>

          <p class="lab-node second-flow-label">SUBSEQUENT REQUEST</p>
          <div class="session-flow">
            <div class="flow-node node-client"><span class="mono node-label">REQUEST + COOKIE</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-server"><span class="mono node-label">SERVER</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-db"><span class="mono node-label">SESSION LOOKUP</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-trust"><span class="mono node-label">IDENTITY RESOLVED</span></div>
          </div>

          <p class="lab-node store-label">SESSION STORAGE BACKEND</p>
          <div class="lab-btn-row" role="group" aria-label="Session storage backend">
            <button type="button" class="lab-btn" [class.is-active]="storeBackend() === 'file'" [attr.aria-pressed]="storeBackend() === 'file'" (click)="storeBackend.set('file')">File</button>
            <button type="button" class="lab-btn" [class.is-active]="storeBackend() === 'memory'" [attr.aria-pressed]="storeBackend() === 'memory'" (click)="storeBackend.set('memory')">Memory</button>
            <button type="button" class="lab-btn" [class.is-active]="storeBackend() === 'distributed'" [attr.aria-pressed]="storeBackend() === 'distributed'" (click)="storeBackend.set('distributed')">Distributed store (e.g. Redis)</button>
          </div>

          @if (storeBackend() === 'memory') {
            <p class="lab-note lab-note-warn">
              In-process memory is fast, but only the server instance that created the session knows about it.
            </p>
          } @else if (storeBackend() === 'file') {
            <p class="lab-note">
              A local file survives restarts of that one server, but still isn't visible to any other server
              instance.
            </p>
          } @else {
            <p class="lab-note">
              A distributed/shared store is typically needed once you have more than one server instance handling
              requests — each server can't rely on another server's local memory or disk, so the session data has
              to live somewhere all of them can reach. This is the same reason horizontally scaled backends need
              shared state rather than per-server state.
            </p>
          }
        </div>

        <!-- PART B -->
        <div class="lab-panel">
          <p class="lab-node">PART B — COOKIE SECURITY INSPECTOR</p>
          <div class="cookie-inspector">
            <p class="cookie-name mono">Set-Cookie: session_id={{ mockSessionId }}</p>

            <div class="cookie-row">
              <div class="cookie-toggle">
                <button type="button" class="switch" role="switch" [attr.aria-checked]="secure()" (click)="secure.set(!secure())">
                  <span class="switch-knob" [class.is-on]="secure()"></span>
                </button>
                <span class="mono cookie-attr-label">Secure</span>
              </div>
              <p class="cookie-attr-desc">Only sent over HTTPS connections — never over plain HTTP.</p>
            </div>

            <div class="cookie-row">
              <div class="cookie-toggle">
                <button type="button" class="switch" role="switch" [attr.aria-checked]="httpOnly()" (click)="httpOnly.set(!httpOnly())">
                  <span class="switch-knob" [class.is-on]="httpOnly()"></span>
                </button>
                <span class="mono cookie-attr-label">HttpOnly</span>
              </div>
              <p class="cookie-attr-desc">
                Client-side JavaScript cannot directly read the cookie's value. This reduces, but does not
                eliminate, exposure if the page has other vulnerabilities — it does not make script-injection
                attacks harmless.
              </p>
            </div>

            <div class="cookie-row">
              <div class="cookie-toggle">
                <label class="mono sr-label" for="samesite-select">SameSite</label>
                <select id="samesite-select" class="samesite-select" [value]="sameSite()" (change)="onSameSiteChange($event)">
                  <option value="Strict">Strict</option>
                  <option value="Lax">Lax</option>
                  <option value="None">None</option>
                </select>
              </div>
              <p class="cookie-attr-desc">
                @if (sameSite() === 'Strict') {
                  Never sent along with cross-site navigation — strongest, but can affect links arriving from
                  other sites.
                } @else if (sameSite() === 'Lax') {
                  Allowed for some top-level cross-site navigations (e.g. clicking a link), withheld for most
                  other cross-site requests.
                } @else {
                  Always sent, including on cross-site requests — requires <strong>Secure</strong> to be set.
                }
              </p>
            </div>

            @if (sameSite() === 'None' && !secure()) {
              <p class="lab-note lab-note-warn">SameSite=None requires Secure — this combination would be rejected by real browsers.</p>
            }

            <div class="attack-surface">
              <p class="lab-node">ATTACK SURFACE (illustrative)</p>
              <div class="surface-bar-wrap">
                <div class="surface-bar"><div class="surface-fill" [style.width.%]="exposurePct()"></div></div>
                <span class="mono surface-caption">{{ exposurePct() }}% of illustrated exposure paths still open</span>
              </div>
              <ul class="surface-list">
                <li [class.is-closed]="httpOnly()"><span class="pill" [class.pill-no]="httpOnly()" [class.pill-conditional]="!httpOnly()">{{ httpOnly() ? 'MITIGATED' : 'OPEN' }}</span> script reading cookie value directly</li>
                <li [class.is-closed]="secure()"><span class="pill" [class.pill-no]="secure()" [class.pill-conditional]="!secure()">{{ secure() ? 'MITIGATED' : 'OPEN' }}</span> cookie sent over unencrypted HTTP</li>
                <li [class.is-closed]="sameSite() !== 'None'"><span class="pill" [class.pill-no]="sameSite() !== 'None'" [class.pill-conditional]="sameSite() === 'None'">{{ sameSite() !== 'None' ? 'MITIGATED' : 'OPEN' }}</span> cookie riding along on cross-site requests</li>
              </ul>
              <p class="lab-note">
                Toggling these flags narrows illustrated exposure paths — it doesn't mean the cookie is fully
                safe. Each attribute mitigates one category of risk; none of them, alone or together, is a
                complete defense.
              </p>
            </div>
          </div>
        </div>

        <!-- PART C -->
        <div class="lab-panel">
          <p class="lab-node">PART C — SESSION LIFECYCLE</p>
          <div class="regen-flow">
            <div class="flow-node" [class.is-discarded]="loggedIn()">
              <span class="mono node-label">PRE-LOGIN SESSION</span>
              <span class="node-sub mono">{{ preLoginId }}</span>
              @if (loggedIn()) {
                <span class="discarded-tag mono">discarded</span>
              }
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-server"><span class="mono node-label">LOGIN</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-trust" [class.is-verified]="loggedIn()">
              <span class="mono node-label">NEW AUTHENTICATED SESSION</span>
              <span class="node-sub mono">{{ loggedIn() ? postLoginId() : '(not yet issued)' }}</span>
            </div>
          </div>

          <div class="lab-btn-row" role="group">
            <button type="button" class="lab-btn lab-btn-primary" (click)="triggerLogin()" [disabled]="loggedIn()">Log in</button>
            @if (loggedIn()) {
              <button type="button" class="lab-btn" (click)="resetLogin()">Reset</button>
            }
          </div>

          <p class="lab-note">
            Issuing a brand-new session identifier at login — and discarding the old one — is called
            <strong>session regeneration</strong>. It prevents session fixation: an attacker who fixed or already
            knew the pre-login session ID gains nothing, because that ID is never promoted to an authenticated
            session.
          </p>

          <p class="lab-node lifecycle-events-label">LIFECYCLE EVENTS AFTER LOGIN</p>
          <div class="lifecycle-grid">
            @for (ev of lifecycleEvents; track ev.id) {
              <button type="button" class="lifecycle-card" [class.is-active]="activeLifecycle() === ev.id" (click)="activeLifecycle.set(ev.id)">
                <span class="mono lifecycle-label">{{ ev.label }}</span>
              </button>
            }
          </div>
          <p class="lifecycle-desc">{{ activeLifecycleEvent().desc }}</p>

          <p class="lab-note lab-note-warn">
            Authentication is a lifecycle, not a one-time event — a session that's valid at login time doesn't
            stay trustworthy forever.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .session-flow { margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .second-flow-label { margin-top: 28px; }
    .flow-node {
      display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center;
      min-width: 120px; padding: 12px 14px; border-radius: var(--radius-md);
      border: 1px solid var(--border-strong); background: var(--surface); text-align: center; position: relative;
    }
    .node-label { font-size: 0.75rem; font-weight: 700; color: var(--text); }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }
    .node-client { border-color: var(--c-client); }
    .node-server { border-color: var(--c-server); }
    .node-db { border-color: var(--c-db); }
    .node-trust.is-verified { border-color: var(--trust); background: color-mix(in srgb, var(--trust) 12%, var(--surface)); }
    .flow-node.is-discarded { opacity: 0.45; border-style: dashed; border-color: var(--attack); }
    .discarded-tag { color: var(--attack); font-size: 0.625rem; margin-top: 2px; }

    .store-label { margin-top: 28px; }

    .cookie-inspector { margin-top: 14px; }
    .cookie-name { font-size: 0.8125rem; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; word-break: break-all; }
    .cookie-row { margin-top: 16px; display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; border-top: 1px solid var(--border); }
    .cookie-toggle { display: flex; align-items: center; gap: 10px; min-width: 160px; flex-shrink: 0; }
    .cookie-attr-label { font-size: 0.8125rem; color: var(--text); }
    .cookie-attr-desc { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; margin-top: 2px; }
    .sr-label { font-size: 0.8125rem; color: var(--text); }

    .switch { width: 40px; height: 22px; border-radius: 999px; background: var(--surface-elevated); border: 1px solid var(--border-strong); position: relative; padding: 2px; flex-shrink: 0; }
    .switch-knob { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--text-faint); transition: transform 0.15s ease, background 0.15s ease; }
    .switch-knob.is-on { transform: translateX(18px); background: var(--trust); }
    .switch[aria-checked='true'] { border-color: var(--trust); }

    .samesite-select { background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text); padding: 6px 8px; font-family: var(--font-mono); font-size: 0.8125rem; }

    .attack-surface { margin-top: 24px; padding-top: 20px; border-top: 1px dashed var(--border-strong); }
    .surface-bar-wrap { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
    .surface-bar { height: 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border-strong); overflow: hidden; }
    .surface-fill { height: 100%; background: linear-gradient(90deg, var(--trust), var(--suspicious), var(--attack)); transition: width 0.2s ease; }
    .surface-caption { font-size: 0.75rem; color: var(--text-faint); }
    .surface-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .surface-list li { display: flex; align-items: center; gap: 10px; font-size: 0.8125rem; color: var(--text-muted); }
    .surface-list li.is-closed { color: var(--text-faint); text-decoration: line-through; }

    .regen-flow { margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .lifecycle-events-label { margin-top: 28px; }
    .lifecycle-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
    .lifecycle-card { text-align: left; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); transition: border-color 0.15s ease, background 0.15s ease; }
    .lifecycle-card:hover { border-color: var(--accent); }
    .lifecycle-card.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
    .lifecycle-label { font-size: 0.8125rem; }
    .lifecycle-desc { margin-top: 14px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; max-width: 640px; }
  `,
})
export class SessionsCookies {
  protected readonly mockSessionId = 'a1f9c3e7b2d84f10';
  protected readonly preLoginId = randomId();
  protected readonly lifecycleEvents = LIFECYCLE_EVENTS;

  protected readonly storeBackend = signal<StoreBackend>('distributed');

  protected readonly secure = signal(true);
  protected readonly httpOnly = signal(true);
  protected readonly sameSite = signal<SameSite>('Lax');

  protected readonly exposurePct = computed(() => {
    let openCount = 0;
    if (!this.httpOnly()) openCount++;
    if (!this.secure()) openCount++;
    if (this.sameSite() === 'None') openCount++;
    return Math.round((openCount / 3) * 100);
  });

  protected readonly loggedIn = signal(false);
  protected readonly postLoginId = signal(randomId());

  protected readonly activeLifecycle = signal<string>('expire');
  protected readonly activeLifecycleEvent = computed(
    () => this.lifecycleEvents.find((e) => e.id === this.activeLifecycle())!,
  );

  protected onSameSiteChange(ev: Event): void {
    this.sameSite.set((ev.target as HTMLSelectElement).value as SameSite);
  }

  protected triggerLogin(): void {
    this.postLoginId.set(randomId());
    this.loggedIn.set(true);
  }

  protected resetLogin(): void {
    this.loggedIn.set(false);
  }
}
