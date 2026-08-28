import { Component, OnDestroy, signal } from '@angular/core';

interface Step {
  label: string;
}

const STEPS: Step[] = [
  { label: 'Middleware' },
  { label: 'Routing' },
  { label: 'Authentication' },
  { label: 'Authorization' },
  { label: 'Validation' },
  { label: 'Controller' },
  { label: 'Service' },
  { label: 'Repository' },
  { label: 'Database' },
];

@Component({
  selector: 'app-api-request-debugger',
  standalone: true,
  template: `
    <section class="lab-section" id="request-debugger">
      <div class="container">
        <p class="lab-index">REST API / 42 — THE COMPLETE API REQUEST DEBUGGER</p>
        <h2 class="lab-title">One request, every stage it actually passes through.</h2>

        <div class="lab-panel">
          <div class="debugger-grid">
            <div class="debugger-panel">
              <p class="panel-title mono">METHOD &amp; PATH</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/api/v1/books</span></p>
            </div>
            <div class="debugger-panel">
              <p class="panel-title mono">QUERY</p>
              <pre class="lab-code mono">status=published
sortBy=createdAt
sortOrder=desc
page=2
limit=20</pre>
            </div>
            <div class="debugger-panel">
              <p class="panel-title mono">HEADERS</p>
              <pre class="lab-code mono">Authorization: Bearer •••
Accept: application/json
X-Request-ID: req_5140</pre>
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

          @if (finished()) {
            <div class="response-box mono">
              <p class="response-title mono">RESPONSE</p>
              <p class="lab-code"><span class="tok-status-ok">200 OK</span></p>
              <pre class="lab-code mono">{{ '{' }}
  <span class="tok-key">"data"</span>: [ ...20 books... ],
  <span class="tok-key">"page"</span>: 2,
  <span class="tok-key">"limit"</span>: 20,
  <span class="tok-key">"total"</span>: 137,
  <span class="tok-key">"totalPages"</span>: 7
{{ '}' }}</pre>
            </div>
          }

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
    @media (min-width: 900px) { .debugger-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .debugger-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .panel-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .debugger-panel .lab-code { margin: 0; padding: 10px 12px; }

    .step-list { margin-top: 24px; display: flex; flex-direction: column; gap: 4px; }
    .step-row { font-size: 0.8125rem; color: var(--text-faint); display: flex; align-items: center; gap: 8px; transition: color 0.2s ease; }
    .step-row.is-done { color: var(--accent-2); }
    .step-row.is-active { color: var(--accent-strong); font-weight: 600; }
    .step-marker { width: 16px; display: inline-block; }

    .response-box { margin-top: 20px; }
    .response-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
  `,
})
export class ApiRequestDebugger implements OnDestroy {
  protected readonly steps = STEPS;
  protected readonly step = signal(-1);
  protected readonly playing = signal(false);
  protected readonly finished = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  play(): void {
    this.reset();
    this.playing.set(true);
    this.steps.forEach((_, i) => {
      const t = setTimeout(() => {
        this.step.set(i);
        if (i === this.steps.length - 1) {
          this.playing.set(false);
          this.finished.set(true);
        }
      }, (i + 1) * 350);
      this.timers.push(t);
    });
  }

  reset(): void {
    this.clearTimers();
    this.step.set(-1);
    this.playing.set(false);
    this.finished.set(false);
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }
}
