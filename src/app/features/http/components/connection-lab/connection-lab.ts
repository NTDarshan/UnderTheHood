import { Component, signal } from '@angular/core';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-connection-lab',
  standalone: true,
  imports: [TermTip, ExplainSimply],
  template: `
    <section class="lab-section" id="connections">
      <div class="container">
        <p class="lab-index">HTTP / 13 — PERSISTENT CONNECTIONS</p>
        <h2 class="lab-title">Establishing a connection has a real cost. Reusing it avoids paying twice.</h2>
        <p class="lab-lede">
          HTTP/1.0 historically opened a new
          <app-term def="Transmission Control Protocol — a transport that guarantees delivery and ordering, at the cost of a handshake before any data can flow.">TCP</app-term>
          connection per request. HTTP/1.1 made reuse the default. HTTP/2 goes further and
          <app-term def="Interleaving several independent streams of requests and responses on one connection at the same time, instead of sending them one after another.">multiplexes</app-term>
          many streams over one connection.
        </p>

        <app-explain-simply>
          Instead of hanging up the phone and re-dialing for every single sentence you want to say, you just
          stay on the same call and keep talking. That's a persistent connection — one setup, many messages.
        </app-explain-simply>

        <div class="lab-panel compare-grid">
          <div class="compare-col">
            <p class="compare-heading mono">WITHOUT REUSE — HTTP/1.0 STYLE</p>
            @for (i of [1, 2, 3]; track i) {
              <div class="conn-chain">
                <span class="chain-step">TCP connection</span>
                <span class="lab-flow-arrow">↓</span>
                <span class="chain-step">Request {{ i }}</span>
                <span class="lab-flow-arrow">↓</span>
                <span class="chain-step">Response {{ i }}</span>
                <span class="lab-flow-arrow">↓</span>
                <span class="chain-step chain-close">Close</span>
              </div>
            }
          </div>

          <div class="compare-col">
            <p class="compare-heading mono">PERSISTENT — HTTP/1.1</p>
            <div class="conn-persist">
              <span class="chain-step chain-open">Connection established once</span>
              <div class="persist-list">
                @for (i of [1, 2, 3]; track i) {
                  <span class="persist-item">├── Request {{ i }} / Response {{ i }}</span>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="version-tabs mono">
          <button type="button" class="lab-btn" [class.is-active]="mode() === 'http2'" (click)="mode.set('http2')">HTTP/2</button>
          <button type="button" class="lab-btn" [class.is-active]="mode() === 'http3'" (click)="mode.set('http3')">HTTP/3</button>
        </div>

        @if (mode() === 'http2') {
          <div class="lab-panel">
            <p class="mono connection-title">One connection</p>
            <div class="stream-list">
              <span class="persist-item">├── Stream 1</span>
              <span class="persist-item">├── Stream 2</span>
              <span class="persist-item">└── Stream 3</span>
            </div>
            <p class="lab-note">HTTP/2 multiplexes multiple streams over a single connection, so requests no longer queue behind each other at the HTTP layer.</p>
          </div>
        } @else {
          <div class="lab-panel">
            <div class="quic-stack mono">
              <span>HTTP/3</span>
              <span class="lab-flow-arrow">↓</span>
              <span>
                <app-term def="A modern transport protocol that combines connection setup and encryption into one step, and lets one lost packet stall only its own stream instead of the whole connection.">QUIC</app-term>
              </span>
              <span class="lab-flow-arrow">↓</span>
              <span>
                <app-term def="User Datagram Protocol — a lightweight transport that sends packets without guaranteeing delivery or order on its own. QUIC builds reliability on top of it.">UDP</app-term>
              </span>
            </div>
            <p class="lab-note">
              HTTP/3 carries HTTP semantics over QUIC, a transport protocol built on UDP — it is not simply
              "HTTP directly over UDP."
            </p>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 28px;
    }

    @media (min-width: 780px) {
      .compare-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .compare-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--accent-2);
      margin-bottom: 16px;
    }

    .conn-chain {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px dashed var(--border);
    }

    .conn-chain:last-child {
      border-bottom: none;
    }

    .chain-close {
      color: var(--danger);
    }

    .chain-open {
      color: var(--accent-2);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }

    .persist-list,
    .stream-list {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      padding-left: 4px;
    }

    .version-tabs {
      display: flex;
      gap: 8px;
      margin-top: 40px;
      margin-bottom: 20px;
    }

    .connection-title {
      color: var(--accent-2);
      font-size: 0.8125rem;
      margin-bottom: 4px;
    }

    .quic-stack {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9375rem;
      color: var(--text);
      margin-bottom: 16px;
    }
  `,
})
export class ConnectionLab {
  protected readonly mode = signal<'http2' | 'http3'>('http2');
}
