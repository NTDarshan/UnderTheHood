import { Component, OnDestroy, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Tab = 'fanout' | 'backpressure';

@Component({
  selector: 'app-fanout-backpressure',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="fanout">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 013 — FAN-OUT & BACKPRESSURE</p>
        <h2 class="lab-title">One event in, many sends out — and not every recipient keeps up.</h2>

        <div class="tab-row">
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'fanout'" (click)="tab.set('fanout')">Fan-out</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'backpressure'" (click)="tab.set('backpressure')">Slow client / backpressure</button>
        </div>

        @if (tab() === 'fanout') {
          <div class="lab-panel">
            <app-explain-simply>
              Fan-out is like one person shouting news in a room — the shout is free, but repeating it in 10,000
              separate private phone calls definitely isn't.
            </app-explain-simply>
            <div class="recipient-row" role="group" aria-label="Recipient count">
              @for (n of recipientOptions; track n) {
                <button type="button" class="lab-btn" [class.is-active]="recipients() === n" (click)="recipients.set(n)">{{ n.toLocaleString() }}</button>
              }
            </div>
            <button type="button" class="lab-btn lab-btn-primary" (click)="publish()" [disabled]="fanning()">
              {{ fanning() ? 'Fanning out…' : 'Publish: "Breaking news"' }}
            </button>
            <div class="fanout-diagram" role="img" aria-label="One event fanning out to many recipients">
              <div class="event-node" [class.is-pulsing]="fanning()">EVENT</div>
              <div class="recipient-grid">
                @for (r of visibleRecipientDots(); track $index) {
                  <span class="r-dot" [class.is-hit]="fanning()" [style.animation-delay.ms]="$index * 4"></span>
                }
                @if (overflowCount() > 0) {
                  <span class="r-more mono">+{{ overflowCount().toLocaleString() }} more</span>
                }
              </div>
            </div>
            <p class="fanout-cost mono">Outbound sends for this one event: {{ recipients().toLocaleString() }}</p>
            <p class="fanout-note">
              Fan-out cost grows with recipient count, not with how "big" the event is. A single small event to
              10,000 subscribers is 10,000 separate writes the server has to perform — this is one of the
              biggest real costs in a real-time system.
            </p>
          </div>
        }

        @if (tab() === 'backpressure') {
          <div class="lab-panel">
            <app-explain-simply>
              Imagine a fast talker and a slow note-taker on a call — if the talker never pauses, the notes pile
              up faster than they can be written down, and eventually something has to give.
            </app-explain-simply>
            <p class="lab-note-inline">
              The server produces events. <strong>Client A</strong> consumes quickly. <strong>Client B</strong> is
              slow — its buffer grows every time the producer outruns it.
            </p>
            <div class="bp-controls">
              <div class="lab-field">
                <label for="producer-rate">Producer rate (events/sec)</label>
                <input id="producer-rate" type="range" min="1" max="10" [value]="producerRate()" (input)="producerRate.set(+$any($event.target).value)" />
                <span class="mono">{{ producerRate() }}/s</span>
              </div>
              <div class="lab-field">
                <label for="consumer-rate">Client B consume rate (events/sec)</label>
                <input id="consumer-rate" type="range" min="1" max="10" [value]="consumerRate()" (input)="consumerRate.set(+$any($event.target).value)" />
                <span class="mono">{{ consumerRate() }}/s</span>
              </div>
              <button type="button" class="lab-btn lab-btn-primary" (click)="toggleRun()">{{ running() ? 'Stop' : 'Run' }}</button>
              <button type="button" class="lab-btn" (click)="resetBp()">Reset</button>
            </div>
            <div class="bp-clients">
              <div class="bp-client">
                <p class="bp-label mono">CLIENT A · fast consumer</p>
                <div class="queue-track"><div class="queue-fill queue-fill-good" [style.width.%]="0"></div></div>
                <p class="queue-count mono">queue: 0</p>
              </div>
              <div class="bp-client">
                <p class="bp-label mono">CLIENT B · slow consumer</p>
                <div class="queue-track"><div class="queue-fill queue-fill-bad" [style.width.%]="queuePercent()"></div></div>
                <p class="queue-count mono">queue: {{ queueLength() }} @if (queueLength() > 40) { <span class="queue-warn">— growing unbounded</span> }</p>
              </div>
            </div>
            <p class="bp-note">Options once a slow consumer is detected:</p>
            <ul class="bp-list">
              <li><strong>Buffer growth</strong> — accept the memory cost, hope the client catches up (risks OOM under enough slow clients)</li>
              <li><strong>Drop messages</strong> — send only the latest state, sacrificing some updates the client will never see</li>
              <li><strong>Disconnect the slow consumer</strong> — free the resource, force a reconnect (and probably a resync)</li>
              <li><strong>Rate limiting</strong> — cap how fast the server sends per connection, independent of producer speed</li>
              <li><strong>Application-level strategy</strong> — e.g. coalesce many updates into "just send the latest" instead of every intermediate one</li>
            </ul>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
    .recipient-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }

    .fanout-diagram { display: flex; align-items: center; gap: 24px; margin-top: 24px; }
    .event-node { flex-shrink: 0; padding: 16px 20px; border: 1px solid var(--accent); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--accent); }
    .event-node.is-pulsing { animation: event-pulse 0.5s ease infinite; }
    @keyframes event-pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--glow-accent); } 50% { box-shadow: 0 0 0 8px transparent; } }
    .recipient-grid { display: flex; flex-wrap: wrap; gap: 4px; max-width: 100%; align-items: center; }
    .r-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border-strong); flex-shrink: 0; }
    .r-dot.is-hit { animation: r-hit 0.4s ease forwards; }
    @keyframes r-hit { 0% { background: var(--border-strong); transform: scale(1); } 40% { background: var(--accent-2); transform: scale(1.4); } 100% { background: var(--accent-2-dim); transform: scale(1); } }
    .r-more { font-size: 0.6875rem; color: var(--text-faint); margin-left: 6px; }

    .fanout-cost { margin-top: 18px; color: var(--accent-2); font-size: 0.875rem; }
    .fanout-note { margin-top: 10px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .lab-note-inline { max-width: 660px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
    .lab-note-inline strong { color: var(--text); }

    .bp-controls { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; margin-top: 24px; }

    .bp-clients { display: grid; gap: 16px; grid-template-columns: 1fr; margin-top: 24px; }
    @media (min-width: 640px) { .bp-clients { grid-template-columns: 1fr 1fr; } }
    .bp-client { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
    .bp-label { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 10px; }
    .queue-track { height: 12px; border-radius: 999px; background: var(--surface-elevated); overflow: hidden; }
    .queue-fill { height: 100%; transition: width 0.3s ease; }
    .queue-fill-good { background: var(--accent-2); }
    .queue-fill-bad { background: var(--danger); }
    .queue-count { margin-top: 8px; font-size: 0.75rem; color: var(--text-faint); }
    .queue-warn { color: var(--danger); }

    .bp-note { margin-top: 20px; font-size: 0.875rem; color: var(--text-faint); }
    .bp-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; max-width: 660px; }
    .bp-list li { position: relative; padding-left: 16px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .bp-list li::before { content: '—'; position: absolute; left: 0; color: var(--text-faint); }
    .bp-list strong { color: var(--text); }
  `,
})
export class FanoutBackpressure implements OnDestroy {
  protected readonly tab = signal<Tab>('fanout');

  protected readonly recipientOptions = [1, 10, 100, 1000, 10000];
  protected readonly recipients = signal(100);
  protected readonly fanning = signal(false);
  protected readonly visibleRecipientDots = computed(() => new Array(Math.min(this.recipients(), 300)).fill(0));
  protected readonly overflowCount = computed(() => Math.max(0, this.recipients() - 300));

  publish(): void {
    this.fanning.set(true);
    setTimeout(() => this.fanning.set(false), 700);
  }

  protected readonly producerRate = signal(6);
  protected readonly consumerRate = signal(2);
  protected readonly running = signal(false);
  protected readonly queueLength = signal(0);
  protected readonly queuePercent = computed(() => Math.min(100, this.queueLength()));
  private bpTimer: ReturnType<typeof setInterval> | null = null;

  toggleRun(): void {
    if (this.running()) {
      this.running.set(false);
      if (this.bpTimer) clearInterval(this.bpTimer);
      this.bpTimer = null;
      return;
    }
    this.running.set(true);
    this.bpTimer = setInterval(() => {
      const net = this.producerRate() - this.consumerRate();
      this.queueLength.update((q) => Math.max(0, q + net));
    }, 400);
  }

  resetBp(): void {
    if (this.bpTimer) clearInterval(this.bpTimer);
    this.bpTimer = null;
    this.running.set(false);
    this.queueLength.set(0);
  }

  ngOnDestroy(): void {
    if (this.bpTimer) clearInterval(this.bpTimer);
  }
}
