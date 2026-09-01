import { Component, computed, signal } from '@angular/core';

interface Stage {
  n: number;
  name: string;
  caption: string;
}

const STAGES: Stage[] = [
  { n: 1, name: 'One server', caption: 'One server handles everything — web layer, application logic, and the database, all on a single machine. It works, until traffic exceeds what one machine can do.' },
  { n: 2, name: 'Vertical scale', caption: 'The first fix is the simplest: a bigger server — more CPU, more RAM. Vertical scaling buys time, but every machine has a ceiling, and this one is approaching it.' },
  { n: 3, name: 'Load balancer', caption: 'Before a second server can be added, something has to decide which one handles each request. The load balancer arrives now, in front of the small pool that’s about to grow.' },
  { n: 4, name: 'Horizontal scale', caption: 'With a load balancer in place, servers can now be added freely. Horizontal scaling spreads load across many small machines instead of one large one, with no ceiling tied to a single box.' },
  { n: 5, name: 'Cache', caption: 'More API servers didn’t reduce database load — every request still reaches it. A cache sits between the API and the database, absorbing reads that don’t need to hit it every single time.' },
  { n: 6, name: 'Read replicas', caption: 'Writes still funnel through one primary, but reads now vastly outnumber writes. Read replicas copy the primary’s data so read traffic can be spread across several database instances.' },
  { n: 7, name: 'CDN', caption: 'Static assets and cacheable responses were being served from the same servers as dynamic requests, and distant users still waited on distance. A CDN moves that traffic to edge locations, off the origin path entirely.' },
  { n: 8, name: 'Queue + workers', caption: 'Some requests — sending an email, generating a report, resizing an image — don’t need an instant response, but they were blocking the same synchronous path as everything else. A queue and a pool of workers pull that work off it.' },
  { n: 9, name: 'Autoscaling', caption: 'Manually adding and removing servers for every traffic swing doesn’t scale as a process, even though the architecture does. Autoscaling watches load and adjusts server count automatically, inside a boundary the system manages itself.' },
  { n: 10, name: 'Observability + resilience', caption: 'A well-scaled system can still fail silently, or let one dependency’s outage cascade into a full outage. Observability makes problems visible before users report them; a circuit breaker stops a failing dependency from taking everything else down with it.' },
];

@Component({
  selector: 'app-system-evolution',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="system-evolution">
      <div class="container">
        <p class="lab-index">30 — COMPLETE SYSTEM EVOLUTION</p>
        <h2 class="lab-title">Ten stages. Every one exists because the stage before it hit a wall.</h2>
        <p class="lab-lede">
          Step through the same system growing up, piece by piece. Each addition is a direct response to a
          specific constraint the previous version actually had — not a checklist of "best practices."
        </p>

        <div class="lab-panel">
          <!-- stage rail -->
          <div class="rail" role="tablist" aria-label="Evolution stages">
            @for (s of stages; track s.n) {
              <button
                type="button"
                role="tab"
                class="rail-dot"
                [class.rail-dot-active]="stage() === s.n"
                [class.rail-dot-done]="s.n < stage()"
                [attr.aria-selected]="stage() === s.n"
                [attr.aria-label]="'Stage ' + s.n + ': ' + s.name"
                (click)="goTo(s.n)"
              >
                <span class="rail-dot-num mono">{{ s.n }}</span>
              </button>
            }
          </div>

          <!-- diagram -->
          <div class="canvas-wrap">
            <svg class="canvas" viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet">
              <!-- edges -->
              <line class="edge" [class.edge-off]="!cdnOn()" x1="70" y1="200" x2="150" y2="200" />
              <line class="edge" [class.edge-off]="!cdnOn()" x1="150" y1="200" x2="230" y2="200" />
              <line class="edge" [class.edge-off]="!lbOn()" x1="230" y1="200" x2="300" y2="200" />
              <line class="edge" x1="300" y1="200" x2="360" y2="200" />
              <line class="edge" [class.edge-off]="!cacheOn()" x1="470" y1="150" x2="540" y2="120" />
              <line class="edge" x1="470" y1="200" x2="600" y2="200" [class.edge-off]="!cacheOn()" />
              <line class="edge-branch" [class.edge-off]="!queueOn()" x1="470" y1="250" x2="540" y2="290" />
              <line class="edge-branch" [class.edge-off]="!queueOn()" x1="600" y1="290" x2="660" y2="290" />
              <line class="edge-dep" x1="690" y1="200" x2="790" y2="200" />
              @for (r of replicaBoxes(); track $index; let i = $index) {
                <line class="edge-thin" x1="645" y1="228" x2="645" [attr.y2]="270 + i * 44" />
              }

              <!-- autoscale boundary -->
              @if (autoscaleOn()) {
                <rect class="autoscale-box" x="222" y="55" [attr.width]="autoscaleBoxWidth()" height="160" rx="10" />
                <text x="232" y="46" class="autoscale-label mono">AUTO</text>
              }

              <!-- observability overlay -->
              @if (observabilityOn()) {
                <g class="observe-badge" transform="translate(830,20)">
                  <circle r="14" />
                  <text y="5" class="observe-icon">◎</text>
                </g>
              }

              <!-- USERS -->
              <g class="node node-client">
                <rect x="20" y="175" width="70" height="50" rx="8" />
                <text x="55" y="204" class="node-label">USERS</text>
              </g>

              <!-- CDN -->
              <g class="node node-client" [class.node-ghost]="!cdnOn()">
                <rect x="110" y="175" width="70" height="50" rx="8" />
                <text x="145" y="204" class="node-label">CDN</text>
              </g>

              <!-- LOAD BALANCER -->
              <g class="node node-compute" [class.node-ghost]="!lbOn()">
                <rect x="200" y="175" width="70" height="50" rx="8" />
                <text x="235" y="200" class="node-label">LOAD</text>
                <text x="235" y="214" class="node-label">BALANCER</text>
              </g>

              <!-- API SERVERS -->
              @for (b of serverBoxes(); track $index; let i = $index) {
                <g class="node node-compute node-small">
                  <rect [attr.x]="360" [attr.y]="60 + i * 34" [attr.width]="serverWidth()" height="26" rx="5" />
                  <text [attr.x]="360 + serverWidth() / 2" [attr.y]="60 + i * 34 + 17" class="node-label-sm">API {{ i + 1 }}</text>
                </g>
              }

              <!-- CACHE -->
              <g class="node node-cache" [class.node-ghost]="!cacheOn()">
                <rect x="540" y="95" width="76" height="46" rx="8" />
                <text x="578" y="122" class="node-label">CACHE</text>
              </g>

              <!-- DATABASE PRIMARY -->
              <g class="node node-db">
                <rect x="600" y="175" width="90" height="55" rx="8" />
                <text x="645" y="198" class="node-label">DATABASE</text>
                <text x="645" y="212" class="node-label">PRIMARY</text>
              </g>

              <!-- REPLICAS -->
              @for (r of replicaBoxes(); track $index; let i = $index) {
                <g class="node node-db node-small">
                  <rect x="600" [attr.y]="270 + i * 44" width="90" height="32" rx="6" />
                  <text x="645" [attr.y]="270 + i * 44 + 20" class="node-label-sm">REPLICA {{ i + 1 }}</text>
                </g>
              }

              <!-- QUEUE -->
              <g class="node node-queue" [class.node-ghost]="!queueOn()">
                <rect x="540" y="272" width="66" height="42" rx="8" />
                <text x="573" y="297" class="node-label-sm">QUEUE</text>
              </g>

              <!-- WORKERS -->
              <g class="node node-queue" [class.node-ghost]="!queueOn()">
                <rect x="660" y="272" width="76" height="42" rx="8" />
                <text x="698" y="297" class="node-label-sm">WORKERS</text>
              </g>

              <!-- EXTERNAL DEPENDENCY -->
              <g class="node node-ext">
                <rect x="790" y="175" width="90" height="50" rx="8" />
                <text x="835" y="198" class="node-label-sm">PAYMENTS</text>
                <text x="835" y="212" class="node-label-sm">API (3rd party)</text>
              </g>
              @if (circuitBreakerOn()) {
                <g class="cb-badge" transform="translate(755,200)">
                  <rect x="-13" y="-13" width="26" height="26" rx="6" />
                  <text y="5" class="cb-icon">⏻</text>
                </g>
              }
            </svg>
          </div>

          <!-- stage-specific interactive bit -->
          @if (stage() === 9) {
            <div class="spike-row">
              <button type="button" class="lab-btn" [class.is-active]="spike()" (click)="spike.set(!spike())">
                {{ spike() ? 'Traffic spike active — auto-scaled up' : 'Simulate a traffic spike' }}
              </button>
              <span class="spike-readout mono">instances: {{ serverBoxes().length }}</span>
            </div>
          }

          <!-- caption -->
          <div class="caption-box">
            <p class="caption-index mono">STAGE {{ stage() }} / 10 — {{ currentStage().name.toUpperCase() }}</p>
            <p class="caption-text">{{ currentStage().caption }}</p>
          </div>

          <div class="nav-row">
            <button type="button" class="lab-btn" (click)="prev()" [disabled]="stage() === 1">← Previous</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="next()" [disabled]="stage() === 10">Next →</button>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          You don't necessarily need every one of these ten pieces. Each addition here solved a
          <strong>specific constraint</strong> the system actually hit at that point — a cache because reads were
          swamping the database, a queue because slow work was blocking fast requests. Adding any of them by
          default, or because it's fashionable, adds operational cost without solving a problem you actually have.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .rail { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
    .rail-dot {
      width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border-strong);
      background: var(--surface); display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .rail-dot-num { font-size: 0.6875rem; color: var(--text-faint); }
    .rail-dot-done { background: var(--surface-elevated); border-color: var(--border-strong); }
    .rail-dot-done .rail-dot-num { color: var(--text-muted); }
    .rail-dot-active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--glow-accent); }
    .rail-dot-active .rail-dot-num { color: var(--accent-strong); }

    .canvas-wrap { margin-top: 4px; }
    .canvas { width: 100%; height: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .edge { stroke: var(--border-strong); stroke-width: 2; }
    .edge-thin { stroke: var(--border-strong); stroke-width: 1.5; opacity: 0.6; }
    .edge-branch { stroke: var(--c-queue); stroke-width: 2; stroke-dasharray: 5 4; }
    .edge-dep { stroke: var(--border-strong); stroke-width: 1.5; stroke-dasharray: 3 3; }
    .edge-off { stroke: var(--border); stroke-dasharray: 3 4; opacity: 0.35; }

    .node rect { fill: var(--surface-elevated); stroke-width: 1.5; transition: opacity 0.25s ease; }
    .node-label { fill: var(--text); font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-anchor: middle; letter-spacing: 0.03em; }
    .node-label-sm { fill: var(--text); font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; text-anchor: middle; }

    .node-client rect { stroke: var(--c-client); }
    .node-compute rect { stroke: var(--c-compute); }
    .node-db rect { stroke: var(--c-db); }
    .node-cache rect { stroke: var(--c-cache); }
    .node-queue rect { stroke: var(--c-queue); }
    .node-ext rect { stroke: var(--text-faint); stroke-dasharray: 3 2; }

    .node-ghost rect { fill: transparent; opacity: 0.35; stroke-dasharray: 4 3; }
    .node-ghost .node-label, .node-ghost .node-label-sm { opacity: 0.45; }

    .autoscale-box { fill: transparent; stroke: var(--c-compute); stroke-width: 1.5; stroke-dasharray: 6 4; }
    .autoscale-label { fill: var(--c-compute); font-size: 9px; letter-spacing: 0.1em; }

    .observe-badge circle { fill: var(--surface-elevated); stroke: var(--accent-2); stroke-width: 1.5; }
    .observe-icon { fill: var(--accent-2); text-anchor: middle; font-size: 14px; }

    .cb-badge rect { fill: var(--surface-elevated); stroke: var(--warn); stroke-width: 1.5; }
    .cb-icon { fill: var(--warn); text-anchor: middle; font-size: 13px; }

    .spike-row { margin-top: 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .spike-readout { color: var(--text-muted); font-size: 0.8125rem; }

    .caption-box { margin-top: 22px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .caption-index { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--accent-2); margin-bottom: 8px; }
    .caption-text { color: var(--text-muted); line-height: 1.65; max-width: 680px; }

    .nav-row { margin-top: 20px; display: flex; justify-content: space-between; gap: 12px; }
  `,
})
export class SystemEvolution {
  protected readonly stages = STAGES;
  protected readonly stage = signal(1);
  protected readonly spike = signal(false);

  protected readonly currentStage = computed(() => this.stages[this.stage() - 1]);

  protected readonly lbOn = computed(() => this.stage() >= 3);
  protected readonly cacheOn = computed(() => this.stage() >= 5);
  protected readonly cdnOn = computed(() => this.stage() >= 7);
  protected readonly queueOn = computed(() => this.stage() >= 8);
  protected readonly autoscaleOn = computed(() => this.stage() >= 9);
  protected readonly observabilityOn = computed(() => this.stage() >= 10);
  protected readonly circuitBreakerOn = computed(() => this.stage() >= 10);

  protected readonly replicaBoxes = computed(() => (this.stage() >= 6 ? [0, 1] : []));

  protected readonly baseServerCount = computed(() => {
    const s = this.stage();
    if (s >= 9) return 4;
    if (s >= 4) return 4;
    if (s >= 3) return 2;
    return 1;
  });

  protected readonly serverBoxes = computed(() => {
    const base = this.baseServerCount();
    const bump = this.stage() === 9 && this.spike() ? 3 : 0;
    return Array.from({ length: base + bump }, (_, i) => i);
  });

  protected readonly serverWidth = computed(() => (this.stage() === 2 ? 130 : 100));

  protected readonly autoscaleBoxWidth = computed(() => 138 + this.serverBoxes().length * 0);

  goTo(n: number): void {
    this.stage.set(n);
    if (n !== 9) this.spike.set(false);
  }

  prev(): void {
    this.stage.update((s) => Math.max(1, s - 1));
    if (this.stage() !== 9) this.spike.set(false);
  }

  next(): void {
    this.stage.update((s) => Math.min(10, s + 1));
    if (this.stage() !== 9) this.spike.set(false);
  }
}
