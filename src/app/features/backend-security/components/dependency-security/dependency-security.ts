import { Component, signal } from '@angular/core';

interface DepBox {
  id: string;
  label: string;
}

interface Mitigation {
  id: string;
  label: string;
  detail: string;
}

const LAYERS: DepBox[] = [
  { id: 'http-client', label: 'http-client' },
  { id: 'json-parser', label: 'json-parser' },
  { id: 'image-resize', label: 'image-resize' },
  { id: 'auth-helper', label: 'auth-helper' },
];

const VULNERABLE_ID = 'image-resize';

const MITIGATIONS: Mitigation[] = [
  {
    id: 'scanning',
    label: 'Dependency scanning',
    detail: 'Automated tooling checks your dependency tree against known-vulnerability databases.',
  },
  {
    id: 'lockfiles',
    label: 'Lockfiles',
    detail: 'Pinning exact resolved versions makes builds reproducible — a compromised new version cannot silently slip in.',
  },
  {
    id: 'updates',
    label: 'Version updates',
    detail: 'Keeping dependencies reasonably current so fixes that already exist are actually applied.',
  },
  {
    id: 'sca',
    label: 'Software composition analysis',
    detail: 'Broader visibility into everything your build actually pulls in, including transitive dependencies you never directly chose.',
  },
  {
    id: 'trusted-sources',
    label: 'Trusted package sources',
    detail: 'Verifying you are pulling from the legitimate registry/source, not a typosquatted or compromised one.',
  },
];

type Phase = 'idle' | 'entered' | 'cve' | 'alert';

@Component({
  selector: 'app-dependency-security',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="dependency-security">
      <div class="container">
        <p class="lab-index">27 — DEPENDENCY &amp; SUPPLY-CHAIN SECURITY</p>
        <h2 class="lab-title">Your application rests on code you did not write, and mostly never read.</h2>
        <p class="lab-lede">
          Every dependency you install becomes part of your attack surface — including the dependencies those
          dependencies pull in, several layers deep.
        </p>

        <div class="lab-panel">
          <div class="stack-diagram">
            <div class="app-layer">
              <p class="lab-node">YOUR APPLICATION</p>
            </div>
            <div class="dep-layer" role="list" aria-label="Direct dependencies">
              @for (dep of layers; track dep.id) {
                <div
                  class="dep-box mono"
                  role="listitem"
                  [class.is-vulnerable]="dep.id === vulnerableId && phase() !== 'idle'"
                >
                  {{ dep.label }}
                </div>
              }
            </div>
            <div class="transitive-layer">
              <p class="lab-node transitive-label">TRANSITIVE / NESTED DEPENDENCIES</p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runScenario()">Introduce vulnerable dependency</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="scenario-log" role="status" aria-live="polite">
            @if (phase() === 'idle') {
              <p class="result-line">No known issues in this dependency tree yet.</p>
            }
            @if (phase() === 'entered' || phase() === 'cve' || phase() === 'alert') {
              <p class="log-line">
                <span class="pill pill-conditional">UPDATED</span>
                <code class="mono">{{ vulnerableId }}</code> was updated to a new version as part of routine
                maintenance.
              </p>
            }
            @if (phase() === 'cve' || phase() === 'alert') {
              <p class="log-line">
                <span class="pill pill-no cve-pill">CVE-2027-04821</span>
                A known vulnerability was published for this exact version of
                <code class="mono">{{ vulnerableId }}</code>.
              </p>
            }
            @if (phase() === 'alert') {
              <div class="alert-callout">
                <p class="pill pill-no cve-pill">SECURITY ALERT</p>
                <p class="alert-text">
                  Your dependency scanner flagged <code class="mono">{{ vulnerableId }}</code> as vulnerable. It
                  is used by your application even though nobody on the team wrote or reviewed its code.
                </p>
              </div>
            }
          </div>
        </div>

        <div class="mitigation-grid">
          @for (m of mitigations; track m.id) {
            <div class="mitigation-card">
              <p class="pill pill-yes">{{ m.label }}</p>
              <p class="mitigation-detail">{{ m.detail }}</p>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Your application's attack surface includes software you did not write — a vulnerability in a dependency
          three levels deep in your dependency tree is still a vulnerability in your system.
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

    .stack-diagram { display: flex; flex-direction: column; align-items: stretch; gap: 4px; }
    .app-layer { text-align: center; padding: 14px; border: 1px solid var(--c-server); border-radius: var(--radius-md); background: color-mix(in srgb, var(--c-server) 10%, var(--surface)); }
    .dep-layer { margin-top: 10px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    @media (min-width: 560px) { .dep-layer { grid-template-columns: repeat(4, 1fr); } }
    .dep-box { text-align: center; padding: 12px 8px; font-size: 0.75rem; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-muted); transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    .dep-box.is-vulnerable { border-color: var(--attack); color: var(--attack); background: color-mix(in srgb, var(--attack) 14%, var(--surface)); box-shadow: 0 0 14px color-mix(in srgb, var(--attack) 35%, transparent); }
    .transitive-layer { margin-top: 10px; text-align: center; padding: 10px; border: 1px dashed var(--border-strong); border-radius: var(--radius-md); }
    .transitive-label { color: var(--text-faint); font-size: 0.6875rem; }

    .scenario-log { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; min-height: 40px; }
    .result-line { font-size: 0.8125rem; color: var(--text-muted); }
    .log-line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .cve-pill { color: var(--attack); border-color: var(--attack); }
    .alert-callout { border-left: 2px solid var(--attack); padding: 10px 14px; background: color-mix(in srgb, var(--attack) 8%, var(--surface)); border-radius: var(--radius-sm); }
    .alert-text { margin-top: 6px; font-size: 0.8125rem; color: var(--text); line-height: 1.55; }

    .mitigation-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .mitigation-grid { grid-template-columns: 1fr 1fr; } }
    .mitigation-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
    .mitigation-detail { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class DependencySecurity {
  protected readonly layers = LAYERS;
  protected readonly mitigations = MITIGATIONS;
  protected readonly vulnerableId = VULNERABLE_ID;

  protected readonly phase = signal<Phase>('idle');

  private timers: ReturnType<typeof setTimeout>[] = [];

  protected runScenario(): void {
    this.clearTimers();
    this.phase.set('entered');
    this.timers.push(setTimeout(() => this.phase.set('cve'), 500));
    this.timers.push(setTimeout(() => this.phase.set('alert'), 1100));
  }

  protected reset(): void {
    this.clearTimers();
    this.phase.set('idle');
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }
}
