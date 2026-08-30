import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Tab = 'health' | 'close';
type PingPhase = 'idle' | 'ping-out' | 'waiting' | 'pong-back' | 'suspected-dead' | 'closing';

const CLOSE_CODES = [
  { code: 1000, name: 'Normal Closure', detail: 'Both sides agreed this was a clean, intentional close.' },
  { code: 1001, name: 'Going Away', detail: 'A side is navigating away — browser tab closing, server shutting down.' },
  { code: 1002, name: 'Protocol Error', detail: 'The other side violated the WebSocket protocol itself.' },
  { code: 1003, name: 'Unsupported Data', detail: 'Received a data type it cannot accept (e.g. binary when only text is supported).' },
  { code: 1008, name: 'Policy Violation', detail: 'A generic code for "this violates an application-level rule."' },
  { code: 1011, name: 'Internal Error', detail: 'The server hit an unexpected condition and cannot continue.' },
];

@Component({
  selector: 'app-ping-pong-close',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="ping-pong">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 010 — CONNECTION HEALTH & SHUTDOWN</p>
        <h2 class="lab-title">A connection can go silent without telling anyone.</h2>

        <div class="tab-row">
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'health'" (click)="tab.set('health')">Ping / Pong</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'close'" (click)="tab.set('close')">Close handshake</button>
        </div>

        @if (tab() === 'health') {
          <div class="lab-panel">
            <app-explain-simply>
              Ping/pong is like tapping the phone mic every so often and asking "you still there?" — if nobody
              taps back, you assume the call dropped even though it never said goodbye.
            </app-explain-simply>

            <div class="pp-diagram">
              <div class="node" [class.is-active]="phase() !== 'idle' && phase() !== 'suspected-dead'">CLIENT</div>
              <div class="wire">
                <div class="packet" [class.is-flying]="phase() === 'ping-out'"><span class="mono">PING</span></div>
                <div class="packet packet-return" [class.is-flying]="phase() === 'pong-back'"><span class="mono">PONG</span></div>
              </div>
              <div class="node" [class.is-active]="phase() === 'waiting' || phase() === 'pong-back'">SERVER</div>
            </div>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="sendPing(true)" [disabled]="phase() !== 'idle'">Send ping</button>
              <button type="button" class="lab-btn lab-btn-danger" (click)="sendPing(false)" [disabled]="phase() !== 'idle'">Simulate silent connection death</button>
              <button type="button" class="lab-btn" (click)="phase.set('idle')" [disabled]="phase() === 'idle' || phase() === 'waiting'">Reset</button>
            </div>

            @if (phase() === 'suspected-dead') {
              <div class="dead-box">
                <p class="dead-line mono">PING → (waiting…) → NO PONG → CONNECTION SUSPECTED DEAD</p>
                <p class="dead-detail">
                  No pong arrived within the timeout. The application can't be 100% sure the connection is dead
                  — but it treats "no pong in time" as dead anyway, closes the socket, and reconnects.
                </p>
              </div>
            }

            <p class="pp-note">
              Ping/pong exists to <strong>detect broken connections</strong>, keep intermediaries (proxies,
              load balancers) from silently timing out an idle connection, and catch "half-open" sockets where
              one side thinks the connection is alive and the other doesn't.
            </p>
            <p class="pp-note">
              <strong>Protocol ping/pong</strong> (control frames, opcodes 0x9/0xA) is not automatically the
              same thing as an <strong>application heartbeat</strong> (e.g. a JSON <span class="mono">{{ '{' }}"type":"heartbeat"{{ '}' }}</span> message). They solve related but different concerns —
              a protocol pong only proves the transport is alive; an application heartbeat can also prove the
              application logic on the other end is still responsive.
            </p>
          </div>
        }

        @if (tab() === 'close') {
          <div class="lab-panel">
            <app-explain-simply>
              A graceful close is like both people saying "bye" before hanging up, instead of one side just
              walking away mid-sentence.
            </app-explain-simply>

            <div class="pp-diagram">
              <div class="node" [class.is-active]="closing()">CLIENT</div>
              <div class="wire">
                <div class="packet" [class.is-flying]="closing()"><span class="mono">CLOSE {{ selectedCode() }}</span></div>
                <div class="packet packet-return" [class.is-flying]="closeAcked()"><span class="mono">CLOSE (ack)</span></div>
              </div>
              <div class="node" [class.is-active]="closing() || closeAcked()">SERVER</div>
            </div>

            <p class="code-lede">Pick a close code and send it:</p>
            <div class="code-grid">
              @for (c of closeCodes; track c.code) {
                <button type="button" class="code-btn" [class.is-selected]="selectedCode() === c.code" (click)="selectedCode.set(c.code)">
                  <span class="code-num mono">{{ c.code }}</span>
                  <span class="code-name">{{ c.name }}</span>
                </button>
              }
            </div>
            <p class="code-detail">{{ codeDetail() }}</p>

            <button type="button" class="lab-btn lab-btn-primary" (click)="runClose()" [disabled]="closing()">Send close frame</button>
            @if (closedDone()) {
              <p class="closed-note mono">CONNECTION CLOSED — code {{ selectedCode() }}</p>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; gap: 8px; margin-top: 28px; }

    .pp-diagram { display: flex; align-items: center; gap: 0; margin-top: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px 16px; }
    .node { flex-shrink: 0; width: 100px; height: 60px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600; color: var(--text-faint); transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    @media (min-width: 640px) { .node { width: 130px; } }
    .node.is-active { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .wire { position: relative; flex: 1; height: 60px; min-width: 60px; }
    .packet { position: absolute; top: 4px; left: 4px; opacity: 0; font-size: 0.6875rem; color: var(--accent); white-space: nowrap; background: var(--surface); border: 1px solid var(--accent-dim); border-radius: 999px; padding: 4px 10px; }
    .packet-return { top: auto; bottom: 4px; color: var(--accent-2); border-color: var(--accent-2-dim); }
    .packet.is-flying { animation: pk-out 0.6s ease forwards; }
    .packet-return.is-flying { animation: pk-in 0.6s ease forwards; }
    @keyframes pk-out { 0% { left: 4px; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: calc(100% - 90px); opacity: 0; } }
    @keyframes pk-in { 0% { left: calc(100% - 90px); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 4px; opacity: 0; } }

    .dead-box { margin-top: 20px; padding: 16px 18px; border-left: 2px solid var(--danger); background: var(--surface); border-radius: var(--radius-sm); }
    .dead-line { color: var(--danger); font-size: 0.8125rem; margin-bottom: 8px; }
    .dead-detail { color: var(--text-muted); font-size: 0.875rem; line-height: 1.55; }

    .pp-note { margin-top: 18px; max-width: 660px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }
    .pp-note strong { color: var(--accent-2); }

    .code-lede { margin-top: 24px; font-size: 0.875rem; color: var(--text-faint); }
    .code-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
    .code-btn { display: flex; flex-direction: column; gap: 3px; padding: 10px 14px; text-align: left; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); transition: border-color 0.15s ease; }
    .code-btn:hover { border-color: var(--accent-2); }
    .code-btn.is-selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated)); }
    .code-num { color: var(--accent-2); font-size: 0.8125rem; }
    .code-name { color: var(--text-muted); font-size: 0.75rem; }
    .code-detail { margin-top: 12px; max-width: 620px; font-size: 0.875rem; color: var(--text-muted); }

    .closed-note { margin-top: 16px; color: var(--text-faint); font-size: 0.8125rem; }
  `,
})
export class PingPongClose {
  protected readonly tab = signal<Tab>('health');
  protected readonly phase = signal<PingPhase>('idle');
  protected readonly closeCodes = CLOSE_CODES;
  protected readonly selectedCode = signal(1000);
  protected readonly closing = signal(false);
  protected readonly closeAcked = signal(false);
  protected readonly closedDone = signal(false);

  protected readonly codeDetail = computed(
    () => this.closeCodes.find((c) => c.code === this.selectedCode())?.detail ?? '',
  );

  async sendPing(willPong: boolean): Promise<void> {
    if (this.phase() !== 'idle') return;
    this.phase.set('ping-out');
    await this.wait(500);
    this.phase.set('waiting');
    await this.wait(700);
    if (willPong) {
      this.phase.set('pong-back');
      await this.wait(500);
      this.phase.set('idle');
    } else {
      this.phase.set('suspected-dead');
    }
  }

  async runClose(): Promise<void> {
    this.closing.set(true);
    this.closedDone.set(false);
    await this.wait(600);
    this.closeAcked.set(true);
    await this.wait(600);
    this.closing.set(false);
    this.closeAcked.set(false);
    this.closedDone.set(true);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
