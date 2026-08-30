import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

type Mode = 'http-only' | 'wants-push';

@Component({
  selector: 'app-ws-hero',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="hero" id="the-problem">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="lab-index">WEBSOCKETS / 001 — REAL-TIME COMMUNICATION</p>
        <h1 class="hero-title">What actually happens when a browser opens a WebSocket connection?</h1>
        <p class="hero-lede">
          HTTP is excellent when the client asks and the server answers. But what happens when the
          <strong>server</strong> needs to tell the client something — right now, without being asked?
        </p>

        <app-explain-simply>
          Imagine you're waiting for a text back from a friend. HTTP is like you having to call them every
          few seconds and ask "did you reply yet?" A WebSocket is like leaving the phone line open — the
          moment they reply, you hear it immediately, no asking required.
        </app-explain-simply>

        <ul class="vocab-strip mono" aria-label="Key vocabulary used on this page">
          <li><app-term def="Whatever opens the connection — almost always a browser tab for WebSockets.">Client</app-term></li>
          <li><app-term def="The program accepting the connection and able to send messages at any time once it's open.">Server</app-term></li>
          <li><app-term def="A connection that stays open across many messages, instead of opening and closing per exchange.">Persistent connection</app-term></li>
          <li><app-term def="Both sides can send data independently and simultaneously — neither has to wait for the other to 'finish speaking'.">Full-duplex</app-term></li>
        </ul>

        <div class="scenario-panel">
          <p class="scenario-heading mono">SCENARIO</p>
          <p class="scenario-text">
            You're watching a live order-tracking screen. Somewhere on the server, a new event just happened:
          </p>
          <p class="scenario-event mono">"Order #4821 — status changed to Out for Delivery"</p>
          <p class="scenario-question">How does the server tell your browser? Try it with plain HTTP.</p>

          <div class="model-row" role="group" aria-label="Communication model">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'http-only'" (click)="mode.set('http-only')">
              Plain HTTP request/response
            </button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'wants-push'" (click)="mode.set('wants-push')">
              What we actually need
            </button>
          </div>

          @if (mode() === 'http-only') {
            <div class="diagram">
              <div class="node node-client is-idle">CLIENT</div>
              <div class="arrow-col">
                <div class="arrow-line arrow-right">
                  <span class="arrow-label mono">REQUEST</span>
                </div>
                <div class="arrow-line arrow-left">
                  <span class="arrow-label mono">RESPONSE</span>
                </div>
              </div>
              <div class="node node-server is-idle">SERVER</div>
            </div>
            <p class="diagram-caption">
              In the traditional model, the server can only speak <em>in reply to</em> a request. It cannot
              reach across and hand the client a response whenever it feels like it — there's no open channel
              to send it through. Until the client asks again, that "Out for Delivery" update just sits there.
            </p>
            <button type="button" class="lab-btn lab-btn-primary" (click)="fireEvent()" [disabled]="firing()">
              {{ firing() ? 'Event fired — but no one is asking…' : 'Server: new event happens' }}
            </button>
            @if (fired()) {
              <p class="stuck-note mono">⚠ Event queued on the server. The client won't know until its next request.</p>
            }
          } @else {
            <div class="diagram">
              <div class="node node-client is-active">CLIENT</div>
              <div class="arrow-col">
                <div class="dual-arrow">
                  <span class="dual-symbol" aria-hidden="true">⇄</span>
                </div>
              </div>
              <div class="node node-server is-active">SERVER</div>
            </div>
            <p class="diagram-caption">
              What the scenario actually calls for: a channel that stays open, where <strong>either side can
              send whenever it needs to</strong>. The server pushes "Out for Delivery" the instant it happens —
              no request required. This is the problem WebSockets (and their predecessors) exist to solve.
            </p>
          }
        </div>

        <div class="evolution-teaser mono" aria-label="Evolution of solutions, previewed here and explored below">
          <span>HTTP req/response</span>
          <span class="eq-arrow">→</span>
          <span>Polling</span>
          <span class="eq-arrow">→</span>
          <span>Long polling</span>
          <span class="eq-arrow">→</span>
          <span>SSE</span>
          <span class="eq-arrow">→</span>
          <span class="eq-final">WebSocket</span>
        </div>
        <p class="evolution-note">
          Each step below exists because the one before it wasn't good enough. We'll build and break each one.
        </p>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; padding-block: 96px 64px; overflow: hidden; }
    .hero-inner { position: relative; z-index: 1; }
    .hero-title { margin-top: 18px; font-size: clamp(2rem, 1.5rem + 2.2vw, 3.5rem); max-width: 900px; }
    .hero-lede { margin-top: 20px; max-width: 660px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }
    .hero-lede strong { color: var(--accent-strong); }

    .vocab-strip { display: flex; flex-wrap: wrap; gap: 8px 4px; margin-top: 20px; list-style: none; padding: 0; font-size: 0.75rem; color: var(--text-faint); }
    .vocab-strip li:not(:last-child)::after { content: '·'; margin-left: 8px; color: var(--border-strong); }

    .scenario-panel { margin-top: 32px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; }
    @media (min-width: 640px) { .scenario-panel { padding: 32px; } }

    .scenario-heading { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--accent-2); margin-bottom: 10px; }
    .scenario-text { color: var(--text-muted); font-size: 0.9375rem; }
    .scenario-event { margin-top: 10px; color: var(--accent); font-size: 0.9375rem; padding: 10px 14px; background: var(--surface); border-left: 2px solid var(--accent-dim); border-radius: var(--radius-sm); }
    .scenario-question { margin-top: 14px; color: var(--text); font-size: 0.9375rem; }

    .model-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }

    .diagram { display: flex; align-items: center; gap: 0; margin-top: 24px; padding: 24px 12px; }
    .node { flex-shrink: 0; width: 96px; height: 60px; display: flex; align-items: center; justify-content: center; text-align: center; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; color: var(--text-faint); transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    @media (min-width: 640px) { .node { width: 130px; height: 76px; } }
    .node.is-active { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }

    .arrow-col { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 40px; padding-inline: 12px; }
    .arrow-line { position: relative; height: 2px; background: var(--border-strong); }
    .arrow-right::after { content: '▶'; position: absolute; right: -2px; top: -7px; font-size: 0.7rem; color: var(--text-faint); }
    .arrow-left::after { content: '◀'; position: absolute; left: -2px; top: -7px; font-size: 0.7rem; color: var(--text-faint); }
    .arrow-label { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.625rem; color: var(--text-faint); white-space: nowrap; }
    .arrow-left .arrow-label { top: 6px; }

    .dual-arrow { display: flex; align-items: center; justify-content: center; height: 60px; }
    .dual-symbol { font-size: 2rem; color: var(--accent); animation: dual-pulse 1.6s ease-in-out infinite; }
    @keyframes dual-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

    .diagram-caption { margin-top: 8px; max-width: 620px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
    .diagram-caption strong { color: var(--accent-2); }

    .stuck-note { margin-top: 12px; color: var(--danger); font-size: 0.8125rem; }

    .evolution-teaser { margin-top: 40px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 0.8125rem; color: var(--text-faint); }
    .eq-arrow { color: var(--border-strong); }
    .eq-final { color: var(--accent); font-weight: 700; }
    .evolution-note { margin-top: 8px; font-size: 0.8125rem; color: var(--text-faint); }
  `,
})
export class WsHero {
  protected readonly mode = signal<Mode>('http-only');
  protected readonly firing = signal(false);
  protected readonly fired = signal(false);

  fireEvent(): void {
    if (this.firing()) return;
    this.firing.set(true);
    setTimeout(() => {
      this.firing.set(false);
      this.fired.set(true);
    }, 700);
  }
}
