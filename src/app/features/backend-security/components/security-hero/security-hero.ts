import { Component, computed, signal } from '@angular/core';

type EntryKey = 'input' | 'auth-n' | 'auth-z' | 'session' | 'database' | 'files' | 'external';

interface EntryPoint {
  key: EntryKey;
  label: string;
  caption: string;
}

const ENTRY_POINTS: EntryPoint[] = [
  { key: 'input', label: 'INPUT', caption: 'INPUT — can attacker-controlled data reach something that interprets it as code?' },
  { key: 'auth-n', label: 'AUTHENTICATION', caption: 'AUTHENTICATION — can the attacker prove they are someone they are not?' },
  { key: 'auth-z', label: 'AUTHORIZATION', caption: 'AUTHORIZATION — once inside, can they reach data or actions that aren’t theirs?' },
  { key: 'session', label: 'SESSION', caption: 'SESSION — can a token or cookie be stolen, forged, or reused after it should be dead?' },
  { key: 'database', label: 'DATABASE', caption: 'DATABASE — can untrusted input change the meaning of a query instead of just its value?' },
  { key: 'files', label: 'FILES', caption: 'FILES — can an uploaded or requested file be used to read, write, or execute something unintended?' },
  { key: 'external', label: 'EXTERNAL SERVICES', caption: 'EXTERNAL SERVICES — does this system trust a response, webhook, or dependency more than it should?' },
];

const CYCLE_MS = 2600;

@Component({
  selector: 'app-security-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section sec-scene" id="security-landing">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">BACKEND SECURITY</p>
        <h1 class="hero-title">Your backend has an attack surface.</h1>
        <p class="hero-lede">
          Learn how backend systems get attacked — and build the defenses that stop them.
        </p>

        <div class="lab-panel">
          <div class="stage">
            <div class="node node-client">
              <span class="node-label mono">CLIENT</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-server">
              <span class="node-label mono">API</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-db">
              <span class="node-label mono">DATABASE</span>
            </div>
          </div>

          <div class="attacker-row">
            <div class="node node-attacker">
              <span class="node-label mono">ATTACKER</span>
              <span class="node-sub mono">observing the public API</span>
            </div>

            <div class="paths" role="group" aria-label="Attack entry points">
              @for (ep of entryPoints; track ep.key) {
                <button
                  type="button"
                  class="path-chip mono"
                  [class.is-active]="activeKey() === ep.key"
                  [attr.aria-pressed]="activeKey() === ep.key"
                  (click)="select(ep.key)"
                >
                  {{ ep.label }}
                </button>
              }
            </div>
          </div>

          @if (activeEntry(); as ep) {
            <p class="path-caption">{{ ep.caption }}</p>
          }

          <div class="controls">
            <label class="auto-toggle mono">
              <input type="checkbox" [checked]="autoCycle()" (change)="toggleAuto()" />
              Auto-cycle attack paths
            </label>
            <button type="button" class="lab-btn" [class.is-active]="secure()" [attr.aria-pressed]="secure()" (click)="toggleSecure()">
              {{ secure() ? 'Hide' : 'Show' }} secure system
            </button>
          </div>

          @if (secure()) {
            <div class="defense-row" aria-live="polite">
              @for (ep of entryPoints; track ep.key) {
                <div class="defense-gate" [class.is-triggered]="activeKey() === ep.key">
                  <span class="gate-label mono">{{ ep.label }}</span>
                  <span class="gate-status mono">{{ activeKey() === ep.key ? 'BLOCKED' : 'GUARDED' }}</span>
                </div>
              }
            </div>
            <p class="lab-note">
              Same architecture, now defended — a gate sits in front of every entry point. The attack path being
              highlighted above is stopped before it reaches the API or database.
            </p>
          }
        </div>

        <div class="cta-row">
          <a class="lab-btn lab-btn-primary" href="#security-lab-entry">Enter the Security Lab</a>
          <a class="lab-btn" href="#threat-modeling">Understand the Threat Model</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .sec-scene {
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

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--attack); margin-bottom: 16px; }
    .eyebrow::before { background: var(--attack); box-shadow: 0 0 8px color-mix(in srgb, var(--attack) 45%, transparent); }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 820px; }
    .hero-lede { margin-top: 18px; max-width: 620px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

    .stage { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .node { flex: 1; min-width: 120px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; }
    .node-client { border-color: var(--c-client); }
    .node-server { border-color: var(--c-server); }
    .node-db { border-color: var(--c-db); }
    .node-label { font-size: 0.75rem; color: var(--text); letter-spacing: 0.06em; font-weight: 600; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }

    .attacker-row { margin-top: 28px; display: grid; grid-template-columns: auto 1fr; gap: 20px; align-items: start; }
    @media (max-width: 720px) { .attacker-row { grid-template-columns: 1fr; } }

    .node-attacker { min-width: 140px; border-color: var(--c-attacker); box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-attacker) 30%, transparent); }
    .node-attacker .node-label { color: var(--c-attacker); }

    .paths { display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }
    .path-chip { font-size: 0.75rem; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-muted); transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease; }
    .path-chip:hover { border-color: var(--attack); color: var(--attack); }
    .path-chip.is-active { border-color: var(--attack); color: var(--attack); background: color-mix(in srgb, var(--attack) 14%, var(--surface-elevated)); box-shadow: 0 0 14px color-mix(in srgb, var(--attack) 35%, transparent); }

    .path-caption { margin-top: 16px; font-family: var(--font-mono); font-size: 0.8125rem; color: var(--attack); line-height: 1.6; max-width: 680px; }

    .controls { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
    .auto-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.04em; }
    .auto-toggle input { accent-color: var(--attack); width: 15px; height: 15px; }

    .defense-row { margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
    .defense-gate { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--trust); border-radius: var(--radius-sm); }
    .defense-gate.is-triggered { border-color: var(--blocked); box-shadow: 0 0 12px color-mix(in srgb, var(--blocked) 40%, transparent); }
    .gate-label { font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.05em; }
    .gate-status { font-size: 0.75rem; color: var(--trust); font-weight: 700; }
    .defense-gate.is-triggered .gate-status { color: var(--blocked); }

    .cta-row { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
  `,
})
export class SecurityHero {
  protected readonly entryPoints = ENTRY_POINTS;

  protected readonly activeIndex = signal(0);
  protected readonly secure = signal(false);
  protected readonly autoCycle = signal(true);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly activeKey = computed<EntryKey>(() => this.entryPoints[this.activeIndex()].key);
  protected readonly activeEntry = computed(() => this.entryPoints[this.activeIndex()]);

  constructor() {
    this.startAuto();
  }

  select(key: EntryKey): void {
    this.autoCycle.set(false);
    this.stopAuto();
    const idx = this.entryPoints.findIndex((e) => e.key === key);
    if (idx >= 0) this.activeIndex.set(idx);
  }

  toggleAuto(): void {
    const next = !this.autoCycle();
    this.autoCycle.set(next);
    if (next) this.startAuto();
    else this.stopAuto();
  }

  toggleSecure(): void {
    this.secure.update((v) => !v);
  }

  private startAuto(): void {
    this.stopAuto();
    this.timer = setInterval(() => {
      this.activeIndex.update((i) => (i + 1) % this.entryPoints.length);
    }, CYCLE_MS);
  }

  private stopAuto(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
