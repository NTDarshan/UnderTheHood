import { Component, signal } from '@angular/core';

type Mode = 'training' | 'inference';

@Component({
  selector: 'app-training-vs-inference',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="training-inference">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 019 — TRAINING VS. INFERENCE</p>
        <h2 class="lab-title">Learning the pattern is a different moment from using it.</h2>

        <div class="lab-btn-row" role="tablist" aria-label="Phase">
          <button type="button" class="lab-btn" role="tab" [class.is-active]="mode() === 'training'" (click)="mode.set('training')">Training</button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="mode() === 'inference'" (click)="mode.set('inference')">Inference</button>
        </div>

        <div class="split-row">
          <div class="split-col" [class.is-dim]="mode() !== 'training'">
            <p class="split-heading mono">TRAINING</p>
            <div class="split-flow">
              <div class="lab-node flow-box">Dataset</div>
              <div class="lab-flow-arrow">→</div>
              <div class="lab-node flow-box flow-box-highlight">Algorithm</div>
              <div class="lab-flow-arrow">→</div>
              <div class="lab-node flow-box flow-box-result">Model</div>
            </div>
            <p class="split-note">Happens once (or periodically), often offline — can take time.</p>
          </div>

          <div class="split-col" [class.is-dim]="mode() !== 'inference'">
            <p class="split-heading mono">INFERENCE</p>
            <div class="split-flow">
              <div class="lab-node flow-box">New input</div>
              <div class="lab-flow-arrow">→</div>
              <div class="lab-node flow-box flow-box-highlight">Model</div>
              <div class="lab-flow-arrow">→</div>
              <div class="lab-node flow-box flow-box-result">Prediction</div>
            </div>
            <p class="split-note">Happens per request, needs to be fast.</p>
          </div>
        </div>

        <p class="active-explainer">
          @if (mode() === 'training') {
            Training is where the model learns its parameters/patterns from data.
          } @else {
            Inference is using the already-learned model to make a prediction on new input.
          }
        </p>
      </div>
    </section>
  `,
  styles: `
    .split-row { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 28px; }
    @media (min-width: 700px) { .split-row { grid-template-columns: 1fr 1fr; } }

    .split-col { padding: 18px 20px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); transition: opacity 0.25s ease; }
    .split-col.is-dim { opacity: 0.4; }

    .split-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 14px; }

    .split-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .flow-box { background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 10px 14px; }
    .flow-box-highlight { color: var(--accent); border-color: var(--accent-dim); box-shadow: 0 0 14px var(--glow-accent); }
    .flow-box-result { color: var(--accent-2); border-color: var(--accent-2-dim); }

    .split-note { margin-top: 14px; font-size: 0.8125rem; color: var(--text-faint); line-height: 1.5; }

    .active-explainer { margin-top: 24px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class TrainingVsInference {
  protected readonly mode = signal<Mode>('training');
}
