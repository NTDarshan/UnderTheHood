import { Component } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-ml-mental-model',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section class="lab-section" id="mental-model">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 021 — THE COMPLETE MENTAL MODEL</p>
        <h2 class="lab-title">Every piece you've learned, in one picture.</h2>
        <p class="lab-lede">
          Nothing new here — just the whole shape of it, assembled from the parts you've already met.
        </p>

        <div class="lab-panel stage-panel" appReveal>
          <p class="stage-label mono">THE PIPELINE</p>
          <div class="flow-wrap">
            @for (n of pipeline; track n; let i = $index; let last = $last) {
              <div class="lab-node flow-box" appReveal [appRevealDelay]="i * 90">{{ n }}</div>
              @if (!last) {
                <span class="lab-flow-arrow">&rarr;</span>
              }
            }
          </div>
        </div>

        <div class="lab-panel stage-panel" appReveal [appRevealDelay]="80">
          <p class="stage-label mono">TWO MODES OF THE SAME PIPELINE</p>
          <div class="mini-grid">
            <div class="mini-flow" appReveal>
              <p class="mini-title mono">TRAINING</p>
              <div class="flow-wrap flow-wrap-mini">
                <div class="lab-node flow-box flow-box-sm">Data</div>
                <span class="lab-flow-arrow">&rarr;</span>
                <div class="lab-node flow-box flow-box-sm">Algorithm</div>
                <span class="lab-flow-arrow">&rarr;</span>
                <div class="lab-node flow-box flow-box-sm flow-box-model">Parameters</div>
              </div>
            </div>
            <div class="mini-flow" appReveal [appRevealDelay]="90">
              <p class="mini-title mono">INFERENCE</p>
              <div class="flow-wrap flow-wrap-mini">
                <div class="lab-node flow-box flow-box-sm">Input</div>
                <span class="lab-flow-arrow">&rarr;</span>
                <div class="lab-node flow-box flow-box-sm flow-box-model">Model</div>
                <span class="lab-flow-arrow">&rarr;</span>
                <div class="lab-node flow-box flow-box-sm">Prediction</div>
              </div>
            </div>
          </div>
          <p class="stage-note">
            Training happens once (or occasionally, when you retrain). Inference happens every single time
            someone asks the model for an answer.
          </p>
        </div>

        <div class="lab-panel stage-panel" appReveal [appRevealDelay]="160">
          <p class="stage-label mono">THE GEOMETRIC VIEW</p>
          <div class="flow-wrap">
            @for (n of geometry; track n; let i = $index; let last = $last) {
              <div class="lab-node flow-box" appReveal [appRevealDelay]="i * 90">{{ n }}</div>
              @if (!last) {
                <span class="lab-flow-arrow">&rarr;</span>
              }
            }
          </div>
          <p class="stage-note">
            Fitting a model is, underneath, a geometry problem: finding the line, plane, or hyperplane that sits
            closest to every point in the feature space.
          </p>
        </div>

        <p class="lab-note" appReveal [appRevealDelay]="240">
          The pipeline, the training/inference split, and the geometry — these aren't three separate topics.
          They're three lenses on the exact same underlying idea, each one revealing something the others don't
          make obvious.
        </p>
      </div>
    </section>
  `,
  styles: `
    .stage-panel { margin-top: 24px; }
    .stage-panel:first-of-type { margin-top: 28px; }
    .stage-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 18px; }

    .flow-wrap { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .flow-wrap-mini { gap: 10px; }

    .flow-box { padding: 12px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); text-align: center; }
    .flow-box-sm { padding: 9px 14px; font-size: 0.6875rem; }
    .flow-box-model { border-color: var(--accent-dim); color: var(--accent); }

    .mini-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 720px) { .mini-grid { grid-template-columns: 1fr 1fr; } }
    .mini-flow { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .mini-title { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 12px; }

    .stage-note { margin-top: 18px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; max-width: 640px; }
  `,
})
export class MlMentalModel {
  protected readonly pipeline = [
    'RAW DATA',
    'FEATURES',
    'DATASET',
    'LEARNING ALGORITHM',
    'MODEL',
    'NEW INPUT',
    'PREDICTION',
  ];

  protected readonly geometry = [
    'DATA POINTS',
    'FEATURE SPACE',
    'LINE / PLANE / HYPERPLANE',
    'DISTANCE / ERROR',
    'MODEL',
  ];
}
