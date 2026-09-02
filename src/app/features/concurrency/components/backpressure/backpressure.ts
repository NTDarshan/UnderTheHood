import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

const CAPACITY = 30;
const TICK_MS = 150;
const DT = TICK_MS / 1000;
const MAX_DROP_TOKENS = 14;

type Mode = 'throttle' | 'drop';

interface DropToken {
  id: number;
}

@Component({
  selector: 'app-backpressure',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="backpressure">
      <div class="container">
        <p class="lab-index">27 — BACKPRESSURE</p>
        <h2 class="lab-title">Backpressure</h2>
        <p class="lab-lede">
          A producer that runs faster than its consumer will eventually fill any queue between them. Backpressure
          is the mechanism that pushes back on the producer once that happens — instead of letting the queue grow
          without limit.
        </p>

        <div class="lab-panel">
          <p class="lab-node">PRODUCER &rarr; BOUNDED QUEUE ({{ capacity }}) &rarr; CONSUMER</p>

          <div class="pipeline">
            <div class="node producer-node" [class.is-throttled]="isFull() && mode() === 'throttle'">
              <span class="node-label mono">PRODUCER</span>
              <span class="node-value mono">{{ effectiveProducerRate().toFixed(1) }}/s</span>
              @if (isFull() && mode() === 'throttle') {
                <span class="pill pill-conditional">THROTTLED</span>
              } @else {
                <span class="pill pill-yes">RUNNING</span>
              }
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            <div class="queue-node" [class.is-warn]="isNearFull() && !isFull()" [class.is-full]="isFull()">
              <span class="node-label mono">QUEUE</span>
              <div class="queue-track" role="img" [attr.aria-label]="'Queue fill level ' + queueLevel().toFixed(0) + ' of ' + capacity">
                <div class="queue-fill" [style.height.%]="fillPct()"></div>
                <div class="queue-tokens">
                  @for (t of queueSlots(); track t) {
                    <div class="queue-token"></div>
                  }
                </div>
              </div>
              <span class="node-value mono">{{ queueLevel().toFixed(0) }} / {{ capacity }}</span>
              @if (isFull()) {
                <span class="pill pill-no">FULL</span>
              } @else if (isNearFull()) {
                <span class="pill pill-conditional">FILLING</span>
              } @else {
                <span class="pill pill-yes">OK</span>
              }
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            <div class="node consumer-node">
              <span class="node-label mono">CONSUMER</span>
              <span class="node-value mono">{{ consumerRate() }}/s</span>
              <span class="pill pill-yes">DRAINING</span>
            </div>
          </div>

          @if (mode() === 'drop' && dropTokens().length > 0) {
            <div class="drop-row mono" aria-live="polite">
              dropped: @for (d of dropTokens(); track d.id) { <span class="drop-dot"></span> }
            </div>
          }

          <div class="controls-grid">
            <div class="lab-field">
              <label for="producer-rate">Producer rate (items/sec)</label>
              <input
                id="producer-rate"
                type="range"
                min="1"
                max="40"
                step="1"
                [value]="producerRate()"
                (input)="setProducerRate($event)"
              />
              <span class="mono field-readout">{{ producerRate() }} items/sec requested</span>
            </div>
            <div class="lab-field">
              <label for="consumer-rate">Consumer rate (items/sec)</label>
              <input
                id="consumer-rate"
                type="range"
                min="1"
                max="40"
                step="1"
                [value]="consumerRate()"
                (input)="setConsumerRate($event)"
              />
              <span class="mono field-readout">{{ consumerRate() }} items/sec</span>
            </div>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Backpressure strategy when the queue is full">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'throttle'" [attr.aria-pressed]="mode() === 'throttle'" (click)="setMode('throttle')">
              Producer slows down / waits
            </button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'drop'" [attr.aria-pressed]="mode() === 'drop'" (click)="setMode('drop')">
              Drop items when full
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">PRODUCED</span>
              <span class="stat-value mono">{{ produced().toFixed(0) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">CONSUMED</span>
              <span class="stat-value mono">{{ consumed().toFixed(0) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">DROPPED</span>
              <span class="stat-value mono" [class.stat-crit]="droppedCount() > 0">{{ droppedCount().toFixed(0) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">FILL LEVEL</span>
              <span class="stat-value mono" [class.stat-warn]="isNearFull() && !isFull()" [class.stat-crit]="isFull()">
                {{ fillPct().toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Once the queue is full, {{ mode() === 'throttle' ? 'the producer is forced to slow to the rate the queue
          can actually absorb — its effective throughput drops to match the consumer instead of overflowing.' :
          'new items are dropped instead of overflowing the queue — the consumer never sees them, and they are
          gone for good.' }}
          The same idea shows up everywhere two things run at different speeds: TCP flow control, reactive
          streams, message brokers like Kafka and RabbitMQ, and any API that returns HTTP 429 when you send it
          more than it can handle. Backpressure is what stops a fast producer from silently overwhelming a
          slower consumer.
        </p>
      </div>
    </section>
  `,
  styles: `
    .pipeline { margin-top: 22px; display: flex; align-items: stretch; gap: 10px; flex-wrap: wrap; }
    .node, .queue-node {
      flex: 1;
      min-width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .producer-node { border-color: var(--c-task); transition: border-color 0.2s ease, background 0.2s ease; }
    .producer-node.is-throttled { border-color: var(--waiting); background: color-mix(in srgb, var(--waiting) 10%, var(--surface)); }
    .consumer-node { border-color: var(--c-cpu); }

    .queue-node { border-color: var(--c-queue); transition: border-color 0.2s ease, background 0.2s ease; }
    .queue-node.is-warn { border-color: var(--waiting); }
    .queue-node.is-full { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 10%, var(--surface)); }

    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .node-value { font-size: 1.0625rem; color: var(--text); }

    .queue-track {
      position: relative;
      width: 100%;
      height: 90px;
      border: 1px dashed var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--surface-raised);
    }
    .queue-fill {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      background: color-mix(in srgb, var(--c-queue) 55%, transparent);
      transition: height 0.15s linear;
    }
    .queue-tokens {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-wrap: wrap-reverse;
      align-content: flex-start;
      gap: 3px;
      padding: 4px;
      box-sizing: border-box;
    }
    .queue-token { width: 8px; height: 8px; border-radius: 2px; background: var(--c-queue); }

    .drop-row { margin-top: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; color: var(--danger); font-size: 0.75rem; }
    .drop-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blocked); display: inline-block; animation: drop-fade 1.2s ease-out; }
    @keyframes drop-fade { 0% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0.5; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .drop-dot { animation: none; } }

    .controls-grid { margin-top: 22px; display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: 1fr 1fr; } }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .lab-btn-row { margin-top: 18px; }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .stat-row { grid-template-columns: repeat(4, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--running); transition: color 0.2s ease; }
    .stat-value.stat-warn { color: var(--waiting); }
    .stat-value.stat-crit { color: var(--blocked); }
  `,
})
export class Backpressure implements OnInit, OnDestroy {
  protected readonly capacity = CAPACITY;

  protected readonly producerRate = signal(14);
  protected readonly consumerRate = signal(8);
  protected readonly mode = signal<Mode>('throttle');

  protected readonly queueLevel = signal(0);
  protected readonly produced = signal(0);
  protected readonly consumed = signal(0);
  protected readonly dropTokens = signal<DropToken[]>([]);
  private dropIdCounter = 0;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly isFull = computed(() => this.queueLevel() >= CAPACITY);
  protected readonly isNearFull = computed(() => this.queueLevel() >= CAPACITY * 0.7);
  protected readonly fillPct = computed(() => Math.min(100, (this.queueLevel() / CAPACITY) * 100));

  protected readonly effectiveProducerRate = computed(() => {
    if (this.mode() === 'throttle' && this.isFull()) {
      return Math.min(this.producerRate(), this.consumerRate());
    }
    return this.producerRate();
  });

  protected readonly droppedCount = signal(0);

  protected readonly queueSlots = computed(() => {
    const n = Math.round(this.queueLevel());
    return Array.from({ length: n }, (_, i) => i);
  });

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private tick(): void {
    if (this.mode() === 'throttle') {
      const inflow = this.effectiveProducerRate() * DT;
      const consumedThisTick = Math.min(this.queueLevel(), this.consumerRate() * DT);
      const next = Math.max(0, Math.min(CAPACITY, this.queueLevel() + inflow - consumedThisTick));
      this.produced.update((v) => v + inflow);
      this.consumed.update((v) => v + consumedThisTick);
      this.queueLevel.set(next);
    } else {
      const inflow = this.producerRate() * DT;
      const consumedThisTick = Math.min(this.queueLevel(), this.consumerRate() * DT);
      let next = this.queueLevel() + inflow - consumedThisTick;
      this.produced.update((v) => v + inflow);
      this.consumed.update((v) => v + consumedThisTick);
      if (next > CAPACITY) {
        const overflow = next - CAPACITY;
        next = CAPACITY;
        this.droppedCount.update((v) => v + overflow);
        this.pushDropToken();
      }
      this.queueLevel.set(Math.max(0, next));
    }
  }

  private pushDropToken(): void {
    this.dropIdCounter += 1;
    const id = this.dropIdCounter;
    this.dropTokens.update((list) => [...list.slice(-(MAX_DROP_TOKENS - 1)), { id }]);
  }

  protected setProducerRate(ev: Event): void {
    this.producerRate.set(+(ev.target as HTMLInputElement).value);
  }

  protected setConsumerRate(ev: Event): void {
    this.consumerRate.set(+(ev.target as HTMLInputElement).value);
  }

  protected setMode(m: Mode): void {
    this.mode.set(m);
  }

  protected reset(): void {
    this.queueLevel.set(0);
    this.produced.set(0);
    this.consumed.set(0);
    this.dropTokens.set([]);
    this.droppedCount.set(0);
  }
}
