import { Component, OnDestroy, signal } from '@angular/core';

interface LogRow {
  id: string;
  event: string;
  attempt: number;
  outcome: 'ok' | 'fail' | 'duplicate' | 'replay' | 'out-of-order';
  latencyMs: number;
}

const TICK_MS = 250;

@Component({
  selector: 'app-webhook-playground-simulator',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene playground-scene" id="wh-playground">
      <div class="container">
        <p class="lab-index mono">28 — THE WEBHOOK CONTROL ROOM</p>
        <h2 class="lab-title">Webhook playground</h2>
        <p class="lab-lede">
          Every dial from this chapter, in one simulator. Tune the network and failure conditions, then send events
          and watch delivery, retries, duplicates, and security checks play out end to end.
        </p>

        <div class="lab-panel">
          <h3 class="panel-heading">Live metrics</h3>
          <div class="metrics-grid">
            <div class="metric"><span class="metric-value mono">{{ metrics().attempts }}</span><span class="metric-label mono">Attempts</span></div>
            <div class="metric"><span class="metric-value mono">{{ metrics().successes }}</span><span class="metric-label mono">Successes</span></div>
            <div class="metric" [class.is-bad]="metrics().failures > 0"><span class="metric-value mono">{{ metrics().failures }}</span><span class="metric-label mono">Failures</span></div>
            <div class="metric"><span class="metric-value mono">{{ metrics().retries }}</span><span class="metric-label mono">Retries</span></div>
            <div class="metric"><span class="metric-value mono">{{ metrics().duplicates }}</span><span class="metric-label mono">Duplicates</span></div>
            <div class="metric"><span class="metric-value mono">{{ metrics().avgLatency }}ms</span><span class="metric-label mono">Avg latency</span></div>
            <div class="metric"><span class="metric-value mono">{{ metrics().p95Latency }}ms</span><span class="metric-label mono">p95 latency</span></div>
            <div class="metric"><span class="metric-value mono">{{ metrics().processed }}</span><span class="metric-label mono">Events processed</span></div>
          </div>
        </div>

        <div class="lab-panel controls-panel">
          <h3 class="panel-heading">Controls</h3>
          <div class="controls-grid">
            <label class="lab-field"><span>Network latency: {{ networkLatency() }}ms</span>
              <input type="range" min="20" max="2000" step="20" [value]="networkLatency()" (input)="networkLatency.set(+$any($event.target).value)" /></label>
            <label class="lab-field"><span>Receiver latency: {{ receiverLatency() }}ms</span>
              <input type="range" min="20" max="6000" step="20" [value]="receiverLatency()" (input)="receiverLatency.set(+$any($event.target).value)" /></label>
            <label class="lab-field"><span>Failure probability: {{ failureProbability() }}%</span>
              <input type="range" min="0" max="100" step="5" [value]="failureProbability()" (input)="failureProbability.set(+$any($event.target).value)" /></label>
            <label class="lab-field"><span>Timeout: {{ timeoutMs() }}ms</span>
              <input type="range" min="500" max="6000" step="100" [value]="timeoutMs()" (input)="timeoutMs.set(+$any($event.target).value)" /></label>
            <label class="lab-field"><span>Retry count: {{ retryCount() }}</span>
              <input type="range" min="0" max="8" step="1" [value]="retryCount()" (input)="retryCount.set(+$any($event.target).value)" /></label>
          </div>
          <div class="toggle-grid">
            <button type="button" class="lab-btn" [attr.aria-pressed]="duplicateDelivery()" (click)="duplicateDelivery.set(!duplicateDelivery())">Duplicate delivery: {{ duplicateDelivery() ? 'ON' : 'OFF' }}</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="outOfOrder()" (click)="outOfOrder.set(!outOfOrder())">Out-of-order: {{ outOfOrder() ? 'ON' : 'OFF' }}</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="validSignature()" (click)="validSignature.set(!validSignature())">Signature: {{ validSignature() ? 'VALID' : 'INVALID' }}</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="replayAttempt()" (click)="replayAttempt.set(!replayAttempt())">Replay old request: {{ replayAttempt() ? 'ON' : 'OFF' }}</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="asyncMode()" (click)="asyncMode.set(!asyncMode())">Mode: {{ asyncMode() ? 'ASYNC (fast-ack)' : 'SYNC' }}</button>
          </div>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendEvent()">SEND EVENT</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="forceFailure()">FORCE FAILURE</button>
            <button type="button" class="lab-btn" (click)="retryLast()" [disabled]="!lastFailedId()">RETRY</button>
            <button type="button" class="lab-btn" (click)="replayLast()" [disabled]="!lastDeliveredEventId()">REPLAY</button>
            <button type="button" class="lab-btn" (click)="reset()">RESET</button>
          </div>
        </div>

        <div class="rooms-grid">
          <div class="lab-panel room">
            <h3 class="panel-heading small">Producer</h3>
            <p class="room-line mono">{{ producerLine() }}</p>
          </div>
          <div class="lab-panel room">
            <h3 class="panel-heading small">Delivery engine</h3>
            <p class="room-line mono">{{ engineLine() }}</p>
          </div>
          <div class="lab-panel room">
            <h3 class="panel-heading small">Receiver</h3>
            <p class="room-line mono">{{ receiverLine() }}</p>
          </div>
          <div class="lab-panel room security-room">
            <h3 class="panel-heading small">Security</h3>
            <p class="room-line mono">{{ securityLine() }}</p>
          </div>
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">Delivery log</h3>
          <div class="table-wrap">
            <table class="cmp-table mono">
              <thead><tr><th>id</th><th>event</th><th>attempt</th><th>outcome</th><th>latency</th></tr></thead>
              <tbody>
                @for (r of log(); track r.id + r.attempt) {
                  <tr>
                    <td>{{ r.id }}</td><td>{{ r.event }}</td><td>{{ r.attempt }}</td>
                    <td [attr.data-outcome]="r.outcome">{{ r.outcome }}</td><td>{{ r.latencyMs }}ms</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .playground-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .panel-heading { margin: 0 0 16px; font-size: 1.0625rem; color: var(--text); }
    .panel-heading.small { font-size: 0.875rem; margin-bottom: 10px; }

    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .metrics-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (min-width: 1000px) { .metrics-grid { grid-template-columns: repeat(8, 1fr); } }
    .metric { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .metric.is-bad { border-color: color-mix(in srgb, var(--failure) 50%, var(--border)); }
    .metric-value { font-size: 1.125rem; font-weight: 700; color: var(--text); }
    .metric.is-bad .metric-value { color: var(--failure); }
    .metric-label { font-size: 0.625rem; color: var(--text-faint); text-align: center; }

    .controls-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .controls-grid { grid-template-columns: repeat(5, 1fr); } }
    .controls-grid input[type='range'] { accent-color: var(--accent); width: 100%; }
    .toggle-grid { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px; }
    .lab-btn-row { margin-top: 16px; }

    .rooms-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 720px) { .rooms-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1100px) { .rooms-grid { grid-template-columns: repeat(4, 1fr); } }
    .room { margin-top: 0; min-height: 90px; }
    .room-line { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }
    .security-room { border-color: color-mix(in srgb, var(--security) 30%, var(--border)); }

    .table-wrap { overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .cmp-table th, .cmp-table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .cmp-table th { color: var(--text-faint); }
    .cmp-table td { color: var(--text-muted); }
    td[data-outcome='ok'] { color: var(--success); }
    td[data-outcome='fail'] { color: var(--failure); }
    td[data-outcome='duplicate'] { color: var(--retry); }
    td[data-outcome='replay'] { color: var(--security); }
    td[data-outcome='out-of-order'] { color: var(--info); }
  `,
})
export class WebhookPlaygroundSimulator implements OnDestroy {
  protected readonly networkLatency = signal(200);
  protected readonly receiverLatency = signal(150);
  protected readonly failureProbability = signal(10);
  protected readonly timeoutMs = signal(3000);
  protected readonly retryCount = signal(3);
  protected readonly duplicateDelivery = signal(false);
  protected readonly outOfOrder = signal(false);
  protected readonly validSignature = signal(true);
  protected readonly replayAttempt = signal(false);
  protected readonly asyncMode = signal(true);

  protected readonly producerLine = signal('Idle. Click SEND EVENT to fire order.created.');
  protected readonly engineLine = signal('Idle.');
  protected readonly receiverLine = signal('Listening for POST /webhooks.');
  protected readonly securityLine = signal('No request in flight.');

  protected readonly log = signal<LogRow[]>([]);
  protected readonly metrics = signal({
    attempts: 0, successes: 0, failures: 0, retries: 0, duplicates: 0, avgLatency: 0, p95Latency: 0, processed: 0,
  });

  protected readonly lastFailedId = signal<string | null>(null);
  protected readonly lastDeliveredEventId = signal<string | null>(null);

  private counter = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private latencies: number[] = [];
  private seenEventIds = new Set<string>();

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected sendEvent(): void {
    this.counter++;
    const eventId = `evt_${(1000 + this.counter).toString(16)}`;
    this.runDelivery(eventId, 'order.created', 1, false);

    if (this.duplicateDelivery()) {
      this.after(this.networkLatency() * 2 + 300, () => this.runDelivery(eventId, 'order.created', 1, true));
    }
  }

  protected forceFailure(): void {
    this.counter++;
    const eventId = `evt_${(1000 + this.counter).toString(16)}`;
    this.runDelivery(eventId, 'order.created', 1, false, true);
  }

  protected retryLast(): void {
    const id = this.lastFailedId();
    if (!id) return;
    const row = this.log().find((r) => r.id === id);
    const attempt = (row?.attempt ?? 1) + 1;
    this.runDelivery(id, row?.event ?? 'order.created', attempt, false);
  }

  protected replayLast(): void {
    const eventId = this.lastDeliveredEventId();
    if (!eventId) return;
    this.securityLine.set('Replaying a previously captured, validly-signed request…');
    this.after(300, () => {
      if (this.replayAttempt()) {
        this.pushLog(eventId, 'order.created', 1, 'replay', this.networkLatency());
        this.securityLine.set('Timestamp freshness / event id dedupe rejects the replay — signature was valid, but the request is stale.');
      } else {
        this.securityLine.set('Replay protection is represented by the "Replay old request" toggle above — enable it to see the defense engage.');
      }
    });
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.log.set([]);
    this.latencies = [];
    this.seenEventIds.clear();
    this.lastFailedId.set(null);
    this.lastDeliveredEventId.set(null);
    this.metrics.set({ attempts: 0, successes: 0, failures: 0, retries: 0, duplicates: 0, avgLatency: 0, p95Latency: 0, processed: 0 });
    this.producerLine.set('Idle. Click SEND EVENT to fire order.created.');
    this.engineLine.set('Idle.');
    this.receiverLine.set('Listening for POST /webhooks.');
    this.securityLine.set('No request in flight.');
  }

  private runDelivery(eventId: string, eventType: string, attempt: number, isDuplicateFlag: boolean, forceFail = false): void {
    this.producerLine.set(`${eventType} event created (${eventId}), attempt ${attempt}…`);
    this.engineLine.set('Signing payload and dispatching…');
    this.securityLine.set(this.validSignature() ? 'Signing with correct shared secret.' : 'Signing with an INVALID secret — receiver verification will fail.');

    const netDelay = this.networkLatency();
    const total = netDelay + Math.min(this.receiverLatency(), this.timeoutMs());
    const isTimeout = this.receiverLatency() > this.timeoutMs();
    const randomFail = !forceFail && Math.random() * 100 < this.failureProbability();
    const badSig = !this.validSignature();

    this.after(netDelay, () => {
      this.receiverLine.set('Request received — verifying signature…');
      if (badSig) {
        this.securityLine.set('Signature mismatch — request rejected before any processing.');
      }
    });

    this.after(total, () => {
      const failed = forceFail || isTimeout || randomFail || badSig;
      const isDuplicate = isDuplicateFlag && this.seenEventIds.has(eventId);
      const isOutOfOrderNow = this.outOfOrder() && Math.random() < 0.3;

      let outcome: LogRow['outcome'] = 'ok';
      if (badSig) outcome = 'fail';
      else if (isDuplicate) outcome = 'duplicate';
      else if (isOutOfOrderNow) outcome = 'out-of-order';
      else if (failed) outcome = 'fail';

      this.pushLog(eventId, eventType, attempt, outcome, total);
      this.seenEventIds.add(eventId);

      this.metrics.update((m) => ({ ...m, attempts: m.attempts + 1 }));

      if (outcome === 'ok') {
        this.receiverLine.set(this.asyncMode() ? '200 OK returned fast — processing continues in the background.' : '200 OK returned after full synchronous processing.');
        this.engineLine.set('Delivery marked DELIVERED.');
        this.securityLine.set('Signature verified, event id is new — accepted.');
        this.metrics.update((m) => ({ ...m, successes: m.successes + 1, processed: m.processed + 1 }));
        this.lastDeliveredEventId.set(eventId);
        this.lastFailedId.set(null);
      } else if (outcome === 'duplicate') {
        this.receiverLine.set('Idempotency store recognizes this event id — returns the prior safe result, no side effect repeated.');
        this.metrics.update((m) => ({ ...m, duplicates: m.duplicates + 1 }));
      } else if (outcome === 'out-of-order') {
        this.receiverLine.set('Event arrived out of sequence — receiver defers or reorders based on its sequence/version check.');
        this.metrics.update((m) => ({ ...m, successes: m.successes + 1, processed: m.processed + 1 }));
      } else {
        const reason = badSig ? 'invalid signature' : isTimeout ? 'timeout' : 'error response';
        this.receiverLine.set(`Delivery failed (${reason}).`);
        this.engineLine.set(attempt <= this.retryCount() ? `Scheduling retry ${attempt + 1} of ${this.retryCount() + 1} with backoff…` : 'Retry budget exhausted — delivery marked EXHAUSTED.');
        this.metrics.update((m) => ({ ...m, failures: m.failures + 1, retries: attempt <= this.retryCount() ? m.retries + 1 : m.retries }));
        this.lastFailedId.set(eventId);
      }

      this.latencies.push(total);
      this.recomputeLatencyMetrics();
    });
  }

  private pushLog(id: string, event: string, attempt: number, outcome: LogRow['outcome'], latencyMs: number): void {
    this.log.update((list) => [{ id, event, attempt, outcome, latencyMs }, ...list].slice(0, 10));
  }

  private recomputeLatencyMetrics(): void {
    if (this.latencies.length === 0) return;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    this.metrics.update((m) => ({ ...m, avgLatency: avg, p95Latency: p95 }));
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
