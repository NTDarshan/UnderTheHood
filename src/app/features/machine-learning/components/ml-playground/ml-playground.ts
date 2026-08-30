import { Component, computed, signal, viewChild, ElementRef } from '@angular/core';

interface DataPoint {
  x: number;
  y: number;
}

const X_MIN = -10;
const X_MAX = 10;
const Y_MIN = -10;
const Y_MAX = 10;
const PLANE_W = 640;
const PLANE_H = 420;
const CLICK_MOVE_THRESHOLD = 4;

const STARTER_POINTS: DataPoint[] = [
  { x: -8, y: -5 },
  { x: -5, y: -3 },
  { x: -2, y: -1 },
  { x: 1, y: 2 },
  { x: 4, y: 3.5 },
  { x: 7, y: 6 },
];

const DEFAULT_M = 0.6;
const DEFAULT_B = 0.5;

@Component({
  selector: 'app-ml-playground',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="playground">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 022 — THE PLAYGROUND</p>
        <h2 class="lab-title">Your data. Your line. Break it however you like.</h2>
        <p class="lab-lede">
          Click empty space to add a point, click a point to remove it, drag a point to move it. The sliders
          control the model — independently of whatever data you throw at it.
        </p>

        <p class="lab-note">
          A straight line is just one kind of model — real ML models can be far more complex — but the
          mechanics you're playing with here (parameters, predictions, residuals, error) are the same ones
          underneath.
        </p>

        <div class="lab-panel">
          <div class="lab-grid">
            <div class="plane-col">
              <svg
                #svgRoot
                class="plane"
                [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH"
                (click)="onCanvasClick($event)"
              >
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

                @if (showResiduals()) {
                  @for (p of points(); track $index) {
                    <line
                      [attr.x1]="toSvgX(p.x)" [attr.y1]="toSvgY(p.y)"
                      [attr.x2]="toSvgX(p.x)" [attr.y2]="toSvgY(lineYAt(p.x))"
                      class="residual-line"
                    />
                  }
                }

                @if (showPredictions()) {
                  @for (p of points(); track $index) {
                    <circle [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(lineYAt(p.x))" r="5" class="pred-marker" />
                  }
                }

                @for (p of points(); track $index; let i = $index) {
                  <circle
                    [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(p.y)"
                    r="9" class="data-point" [class.is-dragging]="dragIndex === i"
                    (pointerdown)="onPointPointerDown($event, i)"
                    (pointermove)="onPointPointerMove($event)"
                    (pointerup)="onPointPointerUp($event, i)"
                    (click)="$event.stopPropagation()"
                  />
                  @if (showErrorValue()) {
                    <text [attr.x]="toSvgX(p.x) + 12" [attr.y]="toSvgY(p.y) - 10" class="error-label mono">
                      e = {{ (p.y - lineYAt(p.x)).toFixed(2) }}
                    </text>
                  }
                }
              </svg>
              <p class="canvas-hint mono">click = add/remove a point &middot; drag = move a point</p>
            </div>

            <div class="controls-col">
              <div class="lab-field">
                <label for="m-slider-pg">Slope (m)</label>
                <input id="m-slider-pg" type="range" min="-3" max="3" step="0.1" [value]="m()" (input)="setM($event)" />
              </div>
              <div class="lab-field">
                <label for="b-slider-pg">Intercept (b)</label>
                <input id="b-slider-pg" type="range" min="-5" max="5" step="0.5" [value]="b()" (input)="setB($event)" />
              </div>

              <div class="lab-btn-row">
                <button type="button" class="lab-btn" [class.is-active]="showPredictions()" (click)="showPredictions.set(!showPredictions())">Show predictions</button>
                <button type="button" class="lab-btn" [class.is-active]="showResiduals()" (click)="showResiduals.set(!showResiduals())">Show residuals</button>
                <button type="button" class="lab-btn" [class.is-active]="showErrorValue()" (click)="showErrorValue.set(!showErrorValue())">Show error value</button>
                <button type="button" class="lab-btn" [class.is-active]="showEquation()" (click)="showEquation.set(!showEquation())">Show equation</button>
              </div>

              <button type="button" class="lab-btn lab-btn-danger" (click)="reset()">Reset</button>
            </div>
          </div>

          <div class="stats-strip mono">
            @if (showEquation()) {
              <span class="stat">y = {{ m().toFixed(1) }}x + {{ b().toFixed(1) }}</span>
            }
            <span class="stat">MSE (one possible loss function): {{ mse() === null ? '—' : mse()!.toFixed(3) }}</span>
            <span class="stat">points: {{ points().length }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .lab-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
    @media (min-width: 900px) { .lab-grid { grid-template-columns: 3fr 2fr; align-items: start; } }

    .plane-col { display: flex; flex-direction: column; gap: 8px; }
    .plane { width: 100%; height: auto; aspect-ratio: 640 / 420; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: crosshair; touch-action: none; }
    .canvas-hint { text-align: center; font-size: 0.6875rem; color: var(--text-faint); }

    .grid-line { stroke: var(--border); stroke-width: 1; }
    .grid-line-axis { stroke: var(--border-strong); stroke-width: 1.5; }

    .model-line { stroke: var(--accent); stroke-width: 2.5; }

    .data-point { fill: var(--accent-2); stroke: var(--surface); stroke-width: 1.5; cursor: pointer; touch-action: none; }
    .data-point.is-dragging { fill: var(--accent-strong); }

    .pred-marker { fill: var(--accent); stroke: var(--bg); stroke-width: 1; }
    .residual-line { stroke: var(--danger); stroke-width: 1.5; stroke-dasharray: 4 3; }
    .error-label { fill: var(--text-muted); font-size: 10px; }

    .controls-col { display: flex; flex-direction: column; gap: 18px; }

    .stats-strip { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 10px 24px; }
    .stat { font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class MlPlayground {
  private readonly svgRoot = viewChild<ElementRef<SVGSVGElement>>('svgRoot');

  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;
  protected readonly gridXs = this.range(X_MIN, X_MAX);
  protected readonly gridYs = this.range(Y_MIN, Y_MAX);

  protected readonly points = signal<DataPoint[]>(STARTER_POINTS.map((p) => ({ ...p })));
  protected readonly m = signal<number>(DEFAULT_M);
  protected readonly b = signal<number>(DEFAULT_B);

  protected readonly showPredictions = signal(false);
  protected readonly showResiduals = signal(false);
  protected readonly showErrorValue = signal(false);
  protected readonly showEquation = signal(true);

  protected readonly mse = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return null;
    const mVal = this.m();
    const bVal = this.b();
    const total = pts.reduce((sum, p) => {
      const residual = p.y - (mVal * p.x + bVal);
      return sum + residual * residual;
    }, 0);
    return total / pts.length;
  });

  protected dragIndex: number | null = null;
  private dragMoved = false;
  private dragStartClientX = 0;
  private dragStartClientY = 0;

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

  private clientToDomain(clientX: number, clientY: number): DataPoint {
    const el = this.svgRoot()?.nativeElement;
    const rect = el?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const fracX = (clientX - rect.left) / rect.width;
    const fracY = (clientY - rect.top) / rect.height;
    return {
      x: X_MIN + fracX * (X_MAX - X_MIN),
      y: Y_MAX - fracY * (Y_MAX - Y_MIN),
    };
  }

  setM(event: Event): void {
    this.m.set(+(event.target as HTMLInputElement).value);
  }

  setB(event: Event): void {
    this.b.set(+(event.target as HTMLInputElement).value);
  }

  onCanvasClick(event: MouseEvent): void {
    const { x, y } = this.clientToDomain(event.clientX, event.clientY);
    this.points.update((pts) => [...pts, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }]);
  }

  onPointPointerDown(event: PointerEvent, index: number): void {
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    this.dragIndex = index;
    this.dragMoved = false;
    this.dragStartClientX = event.clientX;
    this.dragStartClientY = event.clientY;
  }

  onPointPointerMove(event: PointerEvent): void {
    if (this.dragIndex === null) return;
    const dx = event.clientX - this.dragStartClientX;
    const dy = event.clientY - this.dragStartClientY;
    if (Math.hypot(dx, dy) > CLICK_MOVE_THRESHOLD) {
      this.dragMoved = true;
    }
    if (!this.dragMoved) return;
    const { x, y } = this.clientToDomain(event.clientX, event.clientY);
    const index = this.dragIndex;
    this.points.update((pts) => pts.map((p, i) => (i === index ? { x, y } : p)));
  }

  onPointPointerUp(event: PointerEvent, index: number): void {
    event.stopPropagation();
    if (!this.dragMoved) {
      this.points.update((pts) => pts.filter((_, i) => i !== index));
    }
    this.dragIndex = null;
    this.dragMoved = false;
  }

  reset(): void {
    this.points.set(STARTER_POINTS.map((p) => ({ ...p })));
    this.m.set(DEFAULT_M);
    this.b.set(DEFAULT_B);
  }
}
