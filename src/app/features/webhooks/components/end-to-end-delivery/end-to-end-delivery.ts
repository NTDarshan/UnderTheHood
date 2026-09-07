import { Component, OnDestroy, signal } from '@angular/core';

interface Stage {
  key: string;
  label: string;
  detail: string;
}

const STAGES: Stage[] = [
  { key: 'event', label: 'Event', detail: 'Something happens in the provider\'s system — an order is created, a payment clears.' },
  { key: 'created', label: 'Delivery Created', detail: 'The provider records that this event needs to be delivered to your registered endpoint.' },
  { key: 'queue', label: 'Queue', detail: 'The delivery waits its turn in the provider\'s outbound dispatch queue.' },
  { key: 'request', label: 'HTTP Request', detail: 'The provider signs the payload and builds the outbound HTTP POST.' },
  { key: 'internet', label: 'Internet', detail: 'The request travels across the public network to your endpoint\'s URL.' },
  { key: 'endpoint', label: 'Endpoint', detail: 'Your server receives the request on the route you registered.' },
  { key: 'ack', label: 'Ack', detail: 'Your endpoint returns a 2xx response quickly, telling the provider the delivery succeeded.' },
  { key: 'processing', label: 'Processing', detail: 'The actual business work — updating a record, sending an email — happens, ideally after the ack.' },
  { key: 'final', label: 'Final State', detail: 'The delivery is marked delivered on the provider\'s side, and the event is durably reflected on yours.' },
];

@Component({
  selector: 'app-end-to-end-delivery',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-e2e-delivery">
      <div class="container">
        <p class="lab-index mono">04 — ONE DELIVERY, START TO FINISH</p>
        <h2 class="lab-title">The whole lifecycle of a single webhook delivery</h2>
        <p class="lab-lede">
          Click "Send" and watch the packet move stage by stage. Click any stage directly to read what happens
          there, whether or not the animation is running.
        </p>

        <div class="lab-panel">
          <div class="stage-track">
            @for (s of stages; track s.key; let i = $index) {
              <button type="button" class="stage-node mono"
                      [class.is-active]="active() === i"
                      [class.is-done]="active() !== null && i < active()!"
                      [attr.aria-pressed]="selected() === i"
                      (click)="selectStage(i)">
                <span class="stage-dot"></span>
                {{ s.label }}
              </button>
              @if (i < stages.length - 1) { <span class="stage-arrow" [class.is-live]="active() === i">&rarr;</span> }
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="play()" [disabled]="isPlaying()">SEND AN EVENT</button>
          </div>

          <div class="stage-detail">
            <p class="body-label mono">{{ stages[detailIndex()].label.toUpperCase() }}</p>
            <p class="body-text">{{ stages[detailIndex()].detail }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .stage-track { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; row-gap: 14px; }
    .stage-node {
      all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.6875rem; padding: 8px 12px; border-radius: 999px; border: 1px solid var(--border-strong);
      color: var(--text-muted); background: var(--surface); transition: all 0.25s ease;
    }
    .stage-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-faint); transition: background 0.25s ease; }
    .stage-node.is-done { border-color: var(--success); color: var(--success); }
    .stage-node.is-done .stage-dot { background: var(--success); }
    .stage-node.is-active { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 15%, var(--surface)); }
    .stage-node.is-active .stage-dot { background: var(--pending); box-shadow: 0 0 8px var(--glow-accent); }
    .stage-arrow { color: var(--text-faint); font-size: 0.75rem; }
    .stage-arrow.is-live { color: var(--pending); }
    .lab-btn-row { margin-top: 22px; }
    .stage-detail { margin-top: 18px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 8px; }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class EndToEndDelivery implements OnDestroy {
  protected readonly stages = STAGES;
  protected readonly active = signal<number | null>(null);
  protected readonly selected = signal<number | null>(null);
  protected readonly isPlaying = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }

  protected detailIndex(): number {
    return this.selected() ?? this.active() ?? 0;
  }

  protected selectStage(i: number): void {
    this.selected.set(i);
  }

  protected play(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    this.selected.set(null);
    this.active.set(0);
    STAGES.forEach((_, i) => {
      if (i === 0) return;
      this.timers.push(setTimeout(() => this.active.set(i), i * 550));
    });
    this.timers.push(setTimeout(() => {
      this.isPlaying.set(false);
      this.active.set(null);
    }, STAGES.length * 550 + 700));
  }
}
