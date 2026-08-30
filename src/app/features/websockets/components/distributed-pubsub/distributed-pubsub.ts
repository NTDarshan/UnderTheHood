import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Tab = 'single' | 'problem' | 'pubsub';

@Component({
  selector: 'app-distributed-pubsub',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="distributed">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 012 — MULTI-SERVER PROBLEM</p>
        <h2 class="lab-title">Your in-memory connection list only knows about your own process.</h2>

        <div class="tab-row">
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'single'" (click)="tab.set('single')">1. Single server</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'problem'" (click)="tab.set('problem')">2. Multiple servers</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'pubsub'" (click)="tab.set('pubsub')">3. Pub/Sub solution</button>
        </div>

        @if (tab() === 'single') {
          <div class="lab-panel">
            <app-explain-simply>
              As long as everyone's on the same server, it's easy — like a group chat where everyone's phone is
              plugged into the same switchboard.
            </app-explain-simply>
            <div class="single-diagram">
              <div class="client-col">
                <div class="node node-client" [class.is-active]="!restarted()">CLIENT A</div>
                <div class="node node-client" [class.is-active]="!restarted()">CLIENT B</div>
                <div class="node node-client" [class.is-active]="!restarted()">CLIENT C</div>
              </div>
              <span class="single-arrow">⇄</span>
              <div class="node node-server" [class.is-down]="restarted()">SERVER</div>
            </div>
            <button type="button" class="lab-btn lab-btn-danger" (click)="restart()">Restart the server</button>
            @if (restarted()) {
              <p class="restart-note">
                Every connection on this process just dropped — including A, B and C's. This is what forces
                clients to implement reconnection (see the reconnect-storm lab below), and why in-memory-only
                state can't survive a deploy.
              </p>
            }
          </div>
        }

        @if (tab() === 'problem') {
          <div class="lab-panel">
            <app-explain-simply>
              Now imagine two separate switchboards that aren't wired together. Client A's operator has no way
              to ring Client B directly — they're plugged into a different building.
            </app-explain-simply>
            <div class="multi-diagram">
              <div class="server-block">
                <p class="server-label mono">SERVER A</p>
                <div class="node node-client is-active">CLIENT A</div>
              </div>
              <div class="server-block">
                <p class="server-label mono">SERVER B</p>
                <div class="node node-client is-active">CLIENT B</div>
              </div>
            </div>
            <button type="button" class="lab-btn lab-btn-danger" (click)="tryDirect()">Server A: try to send an event straight to Client B</button>
            @if (directFailed()) {
              <p class="fail-note mono">✗ Server A has no in-memory reference to Client B's socket — it lives on Server B's process. This call fails.</p>
            }
          </div>
        }

        @if (tab() === 'pubsub') {
          <div class="lab-panel">
            <app-explain-simply>
              Pub/Sub is a shared switchboard between the buildings — any operator can announce a message, and
              every other building's operator hears it and relays it to whoever's plugged in locally.
            </app-explain-simply>
            <div class="pubsub-diagram">
              <div class="server-block">
                <p class="server-label mono">SERVER A</p>
                <div class="node node-client is-active">CLIENT A</div>
              </div>
              <div class="pubsub-flow">
                <span class="flow-step" [class.is-active]="pubsubStep() >= 1">publish →</span>
                <div class="broker-node" [class.is-active]="pubsubStep() >= 1">PUB/SUB<br /><span class="broker-sub">(e.g. Redis)</span></div>
                <span class="flow-step" [class.is-active]="pubsubStep() >= 2">→ deliver</span>
              </div>
              <div class="server-block">
                <p class="server-label mono">SERVER B</p>
                <div class="node node-client" [class.is-active]="pubsubStep() >= 3">CLIENT B</div>
              </div>
            </div>
            <button type="button" class="lab-btn lab-btn-primary" (click)="runPubsub()" [disabled]="pubsubStep() > 0 && pubsubStep() < 4">
              Server A publishes: "Order 123 completed"
            </button>
            @if (pubsubStep() >= 4) {
              <p class="success-note mono">✓ Client B's WebSocket, held open on Server B, just received the event — without Server A ever knowing Client B's socket existed.</p>
            }
            <p class="pubsub-note">
              This is the general shape: a message broker every server subscribes to. Redis Pub/Sub is one
              common implementation, but the architecture — publish once, every interested server relays to its
              own connected clients — is what matters, not the specific product.
            </p>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }

    .single-diagram { display: flex; align-items: center; gap: 20px; margin-top: 24px; }
    .client-col { display: flex; flex-direction: column; gap: 8px; }
    .node { padding: 10px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--text-faint); transition: border-color 0.3s ease, color 0.3s ease; text-align: center; }
    .node.is-active { border-color: var(--accent-2); color: var(--accent-2); }
    .node-server { padding: 16px 24px; }
    .node-server.is-down { border-color: var(--danger); color: var(--danger); opacity: 0.6; }
    .single-arrow { font-size: 1.5rem; color: var(--text-faint); }
    .restart-note { margin-top: 18px; max-width: 620px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }

    .multi-diagram, .pubsub-diagram { display: flex; align-items: center; gap: 20px; margin-top: 24px; flex-wrap: wrap; }
    .server-block { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border: 1px dashed var(--border-strong); border-radius: var(--radius-md); }
    .server-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .fail-note { margin-top: 16px; color: var(--danger); font-size: 0.875rem; max-width: 560px; }

    .pubsub-flow { display: flex; align-items: center; gap: 10px; }
    .flow-step { font-size: 0.6875rem; color: var(--text-faint); transition: color 0.3s ease; }
    .flow-step.is-active { color: var(--accent-2); }
    .broker-node { padding: 14px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; text-align: center; color: var(--text-faint); transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    .broker-node.is-active { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .broker-sub { font-size: 0.5625rem; opacity: 0.7; }
    .success-note { margin-top: 16px; color: var(--accent-2); font-size: 0.875rem; max-width: 620px; }
    .pubsub-note { margin-top: 18px; max-width: 640px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }
  `,
})
export class DistributedPubsub {
  protected readonly tab = signal<Tab>('single');
  protected readonly restarted = signal(false);
  protected readonly directFailed = signal(false);
  protected readonly pubsubStep = signal(0);

  restart(): void {
    this.restarted.set(true);
  }

  tryDirect(): void {
    this.directFailed.set(true);
  }

  async runPubsub(): Promise<void> {
    this.pubsubStep.set(1);
    await this.wait(600);
    this.pubsubStep.set(2);
    await this.wait(600);
    this.pubsubStep.set(3);
    await this.wait(400);
    this.pubsubStep.set(4);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
