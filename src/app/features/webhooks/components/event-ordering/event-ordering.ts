import { Component, OnDestroy, signal } from '@angular/core';

interface OrderedEvent { label: string; sentAt: number; arriveDelay: number; }

@Component({
  selector: 'app-event-ordering',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-ordering">
      <div class="container">
        <p class="lab-index mono">11 — ORDER IS NOT GUARANTEED</p>
        <h2 class="lab-title">Sent in order does not mean arrives in order</h2>
        <p class="lab-lede">
          Events A, B, and C are sent in that order, a moment apart. Independent network paths and retries mean
          they can still arrive out of order. Run it and watch the arrival column.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">SEND A, B, C IN ORDER</button>
          </div>

          <div class="order-cols">
            <div class="order-col">
              <p class="col-heading mono">SENT (in order)</p>
              @for (e of sentLog(); track e) { <div class="order-chip mono">{{ e }}</div> }
            </div>
            <div class="order-col">
              <p class="col-heading mono">ARRIVED (actual order)</p>
              @for (e of arrivedLog(); track $index) { <div class="order-chip mono" [class.is-out-of-order]="isOutOfOrder($index)">{{ e }}</div> }
            </div>
          </div>

          <div class="strategies">
            <p class="body-label mono">STRATEGIES TO HANDLE THIS</p>
            <ul class="strategy-list">
              <li>Sequence number per stream — process only if it's the next expected number.</li>
              <li>Partition/entity key — order is only meaningful within the same entity, not globally.</li>
              <li>Per-entity ordering — buffer and reorder events scoped to one resource id.</li>
              <li>Version number on the resource — apply an update only if its version is newer than what you have stored.</li>
            </ul>
          </div>
          <p class="lab-note">Timestamps alone don't guarantee ordering — clock skew, retries, and queueing can all make a later timestamp arrive first. A monotonic sequence or version number is what actually protects you.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .order-cols { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .col-heading { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 10px; }
    .order-chip { font-size: 0.8125rem; padding: 8px 12px; margin-bottom: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
    .order-chip.is-out-of-order { border-color: var(--retry); color: var(--retry); }
    .strategies { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 10px; }
    .strategy-list { display: flex; flex-direction: column; gap: 8px; }
    .strategy-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; padding-left: 16px; position: relative; }
    .strategy-list li::before { content: '—'; position: absolute; left: 0; color: var(--text-faint); }
  `,
})
export class EventOrdering implements OnDestroy {
  protected readonly sentLog = signal<string[]>([]);
  protected readonly arrivedLog = signal<string[]>([]);
  protected readonly running = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  private readonly EVENTS: OrderedEvent[] = [
    { label: 'A — item added', sentAt: 0, arriveDelay: 900 },
    { label: 'B — item updated', sentAt: 300, arriveDelay: 200 },
    { label: 'C — item removed', sentAt: 600, arriveDelay: 500 },
  ];

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }

  protected isOutOfOrder(index: number): boolean {
    const arrived = this.arrivedLog();
    if (index === 0) return false;
    // Simplified: flag if a "later" letter arrived before an "earlier" one already logged in sent order.
    const order = ['A — item added', 'B — item updated', 'C — item removed'];
    const prevIdx = order.indexOf(arrived[index - 1]);
    const curIdx = order.indexOf(arrived[index]);
    return curIdx < prevIdx;
  }

  protected run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.sentLog.set([]);
    this.arrivedLog.set([]);

    this.EVENTS.forEach((e) => {
      this.timers.push(setTimeout(() => this.sentLog.update((l) => [...l, e.label]), e.sentAt));
      this.timers.push(setTimeout(() => this.arrivedLog.update((l) => [...l, e.label]), e.sentAt + e.arriveDelay));
    });

    this.timers.push(setTimeout(() => this.running.set(false), 1600));
  }
}
