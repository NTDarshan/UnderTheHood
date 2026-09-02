import { Component, computed, signal } from '@angular/core';

type SameSite = 'None' | 'Lax' | 'Strict';
type AuthLevel = 'none' | 'weak' | 'strong';
type AuthzLevel = 'missing' | 'role-only' | 'object-level';
type DbAccess = 'overprivileged' | 'least-privilege';
type SecretStorage = 'hardcoded' | 'vaulted';
type Posture = 'Critical exposure' | 'Partial hardening' | 'Solid baseline';

interface Setting {
  id: string;
  label: string;
}

const SETTING_ORDER: Setting[] = [
  { id: 'https', label: 'HTTPS' },
  { id: 'secureCookies', label: 'Secure Cookies' },
  { id: 'httpOnly', label: 'HttpOnly' },
  { id: 'sameSite', label: 'SameSite' },
  { id: 'rateLimit', label: 'Rate Limit' },
  { id: 'auth', label: 'Authentication' },
  { id: 'authz', label: 'Authorization' },
  { id: 'debug', label: 'Debug Mode' },
  { id: 'cors', label: 'CORS' },
  { id: 'headers', label: 'Security Headers' },
  { id: 'dbAccess', label: 'Database Access' },
  { id: 'secrets', label: 'Secret Storage' },
];

@Component({
  selector: 'app-security-config-challenge',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-config-challenge">
      <div class="container">
        <p class="lab-index">35 — SECURITY CONFIGURATION CHALLENGE</p>
        <h2 class="lab-title">Secure this backend.</h2>
        <p class="lab-lede">
          Every setting below starts in an insecure default state — the way a lot of real backends actually ship.
          Change settings and watch what gets mitigated, what's still exposed, and where hardening one thing
          introduces a genuine trade-off elsewhere.
        </p>

        <div class="lab-panel challenge-rig">
          <!-- ================= CONTROLS ================= -->
          <div class="controls">
            <p class="block-title mono">TRANSPORT &amp; COOKIES</p>

            <div class="ctrl-row">
              <span class="ctrl-label">HTTPS</span>
              <button type="button" class="lab-btn toggle-btn" [class.is-active]="https()" (click)="https.set(!https())" [attr.aria-pressed]="https()">
                {{ https() ? 'ON' : 'OFF' }}
              </button>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">Secure Cookies</span>
              <button type="button" class="lab-btn toggle-btn" [class.is-active]="secureCookies()" (click)="secureCookies.set(!secureCookies())" [attr.aria-pressed]="secureCookies()">
                {{ secureCookies() ? 'ON' : 'OFF' }}
              </button>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">HttpOnly</span>
              <button type="button" class="lab-btn toggle-btn" [class.is-active]="httpOnly()" (click)="httpOnly.set(!httpOnly())" [attr.aria-pressed]="httpOnly()">
                {{ httpOnly() ? 'ON' : 'OFF' }}
              </button>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">SameSite</span>
              <div class="lab-btn-row seg-row" role="group" aria-label="SameSite value">
                @for (v of sameSiteOptions; track v) {
                  <button type="button" class="lab-btn seg-btn" [class.is-active]="sameSite() === v" (click)="setSameSite(v)">{{ v }}</button>
                }
              </div>
            </div>
            @if (sameSite() === 'Strict') {
              <p class="tradeoff-inline">Trade-off: <strong>SameSite=Strict</strong> can break cross-site login/redirect flows (e.g. arriving from an external link that should stay logged in) — Lax is often the practical default.</p>
            }

            <p class="block-title mono section-gap">TRAFFIC &amp; IDENTITY</p>

            <div class="ctrl-row">
              <span class="ctrl-label">Rate Limit</span>
              <button type="button" class="lab-btn toggle-btn" [class.is-active]="rateLimit() !== 'off'" (click)="cycleRateLimit()" [attr.aria-pressed]="rateLimit() !== 'off'">
                {{ rateLimitDisplay() }}
              </button>
            </div>
            @if (rateLimit() === 'aggressive') {
              <p class="tradeoff-inline">Trade-off: an aggressive limit can throttle legitimate users on shared IPs (offices, mobile carriers) or during normal retry behavior — tune it against real traffic patterns.</p>
            }

            <div class="ctrl-row">
              <span class="ctrl-label">Authentication</span>
              <div class="lab-btn-row seg-row" role="group" aria-label="Authentication level">
                <button type="button" class="lab-btn seg-btn" [class.is-active]="auth() === 'none'" (click)="auth.set('none')">None</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="auth() === 'weak'" (click)="auth.set('weak')">Weak</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="auth() === 'strong'" (click)="auth.set('strong')">Strong</button>
              </div>
            </div>

            <div class="ctrl-row">
              <span class="ctrl-label">Authorization</span>
              <div class="lab-btn-row seg-row" role="group" aria-label="Authorization level">
                <button type="button" class="lab-btn seg-btn" [class.is-active]="authz() === 'missing'" (click)="authz.set('missing')">Missing</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="authz() === 'role-only'" (click)="authz.set('role-only')">Role-only</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="authz() === 'object-level'" (click)="authz.set('object-level')">Object-level</button>
              </div>
            </div>

            <p class="block-title mono section-gap">SURFACE &amp; INFRASTRUCTURE</p>

            <div class="ctrl-row">
              <span class="ctrl-label">Debug Mode</span>
              <button type="button" class="lab-btn toggle-btn" [class.is-active]="debug()" (click)="debug.set(!debug())" [attr.aria-pressed]="debug()">
                {{ debug() ? 'ON' : 'OFF' }}
              </button>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">CORS</span>
              <div class="lab-btn-row seg-row" role="group" aria-label="CORS policy">
                <button type="button" class="lab-btn seg-btn" [class.is-active]="cors() === 'open'" (click)="cors.set('open')">Any origin</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="cors() === 'allowlist'" (click)="cors.set('allowlist')">Allow-listed</button>
              </div>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">Security Headers</span>
              <button type="button" class="lab-btn toggle-btn" [class.is-active]="headers()" (click)="headers.set(!headers())" [attr.aria-pressed]="headers()">
                {{ headers() ? 'SET' : 'NONE' }}
              </button>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">Database Access</span>
              <div class="lab-btn-row seg-row" role="group" aria-label="Database access level">
                <button type="button" class="lab-btn seg-btn" [class.is-active]="dbAccess() === 'overprivileged'" (click)="dbAccess.set('overprivileged')">Overprivileged</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="dbAccess() === 'least-privilege'" (click)="dbAccess.set('least-privilege')">Least-privilege</button>
              </div>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">Secret Storage</span>
              <div class="lab-btn-row seg-row" role="group" aria-label="Secret storage method">
                <button type="button" class="lab-btn seg-btn" [class.is-active]="secrets() === 'hardcoded'" (click)="secrets.set('hardcoded')">Hardcoded</button>
                <button type="button" class="lab-btn seg-btn" [class.is-active]="secrets() === 'vaulted'" (click)="secrets.set('vaulted')">Vaulted</button>
              </div>
            </div>

            <button type="button" class="lab-btn lab-btn-danger reset-btn" (click)="reset()">Reset to insecure defaults</button>
          </div>

          <!-- ================= LIVE READOUT ================= -->
          <div class="readout">
            <div class="posture-band" [class]="'posture-' + postureClass()">
              <span class="posture-label mono">POSTURE</span>
              <span class="posture-value">{{ posture() }}</span>
              <span class="posture-count mono">{{ fixedCount() }} / {{ totalCount() }} controls hardened</span>
            </div>

            <div class="list-col">
              <p class="list-title mono list-title-trust">THREATS MITIGATED ({{ mitigated().length }})</p>
              @if (mitigated().length === 0) {
                <p class="empty-note">Nothing mitigated yet — every control is still at its insecure default.</p>
              } @else {
                <ul class="check-list">
                  @for (t of mitigated(); track t) {
                    <li><span class="pill pill-yes list-mark" aria-hidden="true">✓</span><span>{{ t }}</span></li>
                  }
                </ul>
              }
            </div>

            <div class="list-col">
              <p class="list-title mono list-title-attack">REMAINING RISKS ({{ remaining().length }})</p>
              @if (remaining().length === 0) {
                <p class="empty-note">No known remaining risks from this control set — nice.</p>
              } @else {
                <ul class="check-list">
                  @for (r of remaining(); track r) {
                    <li><span class="pill pill-no list-mark" aria-hidden="true">!</span><span>{{ r }}</span></li>
                  }
                </ul>
              }
            </div>
          </div>
        </div>

        <p class="lab-note">
          Notice there is no single numeric "security score" here — qualitative posture plus explicit threat and
          risk lists is a more honest picture than a fake precise percentage. And maxing out every setting isn't
          automatically correct either: <strong>Rate Limit</strong> and <strong>SameSite</strong> above both show
          real trade-offs against legitimate usage — good security engineering is calibrated to the system, not
          maximized blindly.
        </p>
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

    .challenge-rig {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    @media (min-width: 1050px) {
      .challenge-rig { flex-direction: row; align-items: flex-start; }
      .controls { flex: 1.1; }
      .readout { flex: 1; position: sticky; top: 24px; }
    }

    .controls { display: flex; flex-direction: column; gap: 12px; }

    .block-title {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--text-faint);
      margin-top: 6px;
    }

    .section-gap { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--border); }

    .ctrl-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .ctrl-label {
      font-size: 0.8438rem;
      color: var(--text-muted);
      font-weight: 600;
      min-width: 130px;
    }

    .toggle-btn {
      min-width: 64px;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      color: var(--attack);
      border-color: color-mix(in srgb, var(--attack) 40%, var(--border-strong));
    }

    .toggle-btn.is-active {
      color: var(--trust);
      border-color: var(--trust);
      background: color-mix(in srgb, var(--trust) 12%, var(--surface));
    }

    .seg-row { flex-wrap: wrap; }
    .seg-btn {
      font-size: 0.6875rem;
      padding: 7px 12px;
    }

    .tradeoff-inline {
      margin: -2px 0 4px;
      font-size: 0.75rem;
      color: var(--suspicious);
      line-height: 1.5;
      padding: 8px 12px;
      border-left: 2px solid var(--suspicious);
      background: color-mix(in srgb, var(--suspicious) 8%, var(--surface));
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }

    .reset-btn { align-self: flex-start; margin-top: 12px; }

    .readout {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .posture-band {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
    }

    .posture-label { font-size: 0.625rem; letter-spacing: 0.1em; color: var(--text-faint); }
    .posture-value { font-size: 1.25rem; font-weight: 700; }
    .posture-count { font-size: 0.6875rem; color: var(--text-faint); }

    .posture-critical { border-color: var(--attack); }
    .posture-critical .posture-value { color: var(--attack); }

    .posture-partial { border-color: var(--suspicious); }
    .posture-partial .posture-value { color: var(--suspicious); }

    .posture-solid { border-color: var(--trust); }
    .posture-solid .posture-value { color: var(--trust); }

    .list-col {
      padding: 16px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
    }

    .list-title { font-size: 0.6875rem; letter-spacing: 0.08em; }
    .list-title-trust { color: var(--trust); }
    .list-title-attack { color: var(--attack); }

    .empty-note { margin-top: 10px; font-size: 0.8125rem; color: var(--text-faint); }

    .check-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .check-list li {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .list-mark { flex-shrink: 0; margin-top: 1px; }
  `,
})
export class SecurityConfigChallenge {
  protected readonly sameSiteOptions: SameSite[] = ['None', 'Lax', 'Strict'];

  protected readonly https = signal(false);
  protected readonly secureCookies = signal(false);
  protected readonly httpOnly = signal(false);
  protected readonly sameSite = signal<SameSite>('None');
  protected readonly rateLimit = signal<'off' | 'moderate' | 'aggressive'>('off');
  protected readonly auth = signal<AuthLevel>('none');
  protected readonly authz = signal<AuthzLevel>('missing');
  protected readonly debug = signal(true);
  protected readonly cors = signal<'open' | 'allowlist'>('open');
  protected readonly headers = signal(false);
  protected readonly dbAccess = signal<DbAccess>('overprivileged');
  protected readonly secrets = signal<SecretStorage>('hardcoded');

  protected readonly totalCount = computed(() => SETTING_ORDER.length);

  protected readonly fixedCount = computed(() => {
    let n = 0;
    if (this.https()) n++;
    if (this.secureCookies()) n++;
    if (this.httpOnly()) n++;
    if (this.sameSite() !== 'None') n++;
    if (this.rateLimit() !== 'off') n++;
    if (this.auth() !== 'none') n++;
    if (this.authz() !== 'missing') n++;
    if (!this.debug()) n++;
    if (this.cors() === 'allowlist') n++;
    if (this.headers()) n++;
    if (this.dbAccess() === 'least-privilege') n++;
    if (this.secrets() === 'vaulted') n++;
    return n;
  });

  protected readonly mitigated = computed(() => {
    const list: string[] = [];
    if (this.https()) list.push('Traffic sniffing / man-in-the-middle interception on the wire (plaintext HTTP)');
    if (this.secureCookies()) list.push('Session cookie theft over an unencrypted connection');
    if (this.httpOnly()) list.push('Session/auth cookie theft via a successful XSS payload reading document.cookie');
    if (this.sameSite() !== 'None') list.push('Cross-site request forgery riding the browser’s automatic cookie attachment');
    if (this.rateLimit() !== 'off') list.push('Credential-stuffing / brute-force login attempts throttled');
    if (this.auth() === 'weak') list.push('Fully anonymous access to authenticated endpoints blocked (basic identity now required)');
    if (this.auth() === 'strong') list.push('Fully anonymous access blocked, and weak/guessable credential compromise significantly harder');
    if (this.authz() === 'role-only') list.push('Unauthenticated and wrong-role access to restricted actions blocked');
    if (this.authz() === 'object-level') list.push('Role-based access enforced AND BOLA/IDOR — one user reading another user’s specific records — blocked');
    if (!this.debug()) list.push('Stack traces, internal paths, and framework internals no longer leaked in error responses');
    if (this.cors() === 'allowlist') list.push('Arbitrary third-party origins reading authenticated API responses via the browser blocked');
    if (this.headers()) list.push('Clickjacking, MIME-sniffing, and some XSS vectors reduced via response security headers');
    if (this.dbAccess() === 'least-privilege') list.push('Blast radius of a successful injection or compromised query limited to only what this service needs');
    if (this.secrets() === 'vaulted') list.push('Credential exposure via source control leaks or repo access eliminated');
    return list;
  });

  protected readonly remaining = computed(() => {
    const list: string[] = [];
    if (!this.https()) list.push('Traffic (including credentials and session cookies) travels in plaintext, interceptable on the network');
    if (!this.secureCookies()) list.push('Cookies can be sent over plain HTTP, exposing them to network interception');
    if (!this.httpOnly()) list.push('Client-side JavaScript (including an XSS payload) can read the session cookie directly');
    if (this.sameSite() === 'None') list.push('Cookies are attached to cross-site requests by default, enabling CSRF');
    if (this.rateLimit() === 'off') list.push('Login and API endpoints can be brute-forced or scraped at unlimited speed');
    if (this.auth() === 'none') list.push('Endpoints intended to be authenticated are reachable by anyone, with no identity check at all');
    if (this.auth() === 'weak') list.push('Weak credential handling (no MFA, no lockout) still leaves accounts guessable');
    if (this.authz() === 'missing') list.push('Any authenticated (or unauthenticated) caller can perform actions with no permission check');
    if (this.authz() === 'role-only') list.push('BOLA/IDOR: a caller with the right role can still access another user’s specific records by changing an ID');
    if (this.debug()) list.push('Verbose error output leaks stack traces and internal implementation details to any caller');
    if (this.cors() === 'open') list.push('Any origin can make authenticated cross-origin requests and read the response in-browser');
    if (!this.headers()) list.push('No baseline defense-in-depth headers (framing, content-type sniffing, referrer policy)');
    if (this.dbAccess() === 'overprivileged') list.push('The application’s DB credential can read/write far more than the app itself needs — a single injection reaches everything');
    if (this.secrets() === 'hardcoded') list.push('Credentials embedded in source are exposed to anyone with repo access or a leaked build artifact');
    return list;
  });

  protected readonly posture = computed<Posture>(() => {
    const ratio = this.fixedCount() / this.totalCount();
    if (ratio < 0.34) return 'Critical exposure';
    if (ratio < 0.75) return 'Partial hardening';
    return 'Solid baseline';
  });

  protected readonly postureClass = computed(() => {
    const p = this.posture();
    if (p === 'Critical exposure') return 'critical';
    if (p === 'Partial hardening') return 'partial';
    return 'solid';
  });

  rateLimitDisplay(): string {
    const v = this.rateLimit();
    if (v === 'off') return 'OFF';
    if (v === 'moderate') return 'MODERATE';
    return 'AGGRESSIVE';
  }

  cycleRateLimit(): void {
    const order: ('off' | 'moderate' | 'aggressive')[] = ['off', 'moderate', 'aggressive'];
    const idx = order.indexOf(this.rateLimit());
    this.rateLimit.set(order[(idx + 1) % order.length]);
  }

  setSameSite(v: SameSite): void {
    this.sameSite.set(v);
  }

  reset(): void {
    this.https.set(false);
    this.secureCookies.set(false);
    this.httpOnly.set(false);
    this.sameSite.set('None');
    this.rateLimit.set('off');
    this.auth.set('none');
    this.authz.set('missing');
    this.debug.set(true);
    this.cors.set('open');
    this.headers.set(false);
    this.dbAccess.set('overprivileged');
    this.secrets.set('hardcoded');
  }
}
