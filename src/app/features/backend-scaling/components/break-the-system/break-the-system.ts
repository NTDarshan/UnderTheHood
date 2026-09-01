import { Component, computed, signal } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

type NodeId = 'client' | 'lb' | 'api' | 'cache' | 'db' | 'external' | 'queue';
type Severity = 'ok' | 'warn' | 'crit';

interface NodeDef {
  id: NodeId;
  label: string;
  colorVar: string;
}

interface NodeMetrics {
  latency: number;
  cpu: number;
  connections: number;
}

interface ChaosEffect {
  id: string;
  label: string;
  impacts: Partial<Record<NodeId, Severity>>;
  deltas: Partial<Record<NodeId, Partial<NodeMetrics>>>;
  chain: string[];
}

const NODES: NodeDef[] = [
  { id: 'client', label: 'Client', colorVar: '--c-client' },
  { id: 'lb', label: 'Load Balancer', colorVar: '--c-compute' },
  { id: 'api', label: 'API Servers', colorVar: '--c-compute' },
  { id: 'cache', label: 'Cache', colorVar: '--c-cache' },
  { id: 'db', label: 'Database', colorVar: '--c-db' },
  { id: 'external', label: 'External API', colorVar: '--c-queue' },
  { id: 'queue', label: 'Queue', colorVar: '--c-queue' },
];

const BASE_METRICS: Record<NodeId, NodeMetrics> = {
  client: { latency: 40, cpu: 5, connections: 0 },
  lb: { latency: 5, cpu: 12, connections: 220 },
  api: { latency: 60, cpu: 28, connections: 180 },
  cache: { latency: 2, cpu: 8, connections: 90 },
  db: { latency: 18, cpu: 22, connections: 40 },
  external: { latency: 120, cpu: 0, connections: 10 },
  queue: { latency: 0, cpu: 0, connections: 4 },
};

const EFFECTS: ChaosEffect[] = [
  {
    id: 'traffic',
    label: 'Increase Traffic',
    impacts: { client: 'warn', lb: 'warn', api: 'warn' },
    deltas: {
      lb: { connections: 480, cpu: 30 },
      api: { latency: 90, cpu: 40, connections: 260 },
    },
    chain: [
      'TRAFFIC INCREASES',
      'LOAD BALANCER FORWARDS MORE REQUESTS',
      'API SERVER CPU RISES',
      'RESPONSE TIME INCREASES',
      'P99 LATENCY ↑',
    ],
  },
  {
    id: 'kill-server',
    label: 'Kill Server',
    impacts: { api: 'crit' },
    deltas: {
      api: { latency: 140, cpu: 55, connections: 300 },
    },
    chain: [
      'SERVER KILLED',
      'REMAINING SERVERS ABSORB LOAD',
      'CPU PER SERVER SPIKES',
      'REQUEST QUEUE GROWS',
      'P99 LATENCY ↑',
      'ERROR RATE ↑',
    ],
  },
  {
    id: 'slow-db',
    label: 'Slow Database',
    impacts: { db: 'crit', api: 'warn' },
    deltas: {
      db: { latency: 300, cpu: 35, connections: 60 },
      api: { latency: 220, connections: 140 },
    },
    chain: [
      'DATABASE SLOW',
      'QUERY TIME +300ms',
      'CONNECTIONS BUSY',
      'REQUEST QUEUE GROWS',
      'P99 LATENCY ↑',
      'ERROR RATE ↑',
    ],
  },
  {
    id: 'disable-cache',
    label: 'Disable Cache',
    impacts: { cache: 'crit', db: 'warn', api: 'warn' },
    deltas: {
      cache: { latency: 0, cpu: 0, connections: 0 },
      db: { latency: 160, cpu: 45, connections: 200 },
      api: { latency: 130, cpu: 20 },
    },
    chain: [
      'CACHE DISABLED',
      'ALL READS HIT DATABASE',
      'DATABASE LOAD SPIKES',
      'QUERY LATENCY ↑',
      'P99 LATENCY ↑',
    ],
  },
  {
    id: 'exhaust-connections',
    label: 'Exhaust Connections',
    impacts: { db: 'crit', api: 'crit' },
    deltas: {
      db: { connections: 260 },
      api: { latency: 250, connections: 400 },
    },
    chain: [
      'CONNECTION POOL EXHAUSTED',
      'NEW REQUESTS WAIT FOR A CONNECTION',
      'REQUEST QUEUE GROWS',
      'TIMEOUTS INCREASE',
      'ERROR RATE ↑',
    ],
  },
  {
    id: 'slow-external',
    label: 'Slow External API',
    impacts: { external: 'crit', api: 'warn' },
    deltas: {
      external: { latency: 500 },
      api: { latency: 180, connections: 120 },
    },
    chain: [
      'EXTERNAL API SLOW',
      'OUTBOUND CALL TIME +500ms',
      'API THREADS BLOCKED WAITING',
      'REQUEST QUEUE GROWS',
      'P99 LATENCY ↑',
      'ERROR RATE ↑',
    ],
  },
  {
    id: 'fill-queue',
    label: 'Fill Queue',
    impacts: { queue: 'crit', api: 'warn' },
    deltas: {
      queue: { connections: 400 },
      api: { cpu: 15 },
    },
    chain: [
      'QUEUE FILLS UP',
      'WORKERS FALL BEHIND',
      'BACKLOG GROWS',
      'PROCESSING DELAY ↑',
      'USER-VISIBLE DELAY ↑',
    ],
  },
  {
    id: 'query-time',
    label: 'Increase Query Time',
    impacts: { db: 'warn', api: 'warn' },
    deltas: {
      db: { latency: 150, cpu: 20 },
      api: { latency: 90, connections: 80 },
    },
    chain: [
      'QUERY TIME INCREASES',
      'DATABASE CPU RISES',
      'CONNECTIONS HELD LONGER',
      'REQUEST QUEUE GROWS',
      'P99 LATENCY ↑',
    ],
  },
];

@Component({
  selector: 'app-break-the-system',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section class="lab-section" id="break-the-system">
      <div class="container">
        <p class="lab-index">32 &mdash; BREAK THE SYSTEM</p>
        <h2 class="lab-title">Pull each failure lever and watch the damage propagate.</h2>
        <p class="lab-lede">
          Nothing fails in isolation. Trigger a chaos event and trace exactly how it moves
          through the architecture, node by node, until it reaches the metric you actually see:
          P99 latency and error rate.
        </p>

        <div class="lab-panel">
          <div class="arch-canvas">
            @for (node of nodes; track node.id) {
              <div
                class="arch-node"
                [class.state-warn]="severity(node.id) === 'warn'"
                [class.state-crit]="severity(node.id) === 'crit'"
                [style.--node-color]="'var(' + node.colorVar + ')'"
              >
                <p class="node-name mono">{{ node.label }}</p>
                <p class="node-metric">{{ metrics()[node.id].latency }}ms</p>
                <p class="node-metric-sub mono">CPU {{ metrics()[node.id].cpu }}% &middot; CONN {{ metrics()[node.id].connections }}</p>
              </div>
            }
          </div>

          <div class="lab-btn-row chaos-row">
            @for (effect of effects; track effect.id) {
              <button
                type="button"
                class="lab-btn lab-btn-danger"
                [class.is-active]="active().has(effect.id)"
                [attr.aria-pressed]="active().has(effect.id)"
                (click)="toggle(effect.id)"
              >
                &#128293; {{ effect.label }}
              </button>
            }
            <button type="button" class="lab-btn lab-btn-primary" (click)="reset()">Reset</button>
          </div>

          @if (active().size === 0) {
            <p class="lab-note">System healthy. Trigger a chaos event to see the causal chain.</p>
          } @else {
            <div class="chains">
              @for (effect of activeEffects(); track effect.id) {
                <div class="chain-block">
                  <p class="chain-title mono">{{ effect.label }} → CAUSAL CHAIN</p>
                  <div class="chain-steps">
                    @for (step of effect.chain; track step; let i = $index) {
                      <div class="chain-step" appReveal [appRevealDelay]="i * 120">
                        <span class="lab-node chain-node">{{ step }}</span>
                      </div>
                      @if (i < effect.chain.length - 1) {
                        <div class="lab-flow-arrow chain-arrow" aria-hidden="true">&#8595;</div>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
    }

    .arch-canvas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }

    .arch-node {
      position: relative;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-left: 3px solid var(--node-color);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .node-name { font-size: 0.6875rem; color: var(--text-muted); letter-spacing: 0.06em; }
    .node-metric { margin-top: 6px; font-size: 1.125rem; font-weight: 700; color: var(--text); }
    .node-metric-sub { margin-top: 2px; font-size: 0.6875rem; color: var(--text-faint); }

    .arch-node.state-warn {
      border-color: var(--warn);
      box-shadow: 0 0 0 1px var(--warn) inset;
    }
    .arch-node.state-warn .node-metric { color: var(--warn); }

    .arch-node.state-crit {
      border-color: var(--crit);
      box-shadow: 0 0 0 1px var(--crit) inset;
    }
    .arch-node.state-crit .node-metric { color: var(--crit); }

    .chaos-row { margin-top: 24px; }

    .chains { margin-top: 28px; display: flex; flex-direction: column; gap: 24px; }
    .chain-block { padding-top: 18px; border-top: 1px solid var(--border); }
    .chain-title { font-size: 0.75rem; color: var(--danger); letter-spacing: 0.06em; margin-bottom: 14px; }

    .chain-steps { display: flex; flex-direction: column; align-items: flex-start; }
    .chain-step {
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
    }
    .chain-node { color: var(--text); }
    .chain-arrow { margin: 4px 0 4px 16px; }
  `,
})
export class BreakTheSystem {
  protected readonly nodes = NODES;
  protected readonly effects = EFFECTS;
  protected readonly active = signal<Set<string>>(new Set());

  protected readonly activeEffects = computed(() =>
    this.effects.filter((e) => this.active().has(e.id)),
  );

  protected readonly metrics = computed<Record<NodeId, NodeMetrics>>(() => {
    const result: Record<NodeId, NodeMetrics> = JSON.parse(JSON.stringify(BASE_METRICS));
    for (const effect of this.activeEffects()) {
      for (const [nodeId, delta] of Object.entries(effect.deltas) as [NodeId, Partial<NodeMetrics>][]) {
        result[nodeId].latency += delta.latency ?? 0;
        result[nodeId].cpu = Math.min(100, result[nodeId].cpu + (delta.cpu ?? 0));
        result[nodeId].connections += delta.connections ?? 0;
      }
    }
    return result;
  });

  severity(nodeId: NodeId): Severity {
    let worst: Severity = 'ok';
    for (const effect of this.activeEffects()) {
      const s = effect.impacts[nodeId];
      if (s === 'crit') return 'crit';
      if (s === 'warn') worst = 'warn';
    }
    return worst;
  }

  toggle(id: string): void {
    this.active.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  reset(): void {
    this.active.set(new Set());
  }
}
