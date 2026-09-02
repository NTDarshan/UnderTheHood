import { Component, OnDestroy, signal } from '@angular/core';

const ASYNC_STEPS = [
  { occupant: 'Task X — running', pctX: 15, pctY: 0 },
  { occupant: 'Task X — hits await, suspends (thread freed)', pctX: 15, pctY: 0 },
  { occupant: 'Task Y — running (using the freed thread)', pctX: 15, pctY: 70 },
  { occupant: 'Task X — I/O done, resumes; Task Y still running', pctX: 100, pctY: 100 },
];

const CORE_COUNT = 4;
const CORE_TICKS = 10;

@Component({
  selector: 'app-async-not-parallel-myth',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="async-not-parallel-myth">
      <div class="container">
        <p class="lab-index">18 — MYTH-BUSTING</p>
        <h2 class="lab-title">Myth: async means parallel</h2>
        <p class="lab-lede">
          This is one of the most common mix-ups in backend work. Test the claim, then watch the two mini-demos
          below until the difference is unmistakable.
        </p>

        <div class="lab-panel myth-card">
          <p class="myth-statement mono">"async = parallel"</p>

          @if (!tested()) {
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="testClaim()" [disabled]="isTesting()">
                {{ isTesting() ? 'Testing…' : 'Test this claim' }}
              </button>
            </div>
          } @else {
            <div class="verdict" aria-live="polite">
              <span class="pill pill-no">FALSE</span>
              <p class="verdict-text">
                <strong>Async lets a program make progress while it is WAITING for I/O</strong> — it hands the
                thread to other work instead of blocking it. <strong>Parallelism means multiple computations
                execute at the same physical instant</strong>, on multiple cores. A single-threaded program can be
                highly concurrent with async I/O and still never compute two things at once.
              </p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn" (click)="reset()">Test again</button>
              </div>
            </div>
          }
        </div>

        <div class="demo-grid">
          <div class="lab-panel demo-panel">
            <p class="lab-node demo-heading">ASYNC I/O — ONE THREAD</p>
            <p class="demo-sub">A single worker thread. Only one task ever occupies it at a time.</p>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn" [disabled]="asyncRunning()" (click)="runAsyncDemo()">Run</button>
            </div>

            <div class="thread-visual">
              <span class="lab-node thread-box">WORKER THREAD</span>
              <p class="mono occupant-label" aria-live="polite">{{ asyncOccupant() }}</p>
            </div>

            <div class="single-lane">
              <div class="lane-row">
                <span class="lane-tag mono">Task X</span>
                <div class="lane-bar"><div class="lane-fill fill-x" [style.width.%]="asyncPctX()"></div></div>
              </div>
              <div class="lane-row">
                <span class="lane-tag mono">Task Y</span>
                <div class="lane-bar"><div class="lane-fill fill-y" [style.width.%]="asyncPctY()"></div></div>
              </div>
            </div>
            <p class="demo-verdict">Never two fills advancing at literally the same tick — one thread, one occupant.</p>
          </div>

          <div class="lab-panel demo-panel">
            <p class="lab-node demo-heading">CPU PARALLELISM — MULTIPLE CORES</p>
            <p class="demo-sub">{{ CORE_COUNT }} cores, each actually computing at the same physical instant.</p>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn" [disabled]="coresRunning()" (click)="runCoresDemo()">Run</button>
            </div>

            <div class="cores-grid">
              @for (pct of corePcts(); track $index) {
                <div class="core-row">
                  <span class="lane-tag mono">Core {{ $index + 1 }}</span>
                  <div class="lane-bar"><div class="lane-fill fill-core" [style.width.%]="pct"></div></div>
                </div>
              }
            </div>
            <p class="demo-verdict">All {{ CORE_COUNT }} fills advance together, tick for tick — genuine simultaneity.</p>
          </div>
        </div>

        <p class="lab-note">
          Async and parallel solve different problems: async improves throughput and responsiveness while waiting
          on I/O; parallelism speeds up raw computation by spreading it across cores. A program can be one, both,
          or neither.
        </p>
      </div>
    </section>
  `,
  styles: `
    .myth-card { text-align: center; }
    .myth-statement { font-size: 1.5rem; color: var(--text); margin: 0 0 20px; }

    .verdict { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .verdict .pill { font-size: 0.9375rem; padding: 6px 18px; }
    .verdict-text { max-width: 640px; margin: 0; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; text-align: left; }

    .demo-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 860px) { .demo-grid { grid-template-columns: 1fr 1fr; } }

    .demo-heading { margin-bottom: 6px; }
    .demo-sub { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 16px; }

    .thread-visual { margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .thread-box { border-color: var(--c-thread); color: var(--c-thread); }
    .occupant-label { font-size: 0.75rem; color: var(--text-muted); min-height: 1.2em; text-align: center; }

    .single-lane, .cores-grid { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
    .lane-row, .core-row { display: flex; align-items: center; gap: 10px; }
    .lane-tag { width: 62px; flex-shrink: 0; font-size: 0.75rem; color: var(--text-faint); }
    .lane-bar { flex: 1; height: 10px; border-radius: 999px; background: var(--surface-elevated); border: 1px solid var(--border-strong); overflow: hidden; }
    .lane-fill { height: 100%; width: 0%; transition: width 0.4s ease; }
    .fill-x { background: linear-gradient(90deg, var(--c-task), var(--running)); }
    .fill-y { background: linear-gradient(90deg, var(--c-thread), var(--c-cpu)); }
    .fill-core { background: linear-gradient(90deg, var(--c-cpu), var(--running)); transition: width 0.15s linear; }

    .demo-verdict { margin-top: 16px; font-size: 0.75rem; color: var(--text-faint); line-height: 1.5; }
  `,
})
export class AsyncNotParallelMyth implements OnDestroy {
  protected readonly CORE_COUNT = CORE_COUNT;

  protected readonly tested = signal(false);
  protected readonly isTesting = signal(false);

  protected readonly asyncRunning = signal(false);
  private readonly asyncStepIndex = signal(0);
  protected readonly asyncOccupant = signal('idle');
  protected readonly asyncPctX = signal(0);
  protected readonly asyncPctY = signal(0);

  protected readonly coresRunning = signal(false);
  protected readonly corePcts = signal<number[]>(new Array(CORE_COUNT).fill(0));

  private testTimer: ReturnType<typeof setTimeout> | null = null;
  private asyncTimer: ReturnType<typeof setInterval> | null = null;
  private coresTimer: ReturnType<typeof setInterval> | null = null;

  testClaim(): void {
    if (this.isTesting()) return;
    this.isTesting.set(true);
    this.testTimer = setTimeout(() => {
      this.isTesting.set(false);
      this.tested.set(true);
    }, 600);
  }

  reset(): void {
    if (this.testTimer) clearTimeout(this.testTimer);
    this.tested.set(false);
    this.isTesting.set(false);
  }

  runAsyncDemo(): void {
    if (this.asyncRunning()) return;
    this.asyncRunning.set(true);
    this.asyncStepIndex.set(0);
    this.asyncPctX.set(0);
    this.asyncPctY.set(0);
    this.applyAsyncStep(0);

    this.asyncTimer = setInterval(() => {
      const next = this.asyncStepIndex() + 1;
      if (next >= ASYNC_STEPS.length) {
        this.clearAsyncTimer();
        this.asyncRunning.set(false);
        return;
      }
      this.asyncStepIndex.set(next);
      this.applyAsyncStep(next);
      if (next === ASYNC_STEPS.length - 1) {
        this.clearAsyncTimer();
        this.asyncRunning.set(false);
      }
    }, 900);
  }

  private applyAsyncStep(i: number): void {
    const step = ASYNC_STEPS[i];
    this.asyncOccupant.set(step.occupant);
    this.asyncPctX.set(step.pctX);
    this.asyncPctY.set(step.pctY);
  }

  runCoresDemo(): void {
    if (this.coresRunning()) return;
    this.coresRunning.set(true);
    this.corePcts.set(new Array(CORE_COUNT).fill(0));

    let tick = 0;
    this.coresTimer = setInterval(() => {
      tick++;
      const pct = Math.min(100, (tick / CORE_TICKS) * 100);
      this.corePcts.set(new Array(CORE_COUNT).fill(pct));
      if (tick >= CORE_TICKS) {
        this.clearCoresTimer();
        this.coresRunning.set(false);
      }
    }, 180);
  }

  ngOnDestroy(): void {
    if (this.testTimer) clearTimeout(this.testTimer);
    this.clearAsyncTimer();
    this.clearCoresTimer();
  }

  private clearAsyncTimer(): void {
    if (this.asyncTimer) {
      clearInterval(this.asyncTimer);
      this.asyncTimer = null;
    }
  }

  private clearCoresTimer(): void {
    if (this.coresTimer) {
      clearInterval(this.coresTimer);
      this.coresTimer = null;
    }
  }
}
