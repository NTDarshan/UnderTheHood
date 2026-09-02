import { Component, OnDestroy, computed, signal } from '@angular/core';

const DURATION_MS = 3000;
const TICK_MS = 30;
const IO_WAIT_START_PCT = 8; // small CPU burst to fire off the request
const IO_WAIT_END_PCT = 88; // small CPU burst to handle the response

@Component({
  selector: 'app-cpu-bound-vs-io-bound',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="cpu-bound-vs-io-bound">
      <div class="container">
        <p class="lab-index mono">06 — WORKLOAD SHAPES</p>
        <h2 class="lab-title">CPU-bound vs. I/O-bound work</h2>
        <p class="lab-lede">
          Not all tasks stress the same resource. Some keep the processor busy the whole time; others spend almost
          all their time waiting on something outside the CPU entirely. That shape determines which concurrency
          strategy actually helps.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="runBoth()">
              {{ isRunning() ? 'Running…' : 'Run both' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="workload-grid">
            <div class="workload-card">
              <div class="workload-head mono">
                <span class="workload-title cpu-title">CPU-BOUND</span>
                <span class="pill mono">{{ cpuExampleLabel() }}</span>
              </div>
              <p class="workload-desc">
                Image processing, compression, encryption, large in-memory calculations — the CPU is doing real
                work continuously.
              </p>

              <div class="util-block">
                <span class="mono util-label">CPU UTILIZATION</span>
                <div class="util-bar">
                  <div class="util-fill cpu-fill" [style.width.%]="cpuUtilPct()"></div>
                  <div class="playhead" [style.left.%]="progressPct()"></div>
                </div>
                <span class="mono util-value">{{ cpuUtilPct() }}% busy</span>
              </div>

              <div class="segment-strip mono">
                <span class="segment-chip cpu-chip" [style.width.%]="100">ACTIVELY COMPUTING — {{ (DURATION_MS / 1000).toFixed(1) }}s</span>
              </div>
            </div>

            <div class="workload-card">
              <div class="workload-head mono">
                <span class="workload-title io-title">I/O-BOUND</span>
                <span class="pill mono">{{ ioExampleLabel() }}</span>
              </div>
              <p class="workload-desc">
                Database query, HTTP request, file read — the CPU fires off the request, then sits idle until an
                external system responds.
              </p>

              <div class="util-block">
                <span class="mono util-label">CPU UTILIZATION</span>
                <div class="util-bar">
                  <div class="util-fill io-fill" [style.width.%]="ioUtilPct()"></div>
                  <div class="playhead" [style.left.%]="progressPct()"></div>
                </div>
                <span class="mono util-value">{{ ioUtilPct() }}% busy</span>
              </div>

              <div class="segment-strip mono">
                <span class="segment-chip cpu-chip" [style.width.%]="IO_WAIT_START_PCT">CPU</span>
                <span class="segment-chip wait-chip" [style.width.%]="IO_WAIT_END_PCT - IO_WAIT_START_PCT">DATABASE ──────→ RESPONSE</span>
                <span class="segment-chip cpu-chip" [style.width.%]="100 - IO_WAIT_END_PCT">CPU</span>
              </div>
            </div>
          </div>

          <p class="lab-note" aria-live="polite">
            Elapsed: <strong>{{ elapsedLabel() }}</strong> / {{ (DURATION_MS / 1000).toFixed(1) }}s —
            {{ isRunning() ? (progressPct() < IO_WAIT_END_PCT && progressPct() > IO_WAIT_START_PCT ? 'the I/O-bound task is idle, waiting on the external resource, while the CPU-bound task keeps the processor pegged.' : 'both tasks are running.') : 'press run to compare.' }}
          </p>

          <p class="lab-note">
            <strong>CPU-bound work spends most of its time actively using the CPU</strong>; I/O-bound work spends
            most of its time waiting on something external — a database, a network call, a disk. This distinction
            drives concurrency strategy: throwing more threads at CPU-bound work helps far less than expected,
            because there are only so many cores to share. Async or non-blocking I/O helps I/O-bound work
            dramatically, because the CPU is free to do other things during that wait instead of sitting idle.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cx-scene {
      --running: #4ade80;
      --waiting: var(--accent);
      --blocked: var(--danger);
      --idle: #64748b;
      --c-cpu: #60a5fa;
      --c-thread: #a78bfa;
      --c-task: var(--accent-2);
      --c-lock: #f472b6;
      --c-queue: #fbbf24;
    }

    .workload-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .workload-card {
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .workload-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .workload-title {
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .cpu-title { color: var(--c-cpu); }
    .io-title { color: var(--c-queue); }

    .workload-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .util-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .util-label {
      font-size: 0.6875rem;
      color: var(--text-faint);
      letter-spacing: 0.06em;
    }

    .util-bar {
      position: relative;
      height: 20px;
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      overflow: hidden;
    }

    .util-fill {
      position: absolute;
      inset: 0;
      width: 0%;
      transition: width 0.05s linear;
    }

    .cpu-fill { background: linear-gradient(90deg, var(--c-cpu), var(--blocked)); }
    .io-fill { background: linear-gradient(90deg, var(--c-queue), var(--running)); }

    .playhead {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--text);
      z-index: 2;
    }

    .util-value {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .segment-strip {
      display: flex;
      height: 26px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid var(--border-strong);
    }

    .segment-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-inline: 4px;
    }

    .cpu-chip {
      background: var(--c-cpu);
      color: #041019;
    }

    .wait-chip {
      background: var(--surface-elevated);
      color: var(--c-queue);
      border-inline: 1px dashed var(--c-queue);
    }

    @media (max-width: 720px) {
      .workload-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CpuBoundVsIoBound implements OnDestroy {
  protected readonly DURATION_MS = DURATION_MS;
  protected readonly IO_WAIT_START_PCT = IO_WAIT_START_PCT;
  protected readonly IO_WAIT_END_PCT = IO_WAIT_END_PCT;

  protected readonly isRunning = signal(false);
  protected readonly elapsedMs = signal(0);

  protected readonly cpuExampleLabel = signal('IMAGE COMPRESSION');
  protected readonly ioExampleLabel = signal('DATABASE QUERY');

  protected readonly progressPct = computed(() => Math.min(100, (this.elapsedMs() / DURATION_MS) * 100));

  protected readonly cpuUtilPct = computed(() => (this.elapsedMs() > 0 ? Math.round(Math.min(100, this.progressPct())) : 0));

  protected readonly ioUtilPct = computed(() => {
    const p = this.progressPct();
    if (p <= 0) return 0;
    // Brief CPU bursts to fire the request and handle the response; flat and low while waiting.
    if (p < IO_WAIT_START_PCT) return Math.round(p);
    if (p > IO_WAIT_END_PCT) return Math.round(IO_WAIT_START_PCT + (p - IO_WAIT_END_PCT));
    return IO_WAIT_START_PCT;
  });

  protected readonly elapsedLabel = computed(() => `${(Math.min(this.elapsedMs(), DURATION_MS) / 1000).toFixed(1)}s`);

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected runBoth(): void {
    if (this.isRunning()) return;
    this.reset();
    this.isRunning.set(true);

    this.timerId = setInterval(() => {
      this.elapsedMs.update((v) => v + TICK_MS);
      if (this.elapsedMs() >= DURATION_MS) {
        this.elapsedMs.set(DURATION_MS);
        this.isRunning.set(false);
        this.clearTimer();
      }
    }, TICK_MS);
  }

  protected reset(): void {
    this.clearTimer();
    this.isRunning.set(false);
    this.elapsedMs.set(0);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
