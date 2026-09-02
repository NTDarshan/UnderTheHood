import { Component, OnDestroy, computed, signal } from '@angular/core';

const TICK_MS = 300;
const DB_LATENCY_TICKS = 5;
const RUN_DURATION_TICKS = 30;
const MAX_TOKENS_DISPLAY = 24;

interface PendingIo {
  id: number;
  remaining: number;
}

@Component({
  selector: 'app-blocking-vs-nonblocking',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="blocking-vs-nonblocking">
      <div class="container">
        <p class="lab-index">15 — BLOCKING VS. NON-BLOCKING I/O</p>
        <h2 class="lab-title">Same database, same latency, wildly different throughput.</h2>
        <p class="lab-lede">
          Both systems below have exactly one worker and face identical simulated database latency. Watch what a
          single worker can and cannot do while a call is in flight.
        </p>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">Run</button>
          <span class="mono bn-tick-readout">tick {{ tick() }} / {{ runDuration }}</span>
        </div>

        <div class="bn-columns">
          <div class="lab-panel bn-col">
            <p class="node-label mono">BLOCKING I/O</p>
            <p class="bn-flow mono">Request &rarr; DB call &rarr; WAIT</p>

            <div class="bn-worker" [class.is-occupied]="blockingWorker().busy">
              <p class="bn-worker-label mono">WORKER</p>
              @if (blockingWorker().busy) {
                <span class="pill pill-no">OCCUPIED</span>
                <p class="bn-worker-sub mono">serving req #{{ blockingWorker().reqId }}</p>
              } @else {
                <span class="pill pill-yes">FREE</span>
              }
            </div>

            <p class="node-label bn-queue-label mono">QUEUE</p>
            <div class="bn-token-row" aria-live="polite">
              @for (r of blockingQueueSlots(); track r) {
                <span class="bn-token bn-token-queue"></span>
              }
              @empty {
                <span class="cvl-empty mono">empty</span>
              }
            </div>
            <p class="node-value mono">{{ blockingQueue().length }} waiting</p>

            <div class="stat-row bn-stat-row">
              <div class="stat">
                <span class="stat-label mono">SERVED</span>
                <span class="stat-value mono">{{ blockingServed() }}</span>
              </div>
              <div class="stat">
                <span class="stat-label mono">QUEUE PEAK</span>
                <span class="stat-value mono stat-crit">{{ blockingQueuePeak() }}</span>
              </div>
            </div>
          </div>

          <div class="lab-panel bn-col">
            <p class="node-label mono">NON-BLOCKING I/O</p>
            <p class="bn-flow mono">Request &rarr; start I/O &rarr; worker free &rarr; resume on completion</p>

            <div class="bn-worker" [class.is-occupied]="nonBlockingWorker().busy">
              <p class="bn-worker-label mono">WORKER</p>
              @if (nonBlockingWorker().busy) {
                <span class="pill pill-no">BUSY</span>
                <p class="bn-worker-sub mono">{{ nonBlockingWorker().action }} req #{{ nonBlockingWorker().reqId }}</p>
              } @else {
                <span class="pill pill-yes">FREE</span>
              }
            </div>

            <p class="node-label bn-queue-label mono">IN-FLIGHT I/O ({{ pendingIo().length }})</p>
            <div class="bn-token-row" aria-live="polite">
              @for (p of pendingIoSlots(); track p) {
                <span class="bn-token bn-token-io"></span>
              }
              @empty {
                <span class="cvl-empty mono">none</span>
              }
            </div>

            <p class="node-label bn-queue-label mono">QUEUE</p>
            <p class="node-value mono">{{ nonBlockingQueue().length }} waiting</p>

            <div class="stat-row bn-stat-row">
              <div class="stat">
                <span class="stat-label mono">SERVED</span>
                <span class="stat-value mono">{{ nonBlockingServed() }}</span>
              </div>
              <div class="stat">
                <span class="stat-label mono">QUEUE PEAK</span>
                <span class="stat-value mono">{{ nonBlockingQueuePeak() }}</span>
              </div>
            </div>
          </div>
        </div>

        @if (hasFinished()) {
          <p class="lab-note">
            Over the same {{ runDuration }} ticks with the same {{ dbLatencyTicks }}-tick simulated DB latency,
            blocking I/O served <strong>{{ blockingServed() }}</strong> requests while non-blocking I/O served
            <strong>{{ nonBlockingServed() }}</strong> — because the non-blocking worker is only ever occupied for a
            single tick per request, leaving it free to start the next request while earlier ones are still waiting
            on the database.
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .bn-tick-readout { color: var(--text-muted); font-size: 0.8125rem; margin-left: 4px; }

    .bn-columns { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 800px) { .bn-columns { grid-template-columns: 1fr 1fr; } }
    .bn-col { padding: 18px; }

    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .node-value { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }
    .bn-queue-label { margin-top: 18px; }

    .bn-flow { margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); }

    .bn-worker {
      margin-top: 16px;
      padding: 16px;
      text-align: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .bn-worker.is-occupied { border-color: var(--blocked); box-shadow: 0 0 12px rgba(255, 93, 93, 0.25); }
    .bn-worker-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 8px; }
    .bn-worker-sub { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }

    .bn-token-row { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px; min-height: 18px; }
    .bn-token { width: 9px; height: 9px; border-radius: 2px; }
    .bn-token-queue { background: var(--blocked); }
    .bn-token-io { background: var(--c-queue); }
    .cvl-empty { color: var(--text-faint); font-size: 0.75rem; }

    .stat-row.bn-stat-row { margin-top: 18px; grid-template-columns: repeat(2, 1fr); }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.0625rem; color: var(--running); }
    .stat-value.stat-crit { color: var(--blocked); }
  `,
})
export class BlockingVsNonblocking implements OnDestroy {
  protected readonly runDuration = RUN_DURATION_TICKS;
  protected readonly dbLatencyTicks = DB_LATENCY_TICKS;

  protected readonly isRunning = signal(false);
  protected readonly tick = signal(0);
  protected readonly hasFinished = signal(false);

  protected readonly blockingWorker = signal<{ busy: boolean; reqId: number | null; remaining: number }>({
    busy: false,
    reqId: null,
    remaining: 0,
  });
  protected readonly blockingQueue = signal<number[]>([]);
  protected readonly blockingServed = signal(0);
  protected readonly blockingQueuePeak = signal(0);

  protected readonly nonBlockingWorker = signal<{ busy: boolean; reqId: number | null; action: string }>({
    busy: false,
    reqId: null,
    action: '',
  });
  protected readonly nonBlockingQueue = signal<number[]>([]);
  protected readonly pendingIo = signal<PendingIo[]>([]);
  protected readonly nonBlockingServed = signal(0);
  protected readonly nonBlockingQueuePeak = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private reqIdSeq = 0;

  protected readonly blockingQueueSlots = computed(() => {
    const n = Math.min(this.blockingQueue().length, MAX_TOKENS_DISPLAY);
    return Array.from({ length: n }, (_, i) => i);
  });

  protected readonly pendingIoSlots = computed(() => {
    const n = Math.min(this.pendingIo().length, MAX_TOKENS_DISPLAY);
    return Array.from({ length: n }, (_, i) => i);
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected run(): void {
    if (this.isRunning()) return;
    this.resetState();
    this.isRunning.set(true);

    this.timer = setInterval(() => this.tickForward(), TICK_MS);
  }

  private resetState(): void {
    this.tick.set(0);
    this.hasFinished.set(false);
    this.reqIdSeq = 0;

    this.blockingWorker.set({ busy: false, reqId: null, remaining: 0 });
    this.blockingQueue.set([]);
    this.blockingServed.set(0);
    this.blockingQueuePeak.set(0);

    this.nonBlockingWorker.set({ busy: false, reqId: null, action: '' });
    this.nonBlockingQueue.set([]);
    this.pendingIo.set([]);
    this.nonBlockingServed.set(0);
    this.nonBlockingQueuePeak.set(0);
  }

  private tickForward(): void {
    const t = this.tick() + 1;
    this.tick.set(t);

    const newReqId = this.reqIdSeq++;

    // ---- blocking side ----
    let bQueue = [...this.blockingQueue(), newReqId];
    let bWorker = this.blockingWorker();

    if (bWorker.busy) {
      const remaining = bWorker.remaining - 1;
      if (remaining <= 0) {
        this.blockingServed.update((s) => s + 1);
        bWorker = { busy: false, reqId: null, remaining: 0 };
      } else {
        bWorker = { ...bWorker, remaining };
      }
    }
    if (!bWorker.busy && bQueue.length > 0) {
      const [next, ...rest] = bQueue;
      bQueue = rest;
      bWorker = { busy: true, reqId: next, remaining: DB_LATENCY_TICKS };
    }
    this.blockingWorker.set(bWorker);
    this.blockingQueue.set(bQueue);
    this.blockingQueuePeak.update((p) => Math.max(p, bQueue.length));

    // ---- non-blocking side ----
    let nbQueue = [...this.nonBlockingQueue(), newReqId];
    let pending = this.pendingIo().map((p) => ({ ...p, remaining: p.remaining - 1 }));
    let nbWorker = this.nonBlockingWorker();

    if (nbWorker.busy) {
      if (nbWorker.action === 'resuming') {
        this.nonBlockingServed.update((s) => s + 1);
      }
      nbWorker = { busy: false, reqId: null, action: '' };
    }

    const readyIndex = pending.findIndex((p) => p.remaining <= 0);
    if (readyIndex >= 0) {
      const ready = pending[readyIndex];
      pending = pending.filter((_, i) => i !== readyIndex);
      nbWorker = { busy: true, reqId: ready.id, action: 'resuming' };
    } else if (nbQueue.length > 0) {
      const [next, ...rest] = nbQueue;
      nbQueue = rest;
      pending = [...pending, { id: next, remaining: DB_LATENCY_TICKS - 1 }];
      nbWorker = { busy: true, reqId: next, action: 'starting I/O for' };
    }

    this.nonBlockingWorker.set(nbWorker);
    this.nonBlockingQueue.set(nbQueue);
    this.pendingIo.set(pending);
    this.nonBlockingQueuePeak.update((p) => Math.max(p, nbQueue.length));

    if (t >= RUN_DURATION_TICKS) {
      this.isRunning.set(false);
      this.hasFinished.set(true);
      this.clearTimer();
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
