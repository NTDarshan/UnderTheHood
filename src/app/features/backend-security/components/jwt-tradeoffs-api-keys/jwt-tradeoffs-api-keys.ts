import { Component, computed, signal } from '@angular/core';

interface ConcernItem {
  label: string;
  text: string;
}

const BASE_WINDOW_SEC = 3600; // 1 hour, unmitigated token lifetime for the demo
const MITIGATED_WINDOW_SEC = 300; // 5 minutes, short-lived + refresh pattern

const CONCERNS: ConcernItem[] = [
  { label: 'Secret leakage', text: 'keys committed to code or logs' },
  { label: 'Rotation', text: 'ability to replace a key without downtime' },
  { label: 'Scope', text: 'a key should be limited to what that service actually needs, not full access' },
  { label: 'Expiration', text: 'keys that never expire are a standing liability' },
  { label: 'Storage', text: 'keys belong in a secret store, not source code' },
];

@Component({
  selector: 'app-jwt-tradeoffs-api-keys',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="jwt-tradeoffs">
      <div class="container">
        <p class="lab-index">13 — JWT TRADE-OFFS &amp; API KEYS</p>
        <h2 class="lab-title">Stateless isn't automatically safer. It's a different set of trade-offs.</h2>
        <p class="lab-lede">
          Sessions and tokens solve authentication differently — and each pays for its convenience somewhere else.
        </p>

        <div class="lab-panel">
          <p class="lab-node">STATEFUL VS. STATELESS</p>
          <div class="compare-row">
            <div class="compare-card">
              <p class="compare-title">STATEFUL SESSION</p>
              <ul class="compare-list">
                <li class="pos">+ easy revocation — delete the server-side session record</li>
                <li class="pos">+ server-controlled state, updated any time</li>
                <li class="neg">− requires shared session storage to scale across multiple servers</li>
              </ul>
            </div>
            <div class="compare-card">
              <p class="compare-title">STATELESS TOKEN</p>
              <ul class="compare-list">
                <li class="pos">+ easy horizontal scaling — any server can verify it alone</li>
                <li class="pos">+ self-contained claims, no lookup round-trip</li>
                <li class="neg">− revocation is harder — a valid-looking token can't just be "deleted"</li>
                <li class="neg">− token lifetime must be designed carefully</li>
              </ul>
            </div>
          </div>

          <p class="lab-node section-gap">COMPROMISED TOKEN SCENARIO</p>
          <p class="scenario-text">
            A token leaks — copied from a log, a browser extension, a compromised laptop. The attacker now holds an
            exact copy and can use it like the real client, until it stops being valid.
          </p>

          <div class="scenario-row">
            <div class="node-box client-box">
              <span class="lab-node">CLIENT</span>
              <p class="node-sub mono">holds original token</p>
            </div>
            <span class="lab-flow-arrow leak-arrow">⇢ token leaked ⇢</span>
            <div class="node-box attacker-box">
              <span class="lab-node">ATTACKER</span>
              <p class="node-sub mono">holds identical copy</p>
            </div>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Mitigation toggle">
            <button type="button" class="lab-btn" [class.is-active]="!mitigationOn()" (click)="mitigationOn.set(false)">
              MITIGATION OFF (1h token)
            </button>
            <button type="button" class="lab-btn" [class.is-active]="mitigationOn()" (click)="mitigationOn.set(true)">
              SHORT EXPIRY + REFRESH TOKEN ON (5m token)
            </button>
          </div>

          <div class="window-wrap">
            <div class="window-bar">
              <div class="window-fill" [style.width.%]="windowPct()"></div>
            </div>
            <p class="window-caption mono">
              usable window for the stolen token: <strong>{{ windowLabel() }}</strong> before it expires
            </p>
          </div>

          <p class="lab-note">
            The token remains fully valid and usable by the attacker until either its expiration time passes, or a
            server-side mitigation kicks in — such as a maintained revocation blocklist, or a short-lived
            access-token-plus-refresh-token pattern. Shortening the token lifetime shrinks the damage window even
            though the leak itself already happened.
          </p>

          <p class="lab-note lab-note-warn">
            JWT is not automatically more secure than sessions — security depends on how it's designed and
            implemented, including token lifetime and revocation strategy.
          </p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">PART B — API KEYS (MACHINE-TO-MACHINE)</p>
          <p class="scenario-text">
            Not every caller is a human sitting at a browser. Services also authenticate to other services —
            usually with a static API key rather than a login flow.
          </p>

          <div class="flow-row">
            <span class="lab-node flow-node service-a-node">SERVICE A</span>
            <span class="lab-flow-arrow">— API key: {{ demoKey }} →</span>
            <span class="lab-node flow-node service-b-node">SERVICE B</span>
          </div>

          <div class="compare-row identity-row">
            <div class="compare-card">
              <p class="compare-title id-human">HUMAN IDENTITY</p>
              <p class="node-sub">A person authenticating — password, OAuth login, MFA. Identity tied to an individual.</p>
            </div>
            <div class="compare-card">
              <p class="compare-title id-app">APPLICATION IDENTITY</p>
              <p class="node-sub">A service authenticating as itself, via a static key. Identity tied to the service.</p>
            </div>
          </div>

          <p class="lab-node section-gap">KEY SECURITY CONCERNS</p>
          <ul class="concern-list">
            @for (c of concerns; track c.label) {
              <li class="concern-item">
                <span class="concern-label mono">{{ c.label }}</span>
                <span class="concern-text">{{ c.text }}</span>
              </li>
            }
          </ul>
          <p class="lab-note">
            Storage in particular foreshadows what's next in this chapter: keys and secrets need a dedicated
            secrets-management system, not a config file checked into source control.
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

    .compare-row {
      margin-top: 18px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    @media (min-width: 720px) {
      .compare-row { grid-template-columns: 1fr 1fr; }
    }

    .compare-card {
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .compare-title {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text);
      margin-bottom: 10px;
    }

    .compare-list { display: flex; flex-direction: column; gap: 8px; }
    .compare-list li { font-size: 0.8125rem; line-height: 1.55; }
    .pos { color: var(--trust); }
    .neg { color: var(--suspicious); }

    .section-gap { margin-top: 30px; }

    .scenario-text {
      margin-top: 10px;
      font-size: 0.9375rem;
      color: var(--text-muted);
      max-width: 640px;
      line-height: 1.6;
    }

    .scenario-row {
      margin-top: 18px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }

    .node-box {
      padding: 14px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      min-width: 160px;
    }

    .client-box { color: var(--c-client); border-color: color-mix(in srgb, var(--c-client) 50%, var(--border-strong)); }
    .attacker-box { color: var(--c-attacker); border-color: color-mix(in srgb, var(--c-attacker) 50%, var(--border-strong)); }

    .node-sub {
      margin-top: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .leak-arrow { color: var(--suspicious); font-weight: 600; }

    .window-wrap { margin-top: 22px; }
    .window-bar {
      height: 14px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      overflow: hidden;
    }
    .window-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--attack), var(--compromised));
      transition: width 0.35s ease;
    }
    .window-caption { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .window-caption strong { color: var(--text); }

    .flow-row {
      margin-top: 18px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .flow-node {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
    }

    .service-a-node { color: var(--c-server); border-color: color-mix(in srgb, var(--c-server) 50%, var(--border-strong)); }
    .service-b-node { color: var(--c-db); border-color: color-mix(in srgb, var(--c-db) 50%, var(--border-strong)); }

    .identity-row { margin-top: 20px; }
    .id-human { color: var(--c-client); }
    .id-app { color: var(--c-server); }

    .concern-list {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .concern-item {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: baseline;
      padding: 10px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }

    .concern-label {
      min-width: 130px;
      color: var(--accent-2);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .concern-text {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `,
})
export class JwtTradeoffsApiKeys {
  protected readonly concerns = CONCERNS;
  protected readonly demoKey = 'sk_demo_••••••••1234';

  protected readonly mitigationOn = signal(false);

  private readonly windowSeconds = computed(() => (this.mitigationOn() ? MITIGATED_WINDOW_SEC : BASE_WINDOW_SEC));

  protected readonly windowPct = computed(() => (this.windowSeconds() / BASE_WINDOW_SEC) * 100);

  protected readonly windowLabel = computed(() => {
    const s = this.windowSeconds();
    return s >= 60 ? `${Math.round(s / 60)} minutes` : `${s} seconds`;
  });
}
