import { Component } from '@angular/core';

const CONCERNS = [
  'Connections', 'Memory', 'File descriptors', 'Network', 'Backpressure',
  'Fan-out', 'Reconnection', 'Authentication', 'Observability',
];

const CHECKLIST = [
  'Why HTTP alone can\'t let a server push data',
  'What polling, long polling and SSE trade off',
  'Why WebSocket is a different communication model, not just "faster HTTP"',
  'What actually happens during the handshake, and why it returns 101',
  'ws:// vs wss:// and what TLS protects',
  'Full-duplex communication, independent of request/response turns',
  'The CONNECTING → OPEN → CLOSING → CLOSED lifecycle and its callbacks',
  'Message vs frame vs TCP segment vs network packet',
  'What\'s actually inside a WebSocket frame — FIN, opcode, mask, payload length',
  'Why messages get fragmented, and how continuation frames rebuild them',
  'Why client frames are masked, and why that isn\'t encryption',
  'What ping/pong detects, and how it differs from an app-level heartbeat',
  'Close codes and the graceful shutdown handshake',
  'Why persistent connections still consume real OS resources',
  'The multi-server problem, and why pub/sub solves it',
  'Fan-out cost and backpressure from slow consumers',
  'Reconnect storms, and why backoff + jitter matter',
  'Authentication vs authorization for a live connection',
  'Where WebSocket fits next to HTTP — not instead of it',
];

@Component({
  selector: 'app-final-mental-model',
  standalone: true,
  template: `
    <section class="lab-section" id="mental-model">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 023 — THE FINAL PICTURE</p>
        <h2 class="lab-title">Two stacks: what a message goes through, and what a real system needs.</h2>

        <div class="model-columns">
          <div class="model-col">
            <p class="model-heading mono">ONE MESSAGE, LAYER BY LAYER</p>
            <div class="stack mono">
              <div class="stack-item">Application</div>
              <div class="stack-item">WebSocket message</div>
              <div class="stack-item">WebSocket frame</div>
              <div class="stack-item">TCP</div>
              <div class="stack-item">IP</div>
              <div class="stack-item">Network</div>
            </div>
            <p class="model-caption"><span class="mono">CLIENT ⇄ SERVER</span> — persistent connection, either side sends whenever it needs to.</p>
          </div>

          <div class="model-col">
            <p class="model-heading mono">PRODUCTION REALITY</p>
            <div class="stack mono">
              <div class="stack-item">Clients</div>
              <div class="stack-item">Load balancer</div>
              <div class="stack-item">WebSocket servers</div>
              <div class="stack-item">Pub/Sub</div>
              <div class="stack-item">Application services</div>
              <div class="stack-item">Databases</div>
            </div>
            <p class="model-caption">This is the real WebSocket system — the protocol is the smallest part of it.</p>
          </div>
        </div>

        <div class="concern-cloud">
          @for (c of concerns; track c) {
            <span class="concern-chip">{{ c }}</span>
          }
        </div>

        <h3 class="checklist-heading">You should now be able to explain</h3>
        <ul class="checklist">
          @for (item of checklist; track item) {
            <li class="checklist-item"><span class="check-mark" aria-hidden="true">✓</span><span>{{ item }}</span></li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .model-columns { margin-top: 28px; display: grid; gap: 24px; grid-template-columns: 1fr; }
    @media (min-width: 720px) { .model-columns { grid-template-columns: 1fr 1fr; } }
    .model-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 14px; }
    .stack { display: flex; flex-direction: column; gap: 4px; }
    .stack-item { padding: 10px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-size: 0.8125rem; color: var(--text); text-align: center; }
    .model-caption { margin-top: 12px; font-size: 0.8125rem; color: var(--text-faint); }

    .concern-cloud { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 8px; }
    .concern-chip { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--accent-dim); color: var(--accent); font-size: 0.75rem; font-family: var(--font-mono); }

    .checklist-heading { margin-top: 44px; font-size: 1.25rem; color: var(--text); }
    .checklist { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 720px) { .checklist { grid-template-columns: 1fr 1fr; } }
    .checklist-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.45; }
    .check-mark { color: var(--accent-2); flex-shrink: 0; }
  `,
})
export class FinalMentalModel {
  protected readonly concerns = CONCERNS;
  protected readonly checklist = CHECKLIST;
}
