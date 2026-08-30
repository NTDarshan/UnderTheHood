import { Component, computed, signal } from '@angular/core';

const X_MIN = 0;
const X_MAX = 10;
const Y_MIN = 0;
const Y_MAX = 10;
const PLANE_W = 560;
const PLANE_H = 300;

const M = 0.8;
const B = 1.2;

const TRAINING_DATA: { x: number; y: number }[] = [
  { x: 1, y: 2 },
  { x: 2, y: 3.5 },
  { x: 3, y: 3 },
  { x: 4, y: 5 },
  { x: 5, y: 4.5 },
  { x: 6, y: 6 },
  { x: 7, y: 6.5 },
  { x: 8, y: 7.5 },
];

@Component({
  selector: 'app-model-based-learning',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="model-based">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 016 — MODEL-BASED LEARNING</p>
        <h2 class="lab-title">Model-based learning turns data into a small set of numbers, once.</h2>
        <p class="lab-lede">
          Instead of keeping every example around for comparison at prediction time, a model-based approach runs
          a learning algorithm over the training data once, up front, and keeps only what it learned — the model.
        </p>

        <div class="flow-row">
          <div class="lab-node flow-node">DATA</div>
          <span class="lab-flow-arrow">→</span>
          <div class="lab-node flow-node">LEARNING ALGORITHM</div>
          <span class="lab-flow-arrow">→</span>
          <div class="lab-node flow-node flow-node-model">MODEL</div>
        </div>

        <p class="flow-caption mono">
          Linear regression, concretely: DATA → FIT MODEL → y = mx + b → PREDICT NEW POINT
        </p>

        <div class="lab-panel">
          <svg class="plane" [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH">
            @for (gx of gridXs; track gx) {
              <line [attr.x1]="toSvgX(gx)" [attr.y1]="0" [attr.x2]="toSvgX(gx)" [attr.y2]="planeH" class="grid-line" />
            }
            @for (gy of gridYs; track gy) {
              <line [attr.x1]="0" [attr.y1]="toSvgY(gy)" [attr.x2]="planeW" [attr.y2]="toSvgY(gy)" class="grid-line" />
            }

            @for (p of trainingData; track p.x + '-' + p.y) {
              <circle
                [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(p.y)" r="6"
                class="data-point" [class.is-faded]="fitted()"
              />
            }

            <line
              [attr.x1]="toSvgX(xMin)" [attr.y1]="toSvgY(lineYAt(xMin))"
              [attr.x2]="toSvgX(xMax)" [attr.y2]="toSvgY(lineYAt(xMax))"
              class="model-line" [class.is-prominent]="fitted()"
            />

            @if (predictX() !== null) {
              <circle
                [attr.cx]="toSvgX(predictX()!)" [attr.cy]="toSvgY(predictY()!)" r="7"
                class="predict-point"
              />
            }
          </svg>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="fitted()" (click)="fit()">
              Fit the model
            </button>
          </div>

          @if (fitted()) {
            <p class="lab-note">
              The model now represents the learned pattern. This does <strong>NOT</strong> mean the training
              examples are deleted — it means prediction relies primarily on the learned model rather than
              comparing against every stored example.
            </p>
          }

          <div class="predict-row">
            <label for="predict-x" class="mono predict-label">Predict for x =</label>
            <input
              id="predict-x" type="number" class="predict-input mono"
              [value]="predictInput()" (input)="onPredictInput($event)"
              min="0" max="10" step="0.5"
            />
            @if (predictX() !== null) {
              <span class="predict-result mono">ŷ = {{ mLabel }} × {{ predictX() }} + {{ bLabel }} = {{ predictY()!.toFixed(2) }}</span>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .flow-row { display: flex; align-items: center; gap: 14px; margin-top: 28px; flex-wrap: wrap; }
    .flow-node { padding: 12px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); }
    .flow-node-model { border-color: var(--accent-dim); color: var(--accent); }
    .flow-caption { margin-top: 14px; color: var(--text-muted); font-size: 0.8125rem; }

    .plane { width: 100%; height: auto; aspect-ratio: 560 / 300; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .grid-line { stroke: var(--border); stroke-width: 1; }

    .data-point { fill: var(--accent-2); opacity: 1; transition: opacity 0.6s ease; }
    .data-point.is-faded { opacity: 0.25; }

    .model-line { stroke: var(--accent); stroke-width: 2; transition: stroke-width 0.4s ease, filter 0.4s ease; }
    .model-line.is-prominent { stroke-width: 3.5; filter: drop-shadow(0 0 8px var(--glow-accent)); }

    .predict-point { fill: var(--accent-strong); filter: drop-shadow(0 0 6px var(--glow-accent)); }

    .predict-row { display: flex; align-items: center; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
    .predict-label { color: var(--text-faint); font-size: 0.8125rem; }
    .predict-input { width: 90px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text); padding: 8px 10px; font-size: 0.8125rem; }
    .predict-result { color: var(--accent-strong); font-size: 0.9375rem; }
  `,
})
export class ModelBasedLearning {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;
  protected readonly trainingData = TRAINING_DATA;
  protected readonly mLabel = M.toFixed(1);
  protected readonly bLabel = B.toFixed(1);

  protected readonly gridXs = this.range(X_MIN, X_MAX, 2);
  protected readonly gridYs = this.range(Y_MIN, Y_MAX, 2);

  protected readonly fitted = signal(false);
  protected readonly predictInput = signal<number>(6);

  protected readonly predictX = computed<number | null>(() => {
    const v = this.predictInput();
    return Number.isFinite(v) ? v : null;
  });

  protected readonly predictY = computed<number | null>(() => {
    const x = this.predictX();
    return x === null ? null : M * x + B;
  });

  private range(min: number, max: number, step: number): number[] {
    const out: number[] = [];
    for (let i = min; i <= max; i += step) out.push(i);
    return out;
  }

  protected lineYAt(x: number): number {
    return M * x + B;
  }

  protected toSvgX(x: number): number {
    return ((x - X_MIN) / (X_MAX - X_MIN)) * this.planeW;
  }

  protected toSvgY(y: number): number {
    return this.planeH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * this.planeH;
  }

  fit(): void {
    this.fitted.set(true);
  }

  onPredictInput(ev: Event): void {
    const raw = (ev.target as HTMLInputElement).value;
    const parsed = parseFloat(raw);
    this.predictInput.set(Number.isFinite(parsed) ? parsed : 0);
  }
}
