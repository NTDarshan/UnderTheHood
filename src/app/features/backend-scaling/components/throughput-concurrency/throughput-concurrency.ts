import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

type RateOption = 100 | 500 | 1000;

const CAPACITY = 400; // simulated max requests/sec the server can actually complete
const RATE_OPTIONS: RateOption[] = [100, 500, 1000];
const TOKEN_COUNT = 14;
const SLOTS = 4;

@Component({
  selector: 'app-throughput-concurrency',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="throughput-concurrency">
      <div class="container">
        <p class="lab-index">04 — THROUGHPUT &amp; CONCURRENCY</p>
        <h2 class="lab-title">More traffic doesn't automatically mean more work done.</h2>
        <p class="lab-lede">
          Throughput, concurrency, request rate, and latency are four different measurements. Confusing them is
          one of the most common mistakes when reasoning about backend performance.
        </p>

        <!-- PART A: THROUGHPUT -->
        <div class="lab-panel">
          <p class="lab-node">PART A — THROUGHPUT</p>
          <p class="part-lede">
            <strong>Throughput</strong> = the amount of work completed per unit time. This server can actually
            <em>complete</em> at most {{ capacity }} req/sec — no matter how many more arrive.
          </p>

          <div class="lab-btn-row" role="group" aria-label="Incoming request rate">
            @for (r of rateOptions; track r) {
              <button type="button" class="lab-btn" [class.is-active]="rateA() === r" (click)="setRateA(r)">
                {{ r }} req/sec
              </button>
            }
          </div>

          <div class="pipe" [class.is-saturated]="isSaturatedA()">
            <div class="pipe-track">
              <div class="pipe-fill" [style.width.%]="pipeFillPct()"></div>
            </div>
            <span class="pipe-caption mono">{{ isSaturatedA() ? 'AT CAPACITY — EXCESS REQUESTS QUEUE' : 'WITHIN CAPACITY' }}</span>
          </div>

          <div class="stat-row" role="group" aria-label="Live throughput counters">
            <div class="stat">
              <span class="stat-label mono">RECEIVED</span>
              <span class="stat-value mono">{{ roundNum(receivedA()) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">COMPLETED</span>
              <span class="stat-value mono stat-ok">{{ roundNum(completedA()) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">WAITING</span>
              <span class="stat-value mono" [class.stat-crit]="isSaturatedA()">{{ roundNum(waitingA()) }}</span>
            </div>
          </div>

          <p class="mono elapsed-line">Simulated time: {{ elapsedA().toFixed(1) }}s &middot; effective throughput: {{ effectiveThroughputA() }} req/sec</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="resetA()">Reset simulation</button>
          </div>

          <p class="lab-note-warn lab-note">
            <strong>Increasing traffic does not always mean higher throughput.</strong> Once the server hits its
            capacity ({{ capacity }} req/sec here), throughput plateaus — extra requests don't complete faster,
            they simply pile up in the "waiting" queue. More load at that point also does not mean lower latency;
            it means longer waits.
          </p>
        </div>

        <!-- PART B: CONCURRENCY -->
        <div class="lab-panel">
          <p class="lab-node">PART B — CONCURRENCY</p>
          <p class="part-lede">
            <strong>Concurrency</strong> is the number of operations in progress at a given moment — not the same
            thing as how many arrive per second.
          </p>

          <div class="conveyor">
            <div class="conveyor-track">
              <div class="exec-zone" [style.width.%]="execZoneWidthPct">
                <span class="exec-zone-label mono">{{ slots }} EXECUTION SLOTS</span>
              </div>
              @for (t of tokens; track t) {
                <div
                  class="token"
                  [style.animation-duration.ms]="tokenDurationMs()"
                  [style.animation-delay.ms]="t * tokenDelayMs()"
                ></div>
              }
            </div>
          </div>

          <div class="controls-grid">
            <div class="lab-field">
              <label for="rateB-slider">Request rate (req/sec)</label>
              <input id="rateB-slider" type="range" min="20" max="300" step="10" [value]="rateB()" (input)="setRateB($event)" />
              <span class="mono field-readout">{{ rateB() }} req/sec</span>
            </div>
            <div class="lab-field">
              <label for="latencyB-slider">Latency per request (ms)</label>
              <input id="latencyB-slider" type="range" min="10" max="300" step="10" [value]="latencyB()" (input)="setLatencyB($event)" />
              <span class="mono field-readout">{{ latencyB() }} ms</span>
            </div>
          </div>

          <div class="stat-row four" role="group" aria-label="Rate versus concurrency versus throughput versus latency">
            <div class="stat">
              <span class="stat-label mono">REQUEST RATE</span>
              <span class="stat-value mono">{{ rateB() }}/s</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">CONCURRENCY</span>
              <span class="stat-value mono stat-accent2">{{ concurrencyB().toFixed(1) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">THROUGHPUT</span>
              <span class="stat-value mono stat-ok">{{ throughputB() }}/s</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">LATENCY</span>
              <span class="stat-value mono">{{ latencyB() }}ms</span>
            </div>
          </div>

          <p class="lab-code mono">{{ workedExample() }}</p>

          <p class="lab-note">
            <strong>100 requests/sec does not mean 100 concurrent requests.</strong> Concurrency depends on how
            long each request takes to finish (Little's Law: concurrency &asymp; rate &times; latency). A fast
            server can sustain a high request rate with very few requests ever in flight at once; a slow one
            needs far more concurrency just to keep up.
          </p>
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

    .part-lede { margin-top: 14px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; max-width: 640px; }
    .part-lede strong { color: var(--text); }

    .pipe { margin-top: 22px; display: flex; flex-direction: column; gap: 8px; }
    .pipe-track { height: 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border-strong); overflow: hidden; }
    .pipe-fill { height: 100%; background: linear-gradient(90deg, var(--c-compute), var(--ok)); transition: width 0.3s ease, background 0.3s ease; }
    .pipe.is-saturated .pipe-fill { background: linear-gradient(90deg, var(--warn), var(--crit)); }
    .pipe-caption { font-size: 0.75rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .pipe.is-saturated .pipe-caption { color: var(--crit); }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat-row.four { grid-template-columns: repeat(2, 1fr); }
    @media (min-width: 640px) { .stat-row.four { grid-template-columns: repeat(4, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.25rem; color: var(--text); }
    .stat-ok { color: var(--ok); }
    .stat-crit { color: var(--crit); }
    .stat-accent2 { color: var(--accent-2); }

    .elapsed-line { margin-top: 14px; font-size: 0.8125rem; color: var(--text-faint); }

    .conveyor { margin-top: 20px; }
    .conveyor-track { position: relative; height: 56px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .exec-zone { position: absolute; top: 0; bottom: 0; left: 40%; background: color-mix(in srgb, var(--c-compute) 14%, transparent); border-inline: 1px dashed var(--c-compute); display: flex; align-items: center; justify-content: center; }
    .exec-zone-label { font-size: 0.625rem; color: var(--c-compute); letter-spacing: 0.06em; writing-mode: vertical-rl; }
    @media (min-width: 480px) { .exec-zone-label { writing-mode: horizontal-tb; } }

    .token { position: absolute; top: 50%; left: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--c-client); transform: translate(-50%, -50%); box-shadow: 0 0 6px var(--glow-accent-2); animation-name: token-travel; animation-timing-function: linear; animation-iteration-count: infinite; }

    @keyframes token-travel {
      from { left: 0%; }
      to { left: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .token { animation: none; left: 45%; }
    }

    .controls-grid { margin-top: 22px; display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: 1fr 1fr; } }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .lab-code { margin-top: 20px; }
  `,
})
export class ThroughputConcurrency implements OnInit, OnDestroy {
  protected readonly capacity = CAPACITY;
  protected readonly rateOptions = RATE_OPTIONS;
  protected readonly slots = SLOTS;
  protected readonly tokens = Array.from({ length: TOKEN_COUNT }, (_, i) => i);
  protected readonly execZoneWidthPct = 100 / SLOTS;

  protected readonly rateA = signal<RateOption>(100);
  protected readonly receivedA = signal(0);
  protected readonly completedA = signal(0);
  protected readonly elapsedA = signal(0);

  protected readonly rateB = signal(100);
  protected readonly latencyB = signal(50);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly effectiveThroughputA = computed(() => Math.min(this.rateA(), CAPACITY));
  protected readonly isSaturatedA = computed(() => this.rateA() > CAPACITY);
  protected readonly waitingA = computed(() => Math.max(0, this.receivedA() - this.completedA()));
  protected readonly pipeFillPct = computed(() => Math.min(100, (this.effectiveThroughputA() / CAPACITY) * 100));

  protected readonly concurrencyB = computed(() => (this.rateB() * this.latencyB()) / 1000);
  protected readonly throughputB = computed(() => this.rateB());

  protected readonly tokenDurationMs = computed(() => Math.max(600, this.latencyB() * 20));
  protected readonly tokenDelayMs = computed(() => this.tokenDurationMs() / TOKEN_COUNT);

  protected readonly workedExample = computed(() => {
    const r = this.rateB();
    const l = this.latencyB();
    const c = ((r * l) / 1000).toFixed(1);
    return `${r} requests/sec x ${l}ms average latency each = ~${c} requests in flight concurrently on average (rate x latency = concurrency).`;
  });

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.tick(), 200);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private tick(): void {
    const dt = 0.2;
    this.receivedA.update((v) => v + this.rateA() * dt);
    this.completedA.update((v) => v + Math.min(this.rateA(), CAPACITY) * dt);
    this.elapsedA.update((v) => v + dt);
  }

  setRateA(r: RateOption): void {
    this.rateA.set(r);
    this.resetA();
  }

  resetA(): void {
    this.receivedA.set(0);
    this.completedA.set(0);
    this.elapsedA.set(0);
  }

  setRateB(ev: Event): void {
    this.rateB.set(+(ev.target as HTMLInputElement).value);
  }

  setLatencyB(ev: Event): void {
    this.latencyB.set(+(ev.target as HTMLInputElement).value);
  }

  protected roundNum(v: number): number {
    return Math.round(v);
  }
}
