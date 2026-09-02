import { Component, computed, signal } from '@angular/core';

type Environment = 'development' | 'staging' | 'production';

interface Misconfig {
  id: string;
  label: string;
  consequence: string;
}

const MISCONFIGS: Misconfig[] = [
  {
    id: 'debug',
    label: 'Debug mode',
    consequence: 'Stack traces and internal details are exposed to any client that triggers an error.',
  },
  {
    id: 'verbose-errors',
    label: 'Verbose errors',
    consequence: 'Error messages leak implementation details — file paths, query fragments, library versions.',
  },
  {
    id: 'default-creds',
    label: 'Default credentials',
    consequence: 'The admin panel is still reachable with its out-of-the-box username and password.',
  },
  {
    id: 'open-admin',
    label: 'Open administrative endpoint',
    consequence: 'An admin route is reachable without any extra network or access restriction.',
  },
  {
    id: 'permissive-cors',
    label: 'Overly permissive CORS',
    consequence: 'The API reflects any origin back in Access-Control-Allow-Origin, wide open by default.',
  },
  {
    id: 'exposed-secrets',
    label: 'Exposed secrets',
    consequence: 'A .env-looking config file is accidentally reachable over the web server.',
  },
  {
    id: 'open-ports',
    label: 'Unnecessary ports/services',
    consequence: 'A database or admin service is listening on an internet-facing interface that never needed to be.',
  },
  {
    id: 'missing-headers',
    label: 'Missing security headers',
    consequence: 'CSP, HSTS, and friends are absent — the browser-side protections from the previous lab are not enforced.',
  },
];

const ENV_DEFAULTS: Record<Environment, Set<string>> = {
  development: new Set(MISCONFIGS.map((m) => m.id)),
  staging: new Set(['verbose-errors', 'permissive-cors', 'missing-headers']),
  production: new Set([]),
};

@Component({
  selector: 'app-security-misconfiguration',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-misconfiguration">
      <div class="container">
        <p class="lab-index">23 — SECURITY MISCONFIGURATION</p>
        <h2 class="lab-title">Secure by default, insecure by drift.</h2>
        <p class="lab-lede">
          Every setting below is safe when properly configured — misconfiguration means a convenience left on by
          accident, often because Development, Staging, and Production quietly drifted apart.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Select environment">
            @for (env of environments; track env) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="environment() === env"
                [attr.aria-pressed]="environment() === env"
                (click)="selectEnvironment(env)"
              >
                {{ env.toUpperCase() }}
              </button>
            }
          </div>

          <div class="surface-diagram">
            <p class="part-label mono">ATTACK SURFACE</p>
            <svg class="diagram" viewBox="0 0 640 140" role="img" aria-label="System exposure diagram">
              <g transform="translate(320,70)">
                <rect x="-46" y="-24" width="92" height="48" rx="8" class="core-rect" />
                <text text-anchor="middle" y="5" class="node-text mono">SYSTEM</text>
              </g>
              @for (m of misconfigs; track m.id; let i = $index) {
                <g [attr.transform]="'translate(' + entryPos(i).x + ',' + entryPos(i).y + ')'">
                  <line x1="0" y1="0" [attr.x2]="toCoreDelta(i).x" [attr.y2]="toCoreDelta(i).y"
                    class="entry-line" [class.entry-line-open]="isOn(m.id)" />
                  <circle r="8" class="entry-dot" [class.entry-dot-open]="isOn(m.id)" />
                </g>
              }
            </svg>
            <p class="surface-caption mono">{{ onCount() }} of {{ misconfigs.length }} exposed entry points open</p>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="harden()">Harden this environment</button>
          </div>

          <div class="config-list">
            @for (m of misconfigs; track m.id) {
              <div class="config-card" [class.config-open]="isOn(m.id)">
                <div class="config-top">
                  <p class="config-name mono">{{ m.label }}</p>
                  <button
                    type="button"
                    class="lab-btn"
                    [class.is-active]="isOn(m.id)"
                    [attr.aria-pressed]="isOn(m.id)"
                    (click)="toggle(m.id)"
                  >
                    {{ isOn(m.id) ? 'OPEN' : 'SECURED' }}
                  </button>
                </div>
                @if (isOn(m.id)) {
                  <p class="config-consequence">{{ m.consequence }}</p>
                }
              </div>
            }
          </div>
        </div>

        <p class="lab-note">
          These are all things that are secure by default in a well-configured system but frequently get left
          open by accident, especially when configuration drifts between Development, Staging, and Production.
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

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 10px; margin-top: 24px; }

    .surface-diagram { margin-top: 8px; }
    .diagram { width: 100%; height: auto; aspect-ratio: 640 / 140; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .core-rect { fill: var(--surface-elevated); stroke: var(--trust); stroke-width: 1.5; }
    .node-text { fill: var(--text); font-size: 11px; font-weight: 700; letter-spacing: 0.04em; }

    .entry-line { stroke: var(--border-strong); stroke-width: 1.5; }
    .entry-line-open { stroke: var(--attack); }

    .entry-dot { fill: var(--surface-elevated); stroke: var(--border-strong); stroke-width: 1.5; }
    .entry-dot-open { fill: color-mix(in srgb, var(--attack) 30%, var(--surface-elevated)); stroke: var(--attack); }

    .surface-caption { margin-top: 10px; font-size: 0.6875rem; color: var(--text-faint); }

    .config-list { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }

    .config-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      transition: border-color 0.2s ease;
    }
    .config-open { border-color: color-mix(in srgb, var(--attack) 45%, var(--border)); }

    .config-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .config-name { font-size: 0.8125rem; color: var(--text); }

    .config-consequence { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class SecurityMisconfiguration {
  protected readonly misconfigs = MISCONFIGS;
  protected readonly environments: Environment[] = ['development', 'staging', 'production'];

  protected readonly environment = signal<Environment>('development');
  protected readonly openSet = signal<Set<string>>(new Set(ENV_DEFAULTS.development));

  protected readonly onCount = computed(() => this.openSet().size);

  private readonly positions = this.computePositions();

  selectEnvironment(env: Environment): void {
    this.environment.set(env);
    this.openSet.set(new Set(ENV_DEFAULTS[env]));
  }

  toggle(id: string): void {
    const set = new Set(this.openSet());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.openSet.set(set);
  }

  harden(): void {
    this.openSet.set(new Set());
  }

  isOn(id: string): boolean {
    return this.openSet().has(id);
  }

  entryPos(i: number): { x: number; y: number } {
    return this.positions[i];
  }

  toCoreDelta(i: number): { x: number; y: number } {
    const p = this.positions[i];
    return { x: 320 - p.x, y: 70 - p.y };
  }

  private computePositions(): { x: number; y: number }[] {
    const count = MISCONFIGS.length;
    const radius = 58;
    const cx = 320;
    const cy = 70;
    const ringRadiusX = 260;
    const ringRadiusY = 55;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.round(cx + Math.cos(angle) * ringRadiusX),
        y: Math.round(cy + Math.sin(angle) * (ringRadiusY + radius / 2)),
      };
    });
  }
}
