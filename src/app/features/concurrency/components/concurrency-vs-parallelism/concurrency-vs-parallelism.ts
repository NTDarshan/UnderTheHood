import { Component, OnDestroy, computed, signal } from '@angular/core';

type ViewMode = 'concurrency' | 'parallelism';

interface Segment {
  readonly taskId: 'A' | 'B' | 'C';
  readonly startMs: number;
  readonly durationMs: number;
}

const TASK_DURATION_MS = 1200; // each task needs this much actual CPU time
const SLICE_MS = 400; // interleave slice size in concurrency mode
const TIMELINE_MS = TASK_DURATION_MS * 3; // total width of the timeline in both modes
const TICK_MS = 30;

// Concurrency: one lane, tasks time-sliced/interleaved. Ends up taking 3x a single task.
const CONCURRENCY_SEGMENTS: Segment[] = [
  { taskId: 'A', startMs: 0, durationMs: SLICE_MS },
  { taskId: 'B', startMs: SLICE_MS, durationMs: SLICE_MS },
  { taskId: 'C', startMs: SLICE_MS * 2, durationMs: SLICE_MS },
  { taskId: 'A', startMs: SLICE_MS * 3, durationMs: SLICE_MS },
  { taskId: 'B', startMs: SLICE_MS * 4, durationMs: SLICE_MS },
  { taskId: 'C', startMs: SLICE_MS * 5, durationMs: SLICE_MS },
  { taskId: 'A', startMs: SLICE_MS * 6, durationMs: SLICE_MS },
  { taskId: 'B', startMs: SLICE_MS * 7, durationMs: SLICE_MS },
  { taskId: 'C', startMs: SLICE_MS * 8, durationMs: SLICE_MS },
];

// Parallelism: three lanes, each task runs start-to-finish simultaneously. Ends in 1x a single task.
const PARALLELISM_SEGMENTS: Segment[] = [
  { taskId: 'A', startMs: 0, durationMs: TASK_DURATION_MS },
  { taskId: 'B', startMs: 0, durationMs: TASK_DURATION_MS },
  { taskId: 'C', startMs: 0, durationMs: TASK_DURATION_MS },
];

@Component({
  selector: 'app-concurrency-vs-parallelism',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-vs-parallelism">
      <div class="container">
        <p class="lab-index mono">05 — CONCURRENCY VS. PARALLELISM</p>
        <h2 class="lab-title">Concurrency vs. parallelism — the real difference</h2>
        <p class="lab-lede">
          Same three tasks, same colors, same timeline width. Only the lane structure changes. Toggle between the
          two modes and watch exactly what changes — and what doesn't.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Execution mode">
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="mode() === 'concurrency'"
              [attr.aria-pressed]="mode() === 'concurrency'"
              [disabled]="isRunning()"
              (click)="setMode('concurrency')"
            >
              CONCURRENCY
            </button>
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="mode() === 'parallelism'"
              [attr.aria-pressed]="mode() === 'parallelism'"
              [disabled]="isRunning()"
              (click)="setMode('parallelism')"
            >
              PARALLELISM
            </button>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Running…' : 'Run' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="timeline-block" aria-live="polite">
            <div class="timeline-header mono">
              <span>{{ mode() === 'concurrency' ? '1 EXECUTION LANE' : '3 EXECUTION LANES' }}</span>
              <span>{{ elapsedLabel() }}</span>
            </div>

            <div class="lanes" [class.is-parallel]="mode() === 'parallelism'">
              @for (laneId of laneIds(); track laneId) {
                <div class="lane">
                  <span class="lane-label mono">{{ mode() === 'concurrency' ? 'LANE 0' : 'LANE ' + laneId }}</span>
                  <div class="lane-track">
                    <div class="playhead" [style.left.%]="playheadPct()"></div>
                    @for (seg of segmentsForLane(laneId); track seg.startMs) {
                      <div
                        class="segment"
                        [class.task-a]="seg.taskId === 'A'"
                        [class.task-b]="seg.taskId === 'B'"
                        [class.task-c]="seg.taskId === 'C'"
                        [class.is-active]="isSegmentActive(seg)"
                        [class.is-past]="isSegmentPast(seg)"
                        [style.left.%]="(seg.startMs / totalMs) * 100"
                        [style.width.%]="(seg.durationMs / totalMs) * 100"
                      >
                        <span class="mono">{{ seg.taskId }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="legend mono">
              <span class="legend-item"><span class="legend-swatch task-a"></span>TASK A</span>
              <span class="legend-item"><span class="legend-swatch task-b"></span>TASK B</span>
              <span class="legend-item"><span class="legend-swatch task-c"></span>TASK C</span>
            </div>

            <p class="mono finish-line">
              all three tasks finish at
              <strong>{{ (finishMs() / 1000).toFixed(1) }}s</strong>
              {{ mode() === 'concurrency' ? '(one lane, taken in turns)' : '(three lanes, simultaneously — 3x faster wall-clock)' }}
            </p>
          </div>

          <div class="callout-pair">
            <div class="lab-panel callout">
              <p class="mono callout-title">CONCURRENCY</p>
              <p class="callout-body">Concurrency can exist without parallelism.</p>
            </div>
            <div class="lab-panel callout">
              <p class="mono callout-title">PARALLELISM</p>
              <p class="callout-body">Parallelism is one way concurrent work can execute simultaneously.</p>
            </div>
          </div>

          <p class="lab-note lab-note-warn">
            <strong>Concurrency ≠ threads. Parallelism ≠ multiple threads.</strong>
            Concurrency is about <em>structure</em> — managing multiple in-progress tasks, whether or not they ever
            run at the same instant. Parallelism is about a <em>resource requirement</em> — actual simultaneous
            execution, which needs multiple real execution units (cores). A single core running many threads is
            still just concurrency: the threads take turns. Only extra cores turn "taking turns" into "at once."
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

    .timeline-block {
      margin-top: 28px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-faint);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .lanes {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .lane {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .lane-label {
      flex: 0 0 68px;
      font-size: 0.6875rem;
      color: var(--text-faint);
    }

    .lane-track {
      position: relative;
      flex: 1;
      height: 36px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .playhead {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--text);
      z-index: 2;
      transition: left 0.03s linear;
    }

    .segment {
      position: absolute;
      top: 3px;
      bottom: 3px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.35;
      transition: opacity 0.1s ease, box-shadow 0.1s ease;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #05130a;
    }

    .segment.is-past {
      opacity: 0.6;
    }

    .segment.is-active {
      opacity: 1;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25) inset, 0 0 12px rgba(0, 0, 0, 0.3);
    }

    .segment.task-a,
    .legend-swatch.task-a {
      background: var(--c-task);
    }
    .segment.task-b,
    .legend-swatch.task-b {
      background: var(--c-thread);
    }
    .segment.task-c,
    .legend-swatch.task-c {
      background: var(--c-cpu);
    }

    .legend {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      margin-top: 16px;
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }

    .finish-line {
      margin-top: 14px;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .finish-line strong {
      color: var(--text);
    }

    .callout-pair {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .callout {
      margin-top: 0;
      background: var(--surface);
    }

    .callout-title {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 8px;
    }

    .callout-body {
      font-size: 0.9375rem;
      color: var(--text);
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      .callout-pair {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ConcurrencyVsParallelism implements OnDestroy {
  protected readonly mode = signal<ViewMode>('concurrency');
  protected readonly isRunning = signal(false);
  protected readonly elapsedMs = signal(0);
  protected readonly totalMs = TIMELINE_MS;

  protected readonly laneIds = computed<(0 | 1 | 2)[]>(() => (this.mode() === 'concurrency' ? [0] : [0, 1, 2]));

  protected readonly finishMs = computed(() => (this.mode() === 'concurrency' ? this.totalMs : TASK_DURATION_MS));

  protected readonly playheadPct = computed(() => Math.min(100, (this.elapsedMs() / this.totalMs) * 100));

  protected readonly elapsedLabel = computed(() => `${(Math.min(this.elapsedMs(), this.finishMs()) / 1000).toFixed(1)}s`);

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected setMode(m: ViewMode): void {
    if (this.isRunning()) return;
    this.mode.set(m);
    this.reset();
  }

  protected segmentsForLane(laneId: 0 | 1 | 2): Segment[] {
    if (this.mode() === 'concurrency') return CONCURRENCY_SEGMENTS;
    const taskId = (['A', 'B', 'C'] as const)[laneId];
    return PARALLELISM_SEGMENTS.filter((s) => s.taskId === taskId);
  }

  protected isSegmentActive(seg: Segment): boolean {
    const t = this.elapsedMs();
    return this.isRunning() && t >= seg.startMs && t < seg.startMs + seg.durationMs;
  }

  protected isSegmentPast(seg: Segment): boolean {
    return this.elapsedMs() >= seg.startMs + seg.durationMs;
  }

  protected run(): void {
    if (this.isRunning()) return;
    this.reset();
    this.isRunning.set(true);

    this.timerId = setInterval(() => {
      this.elapsedMs.update((v) => v + TICK_MS);
      if (this.elapsedMs() >= this.finishMs()) {
        this.elapsedMs.set(this.finishMs());
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
