import { Component, OnDestroy, computed, signal } from '@angular/core';

const PRODUCE_INTERVAL_MS = 1500;
const WORKER_TICK_MS = 140;
const PROGRESS_PER_TICK = 3.4;
const MAX_QUEUE_DISPLAY = 9;

interface QueueMessage {
  id: number;
  label: string;
}

interface ActiveJob {
  id: number;
  label: string;
  progress: number;
}

@Component({
  selector: 'app-queue-draining',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-queue-draining">
      <div class="container">
        <p class="lab-index">16 — QUEUE DRAINING</p>
        <h2 class="lab-title">Draining a message queue</h2>
        <p class="lab-lede">
          A worker pulling from a message queue does not need to finish "the queue" before it can shut down safely
          — it only needs to stop pulling <em>new</em> messages and finish whatever it already pulled off. Anything
          still sitting in the queue is durable: it stays there for another worker to pick up.
        </p>

        <div class="lab-panel gs-scene qd-scene">
          <p class="lab-node">MESSAGE QUEUE &rarr; WORKER</p>

          <div class="qd-pipeline">
            <div class="qd-queue" [class.is-piling]="isShuttingDown()">
              <div class="qd-box-head">
                <span class="mono">MESSAGE QUEUE</span>
                <span class="pill" [class.pill-conditional]="isShuttingDown()" [class.pill-yes]="!isShuttingDown()">
                  {{ isShuttingDown() ? 'ACCUMULATING' : 'FLOWING' }}
                </span>
              </div>
              <div class="qd-slots" role="list" [attr.aria-label]="queue().length + ' messages waiting in queue'">
                @for (m of displayedQueue(); track m.id) {
                  <div class="qd-msg" role="listitem">{{ m.label }}</div>
                }
                @if (overflowCount() > 0) {
                  <div class="qd-msg qd-msg-more">+{{ overflowCount() }} more</div>
                }
                @if (queue().length === 0) {
                  <div class="qd-empty mono">empty</div>
                }
              </div>
              <span class="qd-count mono">{{ queue().length }} durable message(s) waiting</span>
            </div>

            <div class="qd-arrow-col">
              <span class="lab-flow-arrow" aria-hidden="true">&rarr;</span>
              <span class="pill" [class.pill-no]="isShuttingDown()" [class.pill-yes]="!isShuttingDown()">
                {{ isShuttingDown() ? 'NOT CONSUMING NEW' : 'CONSUMING' }}
              </span>
            </div>

            <div class="qd-worker" [class.is-draining]="isShuttingDown()" [class.is-stopped]="workerStopped()">
              <div class="qd-box-head">
                <span class="mono">WORKER</span>
                @if (workerStopped()) {
                  <span class="pill pill-no">STOPPED</span>
                } @else if (isShuttingDown()) {
                  <span class="pill pill-conditional">FINISHING CURRENT JOB</span>
                } @else {
                  <span class="pill pill-yes">RUNNING</span>
                }
              </div>

              @if (currentJob(); as job) {
                <div class="qd-job">
                  <span class="mono qd-job-label">processing {{ job.label }}</span>
                  <div class="qd-bar-track" role="img" [attr.aria-label]="'Progress ' + job.progress.toFixed(0) + ' percent'">
                    <div class="qd-bar-fill" [style.width.%]="job.progress"></div>
                  </div>
                </div>
              } @else {
                <p class="qd-idle mono">{{ workerStopped() ? 'no active job — shut down' : 'idle, waiting for next message' }}</p>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" [disabled]="isShuttingDown()" (click)="triggerShutdown()">
              Trigger shutdown
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="qd-legend">
            <div class="qd-legend-item">
              <span class="qd-dot" [class.is-off]="isShuttingDown()"></span>
              <span>Stop consuming <strong>new</strong> work — the worker never pulls another message once shutdown starts.</span>
            </div>
            <div class="qd-legend-item">
              <span class="qd-dot is-safe"></span>
              <span>Finish the <strong>one</strong> message already being processed — that work is safe to complete.</span>
            </div>
            <div class="qd-legend-item">
              <span class="qd-dot is-durable"></span>
              <span>Leave everything else in the <strong>durable</strong> queue for another worker — nothing is lost.</span>
            </div>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">PROCESSED</span>
              <span class="stat-value mono">{{ processedCount() }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">STILL QUEUED</span>
              <span class="stat-value mono">{{ queue().length }}</span>
            </div>
          </div>
        </div>

        <p class="lab-note">
          The queue itself does not care whether this worker lives or dies — a message broker like SQS, RabbitMQ,
          or Kafka keeps unconsumed messages durably stored regardless. The only job a graceful shutdown has here is
          to stop the worker from grabbing new messages and to let the one message already "checked out" finish
          cleanly, instead of being killed mid-processing and left in an ambiguous state.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .qd-pipeline {
      margin-top: 22px;
      display: flex;
      align-items: stretch;
      gap: 14px;
      flex-wrap: wrap;
    }

    .qd-queue, .qd-worker {
      flex: 1;
      min-width: 220px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .qd-queue.is-piling { border-color: var(--queue); background: color-mix(in srgb, var(--queue) 8%, var(--surface)); }
    .qd-worker.is-draining { border-color: var(--draining); }
    .qd-worker.is-stopped { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 8%, var(--surface)); }

    .qd-box-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }

    .qd-arrow-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 90px;
    }

    .qd-slots {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 34px;
      align-content: flex-start;
    }
    .qd-msg {
      padding: 5px 8px;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      color: var(--text);
      background: color-mix(in srgb, var(--queue) 18%, var(--surface-raised));
      border: 1px solid color-mix(in srgb, var(--queue) 45%, var(--border));
      border-radius: 4px;
    }
    .qd-msg-more { color: var(--text-faint); background: var(--surface-raised); border-color: var(--border); }
    .qd-empty { color: var(--text-faint); font-size: 0.75rem; }
    .qd-count { display: block; margin-top: 10px; color: var(--text-muted); font-size: 0.75rem; }

    .qd-job { display: flex; flex-direction: column; gap: 8px; }
    .qd-job-label { color: var(--text-muted); font-size: 0.75rem; }
    .qd-bar-track {
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .qd-bar-fill { height: 100%; background: var(--running); transition: width 0.14s linear; }
    .qd-worker.is-draining .qd-bar-fill { background: var(--draining); }
    .qd-idle { color: var(--text-faint); font-size: 0.75rem; }

    .qd-legend { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .qd-legend-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.8125rem; color: var(--text-muted); }
    .qd-dot { flex: none; margin-top: 4px; width: 9px; height: 9px; border-radius: 50%; background: var(--stopped); transition: background 0.2s ease; }
    .qd-dot.is-off { background: var(--idle); }
    .qd-dot.is-safe { background: var(--running); }
    .qd-dot.is-durable { background: var(--queue); }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--text); }

    @media (max-width: 640px) {
      .qd-arrow-col { flex-direction: row; }
    }

    @media (prefers-reduced-motion: reduce) {
      .qd-bar-fill { transition: none; }
    }
  `,
})
export class QueueDraining implements OnDestroy {
  protected readonly queue = signal<QueueMessage[]>([]);
  protected readonly currentJob = signal<ActiveJob | null>(null);
  protected readonly isShuttingDown = signal(false);
  protected readonly workerStopped = signal(false);
  protected readonly processedCount = signal(0);

  private msgIdCounter = 0;
  private producerInterval: ReturnType<typeof setInterval> | null = null;
  private workerInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly displayedQueue = computed(() => this.queue().slice(0, MAX_QUEUE_DISPLAY));
  protected readonly overflowCount = computed(() => Math.max(0, this.queue().length - MAX_QUEUE_DISPLAY));

  constructor() {
    this.start();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private start(): void {
    this.clearTimers();
    this.producerInterval = setInterval(() => this.produce(), PRODUCE_INTERVAL_MS);
    this.workerInterval = setInterval(() => this.tick(), WORKER_TICK_MS);
    // Seed the queue so the scene isn't empty on load.
    this.produce();
    this.produce();
    this.pullNextIfIdle();
  }

  private produce(): void {
    this.msgIdCounter += 1;
    const msg: QueueMessage = { id: this.msgIdCounter, label: `MSG-${this.msgIdCounter}` };
    this.queue.update((q) => [...q, msg]);
  }

  private tick(): void {
    const job = this.currentJob();
    if (job) {
      const next = Math.min(100, job.progress + PROGRESS_PER_TICK);
      if (next >= 100) {
        this.currentJob.set(null);
        this.processedCount.update((v) => v + 1);
        if (this.isShuttingDown()) {
          // Finished the one in-flight job — do not pull another. Worker stops here.
          this.workerStopped.set(true);
        } else {
          this.pullNextIfIdle();
        }
      } else {
        this.currentJob.set({ ...job, progress: next });
      }
    } else {
      this.pullNextIfIdle();
    }
  }

  private pullNextIfIdle(): void {
    if (this.isShuttingDown() || this.currentJob()) return;
    const [next, ...rest] = this.queue();
    if (!next) return;
    this.queue.set(rest);
    this.currentJob.set({ id: next.id, label: next.label, progress: 0 });
  }

  protected triggerShutdown(): void {
    if (this.isShuttingDown()) return;
    this.isShuttingDown.set(true);
    if (this.producerInterval) {
      clearInterval(this.producerInterval);
      this.producerInterval = null;
    }
    // No current job at all — worker was already idle, so it stops immediately.
    if (!this.currentJob()) {
      this.workerStopped.set(true);
    }
  }

  protected reset(): void {
    this.clearTimers();
    this.queue.set([]);
    this.currentJob.set(null);
    this.isShuttingDown.set(false);
    this.workerStopped.set(false);
    this.processedCount.set(0);
    this.msgIdCounter = 0;
    this.start();
  }

  private clearTimers(): void {
    if (this.producerInterval) {
      clearInterval(this.producerInterval);
      this.producerInterval = null;
    }
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }
}
