import { Component, signal } from '@angular/core';

interface Step {
  label: string;
}

const STEPS: Step[] = [
  { label: 'Middleware starts' },
  { label: 'Authentication succeeds' },
  { label: 'Request context populated' },
  { label: 'Router selects handler' },
  { label: 'Controller binds request' },
  { label: 'Service executes business logic' },
  { label: 'Repository executes data operation' },
  { label: 'Database returns result' },
  { label: 'Service returns result' },
  { label: 'Controller creates HTTP response' },
  { label: 'Response middleware executes' },
  { label: 'Client receives response' },
];

@Component({
  selector: 'app-request-debugger',
  standalone: true,
  template: `
    <section class="lab-section" id="request-debugger">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 19 — LIVE REQUEST DEBUGGER</p>
        <h2 class="lab-title">Press play. Watch every step actually happen.</h2>

        <div class="lab-panel">
          <div class="debugger-grid">
            <div class="debugger-panel">
              <p class="panel-title mono">POST /orders</p>
              <pre class="lab-code mono">{{ '{' }}
  "productId": 101,
  "quantity": 2
{{ '}' }}

Authorization: Bearer •••
X-Request-ID: req_7821</pre>
            </div>

            <div class="debugger-panel">
              <p class="panel-title mono">REQUEST CONTEXT</p>
              <pre class="lab-code mono">requestId: req_7821
userId:    {{ step() >= 2 ? '42' : '—' }}
role:      {{ step() >= 2 ? 'customer' : '—' }}
traceId:   trace_123</pre>
            </div>
          </div>

          <div class="step-list mono">
            @for (s of steps; track s.label; let i = $index) {
              <p class="step-row" [class.is-done]="step() > i" [class.is-active]="step() === i">
                <span class="step-marker">{{ step() > i ? '✓' : step() === i ? '→' : '○' }}</span>
                Step {{ i + 1 }} — {{ s.label }}
              </p>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="playing()" (click)="play()">Play Request</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .debugger-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 800px) { .debugger-grid { grid-template-columns: 1fr 1fr; } }
    .debugger-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .panel-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }

    .step-list { margin-top: 24px; display: flex; flex-direction: column; gap: 4px; }
    .step-row { font-size: 0.8125rem; color: var(--text-faint); display: flex; align-items: center; gap: 8px; transition: color 0.2s ease; }
    .step-row.is-done { color: var(--accent-2); }
    .step-row.is-active { color: var(--accent-strong); font-weight: 600; }
    .step-marker { width: 16px; display: inline-block; }
  `,
})
export class RequestDebugger {
  protected readonly steps = STEPS;
  protected readonly step = signal(-1);
  protected readonly playing = signal(false);

  play(): void {
    this.reset();
    this.playing.set(true);
    this.steps.forEach((_, i) => {
      setTimeout(() => {
        this.step.set(i);
        if (i === this.steps.length - 1) this.playing.set(false);
      }, (i + 1) * 350);
    });
  }

  reset(): void {
    this.step.set(-1);
    this.playing.set(false);
  }
}
