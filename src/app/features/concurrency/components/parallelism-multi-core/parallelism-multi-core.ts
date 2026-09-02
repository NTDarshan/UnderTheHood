import { Component, OnDestroy, computed, signal } from '@angular/core';

type CoreCount = 1 | 2 | 4 | 8;

interface TaskDef {
  readonly id: string;
  readonly label: string;
  readonly durationMs: number;
}

interface RunningTask extends TaskDef {
  progressMs: number;
  coreIndex: number | null; // which core lane it is executing on, null while queued
  status: 'queued' | 'running' | 'done';
}

const ALL_TASKS: TaskDef[] = [
  { id: 'A', label: 'TASK A', durationMs: 2600 },
  { id: 'B', label: 'TASK B', durationMs: 1800 },
  { id: 'C', label: 'TASK C', durationMs: 3200 },
  { id: 'D', label: 'TASK D', durationMs: 2200 },
  { id: 'E', label: 'TASK E', durationMs: 2000 },
  { id: 'F', label: 'TASK F', durationMs: 2800 },
  { id: 'G', label: 'TASK G', durationMs: 1600 },
  { id: 'H', label: 'TASK H', durationMs: 2400 },
];

const TICK_MS = 40;

@Component({
  selector: 'app-parallelism-multi-core',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="parallelism-multi-core">
      <div class="container">
        <p class="lab-index mono">04 — PARALLELISM</p>
        <h2 class="lab-title">Parallelism</h2>
        <p class="lab-lede">
          Concurrency structures work as multiple in-progress tasks. Parallelism is what happens when there are
          enough physical execution units — CPU cores — to actually run more than one of them at the exact same
          instant. Change the core count below and watch the same four to eight tasks finish in very different
          amounts of wall-clock time.
        </p>

        <div class="lab-panel">
          <div class="lab-field">
            <label id="core-count-label">CORES</label>
            <div class="lab-btn-row" role="group" aria-labelledby="core-count-label">
              @for (n of coreOptions; track n) {
                <button
                  type="button"
                  class="lab-btn"
                  [class.is-active]="coreCount() === n"
                  [attr.aria-pressed]="coreCount() === n"
                  [disabled]="isRunning()"
                  (click)="setCoreCount(n)"
                >
                  {{ n }} CORE{{ n > 1 ? 'S' : '' }}
                </button>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Running…' : 'Run' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="cpu-block" aria-live="polite">
            <div class="cpu-header mono">
              <span>CPU — {{ coreCount() }} CORE{{ coreCount() > 1 ? 'S' : '' }}</span>
              <span class="mono">{{ activeTasks().length }} / {{ tasks().length }} tasks active</span>
            </div>

            <div class="core-grid" [style.--cores]="coreCount()">
              @for (lane of coreLanes(); track $index) {
                <div class="core-card" [class.is-busy]="lane.task">
                  <div class="core-card-head mono">
                    <span>CORE {{ $index }}</span>
                    <span class="core-state" [class.is-busy]="lane.task">{{ lane.task ? 'BUSY' : 'IDLE' }}</span>
                  </div>
                  <div class="core-lane-bar">
                    @if (lane.task) {
                      <div class="core-lane-fill" [style.width.%]="lane.task.progressMs / lane.task.durationMs * 100"></div>
                      <span class="core-lane-label mono">{{ lane.task.label }}</span>
                    } @else {
                      <span class="core-lane-label mono is-idle">—</span>
                    }
                  </div>
                </div>
              }
            </div>

            @if (queuedTasks().length > 0) {
              <div class="queue-strip">
                <span class="mono queue-title">WAITING FOR A FREE CORE</span>
                <div class="queue-chips">
                  @for (t of queuedTasks(); track t.id) {
                    <span class="pill queue-chip mono">{{ t.label }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <div class="stat-pair">
            <div class="stat-card">
              <span class="stat-card-label mono">TOTAL COMPLETION TIME</span>
              <span class="stat-card-value mono">{{ elapsedLabel() }}</span>
              <span class="stat-card-sub">wall-clock time until every task is done</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-label mono">TASKS RUNNING SIMULTANEOUSLY (PEAK)</span>
              <span class="stat-card-value mono">{{ peakConcurrent() }}</span>
              <span class="stat-card-sub">max tasks that occupied a core at once</span>
            </div>
          </div>

          <p class="lab-note">
            <strong>Parallelism requires actual simultaneous execution resources.</strong> With 1 core, tasks still
            get managed concurrently — queued, started, paused conceptually — but only one can occupy the CPU at a
            time, so they run one after another. With 4 or more cores, most or all of these tasks execute
            <em>at the same instant</em>, on physically separate execution units — that is parallelism, and it is
            the only thing here that actually shortens total completion time.
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

    .cpu-block {
      margin-top: 28px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .cpu-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-faint);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .core-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }

    .core-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s ease;
    }

    .core-card.is-busy {
      border-color: var(--c-cpu);
    }

    .core-card-head {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      color: var(--text-faint);
    }

    .core-state.is-busy {
      color: var(--running);
    }

    .core-lane-bar {
      position: relative;
      height: 26px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .core-lane-fill {
      position: absolute;
      inset: 0;
      width: 0%;
      background: linear-gradient(90deg, var(--c-cpu), var(--running));
      transition: width 0.05s linear;
    }

    .core-lane-label {
      position: relative;
      z-index: 1;
      margin-inline: auto;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #05130a;
      text-shadow: 0 0 4px rgba(255, 255, 255, 0.35);
    }

    .core-lane-label.is-idle {
      color: var(--text-faint);
      text-shadow: none;
    }

    .queue-strip {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px dashed var(--border-strong);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .queue-title {
      font-size: 0.6875rem;
      color: var(--c-queue);
      letter-spacing: 0.06em;
    }

    .queue-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .queue-chip {
      color: var(--c-queue);
      border-color: var(--c-queue);
    }

    .stat-pair {
      margin-top: 26px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .stat-card-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
    }

    .stat-card-value {
      font-size: 1.6rem;
      color: var(--text);
    }

    .stat-card-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    @media (max-width: 560px) {
      .stat-pair {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ParallelismMultiCore implements OnDestroy {
  protected readonly coreOptions: CoreCount[] = [1, 2, 4, 8];

  protected readonly coreCount = signal<CoreCount>(4);
  protected readonly tasks = signal<RunningTask[]>(this.buildTasks(4));
  protected readonly isRunning = signal(false);
  protected readonly elapsedMs = signal(0);
  protected readonly peakConcurrent = signal(0);

  protected readonly activeTasks = computed(() => this.tasks().filter((t) => t.status === 'running'));
  protected readonly queuedTasks = computed(() => this.tasks().filter((t) => t.status === 'queued'));

  protected readonly coreLanes = computed(() => {
    const lanes: { task: RunningTask | null }[] = Array.from({ length: this.coreCount() }, () => ({ task: null }));
    for (const t of this.tasks()) {
      if (t.status === 'running' && t.coreIndex !== null) {
        lanes[t.coreIndex] = { task: t };
      }
    }
    return lanes;
  });

  protected readonly elapsedLabel = computed(() => `${(this.elapsedMs() / 1000).toFixed(1)}s`);

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  protected setCoreCount(n: CoreCount): void {
    if (this.isRunning()) return;
    this.coreCount.set(n);
    this.reset();
  }

  protected run(): void {
    if (this.isRunning()) return;
    this.reset();
    this.isRunning.set(true);
    this.assignFreeCores();

    this.timerId = setInterval(() => {
      this.elapsedMs.update((v) => v + TICK_MS);

      this.tasks.update((list) =>
        list.map((t) => {
          if (t.status !== 'running') return t;
          const progressMs = t.progressMs + TICK_MS;
          if (progressMs >= t.durationMs) {
            return { ...t, progressMs: t.durationMs, status: 'done', coreIndex: null };
          }
          return { ...t, progressMs };
        }),
      );

      this.assignFreeCores();
      this.peakConcurrent.update((peak) => Math.max(peak, this.activeTasks().length));

      if (this.tasks().every((t) => t.status === 'done')) {
        this.isRunning.set(false);
        this.clearTimer();
      }
    }, TICK_MS);
  }

  protected reset(): void {
    this.clearTimer();
    this.isRunning.set(false);
    this.elapsedMs.set(0);
    this.peakConcurrent.set(0);
    this.tasks.set(this.buildTasks(this.coreCount()));
  }

  private assignFreeCores(): void {
    this.tasks.update((list) => {
      const cores = this.coreCount();
      const occupied = new Set(list.filter((t) => t.status === 'running').map((t) => t.coreIndex));
      const freeCores: number[] = [];
      for (let i = 0; i < cores; i++) {
        if (!occupied.has(i)) freeCores.push(i);
      }
      if (freeCores.length === 0) return list;

      let cursor = 0;
      return list.map((t) => {
        if (t.status === 'queued' && cursor < freeCores.length) {
          const coreIndex = freeCores[cursor];
          cursor++;
          return { ...t, status: 'running' as const, coreIndex };
        }
        return t;
      });
    });
  }

  private buildTasks(coreCount: number): RunningTask[] {
    const count = Math.max(coreCount, 4);
    return ALL_TASKS.slice(0, count).map((t) => ({
      ...t,
      progressMs: 0,
      coreIndex: null,
      status: 'queued' as const,
    }));
  }
}
