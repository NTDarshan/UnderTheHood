import { Component, computed, signal } from '@angular/core';

type TaskId = 'A' | 'B' | 'C';
type TaskState = 'running' | 'ready' | 'waiting' | 'done';

interface TaskRow {
  id: TaskId;
  state: TaskState;
  remainingSlices: number;
}

interface Segment {
  taskId: TaskId;
}

const SPEED_OPTIONS = [
  { label: '1x', delayMs: 260 },
  { label: '0.5x', delayMs: 500 },
  { label: '0.1x', delayMs: 1400 },
] as const;

const SCHEDULE: TaskId[] = ['A', 'A', 'A', 'B', 'B', 'C', 'A', 'B', 'C', 'C', 'B', 'A', 'C', 'C', 'B'];

@Component({
  selector: 'app-concurrency-single-core',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-single-core">
      <div class="container">
        <p class="lab-index">03 — CONCURRENCY ON A SINGLE CORE</p>
        <h2 class="lab-title">One core. Three tasks. Rapid interleaving.</h2>
        <p class="lab-lede">
          The scheduler slices CPU time between tasks so fast it looks like they run together — but only one
          instruction stream ever executes at a given instant.
        </p>

        <div class="lab-panel">
          <div class="core-lane">
            <p class="core-lane-label mono">CORE 1</p>
            <div class="core-track" aria-live="polite">
              @for (seg of playedSegments(); track $index) {
                <span class="core-seg" [class]="'task-' + seg.taskId"></span>
              }
            </div>
          </div>

          <div class="task-rows">
            @for (task of tasks(); track task.id) {
              <div class="task-row">
                <span class="task-id mono task-color-{{ task.id }}">Task {{ task.id }}</span>
                <span class="pill state-pill" [class]="'state-' + task.state">
                  {{ stateLabel(task.state) }}
                </span>
              </div>
            }
          </div>

          <div class="controls-row">
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
                Run
              </button>
              <button type="button" class="lab-btn" [disabled]="isRunning()" (click)="reset()">
                Reset
              </button>
            </div>

            <div class="lab-field speed-field">
              <label for="speed-select">Simulation speed</label>
              <select id="speed-select" [value]="speedIndex()" (change)="onSpeedChange($event)">
                @for (opt of speedOptions; track opt.label; let i = $index) {
                  <option [value]="i">{{ opt.label }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Only one task executes at any instant — but progress on all three overlaps through scheduling. This is
          concurrency without parallelism.
        </p>
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
      --task-a: #60a5fa;
      --task-b: #a78bfa;
      --task-c: #4fd3e8;
    }

    .core-lane-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 8px; }
    .core-track {
      display: flex;
      align-items: center;
      gap: 2px;
      min-height: 28px;
      padding: 6px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      flex-wrap: wrap;
    }
    .core-seg { width: 14px; height: 16px; border-radius: 2px; flex-shrink: 0; }
    .core-seg.task-A { background: var(--task-a); }
    .core-seg.task-B { background: var(--task-b); }
    .core-seg.task-C { background: var(--task-c); }

    .task-rows { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .task-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .task-id { font-size: 0.8125rem; font-weight: 600; }
    .task-color-A { color: var(--task-a); }
    .task-color-B { color: var(--task-b); }
    .task-color-C { color: var(--task-c); }

    .state-pill { border-width: 1px; border-style: solid; }
    .state-pill.state-running { color: var(--running); border-color: var(--running); }
    .state-pill.state-waiting { color: var(--waiting); border-color: var(--waiting); }
    .state-pill.state-ready { color: var(--idle); border-color: var(--idle); }
    .state-pill.state-done { color: var(--text-faint); border-color: var(--border-strong); }

    .controls-row { margin-top: 24px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
    .speed-field { max-width: 160px; }
  `,
})
export class ConcurrencySingleCore {
  protected readonly speedOptions = SPEED_OPTIONS;
  protected readonly speedIndex = signal(0);

  protected readonly playedIndex = signal(0);
  protected readonly isRunning = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly playedSegments = computed<Segment[]>(() =>
    SCHEDULE.slice(0, this.playedIndex()).map((taskId) => ({ taskId })),
  );

  protected readonly tasks = computed<TaskRow[]>(() => {
    const played = this.playedIndex();
    const current = played > 0 ? SCHEDULE[played - 1] : null;
    const done = played >= SCHEDULE.length;

    return (['A', 'B', 'C'] as TaskId[]).map((id) => {
      const remaining = SCHEDULE.slice(played).filter((t) => t === id).length;
      let state: TaskState;
      if (done) {
        state = 'done';
      } else if (id === current) {
        state = 'running';
      } else if (remaining === 0) {
        state = 'done';
      } else {
        state = SCHEDULE.slice(0, played).includes(id) ? 'ready' : 'waiting';
      }
      return { id, state, remainingSlices: remaining };
    });
  });

  protected run(): void {
    if (this.isRunning()) return;
    this.playedIndex.set(0);
    this.isRunning.set(true);

    const delay = this.speedOptions[this.speedIndex()].delayMs;
    this.timer = setInterval(() => {
      this.playedIndex.update((v) => v + 1);
      if (this.playedIndex() >= SCHEDULE.length) {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.isRunning.set(false);
      }
    }, delay);
  }

  protected reset(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.isRunning.set(false);
    this.playedIndex.set(0);
  }

  protected onSpeedChange(event: Event): void {
    this.speedIndex.set(+(event.target as HTMLSelectElement).value);
  }

  protected stateLabel(state: TaskState): string {
    if (state === 'running') return 'RUNNING';
    if (state === 'ready') return 'READY';
    if (state === 'done') return 'DONE';
    return 'WAITING';
  }
}
