import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { normalizeEmail, isSyntacticallyValidEmail } from '../../engine/validation-simulator';

@Component({
  selector: 'app-validation-vs-transformation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="validation-vs-transformation">
      <div class="container">
        <p class="lab-index">VALIDATION / 04 — VALIDATION VS. TRANSFORMATION</p>
        <h2 class="lab-title">Two separate gates, easy to conflate.</h2>

        <div class="gate-grid">
          <div class="gate-card">
            <p class="gate-title mono">TRANSFORMATION</p>
            <p class="gate-question">"Can I convert or normalize this input into the representation my application expects?"</p>
          </div>
          <div class="gate-card">
            <p class="gate-title mono">VALIDATION</p>
            <p class="gate-question">"Is this value acceptable according to the rules of this boundary or domain?"</p>
          </div>
        </div>

        <div class="lab-panel example-panel">
          <div class="lab-field">
            <label for="vvt-raw">Try your own input</label>
            <input id="vvt-raw" type="text" [ngModel]="raw()" (ngModelChange)="raw.set($event)" />
          </div>
          <p class="example-in mono">Incoming: "{{ raw() }}"</p>
          <p class="example-arrow">↓ transform</p>
          <p class="example-mid mono">"{{ transformed() }}"</p>
          <p class="example-arrow">↓ validate</p>
          <p class="example-check">{{ isValid() ? '✓ Syntactically valid email' : '✕ Not a valid email' }}</p>
          <p class="example-arrow">↓</p>
          <p class="example-final mono">Trusted representation: "{{ transformed() }}"</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="raw-transformed-validated">
      <div class="container">
        <p class="lab-index">VALIDATION / 05 — RAW → TRANSFORMED → VALIDATED</p>
        <h2 class="lab-title">Follow one request through all three steps.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="playing()">▶ Run the pipeline</button>
        </div>

        <div class="rtv-stages mono">
          <div class="rtv-stage" [class.is-active]="stage() >= 0">
            <p class="rtv-label">STEP 1 — RAW</p>
            <pre class="lab-code">{{ '{' }}
  "email": "  JOHN&#64;Example.COM ",
  "age": "27",
  "phone": "9876543210"
{{ '}' }}</pre>
          </div>
          <div class="rtv-stage" [class.is-active]="stage() >= 1">
            <p class="rtv-label">STEP 2 — TRANSFORM</p>
            <p class="rtv-line">email: "  JOHN&#64;Example.COM " → "john&#64;example.com"</p>
            <p class="rtv-line">age: "27" → 27</p>
          </div>
          <div class="rtv-stage" [class.is-active]="stage() >= 2">
            <p class="rtv-label">STEP 3 — VALIDATE</p>
            <p class="rtv-line ok">email → valid ✓</p>
            <p class="rtv-line ok">age → valid ✓</p>
            <p class="rtv-line ok">phone → valid ✓</p>
          </div>
          <div class="rtv-stage" [class.is-active]="stage() >= 3">
            <p class="rtv-label">STEP 4 — TRUSTED MODEL</p>
            <pre class="lab-code is-trusted">{{ '{' }}
  "email": "john&#64;example.com",
  "age": 27,
  "phone": "9876543210"
{{ '}' }}</pre>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .gate-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .gate-grid { grid-template-columns: 1fr 1fr; } }
    .gate-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .gate-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .gate-question { font-size: 0.9375rem; color: var(--text); line-height: 1.5; }

    .example-panel { margin-top: 24px; }
    .example-in { font-size: 0.875rem; color: var(--danger); }
    .example-mid { font-size: 0.875rem; color: var(--accent-strong); margin-top: 4px; }
    .example-arrow { font-size: 0.75rem; color: var(--text-faint); margin: 8px 0; }
    .example-check { font-size: 0.9375rem; color: var(--accent-2); font-weight: 600; }
    .example-final { margin-top: 8px; font-size: 0.875rem; color: var(--accent-2); }

    .rtv-stages { margin-top: 28px; display: flex; flex-direction: column; gap: 16px; }
    .rtv-stage { opacity: 0.35; transition: opacity 0.3s ease; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border); }
    .rtv-stage.is-active { opacity: 1; border-color: var(--accent-dim); background: var(--surface-raised); }
    .rtv-label { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .rtv-line { font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px; }
    .rtv-line.ok { color: var(--accent-2); }
    .lab-code.is-trusted { color: var(--accent-2); border-color: var(--accent-2-dim); }
  `,
})
export class ValidationVsTransformation {
  protected readonly raw = signal('  John@Example.COM  ');
  protected readonly transformed = computed(() => normalizeEmail(this.raw()));
  protected readonly isValid = computed(() => isSyntacticallyValidEmail(this.transformed()));

  protected readonly stage = signal(-1);
  protected readonly playing = signal(false);

  async run(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    this.stage.set(-1);
    for (let i = 0; i < 4; i++) {
      this.stage.set(i);
      await wait(600);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
