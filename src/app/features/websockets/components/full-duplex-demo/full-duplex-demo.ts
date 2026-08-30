import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Dir = 'client' | 'server';
interface WireMsg {
  n: number;
  dir: Dir;
  text: string;
}

const CLIENT_MESSAGES = ['typing…', 'message: "hey, you around?"', 'read receipt sent'];
const SERVER_MESSAGES = ['notification: new follower', 'message delivered ✓', 'presence: user online'];

@Component({
  selector: 'app-full-duplex-demo',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="full-duplex">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 005 — FULL-DUPLEX</p>
        <h2 class="lab-title">Neither side waits for a turn.</h2>
        <p class="lab-lede">
          Fire messages from both sides in any order you like. This is not alternating request/response — it's
          two independent streams sharing one connection.
        </p>

        <app-explain-simply>
          Think of a phone call, not a walkie-talkie with a "press to talk" button. Both people can talk over
          each other if they want to — the line doesn't enforce turns.
        </app-explain-simply>

        <div class="duplex-controls">
          <div class="control-col">
            <p class="control-heading mono">CLIENT</p>
            <button type="button" class="lab-btn" (click)="send('client')">Send next client message</button>
          </div>
          <div class="control-col">
            <p class="control-heading mono">SERVER</p>
            <button type="button" class="lab-btn" (click)="send('server')">Send next server message</button>
          </div>
        </div>

        <div class="duplex-track" role="log" aria-label="Full-duplex message stream">
          <div class="track-lane track-lane-client">
            <p class="lane-label mono">CLIENT →</p>
          </div>
          <div class="track-spine"></div>
          <div class="track-lane track-lane-server">
            <p class="lane-label mono">← SERVER</p>
          </div>
        </div>

        <ol class="duplex-log" aria-label="Message order">
          @if (log().length === 0) {
            <p class="log-empty">No messages yet — try sending from both sides out of order.</p>
          }
          @for (m of log(); track m.n) {
            <li class="log-item" [class]="'dir-' + m.dir">
              <span class="log-n mono">t+{{ m.n }}</span>
              <span class="log-arrow mono">{{ m.dir === 'client' ? '→' : '←' }}</span>
              <span class="log-text">{{ m.dir === 'client' ? 'CLIENT' : 'SERVER' }}: {{ m.text }}</span>
            </li>
          }
        </ol>

        <p class="duplex-note">
          Notice there's no forced alternation — you can send client, client, server, client. Each direction is
          independent because the underlying TCP connection carries traffic both ways simultaneously.
        </p>
      </div>
    </section>
  `,
  styles: `
    .duplex-controls { display: flex; gap: 24px; margin-top: 28px; flex-wrap: wrap; }
    .control-col { display: flex; flex-direction: column; gap: 10px; }
    .control-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); }

    .duplex-track { position: relative; display: flex; flex-direction: column; margin-top: 28px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; gap: 12px; }
    .track-lane { font-size: 0.6875rem; }
    .lane-label { color: var(--text-faint); letter-spacing: 0.06em; }
    .track-spine { height: 1px; background: var(--border-strong); }

    .duplex-log { margin-top: 20px; display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .log-empty { color: var(--text-faint); font-size: 0.875rem; }
    .log-item { display: flex; align-items: baseline; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.8125rem; background: var(--surface); border-left: 2px solid var(--border-strong); animation: log-in 0.3s ease; }
    @keyframes log-in { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
    .log-n { color: var(--text-faint); flex-shrink: 0; width: 44px; }
    .log-arrow { flex-shrink: 0; width: 14px; }
    .dir-client { border-left-color: var(--accent-dim); }
    .dir-client .log-arrow, .dir-client .log-text { color: var(--accent); }
    .dir-server { border-left-color: var(--accent-2-dim); }
    .dir-server .log-arrow, .dir-server .log-text { color: var(--accent-2); }

    .duplex-note { margin-top: 16px; max-width: 640px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }
  `,
})
export class FullDuplexDemo {
  protected readonly log = signal<WireMsg[]>([]);
  private clientIdx = 0;
  private serverIdx = 0;
  private tick = 0;

  send(dir: Dir): void {
    const text = dir === 'client'
      ? CLIENT_MESSAGES[this.clientIdx++ % CLIENT_MESSAGES.length]
      : SERVER_MESSAGES[this.serverIdx++ % SERVER_MESSAGES.length];
    this.tick += 1;
    this.log.update((l) => [...l, { n: this.tick, dir, text }]);
  }
}
