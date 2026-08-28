import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface FlowStep {
  label: string;
  detail: string;
}

const STEPS: FlowStep[] = [
  { label: 'Client', detail: 'User clicks "View Order #123" in the UI.' },
  { label: 'HTTP Request', detail: 'GET /users/42/orders/123 is sent to the backend.' },
  { label: 'Router', detail: 'The router receives the method and path, ready to search the route table.' },
  { label: 'Route Matching', detail: 'Candidate routes are checked in order for a method + path match.' },
  { label: 'Path Parameters', detail: 'userId = 42 and orderId = 123 are extracted from the matched segments.' },
  { label: 'Constraints', detail: 'Both segments satisfy their :int constraints — the match holds.' },
  { label: 'Selected Handler', detail: 'GetUserOrderById() is chosen as the handler for this request.' },
  { label: 'Business Logic', detail: 'The handler loads order 123 belonging to user 42.' },
  { label: 'Response', detail: 'The order data travels back to the client as an HTTP response.' },
  { label: 'Client', detail: 'The UI renders order #123 on screen.' },
];

@Component({
  selector: 'app-real-world-flow',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="real-world">
      <div class="container">
        <p class="lab-index">ROUTING / 16 — REAL-WORLD END-TO-END FLOW</p>
        <h2 class="lab-title">Follow one click, all the way to a handler.</h2>
        <p class="lab-lede">Everything from this chapter, in a single continuous pass.</p>

        <app-explain-simply>
          This is the same round trip as clicking a link on any website — the interesting part isn't that
          it works, it's exactly which decisions the router makes along the way.
        </app-explain-simply>

        <div class="lab-btn-row">
          <button type="button" class="btn btn-primary" (click)="play()" [disabled]="playing()">
            {{ playing() ? 'Running…' : 'View Order #123' }}
          </button>
          <button type="button" class="lab-btn" (click)="reset()">Reset</button>
        </div>

        <ol class="flow-track">
          @for (s of steps; track s.label + $index; let i = $index) {
            <li [class.is-lit]="lit() > i" [class.is-current]="lit() === i + 1 && playing()">
              <span class="flow-dot" aria-hidden="true"></span>
              <div>
                <p class="flow-label">{{ s.label }}</p>
                @if (lit() > i) {
                  <p class="flow-detail">{{ s.detail }}</p>
                }
              </div>
            </li>
          }
        </ol>

        @if (lit() === steps.length) {
          <div class="extract-panel">
            <p class="extract-heading mono">EXTRACTED</p>
            <p class="kv mono"><span class="kv-key">userId</span> = 42</p>
            <p class="kv mono"><span class="kv-key">orderId</span> = 123</p>
            <p class="handler mono">Handler: GetUserOrderById()</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .flow-track {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .flow-track li {
      display: flex;
      gap: 12px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      opacity: 0.35;
      transition: opacity 0.3s ease, background 0.3s ease;
    }

    .flow-track li.is-lit {
      opacity: 1;
    }

    .flow-track li.is-current {
      background: var(--surface-raised);
    }

    .flow-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 5px;
      background: var(--border-strong);
    }

    .flow-track li.is-lit .flow-dot {
      background: var(--accent-2);
    }

    .flow-track li.is-current .flow-dot {
      background: var(--accent);
      box-shadow: 0 0 8px var(--glow-accent);
    }

    .flow-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    .flow-detail {
      margin-top: 2px;
      font-size: 0.8125rem;
      color: var(--text-faint);
      max-width: 480px;
    }

    .extract-panel {
      margin-top: 24px;
      background: var(--surface-raised);
      border: 1px solid var(--accent-2-dim);
      border-radius: var(--radius-lg);
      padding: 20px;
      max-width: 320px;
    }

    .extract-heading {
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    .kv {
      font-size: 0.875rem;
      color: var(--text);
    }

    .kv-key {
      color: var(--accent-2);
    }

    .handler {
      margin-top: 10px;
      color: var(--accent);
      font-size: 0.875rem;
    }
  `,
})
export class RealWorldFlow {
  protected readonly steps = STEPS;
  protected readonly lit = signal(0);
  protected readonly playing = signal(false);

  async play(): Promise<void> {
    if (this.playing()) return;
    this.reset();
    this.playing.set(true);
    for (let i = 1; i <= this.steps.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      this.lit.set(i);
    }
    this.playing.set(false);
  }

  reset(): void {
    this.lit.set(0);
    this.playing.set(false);
  }
}
