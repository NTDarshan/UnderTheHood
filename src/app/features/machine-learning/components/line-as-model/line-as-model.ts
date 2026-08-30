import { Component, computed, signal } from '@angular/core';

interface DataPoint {
  x: number;
  y: number;
}

const DATASET: DataPoint[] = [
  { x: -8, y: -6.2 },
  { x: -6, y: -3.8 },
  { x: -4, y: -3.1 },
  { x: -2, y: -0.4 },
  { x: 0, y: 1.2 },
  { x: 2, y: 1.6 },
  { x: 4, y: 3.9 },
  { x: 6, y: 4.4 },
];

const X_MIN = -10;
const X_MAX = 10;
const Y_MIN = -10;
const Y_MAX = 10;
const PLANE_W = 560;
const PLANE_H = 400;

@Component({
  selector: 'app-line-as-model',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="line-as-model">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 007 — THE LINE AS A MODEL</p>
        <h2 class="lab-title">A line can guess. That's what makes it a model.</h2>
        <p class="lab-lede">
          Feed it an <span class="mono">x</span>, and the line hands back a guess: <span class="mono">ŷ</span>.
          Whether that guess is any good depends entirely on the two parameters underneath.
        </p>

        <div class="flow-row" role="img" aria-label="x flows into the model, which outputs y hat">
          <div class="lab-node flow-box">x</div>
          <span class="lab-flow-arrow">&rarr;</span>
          <div class="lab-node flow-box flow-box-model">
            MODEL
            <span class="flow-sub mono">PARAMETERS: m, b</span>
          </div>
          <span class="lab-flow-arrow">&rarr;</span>
          <div class="lab-node flow-box">&#375;</div>
        </div>

        <div class="lab-panel">
          <div class="lab-grid">
            <div class="plane-col">
              <svg class="plane" [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH">
                @for (gx of gridXs; track gx) {
                  <line [attr.x1]="toSvgX(gx)" [attr.y1]="0" [attr.x2]="toSvgX(gx)" [attr.y2]="planeH" class="grid-line" [class.grid-line-axis]="gx === 0" />
                }
                @for (gy of gridYs; track gy) {
                  <line [attr.x1]="0" [attr.y1]="toSvgY(gy)" [attr.x2]="planeW" [attr.y2]="toSvgY(gy)" class="grid-line" [class.grid-line-axis]="gy === 0" />
                }

                <line
                  [attr.x1]="toSvgX(xMin)" [attr.y1]="toSvgY(lineYAt(xMin))"
                  [attr.x2]="toSvgX(xMax)" [attr.y2]="toSvgY(lineYAt(xMax))"
                  class="model-line"
                />

                @for (p of dataset; track p.x) {
                  <circle
                    [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(p.y)"
                    r="7" class="data-point" [class.is-selected]="selectedPoint()?.x === p.x"
                    (click)="selectedPoint.set(p)"
                  />
                }

                @if (selectedPoint(); as sp) {
                  <circle [attr.cx]="toSvgX(sp.x)" [attr.cy]="toSvgY(sp.y)" r="10" class="callout-ring callout-ring-actual" />
                  <circle [attr.cx]="toSvgX(sp.x)" [attr.cy]="toSvgY(predictedFor(sp))" r="10" class="callout-ring callout-ring-pred" />
                  <line
                    [attr.x1]="toSvgX(sp.x)" [attr.y1]="toSvgY(sp.y)"
                    [attr.x2]="toSvgX(sp.x)" [attr.y2]="toSvgY(predictedFor(sp))"
                    class="gap-line"
                  />
                }
              </svg>

              @if (selectedPoint(); as sp) {
                <div class="callout-row">
                  <p class="callout callout-actual mono">y (actual) = {{ sp.y.toFixed(1) }}</p>
                  <p class="callout callout-pred mono">&#375; (predicted) = {{ predictedFor(sp).toFixed(1) }}</p>
                </div>
                <p class="callout-explain">
                  The dataset says the actual value here is <span class="mono">y</span>. The line — our model —
                  predicts <span class="mono">ŷ</span>. They usually don't match exactly.
                </p>
              } @else {
                <p class="callout-hint">Click a data point to compare its actual value against the line's prediction.</p>
              }
            </div>

            <div class="controls-col">
              <div class="lab-field">
                <label for="m-slider-2">Slope (m)</label>
                <input id="m-slider-2" type="range" min="-3" max="3" step="0.1" [value]="m()" (input)="setM($event)" />
              </div>
              <div class="lab-field">
                <label for="b-slider-2">Intercept (b)</label>
                <input id="b-slider-2" type="range" min="-5" max="5" step="0.5" [value]="b()" (input)="setB($event)" />
              </div>
              <p class="equation mono">y = {{ m().toFixed(1) }}x + {{ b().toFixed(1) }}</p>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Linear regression (a line) is just one kind of model — many ML models aren't lines at all.
        </p>
      </div>
    </section>
  `,
  styles: `
    .flow-row { display: flex; align-items: center; gap: 16px; margin-top: 28px; flex-wrap: wrap; }
    .flow-box { padding: 14px 22px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .flow-box-model { border-color: var(--accent-dim); color: var(--accent); }
    .flow-sub { font-size: 0.6875rem; letter-spacing: 0.04em; color: var(--text-faint); text-transform: none; }

    .lab-grid { display: grid; grid-template-columns: 1fr; gap: 32px; margin-top: 4px; }
    @media (min-width: 900px) { .lab-grid { grid-template-columns: 3fr 2fr; align-items: start; } }

    .plane-col { display: flex; flex-direction: column; gap: 10px; }
    .plane { width: 100%; height: auto; aspect-ratio: 560 / 400; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .grid-line { stroke: var(--border); stroke-width: 1; }
    .grid-line-axis { stroke: var(--border-strong); stroke-width: 1.5; }

    .model-line { stroke: var(--accent); stroke-width: 2.5; }

    .data-point { fill: var(--accent-2); stroke: var(--surface); stroke-width: 1.5; cursor: pointer; }
    .data-point.is-selected { fill: var(--accent-strong); }

    .callout-ring { fill: none; stroke-width: 1.5; stroke-dasharray: 3 3; }
    .callout-ring-actual { stroke: var(--accent-2); }
    .callout-ring-pred { stroke: var(--accent); }
    .gap-line { stroke: var(--danger); stroke-width: 1.5; stroke-dasharray: 4 3; }

    .callout-row { display: flex; flex-wrap: wrap; gap: 12px 20px; }
    .callout { font-size: 0.875rem; }
    .callout-actual { color: var(--accent-2); }
    .callout-pred { color: var(--accent-strong); }
    .callout-explain { color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; max-width: 520px; }
    .callout-hint { color: var(--text-faint); font-size: 0.875rem; }

    .controls-col { display: flex; flex-direction: column; gap: 18px; }
    .equation { font-size: 1.25rem; color: var(--accent-strong); margin-top: 4px; }
  `,
})
export class LineAsModel {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;
  protected readonly dataset = DATASET;

  protected readonly gridXs = this.range(X_MIN, X_MAX);
  protected readonly gridYs = this.range(Y_MIN, Y_MAX);

  protected readonly m = signal<number>(0.6);
  protected readonly b = signal<number>(1);
  protected readonly selectedPoint = signal<DataPoint | null>(null);

  private range(min: number, max: number): number[] {
    const out: number[] = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
  }

  protected lineYAt(x: number): number {
    return this.m() * x + this.b();
  }

  protected predictedFor(p: DataPoint): number {
    return this.lineYAt(p.x);
  }

  protected toSvgX(x: number): number {
    return ((x - X_MIN) / (X_MAX - X_MIN)) * this.planeW;
  }

  protected toSvgY(y: number): number {
    return this.planeH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * this.planeH;
  }

  setM(ev: Event): void {
    this.m.set(+(ev.target as HTMLInputElement).value);
  }

  setB(ev: Event): void {
    this.b.set(+(ev.target as HTMLInputElement).value);
  }
}
