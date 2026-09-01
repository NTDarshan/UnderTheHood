import { Component, computed, signal } from '@angular/core';

type BottleneckKey = 'cpu' | 'memory' | 'database' | 'network' | 'external-api' | 'connection-pool';

interface BottleneckScenario {
  key: BottleneckKey;
  label: string;
  apiLatencyMs: number;
  cacheLatencyMs: number;
  dbLatencyMs: number;
  externalLatencyMs: number;
  gauges: { label: string; value: string }[];
  symptomNote: string;
  explanation: string;
}

const BASELINE = {
  apiLatencyMs: 22,
  cacheLatencyMs: 3,
  dbLatencyMs: 14,
  externalLatencyMs: 38,
};

const SCENARIOS: BottleneckScenario[] = [
  {
    key: 'cpu',
    label: 'CPU',
    apiLatencyMs: 210,
    cacheLatencyMs: 3,
    dbLatencyMs: 14,
    externalLatencyMs: 38,
    gauges: [
      { label: 'API CPU', value: '97%' },
      { label: 'Request queue (runqueue)', value: 'growing' },
    ],
    symptomNote: 'The API process itself is CPU-bound — it is spending its time computing, not waiting on anything downstream. Cache and database respond normally, but the API can\'t get scheduled time to finish handling each request.',
    explanation: 'API CPU is pegged at 97% while the database and cache are both fast and idle. The extra latency is generated locally, inside the API process, before it even calls out.',
  },
  {
    key: 'memory',
    label: 'Memory',
    apiLatencyMs: 165,
    cacheLatencyMs: 3,
    dbLatencyMs: 14,
    externalLatencyMs: 38,
    gauges: [
      { label: 'API memory pressure', value: '94%' },
      { label: 'GC pause time', value: '+140ms' },
    ],
    symptomNote: 'The API is close to its memory ceiling, triggering frequent, long garbage-collection pauses. Every request stalls mid-flight while the runtime reclaims memory — downstream services never even see the delay.',
    explanation: 'CPU usage looks moderate, but memory pressure is at 94% and GC pause time has spiked. The stalls are happening inside the API\'s runtime, not in the database or cache calls.',
  },
  {
    key: 'database',
    label: 'Database',
    apiLatencyMs: 265,
    cacheLatencyMs: 3,
    dbLatencyMs: 220,
    externalLatencyMs: 38,
    gauges: [
      { label: 'DB CPU', value: '98%' },
      { label: 'Query duration', value: '14ms -> 220ms' },
      { label: 'Connection wait', value: '+80ms' },
    ],
    symptomNote: 'The database is saturated: query duration has ballooned and requests are queueing for connections. The API itself is barely working — it is simply waiting on a slow downstream dependency, and that wait shows up as API latency too.',
    explanation: 'API CPU is actually low here. The API\'s latency rose only because it is blocked waiting on the database — query duration jumped from 14ms to 220ms and connection wait added another 80ms on top.',
  },
  {
    key: 'network',
    label: 'Network',
    apiLatencyMs: 190,
    cacheLatencyMs: 55,
    dbLatencyMs: 95,
    externalLatencyMs: 140,
    gauges: [
      { label: 'Inter-service RTT', value: '+110ms' },
      { label: 'Packet loss', value: '4%' },
    ],
    symptomNote: 'Every hop between services now carries extra round-trip time and some packet loss, which forces retries. No single downstream service is unhealthy on its own — the network connecting them is the shared bottleneck.',
    explanation: 'Cache, database, and external calls are all slower by roughly the same added delay, and packet loss is elevated. That pattern — every hop degraded a similar amount — points at the network, not any one dependency.',
  },
  {
    key: 'external-api',
    label: 'External API',
    apiLatencyMs: 455,
    cacheLatencyMs: 3,
    dbLatencyMs: 14,
    externalLatencyMs: 420,
    gauges: [
      { label: 'External API p99', value: '420ms' },
      { label: 'API threads blocked on external call', value: '82%' },
    ],
    symptomNote: 'A third-party API the request depends on has slowed dramatically. Because the API calls it synchronously, the API\'s own reported latency rises to match — even though nothing in this system\'s own code changed.',
    explanation: 'Database and cache are both fast. The external API\'s own latency jumped to 420ms, and the API is blocked waiting on that response, so its latency rose to nearly match it.',
  },
  {
    key: 'connection-pool',
    label: 'Connection Pool',
    apiLatencyMs: 340,
    cacheLatencyMs: 3,
    dbLatencyMs: 16,
    externalLatencyMs: 38,
    gauges: [
      { label: 'DB pool utilization', value: '100%' },
      { label: 'Time waiting for a connection', value: '+300ms' },
    ],
    symptomNote: 'The database itself responds quickly once a connection is available — but every connection in the pool is checked out, so new requests queue just to get one. That queueing time, not query execution, is what dominates.',
    explanation: 'Query duration barely moved (14ms -> 16ms) — the database is healthy. The pool is fully checked out, so requests wait ~300ms just to acquire a connection before a fast query even runs.',
  },
];

@Component({
  selector: 'app-bottleneck-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="bottleneck-lab">
      <div class="container">
        <p class="lab-index">07 — FINDING BOTTLENECKS</p>
        <h2 class="lab-title">A bottleneck can hide anywhere in the chain — not just the CPU.</h2>
        <p class="lab-lede">
          Inject a bottleneck into one part of this architecture and watch how its effect propagates backward:
          a slow database doesn't just show up as "database latency" — it shows up as API latency too, because
          the API is stuck waiting on it.
        </p>

        <div class="lab-panel">
          <div class="arch-strip">
            <div class="arch-node client">
              <span class="node-label mono">CLIENT</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="arch-node api" [class.is-hot]="active() !== null">
              <span class="node-label mono">API</span>
              <span class="node-latency mono">{{ display().apiLatencyMs.toFixed(0) }}ms</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="arch-node cache" [class.is-hot]="active()?.key === 'network'">
              <span class="node-label mono">CACHE</span>
              <span class="node-latency mono">{{ display().cacheLatencyMs.toFixed(0) }}ms</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="arch-node db" [class.is-hot]="isDbHot()">
              <span class="node-label mono">DATABASE</span>
              <span class="node-latency mono">{{ display().dbLatencyMs.toFixed(0) }}ms</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="arch-node external" [class.is-hot]="active()?.key === 'external-api' || active()?.key === 'network'">
              <span class="node-label mono">EXTERNAL API</span>
              <span class="node-latency mono">{{ display().externalLatencyMs.toFixed(0) }}ms</span>
            </div>
          </div>

          <p class="lab-node inject-heading">INJECT A BOTTLENECK</p>
          <div class="lab-btn-row" role="group" aria-label="Bottleneck type">
            @for (s of scenarios; track s.key) {
              <button type="button" class="lab-btn" [class.is-active]="active()?.key === s.key" (click)="inject(s)">
                {{ s.label }}
              </button>
            }
            <button type="button" class="lab-btn lab-btn-danger" (click)="clear()">Clear</button>
          </div>

          @if (active(); as sc) {
            <div class="gauge-row">
              @for (g of sc.gauges; track g.label) {
                <div class="gauge">
                  <span class="gauge-label mono">{{ g.label }}</span>
                  <span class="gauge-value mono">{{ g.value }}</span>
                </div>
              }
            </div>

            <p class="lab-note-warn lab-note">{{ sc.symptomNote }}</p>

            <div class="quiz">
              <p class="lab-node">DIAGNOSTIC QUIZ — WHERE IS THE BOTTLENECK?</p>
              <div class="lab-btn-row" role="radiogroup" aria-label="Diagnosis options">
                @for (s of scenarios; track s.key) {
                  <button
                    type="button"
                    class="lab-btn quiz-option"
                    role="radio"
                    [attr.aria-checked]="quizAnswer() === s.key"
                    [class.is-active]="quizAnswer() === s.key"
                    [class.is-correct]="quizAnswer() !== null && s.key === sc.key"
                    [class.is-wrong]="quizAnswer() === s.key && s.key !== sc.key"
                    (click)="answerQuiz(s.key)"
                  >
                    {{ s.label }}
                  </button>
                }
              </div>

              @if (quizAnswer(); as answer) {
                @if (answer === sc.key) {
                  <p class="quiz-feedback quiz-correct mono">CORRECT — {{ sc.explanation }}</p>
                } @else {
                  <p class="quiz-feedback quiz-wrong mono">NOT QUITE — {{ sc.explanation }}</p>
                }
              }
            </div>
          } @else {
            <p class="lab-note">Select a bottleneck above to see how it changes the diagram and to try the diagnostic quiz.</p>
          }
        </div>
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

    .arch-strip { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .arch-node { flex: 1; min-width: 100px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .arch-node.client { border-color: var(--c-client); }
    .arch-node.api { border-color: var(--c-compute); }
    .arch-node.cache { border-color: var(--c-cache); }
    .arch-node.db { border-color: var(--c-db); }
    .arch-node.external { border-color: var(--c-queue); }
    .arch-node.is-hot { border-color: var(--crit); box-shadow: 0 0 16px color-mix(in srgb, var(--crit) 45%, transparent); }

    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .node-latency { font-size: 1rem; color: var(--text); }
    .arch-node.is-hot .node-latency { color: var(--crit); }

    .inject-heading { margin-top: 28px; }

    .gauge-row { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 12px; }
    .gauge { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); min-width: 160px; }
    .gauge-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .gauge-value { font-size: 1.0625rem; color: var(--crit); }

    .quiz { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); }
    .quiz-option.is-correct { border-color: var(--ok); color: var(--ok); }
    .quiz-option.is-wrong { border-color: var(--crit); color: var(--crit); }

    .quiz-feedback { margin-top: 16px; font-size: 0.8125rem; line-height: 1.7; max-width: 680px; }
    .quiz-correct { color: var(--ok); }
    .quiz-wrong { color: var(--crit); }
  `,
})
export class BottleneckLab {
  protected readonly scenarios = SCENARIOS;

  protected readonly active = signal<BottleneckScenario | null>(null);
  protected readonly quizAnswer = signal<BottleneckKey | null>(null);

  protected readonly display = computed(() => this.active() ?? { ...BASELINE });

  protected readonly isDbHot = computed(() => {
    const a = this.active();
    return a?.key === 'database' || a?.key === 'connection-pool' || a?.key === 'network';
  });

  inject(s: BottleneckScenario): void {
    this.active.set(s);
    this.quizAnswer.set(null);
  }

  clear(): void {
    this.active.set(null);
    this.quizAnswer.set(null);
  }

  answerQuiz(key: BottleneckKey): void {
    this.quizAnswer.set(key);
  }
}
