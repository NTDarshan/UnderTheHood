import { Component, OnDestroy, computed, signal } from '@angular/core';

type WorkType = 'cpu' | 'io' | 'mixed';
type TaskStatus = 'queued' | 'running' | 'waiting' | 'completed';

interface SimTask {
  id: number;
  status: TaskStatus;
  coreId: number | null;
  isIoTask: boolean;
  workLeft: number;
  waitLeft: number;
  enqueuedAt: number;
  completedAt: number | null;
}

interface Core {
  id: number;
  taskId: number | null;
}

const SPEED_MS: Record<number, number> = { 1: 900, 2: 650, 3: 450, 4: 280, 5: 150 };

let taskSeq = 0;

@Component({
  selector: 'app-concurrency-visualizer-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-visualizer-lab">
      <div class="container">
        <p class="lab-index">13 — THE CONCURRENCY VISUALIZER</p>
        <h2 class="lab-title">Your first full simulation.</h2>
        <p class="lab-lede">
          Configure a workload, then watch tasks move through queueing, execution, and — for I/O-bound work —
          blocking, one scheduler tick at a time. Every panel below updates live from the same simulation.
        </p>

        <div class="lab-panel">
          <div class="cvl-controls">
            <div class="lab-field">
              <label for="cvl-tasks">Number of tasks</label>
              <input id="cvl-tasks" type="range" min="5" max="50" step="1" [value]="numTasks()" [disabled]="isRunning()" (input)="setNumTasks($event)" />
              <span class="mono field-readout">{{ numTasks() }} tasks</span>
            </div>
            <div class="lab-field">
              <label for="cvl-cores">CPU cores</label>
              <input id="cvl-cores" type="range" min="1" max="8" step="1" [value]="numCores()" [disabled]="isRunning()" (input)="setNumCores($event)" />
              <span class="mono field-readout">{{ numCores() }} core(s)</span>
            </div>
            <div class="lab-field">
              <label for="cvl-work-type">Work type</label>
              <div class="lab-btn-row" role="group" aria-label="Work type">
                @for (wt of workTypes; track wt.value) {
                  <button
                    type="button"
                    class="lab-btn"
                    [class.is-active]="workType() === wt.value"
                    [attr.aria-pressed]="workType() === wt.value"
                    [disabled]="isRunning()"
                    (click)="workType.set(wt.value)"
                  >
                    {{ wt.label }}
                  </button>
                }
              </div>
            </div>
            <div class="lab-field">
              <label for="cvl-speed">Scheduling speed</label>
              <input id="cvl-speed" type="range" min="1" max="5" step="1" [value]="speed()" (input)="setSpeed($event)" />
              <span class="mono field-readout">{{ speed() === 5 ? 'fastest' : speed() === 1 ? 'slowest' : 'level ' + speed() }}</span>
            </div>
            <div class="lab-field">
              <label for="cvl-block">Blocking probability</label>
              <input id="cvl-block" type="range" min="0" max="100" step="5" [value]="blockingProbability()" (input)="setBlockingProbability($event)" />
              <span class="mono field-readout">{{ blockingProbability() }}%</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="start()">Start</button>
            <button type="button" class="lab-btn" [disabled]="!isRunning()" (click)="pause()">Pause</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="resetSim()">Reset</button>
          </div>
        </div>

        <div class="cvl-grid">
          <div class="lab-panel cvl-panel">
            <p class="node-label mono">TASK QUEUE ({{ queuedTasks().length }})</p>
            <div class="cvl-pill-row" aria-live="polite">
              @for (t of queuedTasks(); track t.id) {
                <span class="pill">T{{ t.id }}</span>
              } @empty {
                <span class="cvl-empty mono">empty</span>
              }
            </div>
          </div>

          <div class="lab-panel cvl-panel">
            <p class="node-label mono">RUNNING (PER CORE)</p>
            <div class="cvl-core-row" aria-live="polite">
              @for (core of cores(); track core.id) {
                <div class="cvl-core" [class.is-busy]="core.taskId !== null">
                  <p class="cvl-core-label mono">CORE {{ core.id }}</p>
                  @if (core.taskId !== null) {
                    <span class="pill pill-yes">T{{ core.taskId }}</span>
                  } @else {
                    <span class="pill pill-no">IDLE</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="lab-panel cvl-panel">
            <p class="node-label mono">WAITING / BLOCKED ({{ waitingTasks().length }})</p>
            <div class="cvl-pill-row" aria-live="polite">
              @for (t of waitingTasks(); track t.id) {
                <span class="pill pill-conditional">T{{ t.id }}</span>
              } @empty {
                <span class="cvl-empty mono">none blocked</span>
              }
            </div>
          </div>

          <div class="lab-panel cvl-panel">
            <p class="node-label mono">COMPLETED</p>
            <p class="cvl-big-stat mono">{{ completedTasks().length }} / {{ numTasks() }}</p>
          </div>
        </div>

        <div class="stat-row">
          <div class="stat">
            <span class="stat-label mono">CPU UTILIZATION</span>
            <span class="stat-value mono">{{ cpuUtilization().toFixed(0) }}%</span>
          </div>
          <div class="stat">
            <span class="stat-label mono">AVG LATENCY</span>
            <span class="stat-value mono">{{ avgLatencyMs().toFixed(0) }} ms</span>
          </div>
          <div class="stat">
            <span class="stat-label mono">THROUGHPUT</span>
            <span class="stat-value mono">{{ throughput().toFixed(2) }} tasks/s</span>
          </div>
          <div class="stat">
            <span class="stat-label mono">ELAPSED</span>
            <span class="stat-value mono">{{ elapsedSeconds().toFixed(1) }} s</span>
          </div>
        </div>

        @if (isDone()) {
          <p class="lab-note">
            All {{ numTasks() }} tasks completed across {{ numCores() }} core(s). With more cores, CPU-bound work
            finishes faster almost linearly; I/O-bound work benefits less from extra cores because tasks spend most
            of their time blocked, not computing.
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .cvl-controls { display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 700px) { .cvl-controls { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1100px) { .cvl-controls { grid-template-columns: repeat(3, 1fr); } }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .cvl-grid { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 800px) { .cvl-grid { grid-template-columns: 1fr 1fr; } }
    .cvl-panel { padding: 16px 18px; }

    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }

    .cvl-pill-row { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; min-height: 30px; }
    .cvl-empty { color: var(--text-faint); font-size: 0.75rem; }

    .cvl-core-row { margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
    .cvl-core { padding: 10px 8px; text-align: center; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-elevated); }
    .cvl-core.is-busy { border-color: var(--c-cpu); box-shadow: 0 0 10px rgba(96, 165, 250, 0.25); }
    .cvl-core-label { font-size: 0.625rem; color: var(--text-faint); margin-bottom: 6px; }

    .cvl-big-stat { margin-top: 10px; font-size: 1.75rem; color: var(--running); }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 700px) { .stat-row { grid-template-columns: repeat(4, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--text); }
  `,
})
export class ConcurrencyVisualizerLab implements OnDestroy {
  protected readonly workTypes: { value: WorkType; label: string }[] = [
    { value: 'cpu', label: 'CPU-bound' },
    { value: 'io', label: 'I/O-bound' },
    { value: 'mixed', label: 'Mixed' },
  ];

  protected readonly numTasks = signal(20);
  protected readonly numCores = signal(4);
  protected readonly workType = signal<WorkType>('mixed');
  protected readonly speed = signal(3);
  protected readonly blockingProbability = signal(20);

  protected readonly isRunning = signal(false);
  protected readonly tasks = signal<SimTask[]>([]);
  protected readonly cores = signal<Core[]>([]);
  protected readonly tickCount = signal(0);
  protected readonly startedAtTick = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private hasStarted = false;

  protected readonly queuedTasks = computed(() => this.tasks().filter((t) => t.status === 'queued'));
  protected readonly waitingTasks = computed(() => this.tasks().filter((t) => t.status === 'waiting'));
  protected readonly completedTasks = computed(() => this.tasks().filter((t) => t.status === 'completed'));

  protected readonly cpuUtilization = computed(() => {
    const cores = this.cores();
    if (cores.length === 0) return 0;
    const busy = cores.filter((c) => c.taskId !== null).length;
    return (busy / cores.length) * 100;
  });

  protected readonly avgLatencyMs = computed(() => {
    const done = this.completedTasks();
    if (done.length === 0) return 0;
    const tickMs = SPEED_MS[this.speed()];
    const avgTicks = done.reduce((sum, t) => sum + ((t.completedAt ?? 0) - t.enqueuedAt), 0) / done.length;
    return avgTicks * tickMs;
  });

  protected readonly elapsedSeconds = computed(() => {
    if (!this.hasStarted) return 0;
    const tickMs = SPEED_MS[this.speed()];
    return ((this.tickCount() - this.startedAtTick()) * tickMs) / 1000;
  });

  protected readonly throughput = computed(() => {
    const elapsed = this.elapsedSeconds();
    if (elapsed <= 0) return 0;
    return this.completedTasks().length / elapsed;
  });

  protected readonly isDone = computed(() => this.hasStarted && !this.isRunning() && this.completedTasks().length === this.numTasks() && this.numTasks() > 0);

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected setNumTasks(ev: Event): void {
    this.numTasks.set(+(ev.target as HTMLInputElement).value);
  }

  protected setNumCores(ev: Event): void {
    this.numCores.set(+(ev.target as HTMLInputElement).value);
  }

  protected setSpeed(ev: Event): void {
    this.speed.set(+(ev.target as HTMLInputElement).value);
    if (this.isRunning()) {
      this.clearTimer();
      this.startTimer();
    }
  }

  protected setBlockingProbability(ev: Event): void {
    this.blockingProbability.set(+(ev.target as HTMLInputElement).value);
  }

  protected start(): void {
    if (this.isRunning()) return;
    if (!this.hasStarted) {
      this.initSimulation();
    }
    this.isRunning.set(true);
    this.startTimer();
  }

  protected pause(): void {
    this.isRunning.set(false);
    this.clearTimer();
  }

  protected resetSim(): void {
    this.clearTimer();
    this.isRunning.set(false);
    this.hasStarted = false;
    this.tasks.set([]);
    this.cores.set([]);
    this.tickCount.set(0);
    this.startedAtTick.set(0);
  }

  private startTimer(): void {
    this.timer = setInterval(() => this.tick(), SPEED_MS[this.speed()]);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private initSimulation(): void {
    this.hasStarted = true;
    this.tickCount.set(0);
    this.startedAtTick.set(0);

    const wt = this.workType();
    const newTasks: SimTask[] = Array.from({ length: this.numTasks() }, () => {
      const isIoTask = wt === 'io' ? true : wt === 'cpu' ? false : Math.random() < 0.5;
      const workLeft = isIoTask ? 2 + Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 10);
      return {
        id: taskSeq++,
        status: 'queued' as TaskStatus,
        coreId: null,
        isIoTask,
        workLeft,
        waitLeft: 0,
        enqueuedAt: 0,
        completedAt: null,
      };
    });

    this.tasks.set(newTasks);
    this.cores.set(Array.from({ length: this.numCores() }, (_, i) => ({ id: i + 1, taskId: null })));
  }

  private tick(): void {
    this.tickCount.update((t) => t + 1);
    const now = this.tickCount();
    const blockChance = this.blockingProbability() / 100;

    let tasks = this.tasks();
    let cores = this.cores();

    // 1. progress running tasks
    tasks = tasks.map((t) => {
      if (t.status !== 'running') return t;
      const workLeft = t.workLeft - 1;
      if (workLeft <= 0) {
        cores = cores.map((c) => (c.taskId === t.id ? { ...c, taskId: null } : c));
        return { ...t, status: 'completed' as TaskStatus, workLeft: 0, completedAt: now, coreId: null };
      }
      if (t.isIoTask && Math.random() < blockChance) {
        cores = cores.map((c) => (c.taskId === t.id ? { ...c, taskId: null } : c));
        return { ...t, status: 'waiting' as TaskStatus, workLeft, waitLeft: 2 + Math.floor(Math.random() * 4), coreId: null };
      }
      return { ...t, workLeft };
    });

    // 2. progress waiting (blocked) tasks
    tasks = tasks.map((t) => {
      if (t.status !== 'waiting') return t;
      const waitLeft = t.waitLeft - 1;
      if (waitLeft <= 0) {
        return { ...t, status: 'queued' as TaskStatus, waitLeft: 0 };
      }
      return { ...t, waitLeft };
    });

    // 3. assign idle cores to queued tasks (FIFO)
    const idleCores = cores.filter((c) => c.taskId === null);
    let cursor = 0;
    tasks = tasks.map((t) => {
      if (t.status !== 'queued' || cursor >= idleCores.length) return t;
      const core = idleCores[cursor];
      cursor++;
      cores = cores.map((c) => (c.id === core.id ? { ...c, taskId: t.id } : c));
      return { ...t, status: 'running' as TaskStatus, coreId: core.id };
    });

    this.tasks.set(tasks);
    this.cores.set(cores);

    if (tasks.every((t) => t.status === 'completed')) {
      this.isRunning.set(false);
      this.clearTimer();
    }
  }
}
