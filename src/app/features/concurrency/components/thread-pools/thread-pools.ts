import { Component, OnDestroy, computed, signal } from '@angular/core';

type PoolSize = 2 | 4 | 8 | 16;
type WorkerState = 'idle' | 'busy';

interface WorkItem {
  id: number;
  enqueuedAt: number;
}

interface WorkerSlot {
  id: number;
  state: WorkerState;
  itemId: number | null;
  remainingTicks: number;
}

const TICK_MS = 260;
const BURST_SIZE = 24;
const MAX_QUEUE_DISPLAY = 40;

let itemSeq = 0;

@Component({
  selector: 'app-thread-pools',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="thread-pools">
      <div class="container">
        <p class="lab-index">12 — THREAD POOLS</p>
        <h2 class="lab-title">Reuse a fixed set of workers instead of spawning one thread per task.</h2>
        <p class="lab-lede">
          Creating an OS thread is not free — allocating a stack, registering it with the scheduler, and later
          tearing it down all cost real time. A thread pool amortizes that cost: a fixed set of worker threads
          pull work items off a shared queue for the life of the process.
        </p>

        <div class="lab-panel">
          <div class="lab-field">
            <label id="pool-size-label">Pool size</label>
            <div class="lab-btn-row" role="group" aria-labelledby="pool-size-label">
              @for (size of poolSizes; track size) {
                <button
                  type="button"
                  class="lab-btn"
                  [class.is-active]="poolSize() === size"
                  [attr.aria-pressed]="poolSize() === size"
                  (click)="setPoolSize(size)"
                >
                  {{ size }}
                </button>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="generateWork()">Generate work</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="tp-pipeline">
            <div class="tp-stage">
              <p class="node-label mono">INCOMING WORK</p>
              <p class="node-value mono">{{ totalEnqueued() }} items sent</p>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            <div class="tp-stage tp-queue" [class.is-hot]="queue().length > 6" aria-live="polite">
              <p class="node-label mono">QUEUE</p>
              <div class="tp-token-row">
                @for (item of queueSlots(); track item) {
                  <span class="tp-token"></span>
                }
              </div>
              <p class="node-value mono">{{ queue().length }} waiting</p>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            <div class="tp-stage">
              <p class="node-label mono">THREAD POOL</p>
              <p class="node-value mono">{{ busyCount() }} / {{ poolSize() }} busy</p>
            </div>
          </div>

          <div class="tp-worker-grid" [style.gridTemplateColumns]="workerGridColumns()">
            @for (w of workers(); track w.id) {
              <div class="tp-worker" [class.is-busy]="w.state === 'busy'">
                <p class="tp-worker-label mono">WORKER {{ w.id }}</p>
                @if (w.state === 'busy') {
                  <span class="pill pill-yes">BUSY</span>
                  <p class="tp-worker-item mono">item #{{ w.itemId }}</p>
                } @else {
                  <span class="pill pill-no">IDLE</span>
                }
              </div>
            }
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">COMPLETED</span>
              <span class="stat-value mono">{{ completedCount() }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">AVG WAIT TIME</span>
              <span class="stat-value mono" [class.stat-warn]="avgWaitMs() > 800">{{ avgWaitMs().toFixed(0) }} ms</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">CONTENTION OVERHEAD</span>
              <span class="stat-value mono" [class.stat-crit]="contentionOverheadMs() > 400">{{ contentionOverheadMs().toFixed(0) }} ms</span>
            </div>
          </div>

          @if (poolSize() <= 2 && queue().length > 6) {
            <p class="lab-note lab-note-warn">
              Too few threads: the queue backs up faster than {{ poolSize() }} worker(s) can drain it, and average
              wait time climbs steadily under load.
            </p>
          }
          @if (poolSize() === 16) {
            <p class="lab-note lab-note-warn">
              Too many threads: with only a handful of CPU cores backing them, most of these 16 workers spend time
              being context-switched onto and off the CPU rather than doing useful work — overhead rises while
              throughput barely improves. This is the diminishing-returns side of thread pools.
            </p>
          }
        </div>

        <p class="lab-note">
          Runtimes reuse a pool of worker threads instead of creating a brand-new OS thread per tiny task, because
          thread creation and excessive thread counts both have real costs.
        </p>
      </div>
    </section>
  `,
  styles: `
    .tp-pipeline { margin-top: 22px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .tp-stage {
      flex: 1;
      min-width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .tp-queue { border-color: var(--c-queue); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .tp-queue.is-hot { box-shadow: 0 0 14px rgba(251, 191, 36, 0.25); }

    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .node-value { font-size: 0.875rem; color: var(--text); }

    .tp-token-row { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; min-height: 22px; max-width: 160px; }
    .tp-token { width: 8px; height: 8px; border-radius: 2px; background: var(--c-queue); }

    .tp-worker-grid { margin-top: 20px; display: grid; gap: 10px; }

    .tp-worker {
      padding: 14px 10px;
      text-align: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .tp-worker.is-busy { border-color: var(--c-thread); box-shadow: 0 0 12px rgba(167, 139, 250, 0.25); }
    .tp-worker-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 8px; }
    .tp-worker-item { margin-top: 6px; font-size: 0.6875rem; color: var(--c-thread); }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 640px) { .stat-row { grid-template-columns: repeat(3, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--running); transition: color 0.2s ease; }
    .stat-value.stat-warn { color: var(--waiting); }
    .stat-value.stat-crit { color: var(--blocked); }
  `,
})
export class ThreadPools implements OnDestroy {
  protected readonly poolSizes: PoolSize[] = [2, 4, 8, 16];

  protected readonly poolSize = signal<PoolSize>(4);
  protected readonly workers = signal<WorkerSlot[]>(this.makeWorkers(4));
  protected readonly queue = signal<WorkItem[]>([]);
  protected readonly totalEnqueued = signal(0);
  protected readonly completedCount = signal(0);
  protected readonly waitSamples = signal<number[]>([]);
  protected readonly contentionOverheadMs = signal(0);

  private tickCount = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly busyCount = computed(() => this.workers().filter((w) => w.state === 'busy').length);

  protected readonly avgWaitMs = computed(() => {
    const samples = this.waitSamples();
    if (samples.length === 0) return 0;
    const avgTicks = samples.reduce((a, b) => a + b, 0) / samples.length;
    return avgTicks * TICK_MS;
  });

  protected readonly queueSlots = computed(() => {
    const n = Math.min(this.queue().length, MAX_QUEUE_DISPLAY);
    return Array.from({ length: n }, (_, i) => i);
  });

  protected readonly workerGridColumns = computed(() => {
    const n = this.poolSize();
    const cols = n <= 4 ? n : n <= 8 ? 4 : 8;
    return `repeat(${cols}, 1fr)`;
  });

  constructor() {
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  protected setPoolSize(size: PoolSize): void {
    this.poolSize.set(size);
    this.reset();
  }

  protected generateWork(): void {
    const now = this.tickCount;
    const items: WorkItem[] = Array.from({ length: BURST_SIZE }, () => ({
      id: itemSeq++,
      enqueuedAt: now,
    }));
    this.queue.update((q) => [...q, ...items]);
    this.totalEnqueued.update((t) => t + items.length);
  }

  protected reset(): void {
    this.workers.set(this.makeWorkers(this.poolSize()));
    this.queue.set([]);
    this.totalEnqueued.set(0);
    this.completedCount.set(0);
    this.waitSamples.set([]);
    this.contentionOverheadMs.set(0);
    this.tickCount = 0;
  }

  private makeWorkers(size: number): WorkerSlot[] {
    return Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      state: 'idle' as WorkerState,
      itemId: null,
      remainingTicks: 0,
    }));
  }

  private tick(): void {
    this.tickCount++;

    let workers = this.workers();
    let queue = this.queue();
    let newlyCompleted = 0;
    const newWaitSamples: number[] = [];

    workers = workers.map((w) => {
      if (w.state !== 'busy') return w;
      const remaining = w.remainingTicks - 1;
      if (remaining <= 0) {
        newlyCompleted++;
        return { ...w, state: 'idle' as WorkerState, itemId: null, remainingTicks: 0 };
      }
      return { ...w, remainingTicks: remaining };
    });

    workers = workers.map((w) => {
      if (w.state === 'busy' || queue.length === 0) return w;
      const [next, ...rest] = queue;
      queue = rest;
      newWaitSamples.push(this.tickCount - next.enqueuedAt);
      return { ...w, state: 'busy' as WorkerState, itemId: next.id, remainingTicks: 2 + Math.floor(Math.random() * 3) };
    });

    if (newlyCompleted > 0) this.completedCount.update((c) => c + newlyCompleted);
    if (newWaitSamples.length > 0) {
      this.waitSamples.update((s) => [...s.slice(-40), ...newWaitSamples]);
    }

    const size = this.poolSize();
    const busy = workers.filter((w) => w.state === 'busy').length;
    if (size > 4 && busy > 0) {
      const overheadStep = (size - 4) * busy * 0.35;
      this.contentionOverheadMs.update((o) => o + overheadStep);
    }

    this.workers.set(workers);
    this.queue.set(queue);
  }
}
