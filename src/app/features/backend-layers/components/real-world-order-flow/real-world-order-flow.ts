import { Component, signal } from '@angular/core';

interface Beat {
  stage: string;
  detail: string;
}

const BEATS: Beat[] = [
  { stage: 'Middleware', detail: 'Logging, request ID, authentication, rate limiting all pass.' },
  { stage: 'Router', detail: 'POST /orders → createOrder handler.' },
  { stage: 'Controller', detail: 'Parse body, validate, call service.' },
  { stage: 'Service', detail: 'Get product, check inventory, calculate price, create order.' },
  { stage: 'Repository', detail: 'Query product, save order.' },
  { stage: 'Database', detail: 'INSERT order.' },
  { stage: 'Response', detail: '201 Created.' },
];

@Component({
  selector: 'app-real-world-order-flow',
  standalone: true,
  template: `
    <section class="lab-section" id="real-world-order">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 25 — REAL-WORLD ORDER REQUEST</p>
        <h2 class="lab-title">POST /orders, end to end.</h2>

        <div class="lab-panel">
          <pre class="lab-code mono">POST /orders
{{ '{' }} "productId": 101, "quantity": 2 {{ '}' }}
Authorization: Bearer token
X-Request-ID: req_123</pre>

          <div class="beat-list mono">
            @for (b of beats; track b.stage; let i = $index) {
              <div class="beat-row" [class.is-active]="active() === i">
                <p class="beat-stage">STEP {{ i + 1 }} — {{ b.stage.toUpperCase() }}</p>
                <p class="beat-detail">{{ b.detail }}</p>
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="play()">Animate Full Request</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .beat-list { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
    .beat-row { padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); opacity: 0.55; transition: opacity 0.2s ease, border-color 0.2s ease; }
    .beat-row.is-active { opacity: 1; border-color: var(--accent); box-shadow: 0 0 12px var(--glow-accent); }
    .beat-stage { font-size: 0.75rem; color: var(--accent-2); font-weight: 700; }
    .beat-detail { font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px; }
  `,
})
export class RealWorldOrderFlow {
  protected readonly beats = BEATS;
  protected readonly active = signal(-1);

  play(): void {
    this.reset();
    this.beats.forEach((_, i) => {
      setTimeout(() => this.active.set(i), (i + 1) * 500);
    });
  }

  reset(): void {
    this.active.set(-1);
  }
}
