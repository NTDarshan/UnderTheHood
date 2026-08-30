import { Component, computed, signal } from '@angular/core';

interface DataPoint {
  x: number;
  y: number;
}

interface ResidualRow {
  x: number;
  y: number;
  yHat: number;
  residual: number;
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
  selector: 'app-residual-error',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="residual">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 008 — RESIDUALS: HOW WRONG IS THE MODEL?</p>
        <h2 class="lab-title">Every gap between the dot and the line has a name.</h2>
        <p class="lab-lede">
          The vertical distance between an actual value <span class="mono">y</span> and the line's prediction
          <span class="mono">ŷ</span> at that same x is called the <strong>residual</strong>.
        </p>

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

                @for (row of residualRows(); track row.x) {
                  <line
                    [attr.x1]="toSvgX(row.x)" [attr.y1]="toSvgY(row.y)"
                    [attr.x2]="toSvgX(row.x)" [attr.y2]="toSvgY(row.yHat)"
                    class="residual-line"
                  />
                }

                @for (p of dataset; track p.x) {
                  <circle [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(p.y)" r="6" class="data-point" />
                }
              </svg>
              <p class="residual-legend">
                <span class="legend-swatch" aria-hidden="true"></span>
                <span class="mono">RESIDUAL</span> — the dashed red segment between each dot and the line.
              </p>
            </div>

            <div class="controls-col">
              <div class="lab-field">
                <label for="m-slider-3">Slope (m)</label>
                <input id="m-slider-3" type="range" min="-3" max="3" step="0.1" [value]="m()" (input)="setM($event)" />
              </div>
              <div class="lab-field">
                <label for="b-slider-3">Intercept (b)</label>
                <input id="b-slider-3" type="range" min="-5" max="5" step="0.5" [value]="b()" (input)="setB($event)" />
              </div>
              <p class="equation mono">y = {{ m().toFixed(1) }}x + {{ b().toFixed(1) }}</p>
            </div>
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">Residuals per point — e = y - ŷ</p>
          <div class="residual-table" role="table" aria-label="Residuals per data point">
            <div class="residual-header mono" role="row">
              <span role="columnheader">x</span>
              <span role="columnheader">y (actual)</span>
              <span role="columnheader">ŷ (predicted)</span>
              <span role="columnheader">e = y - ŷ</span>
            </div>
            @for (row of residualRows(); track row.x) {
              <div class="residual-row mono" role="row">
                <span role="cell">{{ row.x }}</span>
                <span role="cell">{{ row.y.toFixed(1) }}</span>
                <span role="cell">{{ row.yHat.toFixed(2) }}</span>
                <span role="cell" [class.is-nonzero]="!isNearZero(row.residual)" [class.is-zero]="isNearZero(row.residual)">
                  {{ row.residual >= 0 ? '+' : '' }}{{ row.residual.toFixed(2) }}
                </span>
              </div>
            }
          </div>

          <p class="total-error mono">TOTAL ERROR (naive sum) = {{ totalError() >= 0 ? '+' : '' }}{{ totalError().toFixed(2) }}</p>
          <p class="total-caption">Naively summed — this is misleading, see the next section for why.</p>
        </div>

        <p class="lab-note">
          The model "wants" a line that makes these residuals small — but how exactly should we measure
          "small"? That's next.
        </p>
      </div>
    </section>
  `,
  styles: `
    .lab-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
    @media (min-width: 900px) { .lab-grid { grid-template-columns: 3fr 2fr; align-items: start; } }

    .plane-col { display: flex; flex-direction: column; gap: 10px; }
    .plane { width: 100%; height: auto; aspect-ratio: 560 / 400; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .grid-line { stroke: var(--border); stroke-width: 1; }
    .grid-line-axis { stroke: var(--border-strong); stroke-width: 1.5; }

    .model-line { stroke: var(--accent); stroke-width: 2.5; }
    .data-point { fill: var(--accent-2); stroke: var(--surface); stroke-width: 1.5; }
    .residual-line { stroke: var(--danger); stroke-width: 1.5; stroke-dasharray: 4 3; }

    .residual-legend { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .legend-swatch { display: inline-block; width: 20px; height: 0; border-top: 1.5px dashed var(--danger); }

    .controls-col { display: flex; flex-direction: column; gap: 18px; }
    .equation { font-size: 1.25rem; color: var(--accent-strong); margin-top: 4px; }

    .residual-table { margin-top: 16px; display: flex; flex-direction: column; gap: 2px; font-size: 0.8125rem; }
    .residual-header, .residual-row { display: grid; grid-template-columns: 1fr 1.4fr 1.4fr 1.4fr; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); }
    .residual-header { color: var(--text-faint); font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .residual-row { background: var(--surface); color: var(--text-muted); }
    .residual-row .is-nonzero { color: var(--danger); }
    .residual-row .is-zero { color: var(--text-faint); }

    .total-error { margin-top: 18px; font-size: 1.0625rem; color: var(--text); }
    .total-caption { margin-top: 4px; font-size: 0.8125rem; color: var(--text-faint); }
  `,
})
export class ResidualError {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;
  protected readonly dataset = DATASET;

  protected readonly gridXs = this.range(X_MIN, X_MAX);
  protected readonly gridYs = this.range(Y_MIN, Y_MAX);

  protected readonly m = signal<number>(0.6);
  protected readonly b = signal<number>(1);

  protected readonly residualRows = computed<ResidualRow[]>(() =>
    this.dataset.map((p) => {
      const yHat = this.lineYAt(p.x);
      return { x: p.x, y: p.y, yHat, residual: p.y - yHat };
    }),
  );

  protected readonly totalError = computed(() =>
    this.residualRows().reduce((sum, row) => sum + row.residual, 0),
  );

  private range(min: number, max: number): number[] {
    const out: number[] = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
  }

  protected lineYAt(x: number): number {
    return this.m() * x + this.b();
  }

  protected toSvgX(x: number): number {
    return ((x - X_MIN) / (X_MAX - X_MIN)) * this.planeW;
  }

  protected toSvgY(y: number): number {
    return this.planeH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * this.planeH;
  }

  protected isNearZero(v: number): boolean {
    return Math.abs(v) < 0.05;
  }

  setM(ev: Event): void {
    this.m.set(+(ev.target as HTMLInputElement).value);
  }

  setB(ev: Event): void {
    this.b.set(+(ev.target as HTMLInputElement).value);
  }
}
