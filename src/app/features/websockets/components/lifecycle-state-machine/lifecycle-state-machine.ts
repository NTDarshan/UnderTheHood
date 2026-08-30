import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type WsState = 'connecting' | 'open' | 'closing' | 'closed';
interface EventLogRow {
  n: number;
  event: 'onopen' | 'onmessage' | 'onerror' | 'onclose';
  detail: string;
}

const STATES: { id: WsState; label: string }[] = [
  { id: 'connecting', label: 'CONNECTING' },
  { id: 'open', label: 'OPEN' },
  { id: 'closing', label: 'CLOSING' },
  { id: 'closed', label: 'CLOSED' },
];

@Component({
  selector: 'app-lifecycle-state-machine',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="lifecycle">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 006 — CONNECTION LIFECYCLE</p>
        <h2 class="lab-title">Every WebSocket connection is a small state machine.</h2>
        <p class="lab-lede">
          The browser's <span class="mono">WebSocket</span> object always sits in one of four states. Drive it
          through each one and watch which callbacks fire.
        </p>

        <app-explain-simply>
          Like a phone call: it rings (connecting), you're talking (open), someone says "gotta go" (closing),
          then the line goes dead (closed). Sometimes the line just drops with no goodbye — that's a network failure.
        </app-explain-simply>

        <div class="state-track" role="img" aria-label="Connection state machine">
          @for (s of states; track s.id; let i = $index) {
            <div class="state-node" [class.is-active]="state() === s.id" [class.is-terminal-error]="s.id === 'closed' && lastWasAbrupt()">
              <span class="state-label mono">{{ s.label }}</span>
            </div>
            @if (i < states.length - 1) {
              <span class="state-arrow">→</span>
            }
          }
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="connect()" [disabled]="state() !== 'closed'">Connect</button>
          <button type="button" class="lab-btn" (click)="sendMessage()" [disabled]="state() !== 'open'">Send message</button>
          <button type="button" class="lab-btn" (click)="closeGracefully()" [disabled]="state() !== 'open'">Close</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="serverDisconnect()" [disabled]="state() !== 'open'">Server disconnects</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="networkFailure()" [disabled]="state() !== 'open'">Network failure</button>
          <button type="button" class="lab-btn" (click)="reconnect()" [disabled]="state() !== 'closed'">Reconnect</button>
        </div>

        <div class="lab-panel event-panel">
          <p class="event-heading mono">CLIENT CALLBACKS</p>
          @if (events().length === 0) { <p class="history-empty">No events yet — press Connect.</p> }
          <ol class="event-list">
            @for (e of events(); track e.n) {
              <li class="event-item" [class]="'evt-' + e.event">
                <span class="evt-name mono">{{ e.event }}</span>
                <span class="evt-detail">{{ e.detail }}</span>
              </li>
            }
          </ol>
        </div>

        <div class="state-explain">
          <p><strong class="mono">CONNECTING</strong> — the handshake is in flight; no data can be sent yet.</p>
          <p><strong class="mono">OPEN</strong> — handshake succeeded; either side can send frames.</p>
          <p><strong class="mono">CLOSING</strong> — a close handshake started; no new application messages should be sent.</p>
          <p><strong class="mono">CLOSED</strong> — the underlying TCP connection is gone, gracefully or not.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .state-track { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
    .state-node { padding: 14px 20px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease; }
    .state-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text-faint); }
    .state-node.is-active { border-color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .state-node.is-active .state-label { color: var(--accent); }
    .state-node.is-terminal-error.is-active { border-color: var(--danger); box-shadow: none; }
    .state-node.is-terminal-error.is-active .state-label { color: var(--danger); }
    .state-arrow { color: var(--text-faint); }

    .event-panel { margin-top: 28px; }
    .event-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 12px; }
    .event-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
    .event-item { display: flex; gap: 12px; align-items: baseline; padding: 8px 12px; background: var(--surface); border-radius: var(--radius-sm); border-left: 2px solid var(--border-strong); font-size: 0.8125rem; }
    .evt-name { flex-shrink: 0; width: 90px; color: var(--text-faint); }
    .evt-onopen .evt-name { color: var(--accent-2); }
    .evt-onmessage .evt-name { color: var(--accent); }
    .evt-onerror .evt-name { color: var(--danger); }
    .evt-onclose .evt-name { color: var(--text-muted); }
    .evt-detail { color: var(--text-muted); }
    .history-empty { color: var(--text-faint); font-size: 0.875rem; }

    .state-explain { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; max-width: 640px; }
    .state-explain p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .state-explain strong { color: var(--text); margin-right: 4px; }
  `,
})
export class LifecycleStateMachine {
  protected readonly states = STATES;
  protected readonly state = signal<WsState>('closed');
  protected readonly events = signal<EventLogRow[]>([]);
  protected readonly lastWasAbrupt = signal(false);
  private n = 0;

  private push(event: EventLogRow['event'], detail: string): void {
    this.n += 1;
    this.events.update((e) => [...e, { n: this.n, event, detail }]);
  }

  async connect(): Promise<void> {
    if (this.state() !== 'closed') return;
    this.lastWasAbrupt.set(false);
    this.state.set('connecting');
    await this.wait(700);
    this.state.set('open');
    this.push('onopen', 'Handshake complete — ready to send and receive.');
  }

  async reconnect(): Promise<void> {
    this.events.set([]);
    this.n = 0;
    await this.connect();
  }

  sendMessage(): void {
    if (this.state() !== 'open') return;
    this.push('onmessage', 'Received a text frame from the server.');
  }

  async closeGracefully(): Promise<void> {
    if (this.state() !== 'open') return;
    this.state.set('closing');
    await this.wait(600);
    this.state.set('closed');
    this.push('onclose', 'code 1000 · "Normal Closure" — both sides agreed to close.');
  }

  async serverDisconnect(): Promise<void> {
    if (this.state() !== 'open') return;
    this.lastWasAbrupt.set(true);
    this.state.set('closed');
    this.push('onclose', 'code 1001 · "Going Away" — server initiated the close.');
  }

  async networkFailure(): Promise<void> {
    if (this.state() !== 'open') return;
    this.lastWasAbrupt.set(true);
    this.push('onerror', 'Underlying transport failed — no close handshake was possible.');
    await this.wait(400);
    this.state.set('closed');
    this.push('onclose', 'code 1006 · "Abnormal Closure" — connection dropped without a close frame.');
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
