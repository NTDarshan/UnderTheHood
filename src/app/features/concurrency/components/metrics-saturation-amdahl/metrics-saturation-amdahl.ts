import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ContentionScenario {
  resource: string;
  description: string;
  threads: { id: string; state: 'holding' | 'waiting' | 'idle' }[];
  note: string;
}

const CONTENTION_SCENARIOS: ContentionScenario[] = [
  {
    resource: 'LOCK',
    description:
      'Thread A holds a mutex protecting a shared counter. B, C, and D all need it and pile up in the wait queue.',
    threads: [
      { id: 'A', state: 'holding' },
      { id: 'B', state: 'waiting' },
      { id: 'C', state: 'waiting' },
      { id: 'D', state: 'waiting' },
    ],
    note: 'Only one thread makes progress on the protected section at a time. The other three burn wall-clock time doing nothing but waiting.',
  },
  {
    resource: 'DATABASE CONNECTION',
    description:
      'The connection pool has 1 free slot. A grabs it to run a query; B, C, and D queue for the next available connection.',
    threads: [
      { id: 'A', state: 'holding' },
      { id: 'B', state: 'waiting' },
      { id: 'C', state: 'waiting' },
      { id: 'D', state: 'waiting' },
    ],
    note: 'A pool sized smaller than concurrent demand turns "more requests" directly into "more queueing," independent of how fast the database itself is.',
  },
  {
    resource: 'CPU',
    description:
      'All 4 threads are runnable at once, but the machine has 1 core. The scheduler time-slices between them — none run for very long uninterrupted.',
    threads: [
      { id: 'A', state: 'holding' },
      { id: 'B', state: 'waiting' },
      { id: 'C', state: 'waiting' },
      { id: 'D', state: 'waiting' },
    ],
    note: 'Unlike a lock or a connection, the CPU rotates fairly among contenders via preemption — but total throughput is still capped by the number of physical cores.',
  },
  {
    resource: 'MEMORY',
    description:
      'A holds a large allocation the garbage collector cannot reclaim yet. B, C, and D all trigger allocations that stall waiting for memory pressure to ease.',
    threads: [
      { id: 'A', state: 'holding' },
      { id: 'B', state: 'waiting' },
      { id: 'C', state: 'waiting' },
      { id: 'D', state: 'waiting' },
    ],
    note: 'Memory contention is the least visible of the four — there is no explicit "lock" to inspect, just GC pauses and allocation stalls that look like generic slowness.',
  },
];

const CORE_OPTIONS = [1, 2, 4, 8, 16, 32] as const;

@Component({
  selector: 'app-metrics-saturation-amdahl',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section cx-scene" id="metrics-saturation-amdahl">
      <div class="container">
        <p class="lab-index mono">40-43 — THROUGHPUT, LATENCY, SATURATION AND AMDAHL'S LAW</p>
        <h2 class="lab-title">Throughput, latency, saturation and Amdahl's Law</h2>
        <p class="lab-lede">
          Concurrency isn't free capacity — it's a knob that trades queueing against utilization. Push it far
          enough and the system stops getting faster, then gets slower. And even with unlimited cores, a serial
          bottleneck caps how much parallelism can ever buy you.
        </p>

        <div class="lab-panel">
          <p class="section-label mono">A — LIVE METRICS DASHBOARD</p>

          <div class="lab-field">
            <label for="concurrency-slider">Concurrency level: {{ concurrency() }} in-flight requests</label>
            <input
              id="concurrency-slider"
              type="range"
              min="1"
              max="60"
              step="1"
              [ngModel]="concurrency()"
              (ngModelChange)="concurrency.set($event)"
            />
          </div>

          <div class="gauge-grid" aria-live="polite">
            <div class="gauge">
              <p class="gauge-label mono">CONCURRENCY</p>
              <p class="gauge-value mono">{{ concurrency() }}</p>
            </div>
            <div class="gauge">
              <p class="gauge-label mono">THROUGHPUT</p>
              <p class="gauge-value mono">{{ throughput() }} req/s</p>
            </div>
            <div class="gauge">
              <p class="gauge-label mono">LATENCY (p50)</p>
              <p class="gauge-value mono" [class.is-danger]="isSaturated()">{{ latencyMs() }} ms</p>
            </div>
            <div class="gauge">
              <p class="gauge-label mono">CPU UTILIZATION</p>
              <p class="gauge-value mono" [class.is-danger]="isSaturated()">{{ utilizationPct() }}%</p>
              <div class="bar-track"><div class="bar-fill" [class.is-danger]="isSaturated()" [style.width.%]="utilizationPct()"></div></div>
            </div>
            <div class="gauge">
              <p class="gauge-label mono">QUEUE DEPTH</p>
              <p class="gauge-value mono" [class.is-danger]="isSaturated()">{{ queueDepth() }}</p>
            </div>
          </div>

          @if (isSaturated()) {
            <p class="lab-note lab-note-warn">
              CPU utilization is pegged at 100% — the server (modeled with {{ serverCapacity }} effective
              worker slots) cannot process arrivals as fast as they come in. Extra concurrency now only grows the
              queue, which is why latency is climbing while throughput has flattened.
            </p>
          } @else {
            <p class="lab-note">
              Below saturation, adding concurrency raises throughput almost linearly with little effect on
              latency — there's spare capacity absorbing the extra work.
            </p>
          }
        </div>

        <div class="lab-panel">
          <p class="section-label mono">B — RESOURCE CONTENTION WALKTHROUGH</p>
          <p class="lab-lede small">Threads A, B, C, D compete in sequence for four different kinds of shared resource. Step through to see how contention looks different for each one.</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="scenarioIndex() === 0" (click)="prevScenario()">&larr; Previous</button>
            <span class="scenario-counter mono">{{ scenarioIndex() + 1 }} / {{ scenarios.length }}</span>
            <button type="button" class="lab-btn" [disabled]="scenarioIndex() === scenarios.length - 1" (click)="nextScenario()">Next &rarr;</button>
          </div>

          <div class="contention-panel">
            <p class="resource-title mono">RESOURCE: {{ currentScenario().resource }}</p>
            <p class="resource-desc">{{ currentScenario().description }}</p>

            <div class="thread-row">
              @for (t of currentScenario().threads; track t.id) {
                <div class="lab-node thread-node" [class]="'thread-' + t.state">
                  <span class="thread-id mono">{{ t.id }}</span>
                  <span class="pill" [class]="t.state === 'holding' ? 'pill-yes' : 'pill-no'">{{ t.state === 'holding' ? 'HOLDING' : 'WAITING' }}</span>
                </div>
              }
            </div>

            <p class="lab-note">{{ currentScenario().note }}</p>
          </div>
        </div>

        <div class="lab-panel">
          <p class="section-label mono">C — AMDAHL'S LAW</p>

          <div class="amdahl-controls">
            <div class="lab-field">
              <label for="parallel-pct">Parallelizable portion: {{ parallelPct() }}% (serial: {{ 100 - parallelPct() }}%)</label>
              <input
                id="parallel-pct"
                type="range"
                min="0"
                max="100"
                step="1"
                [ngModel]="parallelPct()"
                (ngModelChange)="parallelPct.set($event)"
              />
            </div>

            <div class="lab-field">
              <label for="core-select">Cores</label>
              <select id="core-select" [ngModel]="cores()" (ngModelChange)="cores.set(+$event)">
                @for (c of coreOptions; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
          </div>

          <p class="speedup-readout mono">Speedup: {{ speedup() }}&times;</p>

          <div class="amdahl-bars" aria-hidden="true">
            @for (c of coreOptions; track c) {
              <div class="amdahl-bar-col">
                <div class="amdahl-bar" [style.height.%]="barHeightPct(c)" [class.is-current]="c === cores()"></div>
                <span class="amdahl-bar-label mono">{{ c }}</span>
              </div>
            }
          </div>

          <p class="lab-note lab-note-warn">
            The serial portion mathematically limits maximum parallel speedup no matter how many cores you add —
            with {{ 100 - parallelPct() }}% serial, speedup can never exceed {{ theoreticalMax() }}&times;, even
            at infinite cores.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .section-label { font-size: 0.75rem; color: var(--accent-2); letter-spacing: 0.06em; margin: 0 0 16px; }
    .lab-lede.small { font-size: 0.875rem; margin-bottom: 16px; }

    .gauge-grid { margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 780px) { .gauge-grid { grid-template-columns: repeat(5, 1fr); } }
    .gauge { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
    .gauge-label { font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.05em; margin: 0 0 6px; }
    .gauge-value { font-size: 1.25rem; color: var(--text); margin: 0; }
    .gauge-value.is-danger { color: var(--blocked); }
    .bar-track { margin-top: 8px; height: 6px; border-radius: 3px; background: var(--surface-elevated); overflow: hidden; }
    .bar-fill { height: 100%; background: var(--running); transition: width 0.2s ease; }
    .bar-fill.is-danger { background: var(--blocked); }

    .scenario-counter { font-size: 0.8125rem; color: var(--text-faint); }
    .contention-panel { margin-top: 18px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-elevated); }
    .resource-title { font-size: 0.8125rem; color: var(--c-lock); letter-spacing: 0.05em; margin: 0 0 8px; }
    .resource-desc { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; margin: 0 0 16px; }

    .thread-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .thread-node { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 18px; min-width: 76px; }
    .thread-id { font-size: 1rem; font-weight: 700; color: var(--text); }
    .thread-holding { border-color: var(--running); }
    .thread-waiting { border-color: var(--blocked); opacity: 0.85; }

    .amdahl-controls { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
    @media (min-width: 620px) { .amdahl-controls { grid-template-columns: 2fr 1fr; align-items: end; } }

    .speedup-readout { font-size: 1.5rem; color: var(--accent-strong); margin: 4px 0 18px; }

    .amdahl-bars { display: flex; align-items: flex-end; gap: 14px; height: 140px; padding: 0 4px; }
    .amdahl-bar-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; flex: 1; gap: 6px; }
    .amdahl-bar { width: 100%; max-width: 36px; background: var(--c-task); border-radius: 4px 4px 0 0; transition: height 0.25s ease, background 0.2s ease; min-height: 2px; }
    .amdahl-bar.is-current { background: var(--accent-strong); }
    .amdahl-bar-label { font-size: 0.6875rem; color: var(--text-faint); }
  `,
})
export class MetricsSaturationAmdahl {
  // ---- Section A: saturation dashboard ----
  protected readonly concurrency = signal(10);
  protected readonly serverCapacity = 20; // effective parallel worker slots
  protected readonly baseServiceTimeMs = 40; // time to service one request with no contention

  private readonly utilization = computed(() => Math.min(1, this.concurrency() / this.serverCapacity));

  protected readonly utilizationPct = computed(() => Math.round(this.utilization() * 100));
  protected readonly isSaturated = computed(() => this.utilizationPct() >= 100);

  // Simple M/M/c-flavored queueing approximation: latency grows sharply as utilization -> 1.
  protected readonly latencyMs = computed(() => {
    const rho = Math.min(0.995, this.utilization());
    const queueingFactor = 1 / (1 - rho);
    return Math.round(this.baseServiceTimeMs * queueingFactor);
  });

  // Throughput rises with concurrency while capacity allows, then plateaus (and slightly degrades)
  // once queueing dominates, because effective completions per second are capped by capacity.
  protected readonly throughput = computed(() => {
    const c = this.concurrency();
    const capacityThroughput = 1000 / this.baseServiceTimeMs; // req/s if one slot ran flat out
    const raw = Math.min(c, this.serverCapacity) * capacityThroughput;
    if (c <= this.serverCapacity) {
      return Math.round(raw);
    }
    // Past saturation: thrashing/coordination overhead causes a mild decline.
    const overload = c - this.serverCapacity;
    const decay = Math.max(0.6, 1 - overload * 0.01);
    return Math.round(this.serverCapacity * capacityThroughput * decay);
  });

  protected readonly queueDepth = computed(() => Math.max(0, this.concurrency() - this.serverCapacity));

  // ---- Section B: contention walkthrough ----
  protected readonly scenarios = CONTENTION_SCENARIOS;
  protected readonly scenarioIndex = signal(0);
  protected readonly currentScenario = computed(() => this.scenarios[this.scenarioIndex()]);

  protected nextScenario(): void {
    this.scenarioIndex.update((i) => Math.min(i + 1, this.scenarios.length - 1));
  }

  protected prevScenario(): void {
    this.scenarioIndex.update((i) => Math.max(i - 1, 0));
  }

  // ---- Section C: Amdahl's Law ----
  protected readonly coreOptions = CORE_OPTIONS;
  protected readonly parallelPct = signal(90);
  protected readonly cores = signal<number>(4);

  private amdahlSpeedup(coresN: number, pPct: number): number {
    const p = pPct / 100;
    const denom = (1 - p) + p / coresN;
    return denom === 0 ? 0 : 1 / denom;
  }

  protected readonly speedup = computed(() => this.amdahlSpeedup(this.cores(), this.parallelPct()).toFixed(2));

  protected readonly theoreticalMax = computed(() => {
    const serial = (100 - this.parallelPct()) / 100;
    if (serial <= 0) return '∞';
    return (1 / serial).toFixed(1);
  });

  protected barHeightPct(coresN: number): number {
    const maxSpeedup = this.amdahlSpeedup(Math.max(...this.coreOptions), this.parallelPct());
    const value = this.amdahlSpeedup(coresN, this.parallelPct());
    return maxSpeedup === 0 ? 0 : Math.max(3, (value / maxSpeedup) * 100);
  }
}
