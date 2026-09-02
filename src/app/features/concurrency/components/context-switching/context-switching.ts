import { Component, OnDestroy, computed, signal } from '@angular/core';

type StepId = 'run-a' | 'save-a' | 'load-b' | 'run-b' | 'save-b' | 'load-a' | 'run-a-2';

interface Step {
  id: StepId;
  label: string;
  detail: string;
  kind: 'run' | 'save' | 'load';
}

const STEPS: Step[] = [
  { id: 'run-a', label: 'RUN A', detail: 'Task A executes on the CPU using its own register values and stack.', kind: 'run' },
  { id: 'save-a', label: 'SAVE A', detail: "The OS saves A's registers, program counter, and stack pointer into A's thread control block.", kind: 'save' },
  { id: 'load-b', label: 'LOAD B', detail: "The OS loads B's previously saved registers, program counter, and stack pointer.", kind: 'load' },
  { id: 'run-b', label: 'RUN B', detail: 'Task B resumes executing on the CPU exactly where it left off.', kind: 'run' },
  { id: 'save-b', label: 'SAVE B', detail: "The OS saves B's execution state again before handing the CPU back.", kind: 'save' },
  { id: 'load-a', label: 'LOAD A', detail: "The OS loads A's saved state back into the CPU's registers.", kind: 'load' },
  { id: 'run-a-2', label: 'RUN A', detail: 'Task A resumes exactly where it was interrupted, unaware any of this happened.', kind: 'run' },
];

const THREAD_COUNTS = [2, 4, 8, 32, 128] as const;
type ThreadCount = (typeof THREAD_COUNTS)[number];

// Simplified conceptual overhead curve: overhead grows with thread count but saturates,
// leaving a floor of useful work so the bars never fully invert.
const OVERHEAD_PCT: Record<ThreadCount, number> = {
  2: 4,
  4: 10,
  8: 22,
  32: 45,
  128: 68,
};

@Component({
  selector: 'app-context-switching',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="context-switching">
      <div class="container">
        <p class="lab-index">11 — CONTEXT SWITCHING</p>
        <h2 class="lab-title">Context switching</h2>
        <p class="lab-lede">
          Only one thread can use a CPU core at a time. To let another thread run, the OS must save the current
          thread's state and load the next one's — that save/load pair is a context switch, and it costs real
          time that does no useful work.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="play()">
              {{ isPlaying() ? 'Switching…' : 'Run switch sequence' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="switch-track" aria-live="polite">
            @for (step of steps; track step.id; let i = $index) {
              <div class="switch-step" [class]="'kind-' + step.kind" [class.is-active]="activeIndex() === i" [class.is-done]="activeIndex() > i">
                <span class="mono step-label">{{ step.label }}</span>
              </div>
              @if (!$last) {
                <span class="lab-flow-arrow">&rarr;</span>
              }
            }
          </div>

          <div class="step-detail">
            @if (activeStep(); as s) {
              <p class="detail-text">{{ s.detail }}</p>
            } @else {
              <p class="detail-text detail-empty">Press "Run switch sequence" to step through a context switch.</p>
            }
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">MORE THREADS &rarr; MORE SWITCHING OVERHEAD</p>
          <p class="part-lede">
            The CPU has a fixed time budget. As more runnable threads compete for the same core, the OS switches
            between them more often — and every switch spends time saving and loading state instead of doing work.
          </p>

          <div class="lab-btn-row" role="group" aria-label="Number of runnable threads">
            @for (n of threadCounts; track n) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="threadCount() === n"
                [attr.aria-pressed]="threadCount() === n"
                (click)="threadCount.set(n)"
              >
                {{ n }} threads
              </button>
            }
          </div>

          <div class="overhead-bar" role="img" [attr.aria-label]="'Useful work ' + usefulPct() + ' percent, scheduling overhead ' + overheadPct() + ' percent'">
            <div class="bar-useful" [style.width.%]="usefulPct()">
              <span class="mono bar-label">USEFUL WORK {{ usefulPct() }}%</span>
            </div>
            <div class="bar-overhead" [style.width.%]="overheadPct()">
              <span class="mono bar-label">OVERHEAD {{ overheadPct() }}%</span>
            </div>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          More threads does not automatically mean more performance. Beyond the number of cores actually
          available, adding threads increases context-switching overhead — real CPU time spent saving and loading
          state instead of running application code.
        </p>
      </div>
    </section>
  `,
  styles: `
    .switch-track { margin-top: 22px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .switch-step {
      padding: 10px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      opacity: 0.55;
    }
    .switch-step.is-done { opacity: 0.85; }
    .switch-step.is-active { opacity: 1; box-shadow: 0 0 0 2px currentColor; }
    .kind-run { border-color: var(--running); color: var(--running); }
    .kind-save { border-color: var(--c-lock); color: var(--c-lock); }
    .kind-load { border-color: var(--c-cpu); color: var(--c-cpu); }
    .step-label { font-size: 0.75rem; letter-spacing: 0.04em; color: inherit; }

    .step-detail {
      margin-top: 18px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      min-height: 56px;
    }
    .detail-text { margin: 0; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
    .detail-empty { color: var(--text-faint); font-style: italic; }

    .part-lede { margin-top: 14px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; max-width: 640px; }

    .overhead-bar {
      margin-top: 20px;
      display: flex;
      width: 100%;
      height: 40px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .bar-useful, .bar-overhead {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      transition: width 0.4s ease;
      overflow: hidden;
    }
    .bar-useful { background: var(--running); }
    .bar-overhead { background: var(--danger); }
    .bar-label { font-size: 0.625rem; color: #0a0a0a; white-space: nowrap; padding: 0 6px; }
  `,
})
export class ContextSwitching implements OnDestroy {
  protected readonly steps = STEPS;
  protected readonly threadCounts = THREAD_COUNTS;

  protected readonly activeIndex = signal(-1);
  protected readonly isPlaying = signal(false);
  protected readonly threadCount = signal<ThreadCount>(2);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly activeStep = computed<Step | undefined>(() => {
    const i = this.activeIndex();
    return i >= 0 && i < STEPS.length ? STEPS[i] : undefined;
  });

  protected readonly overheadPct = computed(() => OVERHEAD_PCT[this.threadCount()]);
  protected readonly usefulPct = computed(() => 100 - this.overheadPct());

  protected play(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    this.activeIndex.set(0);

    this.timer = setInterval(() => {
      const next = this.activeIndex() + 1;
      if (next >= STEPS.length) {
        this.stopTimer();
        this.isPlaying.set(false);
        return;
      }
      this.activeIndex.set(next);
    }, 750);
  }

  protected reset(): void {
    this.stopTimer();
    this.isPlaying.set(false);
    this.activeIndex.set(-1);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
