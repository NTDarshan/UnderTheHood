import { Component } from '@angular/core';

interface EnvLine {
  label: string;
  laptop: string;
  prod: string;
  mismatch: boolean;
}

const ENV_LINES: EnvLine[] = [
  { label: 'OS', laptop: 'macOS 14', prod: 'Ubuntu 22.04', mismatch: true },
  { label: 'Node.js', laptop: 'v22.4.0', prod: 'v18.19.0', mismatch: true },
  { label: 'OpenSSL', laptop: '3.1.4', prod: '1.1.1', mismatch: true },
  { label: 'Env vars', laptop: '.env (local)', prod: 'unset / different', mismatch: true },
  { label: 'File paths', laptop: '/Users/you/app', prod: '/srv/app', mismatch: true },
];

const LAYERS = ['Application', 'Dependencies', 'Runtime', 'Configuration', 'Filesystem'];

@Component({
  selector: 'app-containers-intro',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-containers-intro">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container">
        <p class="lab-index mono">1 — CONTAINERS</p>
        <h2 class="lab-title">"It works on my machine."</h2>
        <p class="lab-lede">
          Every backend engineer has heard this sentence — usually right before something breaks in production. The
          problem isn't the code. It's that "my machine" and "the server" were never the same environment.
        </p>

        <div class="lab-panel">
          <p class="panel-heading mono">LAPTOP ENVIRONMENT &ne; PRODUCTION ENVIRONMENT</p>
          <div class="env-compare">
            <div class="env-col env-laptop">
              <span class="env-title mono">YOUR LAPTOP</span>
              @for (l of envLines; track l.label) {
                <div class="env-row">
                  <span class="env-key mono">{{ l.label }}</span>
                  <span class="env-val mono is-mismatch">{{ l.laptop }}</span>
                </div>
              }
            </div>
            <div class="env-divider" aria-hidden="true">
              <span class="mismatch-badge mono">MISMATCH</span>
            </div>
            <div class="env-col env-prod">
              <span class="env-title mono">PRODUCTION SERVER</span>
              @for (l of envLines; track l.label) {
                <div class="env-row">
                  <span class="env-key mono">{{ l.label }}</span>
                  <span class="env-val mono is-mismatch">{{ l.prod }}</span>
                </div>
              }
            </div>
          </div>
          <p class="lab-note lab-note-warn">
            Same code, five silent differences. Any one of these can turn "works for me" into a 2am incident.
          </p>
        </div>

        <div class="lab-panel">
          <p class="panel-heading mono">A CONTAINER: ONE REPRODUCIBLE RUNTIME BOUNDARY</p>
          <p class="lab-lede-sm">
            A container bundles everything an application needs to run — the same way, everywhere — into a single,
            isolated unit.
          </p>
          <div class="container-box">
            <span class="container-box-label mono">CONTAINER</span>
            <div class="stack">
              @for (layer of layers; track layer; let i = $index) {
                <div class="stack-layer" [style.--i]="i">
                  <span class="mono">{{ layer }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="lab-panel">
          <p class="panel-heading mono">TRADITIONAL DEPLOYMENT vs CONTAINER DEPLOYMENT</p>
          <div class="deploy-compare">
            <div class="deploy-col deploy-traditional">
              <span class="deploy-title mono">TRADITIONAL</span>
              <div class="host-box">
                <span class="host-label mono">SHARED HOST</span>
                <div class="app-blob app-a">App A <span class="mono ver">node 16</span></div>
                <div class="app-blob app-b">App B <span class="mono ver">node 20</span></div>
                <div class="conflict mono">⚠ dependency &amp; version conflicts</div>
              </div>
            </div>
            <div class="deploy-col deploy-container">
              <span class="deploy-title mono">CONTAINERS</span>
              <div class="host-box host-box-split">
                <div class="mini-container">
                  <span class="mono">App A</span>
                  <span class="mono ver ver-ok">node 16</span>
                </div>
                <div class="mini-container">
                  <span class="mono">App B</span>
                  <span class="mono ver ver-ok">node 20</span>
                </div>
              </div>
              <p class="no-conflict mono">✓ isolated — no conflicts possible</p>
            </div>
          </div>
        </div>

        <div class="stat-grid" role="group" aria-label="What containers give you">
          <div class="stat-tile">
            <span class="stat-label mono">ISOLATION</span>
            <span class="stat-desc">Each container gets its own process, filesystem, and network view.</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label mono">REPRODUCIBILITY</span>
            <span class="stat-desc">The same image runs identically on your laptop and in production.</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label mono">PORTABILITY</span>
            <span class="stat-desc">Ship one artifact — it runs anywhere a container runtime does.</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label mono">PROCESS BOUNDARIES</span>
            <span class="stat-desc">A container is fundamentally a constrained, isolated process — not a tiny VM.</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #64748b;
    }

    .panel-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--do-cyan); margin: 0 0 16px; }
    .lab-lede-sm { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 18px; line-height: 1.6; }
    .lab-panel + .lab-panel { margin-top: 20px; }

    .env-compare { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: stretch; }
    @media (max-width: 640px) { .env-compare { grid-template-columns: 1fr; } .env-divider { flex-direction: row; justify-content: center; } }
    .env-col { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; background: var(--surface); display: flex; flex-direction: column; gap: 10px; }
    .env-title { font-size: 0.75rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 4px; }
    .env-row { display: flex; justify-content: space-between; gap: 10px; font-size: 0.8125rem; padding: 4px 0; border-bottom: 1px dashed var(--border); }
    .env-row:last-child { border-bottom: none; }
    .env-key { color: var(--text-faint); }
    .env-val.is-mismatch { color: var(--do-danger); }
    .env-divider { display: flex; align-items: center; justify-content: center; }
    .mismatch-badge { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--do-danger); border: 1px solid color-mix(in srgb, var(--do-danger) 50%, transparent); border-radius: 999px; padding: 6px 10px; white-space: nowrap; }

    .container-box {
      border: 1px solid var(--do-accent);
      border-radius: var(--radius-lg);
      padding: 20px;
      background: color-mix(in srgb, var(--do-accent) 6%, var(--surface));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 25%, transparent);
      max-width: 420px;
      margin: 0 auto;
    }
    .container-box-label { display: block; text-align: center; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--do-accent); margin-bottom: 14px; }
    .stack { display: flex; flex-direction: column-reverse; gap: 6px; }
    .stack-layer {
      padding: 10px 14px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      color: var(--text);
      text-align: center;
      opacity: 0;
      animation: layer-in 0.5s ease forwards;
      animation-delay: calc(var(--i) * 0.12s);
    }
    @keyframes layer-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .stack-layer { animation: none; opacity: 1; } }

    .deploy-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 640px) { .deploy-compare { grid-template-columns: 1fr; } }
    .deploy-title { display: block; font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 10px; }
    .host-box { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; background: var(--surface); display: flex; flex-direction: column; gap: 8px; min-height: 150px; }
    .app-blob { padding: 10px 12px; border-radius: var(--radius-sm); background: var(--surface-elevated); border: 1px solid var(--do-danger); display: flex; justify-content: space-between; font-size: 0.8125rem; }
    .ver { color: var(--text-faint); }
    .conflict { margin-top: auto; color: var(--do-danger); font-size: 0.75rem; }
    .host-box-split { flex-direction: row; gap: 10px; }
    .mini-container { flex: 1; border: 1px solid var(--do-cyan); border-radius: var(--radius-sm); padding: 14px 10px; background: color-mix(in srgb, var(--do-cyan) 8%, var(--surface-elevated)); display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 0.8125rem; }
    .ver-ok { color: var(--do-cyan); }
    .no-conflict { margin-top: 8px; color: var(--do-success); font-size: 0.75rem; }

    .stat-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .stat-tile { display: flex; flex-direction: column; gap: 6px; padding: 16px; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .stat-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--do-accent); }
    .stat-desc { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class ContainersIntro {
  protected readonly envLines = ENV_LINES;
  protected readonly layers = LAYERS;
}
