import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

const MAX_QUEUE_DISPLAY = 60; // visual + numeric ceiling used for the memory-pressure gauge
const BOUNDED_QUEUE_LIMIT = 20; // cap applied when "Queue limits" mitigation is active
const FAILURE_THRESHOLD = 50; // queue size at which the system is presented as failing

interface RejectedToken {
  id: number;
}

@Component({
  selector: 'app-queueing-backpressure',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="queueing-backpressure">
      <div class="container">
        <p class="lab-index">06 — QUEUEING &amp; BACKPRESSURE</p>
        <h2 class="lab-title">When arrivals outpace processing, something has to give.</h2>
        <p class="lab-lede">
          Requests that can't be handled immediately go into a queue. If arrivals keep outpacing the workers
          draining that queue, it grows without bound — until the system runs out of memory or falls over.
          Backpressure is how a well-behaved system says "no" before that happens.
        </p>

        <div class="lab-panel">
          <p class="lab-node">CLIENT &rarr; QUEUE &rarr; WORKERS</p>

          <div class="pipeline">
            <div class="node client-node">
              <span class="node-label mono">INCOMING</span>
              <span class="node-value mono">{{ arrivalRate() }}/s</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            <div class="queue-node" [class.is-crit]="isFailing()" [class.is-warn]="isNearFailure() && !isFailing()">
              <span class="node-label mono">QUEUE</span>
              <div class="queue-stack">
                @for (slot of queueSlots(); track slot) {
                  <div class="queue-token"></div>
                }
                @for (tok of rejectedTokens(); track tok.id) {
                  <div class="rejected-token"></div>
                }
              </div>
              <span class="node-value mono">{{ queueSize().toFixed(0) }}{{ mitigationCap() ? ' / ' + mitigationCap() : '' }}</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            <div class="node worker-node">
              <span class="node-label mono">WORKERS</span>
              <span class="node-value mono">{{ processingRate() }}/s</span>
            </div>
          </div>

          <div class="controls-grid">
            <div class="lab-field">
              <label for="arrival-slider">Arrival rate (req/sec)</label>
              <input id="arrival-slider" type="range" min="10" max="200" step="5" [value]="arrivalRate()" (input)="setArrival($event)" />
              <span class="mono field-readout">{{ arrivalRate() }} req/sec</span>
            </div>
            <div class="lab-field">
              <label for="processing-slider">Processing rate (req/sec)</label>
              <input id="processing-slider" type="range" min="10" max="200" step="5" [value]="processingRate()" (input)="setProcessing($event)" />
              <span class="mono field-readout">{{ processingRate() }} req/sec</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="reset()">Reset simulation</button>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">QUEUE SIZE</span>
              <span class="stat-value mono" [class.stat-warn]="isNearFailure() && !isFailing()" [class.stat-crit]="isFailing()">
                {{ queueSize().toFixed(0) }}
              </span>
            </div>
            <div class="stat">
              <span class="stat-label mono">EST. WAIT TIME</span>
              <span class="stat-value mono" [class.stat-warn]="isNearFailure() && !isFailing()" [class.stat-crit]="isFailing()">
                {{ estimatedWaitMs().toFixed(0) }} ms
              </span>
            </div>
            <div class="stat">
              <span class="stat-label mono">MEMORY PRESSURE</span>
              <span class="stat-value mono" [class.stat-warn]="isNearFailure() && !isFailing()" [class.stat-crit]="isFailing()">
                {{ memoryPressurePct().toFixed(0) }}%
              </span>
            </div>
            <div class="stat">
              <span class="stat-label mono">REJECTED</span>
              <span class="stat-value mono">{{ rejectedCount() }}</span>
            </div>
          </div>

          @if (isFailing()) {
            <p class="lab-note-warn lab-note fail-note">
              <strong>System may fail:</strong> the queue is growing without bound. Memory pressure is climbing
              toward the point where the process runs out of memory or starts timing out everything in flight —
              including requests that arrived long before the overload started.
            </p>
          }
        </div>

        <div class="lab-panel">
          <p class="lab-node">BACKPRESSURE — TELLING THE CLIENT "NOT NOW"</p>
          <p class="part-lede">
            Backpressure means the system communicates that it cannot safely accept unlimited work, instead of
            silently accumulating an ever-growing queue. Toggle a mitigation to see the queue capped instead of
            growing forever.
          </p>

          <div class="lab-btn-row" role="group" aria-label="Backpressure mitigations">
            <button type="button" class="lab-btn" [class.is-active]="rateLimiting()" (click)="rateLimiting.set(!rateLimiting())">
              Rate limiting
            </button>
            <button type="button" class="lab-btn" [class.is-active]="queueLimitOn()" (click)="queueLimitOn.set(!queueLimitOn())">
              Queue limits
            </button>
            <button type="button" class="lab-btn" [class.is-active]="loadShedding()" (click)="loadShedding.set(!loadShedding())">
              Load shedding
            </button>
          </div>

          <ul class="mitigation-list">
            <li><strong class="mono">Rate limiting</strong> — reject requests above a fixed rate before they ever reach the queue, so admitted work stays within what workers can actually handle.</li>
            <li><strong class="mono">Queue limits</strong> — bound the queue's size; once it's full, new requests are rejected immediately instead of waiting behind an ever-growing backlog.</li>
            <li><strong class="mono">Load shedding</strong> — under overload, deliberately drop a portion of incoming requests (often the least important ones) to protect the requests still being served.</li>
          </ul>

          <p class="lab-note">
            With any mitigation active here, the queue is capped at {{ boundedLimit }} — anything past that is
            shown bouncing off as a rejected request instead of joining an unbounded backlog.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .pipeline { margin-top: 22px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .node, .queue-node { flex: 1; min-width: 120px; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; }
    .client-node { border-color: var(--c-client); }
    .worker-node { border-color: var(--c-compute); }
    .queue-node { border-color: var(--c-queue); transition: border-color 0.2s ease, background 0.2s ease; }
    .queue-node.is-warn { border-color: var(--warn); background: color-mix(in srgb, var(--warn) 8%, var(--surface)); }
    .queue-node.is-crit { border-color: var(--crit); background: color-mix(in srgb, var(--crit) 10%, var(--surface)); }

    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .node-value { font-size: 1.0625rem; color: var(--text); }

    .queue-stack { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; min-height: 60px; max-width: 160px; align-content: flex-start; }
    .queue-token { width: 8px; height: 8px; border-radius: 2px; background: var(--c-queue); }
    .rejected-token { width: 8px; height: 8px; border-radius: 50%; background: var(--crit); animation: bounce-off 0.5s ease-out; }

    @keyframes bounce-off {
      0% { transform: translateY(-8px) scale(0.6); opacity: 0.4; }
      50% { transform: translateY(4px) scale(1.1); opacity: 1; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .rejected-token { animation: none; }
    }

    .controls-grid { margin-top: 22px; display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: 1fr 1fr; } }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .stat-row { grid-template-columns: repeat(4, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--ok); transition: color 0.2s ease; }
    .stat-value.stat-warn { color: var(--warn); }
    .stat-value.stat-crit { color: var(--crit); }

    .fail-note { border-left-color: var(--crit); }
    .fail-note strong { color: var(--crit); }

    .part-lede { margin-top: 14px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; max-width: 640px; }

    .mitigation-list { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; max-width: 640px; }
    .mitigation-list strong { color: var(--text); }
  `,
})
export class QueueingBackpressure implements OnInit, OnDestroy {
  protected readonly boundedLimit = BOUNDED_QUEUE_LIMIT;

  protected readonly arrivalRate = signal(50);
  protected readonly processingRate = signal(60);

  protected readonly queueSize = signal(0);
  protected readonly rejectedTokens = signal<RejectedToken[]>([]);
  private rejectedIdCounter = 0;

  protected readonly rateLimiting = signal(false);
  protected readonly queueLimitOn = signal(false);
  protected readonly loadShedding = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly mitigationActive = computed(() => this.rateLimiting() || this.queueLimitOn() || this.loadShedding());
  protected readonly mitigationCap = computed(() => (this.mitigationActive() ? BOUNDED_QUEUE_LIMIT : null));

  protected readonly queueSlots = computed(() => {
    const n = Math.min(Math.round(this.queueSize()), MAX_QUEUE_DISPLAY);
    return Array.from({ length: n }, (_, i) => i);
  });

  protected readonly rejectedCount = computed(() => this.rejectedTokens().length);

  protected readonly memoryPressurePct = computed(() => Math.min(100, (this.queueSize() / MAX_QUEUE_DISPLAY) * 100));
  protected readonly estimatedWaitMs = computed(() => (this.queueSize() / Math.max(1, this.processingRate())) * 1000);

  protected readonly isNearFailure = computed(() => this.queueSize() >= FAILURE_THRESHOLD * 0.6);
  protected readonly isFailing = computed(() => this.queueSize() >= FAILURE_THRESHOLD);

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.tick(), 250);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private tick(): void {
    const dt = 0.25;
    const effectiveArrival = this.rateLimiting() ? Math.min(this.arrivalRate(), this.processingRate() * 1.1) : this.arrivalRate();
    const net = (effectiveArrival - this.processingRate()) * dt;
    const cap = this.mitigationActive() ? BOUNDED_QUEUE_LIMIT : Number.POSITIVE_INFINITY;

    const current = this.queueSize();
    let next = current + net;
    next = Math.max(0, next);

    if (next > cap) {
      const overflow = next - cap;
      next = cap;
      if (overflow > 0.05 && (this.queueLimitOn() || this.loadShedding())) {
        this.pushRejected();
      }
    }

    this.queueSize.set(next);
  }

  private pushRejected(): void {
    this.rejectedIdCounter += 1;
    const id = this.rejectedIdCounter;
    this.rejectedTokens.update((list) => [...list.slice(-11), { id }]);
  }

  setArrival(ev: Event): void {
    this.arrivalRate.set(+(ev.target as HTMLInputElement).value);
  }

  setProcessing(ev: Event): void {
    this.processingRate.set(+(ev.target as HTMLInputElement).value);
  }

  reset(): void {
    this.queueSize.set(0);
    this.rejectedTokens.set([]);
  }
}
