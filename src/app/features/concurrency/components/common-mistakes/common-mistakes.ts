import { Component, computed, signal } from '@angular/core';

type MistakeId =
  | 'thread-per-request'
  | 'more-threads'
  | 'locks-everywhere'
  | 'async-faster'
  | 'more-concurrency'
  | 'retries-reliability';

interface MistakeInfo {
  id: MistakeId;
  title: string;
  claim: string;
}

const MISTAKES: MistakeInfo[] = [
  { id: 'thread-per-request', title: 'Create one thread per request', claim: '"Just spin up a thread for every incoming request."' },
  { id: 'more-threads', title: 'Just add more threads', claim: '"If it\'s slow, throw more threads at it."' },
  { id: 'locks-everywhere', title: 'Use locks everywhere', claim: '"Wrap every shared access in a lock, to be safe."' },
  { id: 'async-faster', title: 'Async means faster', claim: '"Making it async will speed up the computation."' },
  { id: 'more-concurrency', title: 'More concurrency is always better', claim: '"Higher concurrency always means higher throughput."' },
  { id: 'retries-reliability', title: 'Retries always improve reliability', claim: '"Just retry on failure — it makes things more reliable."' },
];

const CONCURRENCY_LEVELS = [1, 2, 4, 8, 16, 32, 64] as const;

@Component({
  selector: 'app-common-mistakes',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="common-mistakes">
      <div class="container">
        <p class="lab-index">46 — COMMON MISTAKES</p>
        <h2 class="lab-title">Common concurrency mistakes</h2>
        <p class="lab-lede">
          Every one of these sounds reasonable in a design meeting. Click a card to see what actually happens when
          you try it.
        </p>

        <div class="mistake-grid">
          @for (m of mistakes; track m.id) {
            <div class="lab-panel mistake-card" [class.is-open]="expandedId() === m.id">
              <button
                type="button"
                class="mistake-header"
                [attr.aria-pressed]="expandedId() === m.id"
                [attr.aria-expanded]="expandedId() === m.id"
                (click)="toggle(m.id)"
              >
                <span class="mistake-title">{{ m.title }}</span>
                <span class="mistake-caret mono">{{ expandedId() === m.id ? '−' : '+' }}</span>
              </button>
              <p class="mistake-claim">{{ m.claim }}</p>

              @if (expandedId() === m.id) {
                <div class="mistake-body" aria-live="polite">
                  @switch (m.id) {
                    @case ('thread-per-request') {
                      <div class="lab-btn-row">
                        <button type="button" class="lab-btn" (click)="spawnRequests()">Simulate 250 more incoming requests</button>
                        <button type="button" class="lab-btn" (click)="resetThreads()">Reset</button>
                      </div>
                      <p class="metric-value mono" [class.metric-danger]="threadsSpawned() > 2000">
                        {{ threadsSpawned() }} threads alive
                      </p>
                      <p class="lab-note lab-note-warn">
                        Every request gets its own OS thread. Each thread reserves its own stack (often 1-8&nbsp;MB)
                        and costs a context switch every time the scheduler moves on to another one. Push enough
                        concurrent requests through and you exhaust memory and burn CPU on switching threads before
                        any of them get real work done — <strong>resource exhaustion</strong>, not scalability.
                      </p>
                    }
                    @case ('more-threads') {
                      <div class="lab-btn-row" role="group" aria-label="Thread count picker">
                        @for (level of concurrencyLevels; track level) {
                          <button
                            type="button"
                            class="lab-btn"
                            [class.is-active]="threadLevel() === level"
                            [attr.aria-pressed]="threadLevel() === level"
                            (click)="setThreadLevel(level)"
                          >
                            {{ level }}
                          </button>
                        }
                      </div>
                      <div class="metric-row">
                        <span class="lab-node">Throughput</span>
                        <div class="bar-track"><div class="bar-fill bar-good" [style.width.%]="lockContentionThroughput()"></div></div>
                        <span class="mono">{{ lockContentionThroughput() }}</span>
                      </div>
                      <div class="metric-row">
                        <span class="lab-node">Lock contention</span>
                        <div class="bar-track"><div class="bar-fill bar-bad" [style.width.%]="lockContentionLevel()"></div></div>
                        <span class="mono">{{ lockContentionLevel() }}</span>
                      </div>
                      <p class="lab-note lab-note-warn">
                        All of these threads are still fighting over the same shared lock. Past a few threads,
                        throughput stops climbing and starts falling while contention on that lock keeps rising —
                        <strong>more threads, same bottleneck, worse result</strong>.
                      </p>
                    }
                    @case ('locks-everywhere') {
                      <div class="metric-row">
                        <span class="lab-node">1 thread</span>
                        <div class="bar-track"><div class="bar-fill bar-good" [style.width.%]="20"></div></div>
                        <span class="mono">20 ops/s</span>
                      </div>
                      <div class="metric-row">
                        <span class="lab-node">8 threads, one giant lock</span>
                        <div class="bar-track"><div class="bar-fill bar-bad" [style.width.%]="22"></div></div>
                        <span class="mono">22 ops/s</span>
                      </div>
                      <p class="lab-note lab-note-warn">
                        Locking every shared access — including ones that didn't need it — serializes the whole
                        pipeline behind one gate. Eight threads exist, but only one is ever inside the critical
                        section at a time, so throughput barely moves off the single-thread number. You paid for
                        concurrency and got sequential execution anyway.
                      </p>
                    }
                    @case ('async-faster') {
                      <div class="metric-row">
                        <span class="lab-node">Sync, CPU-bound (compute a hash)</span>
                        <div class="bar-track"><div class="bar-fill bar-neutral" [style.width.%]="80"></div></div>
                        <span class="mono">800ms</span>
                      </div>
                      <div class="metric-row">
                        <span class="lab-node">Async-wrapped, same CPU-bound work</span>
                        <div class="bar-track"><div class="bar-fill bar-bad" [style.width.%]="80"></div></div>
                        <span class="mono">800ms</span>
                      </div>
                      <div class="metric-row">
                        <span class="lab-node">Async, I/O-bound (network call)</span>
                        <div class="bar-track"><div class="bar-fill bar-good" [style.width.%]="15"></div></div>
                        <span class="mono">150ms</span>
                      </div>
                      <p class="lab-note lab-note-warn">
                        <code>async</code> lets a thread stop <em>waiting</em> on I/O and do other work meanwhile —
                        it doesn't make the CPU compute any faster. For CPU-bound work there is no wait to hide, so
                        wrapping it in async changes nothing about its runtime. Real speedup for CPU-bound work
                        needs actual parallelism (multiple cores) — see
                        <a href="#async-not-parallel-myth" (click)="scrollTo($event, 'async-not-parallel-myth')">why async isn't parallel</a>.
                      </p>
                    }
                    @case ('more-concurrency') {
                      <div class="lab-field">
                        <label for="concurrency-slider">Concurrency level: {{ concurrencyDial() }}</label>
                        <input
                          id="concurrency-slider"
                          type="range"
                          min="0"
                          max="6"
                          step="1"
                          [value]="concurrencyDialIndex()"
                          (input)="setConcurrencyDial($any($event.target).value)"
                        />
                      </div>
                      <div class="metric-row">
                        <span class="lab-node">Throughput</span>
                        <div class="bar-track"><div class="bar-fill" [class.bar-good]="!saturated()" [class.bar-bad]="saturated()" [style.width.%]="concurrencyThroughputPct()"></div></div>
                        <span class="mono">{{ concurrencyThroughputValue() }} req/s</span>
                      </div>
                      @if (saturated()) {
                        <p class="lab-note lab-note-warn">
                          Past level {{ saturationPoint }}, throughput stops rising and starts <strong>falling</strong>:
                          the CPU, connection pool, or downstream service is now saturated, and added concurrency
                          only adds contention and coordination overhead on top of it.
                        </p>
                      } @else {
                        <p class="lab-note">
                          Throughput is still climbing with concurrency here — but keep raising the dial.
                        </p>
                      }
                    }
                    @case ('retries-reliability') {
                      <div class="lab-btn-row">
                        <button type="button" class="lab-btn lab-btn-danger" (click)="triggerOutage()">Trigger a downstream outage</button>
                        <button type="button" class="lab-btn" (click)="resetOutage()">Reset</button>
                      </div>
                      <p class="metric-value mono" [class.metric-danger]="outageLoad() > 200">
                        {{ outageLoad() }} requests/s hitting the failing service
                      </p>
                      @if (outageRounds() > 0) {
                        <p class="lab-note lab-note-warn">
                          The service is down, every request fails, and every failure triggers a retry — which also
                          fails, and also retries. Original load of 100&nbsp;req/s has ballooned to
                          {{ outageLoad() }}&nbsp;req/s after {{ outageRounds() }} retry round(s). This is a
                          <strong>retry storm</strong>: naive retries amplify load on a service that is already
                          struggling, making the outage worse and recovery slower, not more reliable.
                        </p>
                      }
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .mistake-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 860px) { .mistake-grid { grid-template-columns: 1fr 1fr; } }

    .mistake-card { margin-top: 0; cursor: default; transition: border-color 0.2s ease; }
    .mistake-card.is-open { border-color: var(--accent); }

    .mistake-header {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      box-sizing: border-box;
    }
    .mistake-header:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .mistake-title { font-size: 1.0625rem; color: var(--text); font-weight: 600; }
    .mistake-caret { font-size: 1.25rem; color: var(--accent); }
    .mistake-claim { margin: 10px 0 0; color: var(--text-faint); font-style: italic; font-size: 0.875rem; }

    .mistake-body { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }

    .metric-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; margin-top: 10px; }
    .metric-row .lab-node { white-space: nowrap; }
    .metric-value { font-size: 1.375rem; margin: 12px 0 0; color: var(--text); }
    .metric-value.metric-danger { color: var(--danger); }

    .bar-track {
      width: 100%;
      height: 12px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: var(--radius-sm); transition: width 0.4s ease; }
    .bar-good { background: var(--running); }
    .bar-bad { background: var(--danger); }
    .bar-neutral { background: var(--idle); }

    .lab-field input[type='range'] { width: 100%; accent-color: var(--accent); }

    code { font-family: var(--font-mono); font-size: 0.8em; color: var(--text); }
  `,
})
export class CommonMistakes {
  protected readonly mistakes = MISTAKES;
  protected readonly concurrencyLevels = CONCURRENCY_LEVELS;
  protected readonly saturationPoint = 16;

  protected readonly expandedId = signal<MistakeId | null>(null);

  // Mistake 1: thread-per-request
  protected readonly threadsSpawned = signal(0);

  // Mistake 2: just add more threads
  protected readonly threadLevel = signal<number>(1);

  // Mistake 5: more concurrency is always better
  private readonly concurrencyDialIndexSignal = signal(0);

  // Mistake 6: retry storm
  protected readonly outageRounds = signal(0);
  protected readonly outageLoad = signal(0);

  protected toggle(id: MistakeId): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  // --- Mistake 1 ---
  protected spawnRequests(): void {
    this.threadsSpawned.update((v) => v + 250);
  }
  protected resetThreads(): void {
    this.threadsSpawned.set(0);
  }

  // --- Mistake 2 ---
  protected setThreadLevel(level: number): void {
    this.threadLevel.set(level);
  }
  protected readonly lockContentionLevel = computed(() => {
    const level = this.threadLevel();
    return Math.min(100, Math.round((level / 64) * 100 * 1.4));
  });
  protected readonly lockContentionThroughput = computed(() => {
    const level = this.threadLevel();
    // Rises briefly then collapses under lock contention.
    const raw = level <= 2 ? 30 * level : 60 - (level - 2) * 4;
    return Math.max(8, Math.min(100, Math.round(raw)));
  });

  // --- Mistake 5 ---
  protected readonly concurrencyDialIndex = computed(() => this.concurrencyDialIndexSignal());
  protected readonly concurrencyDial = computed(() => CONCURRENCY_LEVELS[this.concurrencyDialIndexSignal()]);
  protected setConcurrencyDial(indexStr: string): void {
    const index = Number(indexStr);
    if (!Number.isNaN(index)) {
      this.concurrencyDialIndexSignal.set(Math.max(0, Math.min(CONCURRENCY_LEVELS.length - 1, index)));
    }
  }
  protected readonly saturated = computed(() => this.concurrencyDial() > this.saturationPoint);
  protected readonly concurrencyThroughputValue = computed(() => {
    const level = this.concurrencyDial();
    if (level <= this.saturationPoint) {
      return Math.round(level * 40);
    }
    const peak = this.saturationPoint * 40;
    const overshoot = level - this.saturationPoint;
    return Math.max(50, Math.round(peak - overshoot * 25));
  });
  protected readonly concurrencyThroughputPct = computed(() => {
    const peak = this.saturationPoint * 40;
    return Math.max(4, Math.min(100, Math.round((this.concurrencyThroughputValue() / peak) * 100)));
  });

  // --- Mistake 6 ---
  protected triggerOutage(): void {
    const base = this.outageLoad() === 0 ? 100 : this.outageLoad();
    this.outageLoad.set(Math.round(base * 2.2));
    this.outageRounds.update((v) => v + 1);
  }
  protected resetOutage(): void {
    this.outageLoad.set(0);
    this.outageRounds.set(0);
  }

  protected scrollTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
