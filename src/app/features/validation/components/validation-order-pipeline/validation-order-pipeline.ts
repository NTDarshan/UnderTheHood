import { Component, signal } from '@angular/core';

const STEPS = [
  'Raw Request',
  'Parse / Bind',
  'Basic Type / Shape Checks',
  'Transformation / Normalization',
  'Structural Validation',
  'Business / Domain Validation',
  'Authorization-sensitive checks where appropriate',
  'Service',
  'Repository',
  'Database',
];

@Component({
  selector: 'app-validation-order-pipeline',
  standalone: true,
  template: `
    <section class="lab-section" id="validation-order">
      <div class="container">
        <p class="lab-index">VALIDATION / 22 — VALIDATION ORDER</p>
        <h2 class="lab-title">A conceptual order — not one universal, framework-mandated sequence.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="playing()">▶ Step through the order</button>
        </div>

        <div class="steps-list mono">
          @for (s of steps; track s; let i = $index) {
            <div class="step-row" [class.is-active]="stepIndex() >= i">
              <span class="step-index">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <span class="step-text">{{ s }}</span>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">Exact ordering varies by architecture and framework — this shows the conceptual shape, not a mandated standard.</p>
      </div>
    </section>

    <section class="lab-section" id="validation-vs-auth">
      <div class="container">
        <p class="lab-index">VALIDATION / 23 — VALIDATION VS. AUTHENTICATION VS. AUTHORIZATION</p>
        <h2 class="lab-title">Three gates. Passing one says nothing about the others.</h2>

        <div class="gates-row mono">
          <div class="gate-card"><p class="gate-name">GATE 1 — AUTHENTICATION</p><p class="gate-q">"Who are you?"</p></div>
          <div class="gate-card"><p class="gate-name">GATE 2 — AUTHORIZATION</p><p class="gate-q">"Are you allowed to perform this operation?"</p></div>
          <div class="gate-card"><p class="gate-name">GATE 3 — VALIDATION</p><p class="gate-q">"Is the input acceptable?"</p></div>
        </div>

        <div class="lab-panel example-flow mono">
          <p>Alice</p>
          <p class="arrow">↓</p>
          <p class="ok">authenticated ✓</p>
          <p class="arrow">↓</p>
          <p class="ok">authorized to create order ✓</p>
          <p class="arrow">↓</p>
          <p class="fail">order data invalid ✕</p>
          <p class="arrow">↓</p>
          <p class="fail">400 Bad Request</p>
        </div>

        <p class="lab-note lab-note-warn">Being authenticated does not mean the request is valid. Being authorized does not mean the request data is valid.</p>
      </div>
    </section>
  `,
  styles: `
    .steps-list { margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }
    .step-row { display: flex; gap: 12px; align-items: baseline; padding: 8px 12px; border-radius: var(--radius-sm); opacity: 0.4; transition: opacity 0.25s ease, background 0.25s ease; }
    .step-row.is-active { opacity: 1; background: var(--surface-raised); }
    .step-index { color: var(--accent-2); font-size: 0.6875rem; flex-shrink: 0; }
    .step-text { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-sans); }
    .step-row.is-active .step-text { color: var(--text); }

    .gates-row { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 800px) { .gates-row { grid-template-columns: repeat(3, 1fr); } }
    .gate-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; text-align: center; }
    .gate-name { font-size: 0.75rem; color: var(--accent-2); }
    .gate-q { margin-top: 8px; font-size: 0.9375rem; color: var(--text); }

    .example-flow { margin-top: 24px; text-align: center; }
    .example-flow p { font-size: 0.875rem; }
    .arrow { color: var(--text-faint); }
    .ok { color: var(--accent-2); }
    .fail { color: var(--danger); }
  `,
})
export class ValidationOrderPipeline {
  protected readonly steps = STEPS;
  protected readonly stepIndex = signal(-1);
  protected readonly playing = signal(false);

  async run(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    this.stepIndex.set(-1);
    for (let i = 0; i < this.steps.length; i++) {
      this.stepIndex.set(i);
      await wait(350);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
