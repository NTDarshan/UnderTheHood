import { Component, computed, signal } from '@angular/core';

interface Message {
  id: number;
  label: string;
}

const CAPACITY = 5;

@Component({
  selector: 'app-channels-message-passing',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="channels-message-passing">
      <div class="container">
        <p class="lab-index">26 — CHANNELS &amp; MESSAGE PASSING</p>
        <h2 class="lab-title">Channels &amp; message passing</h2>
        <p class="lab-lede">
          Instead of two threads reaching into the same memory, a producer and a consumer can communicate through a
          channel: a bounded queue that hands messages off one at a time. Nobody reads or writes the other side's
          memory directly.
        </p>

        <div class="lab-panel">
          <div class="pipeline">
            <div class="node-box">
              <p class="lab-node">PRODUCER</p>
              <p class="node-sub mono">creates messages</p>
            </div>

            <span class="lab-flow-arrow pipeline-arrow">→</span>

            <div class="channel-box" [class.is-full]="isFull()">
              <p class="lab-node">CHANNEL <span class="tok-dim">(bounded queue, capacity {{ capacity }})</span></p>
              <div class="slots" role="list" aria-label="Channel slots">
                @for (slot of slots(); track $index) {
                  <div class="slot" role="listitem" [class.is-filled]="slot !== null">
                    @if (slot) {
                      <span class="slot-chip mono">{{ slot.label }}</span>
                    }
                  </div>
                }
              </div>
              <p class="fill-note mono">{{ queue().length }} / {{ capacity }} filled{{ isFull() ? ' — channel at capacity' : '' }}</p>
            </div>

            <span class="lab-flow-arrow pipeline-arrow">→</span>

            <div class="node-box">
              <p class="lab-node">CONSUMER</p>
              <p class="node-sub mono">processes messages</p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isFull()" (click)="produce()">
              Produce
            </button>
            <button type="button" class="lab-btn" [disabled]="isEmpty()" (click)="consume()">
              Consume
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <p class="live-status mono" aria-live="polite">{{ statusText() }}</p>

          @if (lastConsumed(); as m) {
            <div class="consumed-panel">
              <p class="lab-node">Last processed by consumer</p>
              <p class="mono consumed-line">{{ m.label }} — ownership transferred, no longer shared with the producer.</p>
            </div>
          }

          <div class="lab-btn-row-stats mono">
            <span class="pill" [class.pill-yes]="producedCount() > 0">produced: {{ producedCount() }}</span>
            <span class="pill" [class.pill-yes]="consumedCount() > 0">consumed: {{ consumedCount() }}</span>
            <span class="pill" [class.pill-conditional]="queue().length > 0">in channel: {{ queue().length }}</span>
          </div>
        </div>

        <p class="lab-note">
          Instead of sharing mutable state directly — the way the earlier race-condition examples did — concurrent
          components can communicate safely by passing messages through a channel. Ownership of the data transfers
          with the message rather than being shared, so there is no shared memory left to race over.
        </p>
        <p class="lab-note lab-note-warn">
          A bounded channel pushes back: once it's full, the producer must wait (or the send must block/fail) until
          the consumer frees a slot — this is what keeps a fast producer from overwhelming a slow consumer.
        </p>
      </div>
    </section>
  `,
  styles: `
    .pipeline { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
    .pipeline-arrow { font-size: 1.25rem; }

    .node-box {
      flex: 0 0 auto; padding: 16px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md);
      background: var(--surface); text-align: center; min-width: 140px;
    }
    .node-sub { margin-top: 6px; font-size: 0.6875rem; color: var(--text-faint); }

    .channel-box {
      flex: 1 1 260px; padding: 16px 18px; border: 1px solid var(--c-queue); border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--c-queue) 6%, var(--surface)); transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .channel-box.is-full { border-color: var(--danger); box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 35%, transparent); }

    .slots { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
    .slot {
      width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
      border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .slot.is-filled { border-style: solid; border-color: var(--c-task); background: color-mix(in srgb, var(--c-task) 16%, var(--surface)); }
    .slot-chip { font-size: 0.6875rem; font-weight: 600; color: var(--text); }

    .fill-note { margin-top: 10px; font-size: 0.75rem; color: var(--text-muted); }

    .live-status { margin-top: 18px; min-height: 20px; font-size: 0.8125rem; color: var(--accent-2); }

    .consumed-panel {
      margin-top: 16px; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .consumed-line { margin-top: 6px; font-size: 0.8125rem; color: var(--text-muted); }

    .lab-btn-row-stats { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px; }
  `,
})
export class ChannelsMessagePassing {
  protected readonly capacity = CAPACITY;

  private nextId = 1;
  protected readonly queue = signal<Message[]>([]);
  protected readonly producedCount = signal(0);
  protected readonly consumedCount = signal(0);
  protected readonly lastConsumed = signal<Message | null>(null);
  protected readonly lastAction = signal<string>('Ready. Produce a message to fill the channel.');

  protected readonly isFull = computed(() => this.queue().length >= this.capacity);
  protected readonly isEmpty = computed(() => this.queue().length === 0);

  protected readonly slots = computed<(Message | null)[]>(() => {
    const q = this.queue();
    const out: (Message | null)[] = [];
    for (let i = 0; i < this.capacity; i++) {
      out.push(q[i] ?? null);
    }
    return out;
  });

  protected readonly statusText = computed(() => this.lastAction());

  protected produce(): void {
    if (this.isFull()) return;
    const msg: Message = { id: this.nextId++, label: `msg-${this.nextId - 1}` };
    this.queue.update((q) => [...q, msg]);
    this.producedCount.update((n) => n + 1);
    this.lastAction.set(`Producer sent ${msg.label} into the channel.`);
  }

  protected consume(): void {
    const q = this.queue();
    if (q.length === 0) return;
    const [msg, ...rest] = q;
    this.queue.set(rest);
    this.consumedCount.update((n) => n + 1);
    this.lastConsumed.set(msg);
    this.lastAction.set(`Consumer received and processed ${msg.label}.`);
  }

  protected reset(): void {
    this.queue.set([]);
    this.producedCount.set(0);
    this.consumedCount.set(0);
    this.lastConsumed.set(null);
    this.lastAction.set('Ready. Produce a message to fill the channel.');
  }
}
