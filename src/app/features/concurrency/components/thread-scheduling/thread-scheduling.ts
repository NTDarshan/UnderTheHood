import { Component, OnDestroy, computed, signal } from '@angular/core';

type SliceLength = 'short' | 'medium' | 'long';
type Workload = 'cpu-bound' | 'io-bound' | 'mixed';
type TaskId = 'A' | 'B' | 'C' | 'D';

interface Task {
  id: TaskId;
  remaining: number;
  highPriority: boolean;
}

interface TimelineSlice {
  key: number;
  core: number;
  taskId: TaskId;
}

const TASK_IDS: TaskId[] = ['A', 'B', 'C', 'D'];
const SLICE_MS: Record<SliceLength, number> = { short: 1, medium: 2, long: 4 };
const INITIAL_WORK = 8;

@Component({
  selector: 'app-thread-scheduling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="thread-scheduling">
      <div class="container">
        <p class="lab-index">10 — THREAD SCHEDULING</p>
        <h2 class="lab-title">Thread scheduling</h2>
        <p class="lab-lede">
          Runnable threads sit in a ready queue until a scheduler decides which one gets a CPU core, and for how
          long. Tune the settings below and press Run to watch the scheduler repeatedly pick tasks and build up an
          execution timeline.
        </p>

        <div class="lab-panel">
          <div class="scheduling-flow">
            <div class="queue-lane">
              <p class="lane-label mono">READY QUEUE</p>
              <div class="queue-slots">
                @for (t of readyTasks(); track t.id) {
                  <div class="task-token" [class.is-priority]="t.highPriority">
                    <span class="mono">{{ t.id }}</span>
                    @if (t.highPriority) {
                      <span class="pill pill-conditional prio-pill">HI</span>
                    }
                  </div>
                }
                @if (readyTasks().length === 0) {
                  <p class="empty-note mono">empty</p>
                }
              </div>
            </div>

            <span class="lab-flow-arrow">&rarr;</span>

            <div class="scheduler-lane">
              <p class="lane-label mono">SCHEDULER</p>
              <p class="scheduler-sub mono">{{ sliceLength() }} slice · {{ cores() }} core(s)</p>
            </div>

            <span class="lab-flow-arrow">&rarr;</span>

            <div class="cpu-lane">
              <p class="lane-label mono">CPU</p>
              <div class="cpu-cores">
                @for (c of coreList(); track c) {
                  <div class="cpu-core" [class.is-busy]="runningOnCore(c)">
                    <span class="mono">CORE {{ c + 1 }}</span>
                    <span class="mono core-task">{{ runningOnCore(c)?.id ?? '—' }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="controls-grid">
            <div class="lab-field">
              <label for="slice-select">Time slice length</label>
              <select id="slice-select" [value]="sliceLength()" (change)="setSlice($event)">
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>

            <div class="lab-field">
              <label for="cores-select">Number of cores</label>
              <select id="cores-select" [value]="cores()" (change)="setCores($event)">
                <option [value]="1">1</option>
                <option [value]="2">2</option>
                <option [value]="4">4</option>
              </select>
            </div>

            <div class="lab-field">
              <label for="workload-select">Workload type</label>
              <select id="workload-select" [value]="workload()" (change)="setWorkload($event)">
                <option value="cpu-bound">CPU-bound</option>
                <option value="io-bound">I/O-bound</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div class="lab-field">
              <label>Priority</label>
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="taskA()?.highPriority"
                [attr.aria-pressed]="taskA()?.highPriority ?? false"
                (click)="toggleAPriority()"
              >
                Task A: {{ taskA()?.highPriority ? 'High priority' : 'Normal priority' }}
              </button>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Running…' : 'Run' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="timeline" aria-live="polite">
            <p class="lane-label mono">EXECUTION TIMELINE</p>
            <div class="timeline-track">
              @for (slice of timeline(); track slice.key) {
                <span class="timeline-cell" [class]="'cell-' + slice.taskId">
                  {{ slice.taskId }}
                </span>
              }
              @if (timeline().length === 0) {
                <p class="empty-note mono">Press Run to build the timeline.</p>
              }
            </div>
          </div>

          @if (allDone()) {
            <p class="lab-note">All tasks finished. Reset to run again with different settings.</p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          This is a simplified conceptual model of scheduling — not an implementation of any specific OS's real
          scheduler. Real schedulers weigh many more factors (priority aging, I/O wait history, NUMA locality, fairness
          guarantees) that are left out here to keep the mechanics visible.
        </p>
      </div>
    </section>
  `,
  styles: `
    .scheduling-flow { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .queue-lane, .scheduler-lane, .cpu-lane {
      flex: 1;
      min-width: 160px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .lane-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin: 0 0 10px; }

    .queue-slots { display: flex; flex-wrap: wrap; gap: 8px; min-height: 44px; }
    .task-token {
      position: relative;
      display: flex;
      align-items: center;
      gap: 4px;
      width: 36px;
      height: 36px;
      justify-content: center;
      border-radius: var(--radius-sm);
      border: 1px solid var(--c-task);
      background: color-mix(in srgb, var(--c-task) 12%, var(--surface));
    }
    .task-token.is-priority { border-color: var(--accent); }
    .prio-pill { position: absolute; top: -10px; right: -8px; font-size: 0.5625rem; padding: 1px 4px; }

    .scheduler-sub { color: var(--text-muted); font-size: 0.75rem; margin: 0; }

    .cpu-cores { display: flex; flex-direction: column; gap: 8px; }
    .cpu-core {
      display: flex;
      justify-content: space-between;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      font-size: 0.75rem;
      color: var(--text-faint);
    }
    .cpu-core.is-busy { border-color: var(--running); color: var(--text); }
    .core-task { color: var(--c-task); }

    .empty-note { color: var(--text-faint); font-style: italic; margin: 0; }

    .controls-grid { margin-top: 22px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 960px) { .controls-grid { grid-template-columns: repeat(4, 1fr); } }
    .lab-field select { width: 100%; padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; }

    .timeline { margin-top: 22px; }
    .timeline-track { display: flex; flex-wrap: wrap; gap: 4px; min-height: 40px; align-items: center; }
    .timeline-cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--bg);
    }
    .cell-A { background: var(--c-task); }
    .cell-B { background: var(--c-thread); }
    .cell-C { background: var(--c-cpu); }
    .cell-D { background: var(--c-queue); }
  `,
})
export class ThreadScheduling implements OnDestroy {
  protected readonly sliceLength = signal<SliceLength>('medium');
  protected readonly cores = signal(1);
  protected readonly workload = signal<Workload>('mixed');

  protected readonly tasks = signal<Task[]>(
    TASK_IDS.map((id) => ({ id, remaining: INITIAL_WORK, highPriority: false })),
  );

  protected readonly runningIds = signal<(TaskId | null)[]>([null]);
  protected readonly timeline = signal<TimelineSlice[]>([]);
  protected readonly isRunning = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private tickKey = 0;

  protected readonly coreList = computed(() => Array.from({ length: this.cores() }, (_, i) => i));
  protected readonly readyTasks = computed(() => {
    const running = new Set(this.runningIds().filter((id): id is TaskId => id !== null));
    return this.tasks().filter((t) => t.remaining > 0 && !running.has(t.id));
  });
  protected readonly allDone = computed(() => this.tasks().every((t) => t.remaining <= 0));

  protected taskA(): Task | undefined {
    return this.tasks().find((t) => t.id === 'A');
  }

  protected runningOnCore(coreIndex: number): Task | undefined {
    const id = this.runningIds()[coreIndex];
    if (!id) return undefined;
    return this.tasks().find((t) => t.id === id);
  }

  setSlice(ev: Event): void {
    this.sliceLength.set((ev.target as HTMLSelectElement).value as SliceLength);
  }

  setCores(ev: Event): void {
    const n = Number((ev.target as HTMLSelectElement).value);
    this.cores.set(n);
    this.runningIds.set(Array.from({ length: n }, () => null));
  }

  setWorkload(ev: Event): void {
    this.workload.set((ev.target as HTMLSelectElement).value as Workload);
  }

  toggleAPriority(): void {
    this.tasks.update((list) =>
      list.map((t) => (t.id === 'A' ? { ...t, highPriority: !t.highPriority } : t)),
    );
  }

  run(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);

    this.timer = setInterval(() => {
      this.schedulerTick();
      if (this.allDone()) {
        this.stopTimer();
        this.isRunning.set(false);
      }
    }, 700);
  }

  reset(): void {
    this.stopTimer();
    this.isRunning.set(false);
    this.tasks.update((list) => list.map((t) => ({ ...t, remaining: INITIAL_WORK })));
    this.runningIds.set(Array.from({ length: this.cores() }, () => null));
    this.timeline.set([]);
    this.tickKey = 0;
  }

  private schedulerTick(): void {
    const numCores = this.cores();
    const slice = SLICE_MS[this.sliceLength()];
    const nextRunning: (TaskId | null)[] = [];
    const claimed = new Set<TaskId>();

    for (let core = 0; core < numCores; core++) {
      const candidates = this.tasks()
        .filter((t) => t.remaining > 0 && !claimed.has(t.id))
        .sort((a, b) => {
          if (a.highPriority !== b.highPriority) return a.highPriority ? -1 : 1;
          return b.remaining - a.remaining;
        });

      const pick = candidates[0];
      if (pick) {
        claimed.add(pick.id);
        nextRunning.push(pick.id);
      } else {
        nextRunning.push(null);
      }
    }

    this.runningIds.set(nextRunning);

    const workDone = this.workload() === 'io-bound' ? Math.max(1, slice - 1) : slice;

    this.tasks.update((list) =>
      list.map((t) => {
        if (!claimed.has(t.id)) return t;
        return { ...t, remaining: Math.max(0, t.remaining - workDone) };
      }),
    );

    const newSlices: TimelineSlice[] = nextRunning
      .filter((id): id is TaskId => id !== null)
      .map((id) => ({ key: this.tickKey++, core: 0, taskId: id }));

    this.timeline.update((tl) => [...tl, ...newSlices].slice(-40));
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
