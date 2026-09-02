import { Component, computed, signal } from '@angular/core';

type Defense = 'none' | 'samesite' | 'csrf-token' | 'origin-check';

interface DefenseInfo {
  id: Defense;
  label: string;
  description: string;
}

const DEFENSE_OPTIONS: DefenseInfo[] = [
  {
    id: 'none',
    label: 'No defense',
    description: 'The browser attaches the bank session cookie to every request to the bank’s domain, regardless of which site triggered it.',
  },
  {
    id: 'samesite',
    label: 'SameSite cookies',
    description: 'Set to Strict or Lax — the cookie is no longer attached when the request originates from a cross-site context like the malicious page.',
  },
  {
    id: 'csrf-token',
    label: 'CSRF tokens',
    description: 'A hidden, unpredictable token embedded in the bank’s own legitimate forms — the malicious site has no way to know or include it.',
  },
  {
    id: 'origin-check',
    label: 'Origin / Referer validation',
    description: 'The server checks that the request’s Origin/Referer header actually points to the bank’s own domain before acting.',
  },
];

@Component({
  selector: 'app-csrf-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="csrf-lab">
      <div class="container">
        <p class="lab-index">21 — CSRF (CROSS-SITE REQUEST FORGERY)</p>
        <h2 class="lab-title">The browser doesn't ask "who's asking?" before attaching your cookies.</h2>
        <p class="lab-lede">
          CSRF abuses the fact that browsers automatically attach cookies/credentials to requests, regardless of
          which site technically initiated the request.
        </p>

        <div class="lab-panel">
          <div class="tabs-row">
            <div class="browser-tab" [class.is-active-tab]="true">
              <p class="tab-title mono">TAB 1 — bank.example</p>
              <div class="tab-body">
                <p class="tab-line">Logged in as <strong>you</strong></p>
                <div class="cookie-chip" [class.cookie-riding]="stage() === 'forging'">
                  <span class="cookie-icon">&#127850;</span>
                  <span class="mono cookie-text">session=auth_ok</span>
                </div>
              </div>
            </div>
            <div class="browser-tab">
              <p class="tab-title mono">TAB 2 — free-prizes.example</p>
              <div class="tab-body">
                <p class="tab-line tab-line-attack">Hidden form auto-submits to:</p>
                <p class="mono endpoint-line">POST bank.example/transfer</p>
              </div>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="run()" [disabled]="stage() === 'forging'">
              Visit malicious site &amp; trigger forged request
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <svg class="diagram" viewBox="0 0 640 160" role="img" aria-label="Forged request diagram">
            <line x1="130" y1="80" x2="330" y2="80" class="flow-line" [class.flow-line-active]="stage() === 'forging'" />
            <g transform="translate(60,80)">
              <rect x="-50" y="-26" width="100" height="52" rx="8" class="node-rect node-client" />
              <text text-anchor="middle" y="-2" class="node-text mono">BROWSER</text>
              <text text-anchor="middle" y="14" class="node-text mono node-sub">(malicious tab open)</text>
            </g>
            <g transform="translate(400,80)">
              <rect x="-60" y="-26" width="120" height="52" rx="8" class="node-rect" [class]="resultClass()" />
              <text text-anchor="middle" y="-2" class="node-text mono">BANK API</text>
              <text text-anchor="middle" y="14" class="node-text mono node-sub">/transfer</text>
            </g>
            @if (stage() === 'forging') {
              <g class="cookie-travel">
                <text x="230" y="60" class="cookie-fly mono" text-anchor="middle">&#127850; session cookie</text>
              </g>
            }
            @if (stage() === 'done') {
              <text x="400" y="130" text-anchor="middle" class="result-label mono" [class]="resultTextClass()">
                {{ resultText() }}
              </text>
            }
          </svg>

          <p class="part-label mono">DEFENSE IN PLACE</p>
          <div class="lab-btn-row" role="group" aria-label="Select defense">
            @for (d of defenses; track d.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="defense() === d.id"
                [attr.aria-pressed]="defense() === d.id"
                (click)="selectDefense(d.id)"
              >
                {{ d.label }}
              </button>
            }
          </div>
          <p class="defense-desc">{{ activeDefenseInfo().description }}</p>
        </div>

        <p class="lab-note">
          CSRF risk depends heavily on the authentication mechanism (cookie-based sessions are the classic case)
          and browser behavior — an API that requires a custom header or a bearer token sent explicitly by
          JavaScript (not auto-attached by the browser) is inherently less exposed to classic CSRF, though it
          introduces its own considerations.
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

    .tabs-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .tabs-row { grid-template-columns: 1fr 1fr; } }

    .browser-tab {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .tab-title {
      background: var(--surface-elevated);
      padding: 8px 12px;
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--text-faint);
      border-bottom: 1px solid var(--border);
    }
    .browser-tab:first-child .tab-title { color: var(--trust); }
    .browser-tab:last-child .tab-title { color: var(--c-attacker); }
    .tab-body { padding: 14px; }
    .tab-line { font-size: 0.875rem; color: var(--text-muted); }
    .tab-line strong { color: var(--text); }
    .tab-line-attack { color: var(--attack); }
    .endpoint-line { margin-top: 6px; font-size: 0.75rem; color: var(--text-faint); }

    .cookie-chip {
      margin-top: 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--trust);
      color: var(--trust);
      font-size: 0.75rem;
      transition: transform 0.4s ease;
    }
    .cookie-icon { font-size: 0.9rem; }
    .cookie-riding { animation: cookie-shake 0.6s ease-in-out infinite; }
    @keyframes cookie-shake { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 10px; margin-top: 28px; }

    .diagram { width: 100%; height: auto; aspect-ratio: 640 / 160; margin-top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .flow-line { stroke: var(--border-strong); stroke-width: 1.5; stroke-dasharray: 6 4; }
    .flow-line-active { stroke: var(--attack); animation: dash-flow 0.6s linear infinite; }

    .node-rect { stroke-width: 1.5; transition: fill 0.25s ease, stroke 0.25s ease; }
    .node-client { fill: color-mix(in srgb, var(--c-client) 16%, var(--surface-elevated)); stroke: var(--c-client); }
    .node-neutral { fill: var(--surface-elevated); stroke: var(--border-strong); }
    .node-attack { fill: color-mix(in srgb, var(--attack) 22%, var(--surface-elevated)); stroke: var(--attack); }
    .node-blocked { fill: color-mix(in srgb, var(--blocked) 18%, var(--surface-elevated)); stroke: var(--blocked); }

    .node-text { fill: var(--text); font-size: 11px; font-weight: 600; letter-spacing: 0.03em; }
    .node-sub { fill: var(--text-faint); font-size: 9px; font-weight: 400; }

    .cookie-fly { fill: var(--suspicious); font-size: 11px; font-weight: 700; }

    .result-label { font-size: 11px; font-weight: 700; }
    .result-attack { fill: var(--attack); }
    .result-blocked { fill: var(--blocked); }

    .defense-desc { margin-top: 14px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class CsrfLab {
  protected readonly defenses = DEFENSE_OPTIONS;

  protected readonly defense = signal<Defense>('none');
  protected readonly stage = signal<'idle' | 'forging' | 'done'>('idle');

  protected readonly activeDefenseInfo = computed(
    () => this.defenses.find((d) => d.id === this.defense())!,
  );

  protected readonly blocked = computed(() => this.defense() !== 'none');

  run(): void {
    this.stage.set('forging');
    setTimeout(() => this.stage.set('done'), 900);
  }

  reset(): void {
    this.stage.set('idle');
  }

  selectDefense(id: Defense): void {
    this.defense.set(id);
    this.reset();
  }

  resultClass(): string {
    if (this.stage() === 'idle') return 'node-neutral';
    return this.blocked() ? 'node-blocked' : 'node-attack';
  }

  resultTextClass(): string {
    return this.blocked() ? 'result-blocked' : 'result-attack';
  }

  resultText(): string {
    if (this.blocked()) {
      return 'REQUEST REJECTED — forged request lacked valid credential/token';
    }
    return 'TRANSFER EXECUTED — browser attached a valid session cookie';
  }
}
