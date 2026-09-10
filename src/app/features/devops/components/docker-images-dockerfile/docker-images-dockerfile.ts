import { Component, OnDestroy, computed, signal } from '@angular/core';

type LayerState = 'pending' | 'building' | 'cached' | 'built';

interface BuildLayer {
  instruction: string;
  label: string;
}

const LAYERS: BuildLayer[] = [
  { instruction: 'FROM node:20-alpine', label: 'Base runtime' },
  { instruction: 'COPY package*.json ./\nRUN npm ci', label: 'Dependencies' },
  { instruction: 'COPY . .', label: 'Application' },
  { instruction: 'ENTRYPOINT ["node", "server.js"]', label: 'Configuration' },
];

const BASE_IMAGE_OPTIONS = ['node:20-alpine', 'node:18-alpine', 'node:20-bullseye'];

@Component({
  selector: 'app-docker-images-dockerfile',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-docker-images">
      <div class="container">
        <p class="lab-index mono">3 — IMAGES &amp; THE DOCKERFILE</p>
        <h2 class="lab-title">A Dockerfile builds a stack of layers</h2>
        <p class="lab-lede">
          Each instruction in a Dockerfile produces one layer, cached independently. Build it, then change a line
          and watch how caching decides what has to be rebuilt.
        </p>

        <div class="lab-panel">
          <pre class="lab-code mono">{{ dockerfileText() }}</pre>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="build()" [disabled]="isBuilding()">
              {{ hasBuilt() ? 'REBUILD' : 'BUILD IMAGE' }}
            </button>
            <button type="button" class="lab-btn" (click)="changeLastLayer()" [disabled]="isBuilding()">
              EDIT LAST LINE (config)
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="changeBaseImage()" [disabled]="isBuilding()">
              EDIT FROM LINE (base image)
            </button>
          </div>

          <div class="stack-wrap">
            <div class="stack">
              @for (layer of displayLayers(); track layer.label; let i = $index) {
                <div class="stack-layer" [attr.data-state]="layerStates()[i]">
                  <span class="layer-index mono">{{ i + 1 }}</span>
                  <span class="layer-name mono">{{ layer.label }}</span>
                  <span class="layer-status mono">{{ statusText(layerStates()[i]) }}</span>
                </div>
              }
            </div>
          </div>

          <p class="lab-note" [class.lab-note-warn]="lastActionWasBaseChange()">{{ noteText() }}</p>
        </div>

        <div class="lab-panel">
          <p class="panel-heading mono">IMAGE &ne; CONTAINER</p>
          <p class="lab-lede-sm">
            The image is the inert, stacked blueprint you just built. A container is a running instance spawned from
            it — you can start several containers from the exact same image.
          </p>
          <div class="spawn-row">
            <div class="image-block">
              <span class="mono">IMAGE</span>
              <span class="mono image-tag">myapp:latest</span>
            </div>
            <span class="lab-flow-arrow" [class.is-live]="spawning()">&rarr;</span>
            <div class="containers-row">
              @for (c of runningContainers(); track c) {
                <div class="running-container">
                  <span class="pulse-dot" aria-hidden="true"></span>
                  <span class="mono">container {{ c }}</span>
                </div>
              }
              @if (runningContainers().length === 0) {
                <span class="mono placeholder-text">no containers running yet</span>
              }
            </div>
          </div>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="spawnContainer()" [disabled]="!hasBuilt() || spawning()">
              RUN A CONTAINER FROM THIS IMAGE
            </button>
            @if (runningContainers().length > 0) {
              <button type="button" class="lab-btn" (click)="runningContainers.set([])">STOP ALL</button>
            }
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
    .lab-panel + .lab-panel { margin-top: 20px; }
    .panel-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--do-cyan); margin: 0 0 12px; }
    .lab-lede-sm { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 18px; line-height: 1.6; }
    .lab-code { white-space: pre-wrap; }

    .stack-wrap { margin-top: 20px; }
    .stack { display: flex; flex-direction: column-reverse; gap: 6px; }
    .stack-layer {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-elevated);
      transition: border-color 0.3s ease, background 0.3s ease, opacity 0.3s ease;
    }
    .layer-index { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid var(--border-strong); font-size: 0.6875rem; color: var(--text-faint); flex: none; }
    .layer-name { flex: 1; font-size: 0.8125rem; color: var(--text); }
    .layer-status { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); }

    .stack-layer[data-state='pending'] { opacity: 0.4; }
    .stack-layer[data-state='building'] { border-color: var(--do-accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 30%, transparent); }
    .stack-layer[data-state='building'] .layer-status { color: var(--do-accent); }
    .stack-layer[data-state='cached'] { border-color: var(--do-cyan); opacity: 0.75; }
    .stack-layer[data-state='cached'] .layer-status { color: var(--do-cyan); }
    .stack-layer[data-state='built'] { border-color: var(--do-success); }
    .stack-layer[data-state='built'] .layer-status { color: var(--do-success); }

    .spawn-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .image-block { display: flex; flex-direction: column; gap: 4px; padding: 16px 20px; border: 1px solid var(--do-violet); border-radius: var(--radius-md); background: color-mix(in srgb, var(--do-violet) 8%, var(--surface)); text-align: center; }
    .image-tag { font-size: 0.75rem; color: var(--text-faint); }
    .containers-row { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; min-height: 44px; align-items: center; }
    .running-container { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--do-success); border-radius: 999px; background: color-mix(in srgb, var(--do-success) 8%, var(--surface)); font-size: 0.75rem; }
    .placeholder-text { font-size: 0.75rem; color: var(--text-faint); }
    .pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--do-success); box-shadow: 0 0 8px color-mix(in srgb, var(--do-success) 60%, transparent); animation: pulse 1.6s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
    .lab-flow-arrow.is-live { color: var(--do-accent); animation: arrow-flash 0.6s ease-in-out infinite; }
    @keyframes arrow-flash { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .stack-layer, .pulse-dot, .lab-flow-arrow.is-live { animation: none; transition: none; }
    }
  `,
})
export class DockerImagesDockerfile implements OnDestroy {
  protected readonly layers = LAYERS;
  protected readonly baseImageIndex = signal(0);
  protected readonly layerStates = signal<LayerState[]>(LAYERS.map(() => 'pending'));
  protected readonly isBuilding = signal(false);
  protected readonly hasBuilt = signal(false);
  protected readonly lastActionWasBaseChange = signal(false);
  protected readonly spawning = signal(false);
  protected readonly runningContainers = signal<number[]>([]);

  private nextContainerId = 1;
  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly displayLayers = computed(() => this.layers);

  protected readonly dockerfileText = computed(() => {
    const base = BASE_IMAGE_OPTIONS[this.baseImageIndex()];
    return [
      `FROM ${base}`,
      `COPY package*.json ./`,
      `RUN npm ci`,
      `COPY . .`,
      `ENTRYPOINT ["node", "server.js"]`,
    ].join('\n');
  });

  protected readonly noteText = computed(() => {
    if (this.isBuilding()) return 'Building… layers below their first changed layer must be rebuilt from scratch.';
    if (this.lastActionWasBaseChange()) {
      return 'Changing FROM invalidates every layer below it — the entire cache is busted, so all 4 layers rebuild.';
    }
    if (this.hasBuilt()) {
      return 'Changing only the last instruction keeps earlier layers cached — only that one layer rebuilds.';
    }
    return 'Click BUILD IMAGE to run through the Dockerfile top to bottom.';
  });

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected build(invalidateFrom = 0): void {
    if (this.isBuilding()) return;
    this.isBuilding.set(true);
    this.hasBuilt.set(false);

    const states = this.layerStates().map((s, i) => (i < invalidateFrom ? 'cached' : 'pending')) as LayerState[];
    this.layerStates.set(states);

    let i = invalidateFrom;
    const step = () => {
      if (i >= this.layers.length) {
        this.isBuilding.set(false);
        this.hasBuilt.set(true);
        return;
      }
      this.layerStates.update((list) => list.map((s, idx) => (idx === i ? 'building' : s)));
      this.timers.push(
        setTimeout(() => {
          this.layerStates.update((list) => list.map((s, idx) => (idx === i ? 'built' : s)));
          i++;
          this.timers.push(setTimeout(step, 150));
        }, 550),
      );
    };
    step();
  }

  protected changeLastLayer(): void {
    if (this.isBuilding()) return;
    this.lastActionWasBaseChange.set(false);
    this.build(this.layers.length - 1);
  }

  protected changeBaseImage(): void {
    if (this.isBuilding()) return;
    this.baseImageIndex.update((v) => (v + 1) % BASE_IMAGE_OPTIONS.length);
    this.lastActionWasBaseChange.set(true);
    this.build(0);
  }

  protected spawnContainer(): void {
    if (!this.hasBuilt() || this.spawning()) return;
    this.spawning.set(true);
    this.timers.push(
      setTimeout(() => {
        this.runningContainers.update((list) => [...list, this.nextContainerId++].slice(-3));
        this.spawning.set(false);
      }, 450),
    );
  }

  protected statusText(state: LayerState): string {
    switch (state) {
      case 'building': return 'BUILDING…';
      case 'cached': return 'CACHED';
      case 'built': return 'BUILT';
      default: return 'PENDING';
    }
  }
}
