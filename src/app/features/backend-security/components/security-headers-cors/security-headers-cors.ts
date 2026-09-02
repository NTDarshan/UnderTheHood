import { Component, computed, signal } from '@angular/core';

interface HeaderInfo {
  id: string;
  header: string;
  label: string;
  threat: string;
  control: string;
  effect: string;
}

const HEADERS: HeaderInfo[] = [
  {
    id: 'csp',
    header: 'Content-Security-Policy',
    label: 'Content Security Policy',
    threat: 'Malicious or unexpected scripts running on your page.',
    control: 'An allowlist of sources scripts, styles, and other resources may load from.',
    effect: 'Even if attacker content gets injected, the browser refuses to execute/load it from disallowed sources.',
  },
  {
    id: 'hsts',
    header: 'Strict-Transport-Security',
    label: 'Strict Transport Security',
    threat: "A user's connection getting silently downgraded to plain HTTP, exposing traffic.",
    control: 'Tells the browser to only ever connect via HTTPS for this domain going forward.',
    effect: 'Eliminates a whole class of downgrade/interception attempts.',
  },
  {
    id: 'nosniff',
    header: 'X-Content-Type-Options',
    label: 'X-Content-Type-Options',
    threat: 'A browser "sniffing" a response\'s content type and executing it as something more dangerous than intended, e.g. treating an uploaded file as HTML/script.',
    control: '`nosniff` tells the browser to strictly respect the declared Content-Type.',
    effect: 'Removes a MIME-sniffing-based attack path.',
  },
  {
    id: 'referrer',
    header: 'Referrer-Policy',
    label: 'Referrer Policy',
    threat: 'Sensitive URL information leaking to third-party sites via the Referer header.',
    control: 'Restricts how much referrer information is sent.',
    effect: 'Reduces accidental data leakage.',
  },
  {
    id: 'frame',
    header: 'Frame-Ancestors / X-Frame-Options',
    label: 'Clickjacking defenses',
    threat: 'Your page being embedded in an invisible iframe on an attacker\'s site to trick users into clicking something.',
    control: '`frame-ancestors` / X-Frame-Options restrict who may embed your page in a frame.',
    effect: 'Prevents clickjacking-style UI redress attacks.',
  },
];

@Component({
  selector: 'app-security-headers-cors',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-headers">
      <div class="container">
        <p class="lab-index">22 — SECURITY HEADERS &amp; CORS</p>
        <h2 class="lab-title">Headers are the browser's rulebook for your page.</h2>
        <p class="lab-lede">
          Each header narrows a specific threat down to a specific browser-enforced control. Toggle them off and
          watch the exposed attack surface widen.
        </p>

        <div class="lab-panel">
          <div class="surface-meter">
            <p class="part-label mono">ATTACK SURFACE</p>
            <div class="surface-track">
              @for (slot of surfaceSlots(); track $index) {
                <span class="surface-slot" [class.surface-slot-open]="slot"></span>
              }
            </div>
            <p class="surface-caption mono">{{ headersOffCount() }} of {{ headers.length }} headers disabled</p>
          </div>

          <div class="headers-list">
            @for (h of headers; track h.id) {
              <div class="header-card" [class.header-off]="!isOn(h.id)">
                <div class="header-card-top">
                  <p class="header-name mono">{{ h.header }}</p>
                  <button
                    type="button"
                    class="lab-btn"
                    [class.is-active]="isOn(h.id)"
                    [attr.aria-pressed]="isOn(h.id)"
                    (click)="toggle(h.id)"
                  >
                    {{ isOn(h.id) ? 'ENABLED' : 'DISABLED' }}
                  </button>
                </div>
                <div class="header-steps">
                  <div class="header-step">
                    <p class="step-label mono step-threat">THREAT</p>
                    <p class="step-text">{{ h.threat }}</p>
                  </div>
                  <span class="lab-flow-arrow step-arrow">&#8594;</span>
                  <div class="header-step">
                    <p class="step-label mono step-control">CONTROL</p>
                    <p class="step-text">{{ h.control }}</p>
                  </div>
                  <span class="lab-flow-arrow step-arrow">&#8594;</span>
                  <div class="header-step">
                    <p class="step-label mono" [class]="isOn(h.id) ? 'step-effect' : 'step-effect-off'">
                      {{ isOn(h.id) ? 'REDUCED SURFACE' : 'NOT ENFORCED' }}
                    </p>
                    <p class="step-text">{{ isOn(h.id) ? h.effect : 'Browser has no instruction here — the default, looser behavior applies.' }}</p>
                  </div>
                </div>
              </div>
            }
          </div>

          <p class="part-label mono cors-heading">CORS — CROSS-ORIGIN RESOURCE SHARING</p>
          <div class="cors-panel">
            <div class="cors-flow mono">
              <span class="lab-node" style="color: var(--c-client)">app.example.com (JS)</span>
              <span class="lab-flow-arrow">&#8594;</span>
              <span class="lab-node" style="color: var(--c-server)">api.example.com</span>
            </div>
            <div class="lab-btn-row" role="group" aria-label="CORS response">
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="corsAllowed()"
                [attr.aria-pressed]="corsAllowed()"
                (click)="corsAllowed.set(true)"
              >
                Server sends Access-Control-Allow-Origin: app.example.com
              </button>
              <button
                type="button"
                class="lab-btn lab-btn-danger"
                [class.is-active]="!corsAllowed()"
                [attr.aria-pressed]="!corsAllowed()"
                (click)="corsAllowed.set(false)"
              >
                Server sends no CORS header
              </button>
            </div>
            <p class="cors-result mono" [class.cors-result-ok]="corsAllowed()" [class.cors-result-block]="!corsAllowed()">
              {{ corsAllowed()
                ? 'Browser lets the JS on app.example.com read the response body.'
                : 'Browser blocks JS on app.example.com from reading the response body (the request itself may still reach the server).' }}
            </p>
            <p class="cors-explainer">
              CORS is enforced entirely by the <strong>browser</strong> — the server opts in via
              <code class="mono">Access-Control-Allow-Origin</code> and related headers, and that decision controls
              whether front-end JavaScript on one origin is allowed to read a response from another origin.
            </p>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          CORS is a browser security mechanism, not authentication — misconfigured CORS (e.g. reflecting any
          origin) doesn't grant an attacker any special access on its own, but it can let malicious JavaScript
          running on another origin read data alongside other issues, and is a common misconfiguration to avoid.
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

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 10px; }

    .surface-meter { margin-bottom: 8px; }
    .surface-track { display: flex; gap: 6px; flex-wrap: wrap; }
    .surface-slot {
      width: 22px; height: 14px; border-radius: 3px;
      background: var(--trust); opacity: 0.85;
      transition: background 0.25s ease;
    }
    .surface-slot-open { background: var(--attack); }
    .surface-caption { margin-top: 8px; font-size: 0.6875rem; color: var(--text-faint); }

    .headers-list { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }

    .header-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
      transition: border-color 0.2s ease;
    }
    .header-card:not(.header-off) { border-color: color-mix(in srgb, var(--trust) 40%, var(--border)); }
    .header-off { border-color: color-mix(in srgb, var(--attack) 40%, var(--border)); }

    .header-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .header-name { font-size: 0.8125rem; color: var(--text); }

    .header-steps { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 14px; align-items: start; }
    @media (min-width: 860px) { .header-steps { grid-template-columns: 1fr auto 1fr auto 1fr; } }

    .step-arrow { display: none; }
    @media (min-width: 860px) { .step-arrow { display: block; align-self: center; } }

    .header-step { min-width: 0; }
    .step-label { font-size: 0.6875rem; letter-spacing: 0.06em; margin-bottom: 4px; }
    .step-threat { color: var(--c-attacker); }
    .step-control { color: var(--blocked); }
    .step-effect { color: var(--trust); }
    .step-effect-off { color: var(--attack); }
    .step-text { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .cors-heading { margin-top: 36px; }
    .cors-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
    .cors-flow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }

    .cors-result { margin-top: 14px; font-size: 0.8125rem; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); }
    .cors-result-ok { color: var(--trust); border-color: var(--trust); }
    .cors-result-block { color: var(--blocked); border-color: var(--blocked); }

    .cors-explainer { margin-top: 14px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; max-width: 640px; }
    .cors-explainer strong { color: var(--text); }
    .cors-explainer code { background: var(--surface-elevated); padding: 2px 6px; border-radius: 3px; }
  `,
})
export class SecurityHeadersCors {
  protected readonly headers = HEADERS;

  protected readonly enabled = signal<Set<string>>(new Set(HEADERS.map((h) => h.id)));
  protected readonly corsAllowed = signal(true);

  protected readonly headersOffCount = computed(() => this.headers.length - this.enabled().size);

  protected readonly surfaceSlots = computed(() => {
    const total = this.headers.length;
    const off = this.headersOffCount();
    return Array.from({ length: total }, (_, i) => i < off);
  });

  isOn(id: string): boolean {
    return this.enabled().has(id);
  }

  toggle(id: string): void {
    const set = new Set(this.enabled());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.enabled.set(set);
  }
}
