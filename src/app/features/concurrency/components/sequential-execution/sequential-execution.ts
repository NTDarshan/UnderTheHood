import { Component, computed, signal } from '@angular/core';

type TaskId = 'A' | 'B' | 'C';
type TaskState = 'pending' | 'running' | 'done';

interface Task {
  id: TaskId;
  durationMs: number;
  progress: number;
  state: TaskState;
}

const TASK_DEFS: { id: TaskId; durationMs: number }[] = [
  { id: 'A', durationMs: 1200 },
  { id: 'B', durationMs: 900 },
  { id: 'C', durationMs: 1500 },
];

const TICK_MS = 60;

@Component({
  selector: 'app-sequential-execution',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="sequential-execution">
      <div class="container">
        <p class="lab-index">02 — SEQUENTIAL EXECUTION</p>
        <h2 class="lab-title">Three independent tasks, run one after another</h2>
        <p class="lab-lede">Nothing here depends on anything else. Watch how long it takes anyway.</p>

        <div class="lab-panel">
          <div class="timeline" aria-live="polite">
            @for (task of tasks(); track task.id) {
              <div class="timeline-row">
                <span class="timeline-label mono">Task {{ task.id }}</span>
                <div class="timeline-track">
                  <div
                    class="timeline-fill"
                    [class.is-running]="task.state === 'running'"
                    [class.is-done]="task.state === 'done'"
                    [style.width.%]="task.progress"
                  ></div>
                </div>
                <span class="pill" [class.pill-yes]="task.state === 'done'" [class.pill-conditional]="task.state === 'running'" [class.pill-no]="task.state === 'pending'">
                  {{ stateLabel(task.state) }}
                </span>
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              Run
            </button>
            <button type="button" class="lab-btn" [disabled]="isRunning()" (click)="reset()">
              Reset
            </button>
          </div>

          <p class="total-time mono">Total elapsed: <strong>{{ (elapsedMs() / 1000).toFixed(2) }}s</strong></p>

          @if (isComplete()) {
            <div class="prompt-reveal">
              <p class="lab-note">What if these tasks don't depend on one another?</p>
              <div class="lab-btn-row">
                <button
                  type="button"
                  class="lab-btn"
                  (click)="scrollToSection($event, 'concurrency-single-core')"
                >
                  See it run concurrently
                </button>
              </div>
            </div>
          }
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

    .timeline { display: flex; flex-direction: column; gap: 14px; }
    .timeline-row { display: grid; grid-template-columns: 60px 1fr 84px; align-items: center; gap: 12px; }
    .timeline-label { font-size: 0.8125rem; color: var(--text-muted); }
    .timeline-track { height: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
    .timeline-fill { height: 100%; width: 0%; background: var(--idle); transition: width 0.06s linear, background 0.2s ease; }
    .timeline-fill.is-running { background: var(--waiting); }
    .timeline-fill.is-done { background: var(--running); }

    .total-time { margin-top: 20px; font-size: 0.875rem; color: var(--text-muted); }
    .total-time strong { color: var(--text); }

    .prompt-reveal { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
  `,
})
export class SequentialExecution {
  protected readonly tasks = signal<Task[]>(
    TASK_DEFS.map((t) => ({ ...t, progress: 0, state: 'pending' as TaskState })),
  );
  protected readonly isRunning = signal(false);
  protected readonly elapsedMs = signal(0);

  protected readonly isComplete = computed(() => this.tasks().every((t) => t.state === 'done'));

  private timer: ReturnType<typeof setInterval> | null = null;

  protected run(): void {
    if (this.isRunning()) return;
    this.reset();
    this.isRunning.set(true);

    let taskIndex = 0;

    const runNext = () => {
      if (taskIndex >= TASK_DEFS.length) {
        this.isRunning.set(false);
        return;
      }

      const def = TASK_DEFS[taskIndex];
      this.tasks.update((list) =>
        list.map((t) => (t.id === def.id ? { ...t, state: 'running' } : t)),
      );

      this.timer = setInterval(() => {
        this.elapsedMs.update((v) => v + TICK_MS);

        this.tasks.update((list) =>
          list.map((t) => {
            if (t.id !== def.id) return t;
            const nextProgress = Math.min(100, t.progress + (TICK_MS / def.durationMs) * 100);
            return { ...t, progress: nextProgress };
          }),
        );

        const current = this.tasks().find((t) => t.id === def.id);
        if (current && current.progress >= 100) {
          if (this.timer) clearInterval(this.timer);
          this.timer = null;
          this.tasks.update((list) =>
            list.map((t) => (t.id === def.id ? { ...t, state: 'done', progress: 100 } : t)),
          );
          taskIndex++;
          runNext();
        }
      }, TICK_MS);
    };

    runNext();
  }

  protected reset(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.isRunning.set(false);
    this.elapsedMs.set(0);
    this.tasks.set(TASK_DEFS.map((t) => ({ ...t, progress: 0, state: 'pending' as TaskState })));
  }

  protected stateLabel(state: TaskState): string {
    if (state === 'running') return 'RUNNING';
    if (state === 'done') return 'DONE';
    return 'PENDING';
  }

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
