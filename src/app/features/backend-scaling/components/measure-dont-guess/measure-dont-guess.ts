import { Component, OnDestroy, computed, signal } from '@angular/core';

interface Tile {
  key: string;
  label: string;
  value: number;
  unit: string;
  decimals: number;
  jitter: number;
  crit: boolean;
}

const BASE_TILES: Tile[] = [
  { key: 'reqRate', label: 'Request rate', value: 1420, unit: 'req/s', decimals: 0, jitter: 30, crit: false },
  { key: 'p50', label: 'Latency p50', value: 42, unit: 'ms', decimals: 0, jitter: 3, crit: false },
  { key: 'p99', label: 'Latency p99', value: 650, unit: 'ms', decimals: 0, jitter: 12, crit: false },
  { key: 'errRate', label: 'Error rate', value: 0.4, unit: '%', decimals: 2, jitter: 0.05, crit: false },
  { key: 'cpu', label: 'App CPU', value: 38, unit: '%', decimals: 0, jitter: 2, crit: false },
  { key: 'mem', label: 'App memory', value: 61, unit: '%', decimals: 0, jitter: 1, crit: false },
  { key: 'dbCpu', label: 'DB CPU', value: 94, unit: '%', decimals: 0, jitter: 2, crit: true },
  { key: 'dbConn', label: 'DB conn wait', value: 380, unit: 'ms', decimals: 0, jitter: 15, crit: true },
  { key: 'cacheHit', label: 'Cache hit rate', value: 88, unit: '%', decimals: 0, jitter: 1, crit: false },
];

type Suspect = 'cpu' | 'database' | 'cache' | 'network' | 'external';

const SUSPECTS: { id: Suspect; label: string }[] = [
  { id: 'cpu', label: 'CPU' },
  { id: 'database', label: 'Database' },
  { id: 'cache', label: 'Cache' },
  { id: 'network', label: 'Network' },
  { id: 'external', label: 'External API' },
];

interface SignalType {
  name: string;
  def: string;
  question: string;
}

const SIGNAL_TYPES: SignalType[] = [
  {
    name: 'METRICS',
    def: 'Aggregated numbers over time — counters, gauges, histograms sampled at intervals.',
    question: '"Is p99 latency trending up over the last hour?"',
  },
  {
    name: 'LOGS',
    def: 'Discrete, timestamped event records emitted by the application as things happen.',
    question: '"What exact error did order #4821 hit at 14:02:11?"',
  },
  {
    name: 'TRACES',
    def: 'The path of one specific request as it crosses services, with timing at each hop.',
    question: '"Which downstream call made this one request slow?"',
  },
  {
    name: 'PROFILING',
    def: 'Where execution time is actually spent within one running process.',
    question: '"Inside this function, which line is burning the CPU?"',
  },
];

@Component({
  selector: 'app-measure-dont-guess',
  standalone: true,
  template: `
    <section class="lab-section mdg-section" id="measure-dont-guess" style="--ok:#4ade80;--warn:var(--accent);--crit:var(--danger);--c-client:var(--accent-2);--c-compute:#60a5fa;--c-db:#a78bfa;--c-cache:#2dd4bf;--c-queue:#fbbf24;">
      <div class="bg-dots" aria-hidden="true"></div>
      <div class="container">
        <p class="lab-index">08 — MEASURE, DON'T GUESS</p>
        <h2 class="lab-title">Before you touch any code, look at the dashboard.</h2>
        <p class="lab-lede">
          Performance engineering starts with data, not intuition. Here's a live observability dashboard for an API.
          Watch the numbers, then work the scenario below.
        </p>

        <div class="lab-panel">
          <div class="tile-grid">
            @for (t of displayTiles(); track t.key) {
              <div class="tile" [class.is-crit]="revealed() && t.crit">
                <p class="tile-label mono">{{ t.label }}</p>
                <p class="tile-value mono">
                  {{ formatValue(t) }}<span class="tile-unit">{{ t.unit }}</span>
                </p>
                @if (revealed() && t.crit) {
                  <p class="tile-flag mono">⚠ SPIKING</p>
                }
              </div>
            }
          </div>
          <p class="lab-note">Numbers drift slightly to simulate a live feed — this is what "watching a dashboard" looks like.</p>
        </div>

        <div class="lab-panel scenario-panel">
          <p class="scenario-eyebrow mono">SCENARIO</p>
          <p class="scenario-text">API latency increased from <strong>80ms</strong> to <strong>650ms</strong>. What would you check first?</p>

          <div class="lab-btn-row" role="group" aria-label="Choose what to check first">
            @for (s of suspects; track s.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="chosen() === s.id"
                [attr.aria-pressed]="chosen() === s.id"
                (click)="choose(s.id)"
              >
                {{ s.label }}
              </button>
            }
          </div>

          @if (revealed()) {
            <div class="verdict" [class.correct]="chosen() === 'database'">
              @if (chosen() === 'database') {
                <p class="verdict-title mono">✓ Correct instinct — and it matches the data.</p>
              } @else {
                <p class="verdict-title mono">The dashboard says otherwise.</p>
              }
              <p class="verdict-body">
                Look back at the tiles above — <strong>DB CPU</strong> is pinned near 94% and <strong>DB connection wait</strong>
                has jumped to ~380ms. That's the actual cause, visible the moment you looked. The point isn't that
                "database" was the right guess — it's that you didn't need to guess at all. The dashboard already
                told you where to look.
              </p>
            </div>
          }
        </div>

        <div class="signals-block">
          <h3 class="signals-heading">Metrics, logs, traces, profiling — not interchangeable</h3>
          <p class="signals-lede">Each of these observability signals answers a different kind of question. Reaching for the wrong one wastes time.</p>
          <div class="signals-grid">
            @for (sig of signalTypes; track sig.name) {
              <div class="signal-card">
                <p class="signal-name mono">{{ sig.name }}</p>
                <p class="signal-def">{{ sig.def }}</p>
                <p class="signal-question mono">{{ sig.question }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .mdg-section {
      position: relative;
    }

    .tile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .tile {
      position: relative;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .tile.is-crit {
      border-color: var(--crit);
      box-shadow: 0 0 16px rgba(255, 93, 93, 0.25);
    }

    .tile-label {
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-faint);
    }

    .tile-value {
      margin-top: 8px;
      font-size: 1.375rem;
      font-weight: 600;
      color: var(--text);
    }

    .tile.is-crit .tile-value {
      color: var(--crit);
    }

    .tile-unit {
      margin-left: 3px;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .tile-flag {
      margin-top: 6px;
      font-size: 0.6875rem;
      color: var(--crit);
      letter-spacing: 0.04em;
    }

    .scenario-panel {
      margin-top: 24px;
    }

    .scenario-eyebrow {
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      color: var(--accent-2);
    }

    .scenario-text {
      margin-top: 10px;
      font-size: 1.0625rem;
      color: var(--text);
      max-width: 640px;
      line-height: 1.6;
    }

    .verdict {
      margin-top: 20px;
      padding: 16px 18px;
      border-left: 2px solid var(--warn);
      background: var(--surface-elevated);
      border-radius: var(--radius-sm);
    }

    .verdict.correct {
      border-left-color: var(--ok);
    }

    .verdict-title {
      font-size: 0.8125rem;
      color: var(--text);
      letter-spacing: 0.02em;
    }

    .verdict-body {
      margin-top: 8px;
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 620px;
    }

    .verdict-body strong {
      color: var(--crit);
    }

    .signals-block {
      margin-top: 48px;
    }

    .signals-heading {
      font-size: 1.25rem;
      color: var(--text);
    }

    .signals-lede {
      margin-top: 10px;
      color: var(--text-muted);
      max-width: 640px;
      line-height: 1.6;
    }

    .signals-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .signal-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
    }

    .signal-name {
      font-size: 0.8125rem;
      letter-spacing: 0.08em;
      color: var(--accent);
    }

    .signal-def {
      margin-top: 10px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .signal-question {
      margin-top: 12px;
      font-size: 0.75rem;
      color: var(--text-faint);
      line-height: 1.5;
    }
  `,
})
export class MeasureDontGuess implements OnDestroy {
  protected readonly suspects = SUSPECTS;
  protected readonly signalTypes = SIGNAL_TYPES;

  private readonly tick = signal(0);
  protected readonly chosen = signal<Suspect | null>(null);
  protected readonly revealed = computed(() => this.chosen() !== null);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.timer = setInterval(() => {
      this.tick.update((v) => v + 1);
    }, 1400);
  }

  protected readonly displayTiles = computed<Tile[]>(() => {
    const t = this.tick();
    const crit = this.revealed();
    return BASE_TILES.map((base) => {
      const seed = Math.sin(t * 13.7 + base.key.length * 3.1) * base.jitter;
      let value = base.value + seed;
      if (crit && base.crit) {
        value = base.value + Math.abs(seed);
      }
      return { ...base, value };
    });
  });

  formatValue(t: Tile): string {
    return t.value.toFixed(t.decimals);
  }

  choose(id: Suspect): void {
    this.chosen.set(id);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
