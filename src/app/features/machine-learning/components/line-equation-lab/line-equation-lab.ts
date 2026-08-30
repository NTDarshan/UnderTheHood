import { Component, computed, signal } from '@angular/core';

type Var = 'm' | 'x' | 'b' | 'y';

const VAR_INFO: Record<Var, string> = {
  m: 'Slope — controls how steeply the line rises or falls per unit of x.',
  x: 'Input value.',
  b: 'Intercept — where the line crosses the y-axis (vertical offset).',
  y: 'Output value the line produces for a given x.',
};

const X_MIN = -10;
const X_MAX = 10;
const Y_MIN = -10;
const Y_MAX = 10;
const PLANE_W = 560;
const PLANE_H = 400;

const HANDLE_X1 = -4;
const HANDLE_X2 = 4;

@Component({
  selector: 'app-line-equation-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="line-lab">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 006 — THE EQUATION OF A LINE</p>
        <h2 class="lab-title">Every straight line is just two numbers.</h2>
        <p class="lab-lede">
          Drag the plane, drag the sliders, or drag the handles sitting right on the line — they all edit the
          same two numbers underneath: a slope <span class="mono">m</span> and an intercept <span class="mono">b</span>.
        </p>

        <div class="lab-panel">
          <div class="lab-grid">
            <div class="plane-col">
              <svg
                class="plane"
                [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH"
                (pointermove)="onPointerMove($event)"
                (pointerup)="stopDrag()"
                (pointerleave)="stopDrag()"
              >
                @for (gx of gridXs; track gx) {
                  <line
                    [attr.x1]="toSvgX(gx)" [attr.y1]="0"
                    [attr.x2]="toSvgX(gx)" [attr.y2]="planeH"
                    class="grid-line" [class.grid-line-axis]="gx === 0"
                  />
                }
                @for (gy of gridYs; track gy) {
                  <line
                    [attr.x1]="0" [attr.y1]="toSvgY(gy)"
                    [attr.x2]="planeW" [attr.y2]="toSvgY(gy)"
                    class="grid-line" [class.grid-line-axis]="gy === 0"
                  />
                }

                <text [attr.x]="planeW - 14" [attr.y]="toSvgY(0) - 8" class="axis-label mono">x</text>
                <text [attr.x]="toSvgX(0) + 10" [attr.y]="14" class="axis-label mono">y</text>

                <line
                  [attr.x1]="toSvgX(xMin)" [attr.y1]="toSvgY(lineYAt(xMin))"
                  [attr.x2]="toSvgX(xMax)" [attr.y2]="toSvgY(lineYAt(xMax))"
                  class="model-line"
                />

                <line
                  [attr.x1]="toSvgX(handleX1)" [attr.y1]="toSvgY(lineYAt(handleX1))"
                  [attr.x2]="toSvgX(handleX1)" [attr.y2]="toSvgY(lineYAt(handleX2))"
                  class="rise-run-line"
                />
                <line
                  [attr.x1]="toSvgX(handleX1)" [attr.y1]="toSvgY(lineYAt(handleX2))"
                  [attr.x2]="toSvgX(handleX2)" [attr.y2]="toSvgY(lineYAt(handleX2))"
                  class="rise-run-line"
                />
                <text
                  [attr.x]="toSvgX(handleX1) - 10" [attr.y]="(toSvgY(lineYAt(handleX1)) + toSvgY(lineYAt(handleX2))) / 2"
                  class="rise-run-label mono" text-anchor="end"
                >rise</text>
                <text
                  [attr.x]="(toSvgX(handleX1) + toSvgX(handleX2)) / 2" [attr.y]="toSvgY(lineYAt(handleX2)) + 18"
                  class="rise-run-label mono" text-anchor="middle"
                >run</text>

                <circle
                  [attr.cx]="toSvgX(handleX1)" [attr.cy]="toSvgY(lineYAt(handleX1))"
                  r="9" class="handle" [class.is-dragging]="dragging() === 1"
                  (pointerdown)="startDrag($event, 1)"
                />
                <circle
                  [attr.cx]="toSvgX(handleX2)" [attr.cy]="toSvgY(lineYAt(handleX2))"
                  r="9" class="handle" [class.is-dragging]="dragging() === 2"
                  (pointerdown)="startDrag($event, 2)"
                />
              </svg>

              <p class="rise-run-fraction mono">rise / run = {{ riseOverRunLabel() }}</p>
            </div>

            <div class="controls-col">
              <div class="lab-field">
                <label for="m-slider">Slope (m)</label>
                <input
                  id="m-slider" type="range" min="-3" max="3" step="0.1"
                  [value]="m()" (input)="setM($event)"
                />
              </div>
              <div class="lab-field">
                <label for="b-slider">Intercept (b)</label>
                <input
                  id="b-slider" type="range" min="-5" max="5" step="0.5"
                  [value]="b()" (input)="setB($event)"
                />
              </div>

              <p class="equation mono">y = {{ mLabel() }}x {{ bSign() }} {{ bLabel() }}</p>

              <div class="lab-btn-row">
                <button type="button" class="lab-btn" (click)="applyPreset(1)">Positive slope</button>
                <button type="button" class="lab-btn" (click)="applyPreset(0)">Zero slope</button>
                <button type="button" class="lab-btn" (click)="applyPreset(-1)">Negative slope</button>
              </div>
              <p class="slope-case mono">{{ slopeCase() }}</p>
            </div>
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">Equation breakdown — click a term</p>
          <div class="chip-row">
            <button type="button" class="chip" [class.is-active]="selectedVar() === 'y'" (click)="selectedVar.set('y')">y</button>
            <span class="chip-eq mono">=</span>
            <button type="button" class="chip" [class.is-active]="selectedVar() === 'm'" (click)="selectedVar.set('m')">m</button>
            <button type="button" class="chip" [class.is-active]="selectedVar() === 'x'" (click)="selectedVar.set('x')">x</button>
            <span class="chip-eq mono">+</span>
            <button type="button" class="chip" [class.is-active]="selectedVar() === 'b'" (click)="selectedVar.set('b')">b</button>
          </div>
          <p class="var-detail">{{ varDetail() }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .lab-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
    @media (min-width: 900px) { .lab-grid { grid-template-columns: 3fr 2fr; align-items: start; } }

    .plane-col { display: flex; flex-direction: column; gap: 10px; }
    .plane { width: 100%; height: auto; aspect-ratio: 560 / 400; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); touch-action: none; }

    .grid-line { stroke: var(--border); stroke-width: 1; }
    .grid-line-axis { stroke: var(--border-strong); stroke-width: 1.5; }
    .axis-label { fill: var(--text-faint); font-size: 12px; }

    .model-line { stroke: var(--accent); stroke-width: 2.5; }

    .rise-run-line { stroke: var(--accent-2); stroke-width: 1.5; stroke-dasharray: 5 4; }
    .rise-run-label { fill: var(--accent-2); font-size: 11px; }
    .rise-run-fraction { color: var(--accent-2); font-size: 0.8125rem; }

    .handle { fill: var(--surface-elevated); stroke: var(--accent-strong); stroke-width: 2; cursor: grab; }
    .handle.is-dragging { fill: var(--accent-strong); cursor: grabbing; }

    .controls-col { display: flex; flex-direction: column; gap: 18px; }
    .equation { font-size: 1.25rem; color: var(--accent-strong); margin-top: 4px; }
    .slope-case { color: var(--text-muted); font-size: 0.8125rem; margin-top: -4px; }

    .chip-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
    .chip { font-family: var(--font-mono); font-size: 0.9375rem; font-weight: 700; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-muted); transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease; }
    .chip:hover { border-color: var(--accent-2); color: var(--accent-2); }
    .chip.is-active { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated)); }
    .chip-eq { color: var(--text-faint); }

    .var-detail { margin-top: 14px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; min-height: 1.6em; }
  `,
})
export class LineEquationLab {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;
  protected readonly handleX1 = HANDLE_X1;
  protected readonly handleX2 = HANDLE_X2;

  protected readonly gridXs = this.range(X_MIN, X_MAX);
  protected readonly gridYs = this.range(Y_MIN, Y_MAX);

  protected readonly m = signal<number>(1);
  protected readonly b = signal<number>(0);
  protected readonly selectedVar = signal<Var>('m');
  protected readonly dragging = signal<0 | 1 | 2>(0);

  private svgEl: SVGSVGElement | null = null;

  protected readonly mLabel = computed(() => this.m().toFixed(1));
  protected readonly bLabel = computed(() => Math.abs(this.b()).toFixed(1));
  protected readonly bSign = computed(() => (this.b() < 0 ? '-' : '+'));

  protected readonly slopeCase = computed(() => {
    const m = this.m();
    if (Math.abs(m) < 0.05) return 'ZERO SLOPE — a flat, horizontal line.';
    return m > 0 ? 'POSITIVE SLOPE — the line rises left to right.' : 'NEGATIVE SLOPE — the line falls left to right.';
  });

  protected readonly riseOverRunLabel = computed(() => {
    const rise = this.lineYAt(this.handleX2) - this.lineYAt(this.handleX1);
    const run = this.handleX2 - this.handleX1;
    return `${rise.toFixed(1)} / ${run.toFixed(1)} = ${this.m().toFixed(1)}`;
  });

  protected readonly varDetail = computed(() => VAR_INFO[this.selectedVar()]);

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

  private fromSvgY(svgY: number): number {
    return Y_MIN + ((this.planeH - svgY) / this.planeH) * (Y_MAX - Y_MIN);
  }

  private svgPointFromClient(ev: PointerEvent): { x: number; y: number } | null {
    if (!this.svgEl) return null;
    const rect = this.svgEl.getBoundingClientRect();
    const scaleX = this.planeW / rect.width;
    const scaleY = this.planeH / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  }

  setM(ev: Event): void {
    this.m.set(+(ev.target as HTMLInputElement).value);
  }

  setB(ev: Event): void {
    this.b.set(+(ev.target as HTMLInputElement).value);
  }

  applyPreset(m: number): void {
    this.m.set(m);
  }

  startDrag(ev: PointerEvent, handle: 1 | 2): void {
    ev.preventDefault();
    this.svgEl = (ev.currentTarget as SVGCircleElement).ownerSVGElement;
    this.dragging.set(handle);
  }

  stopDrag(): void {
    this.dragging.set(0);
  }

  onPointerMove(ev: PointerEvent): void {
    const which = this.dragging();
    if (which === 0) return;
    if (!this.svgEl) this.svgEl = ev.currentTarget as SVGSVGElement;
    const pt = this.svgPointFromClient(ev);
    if (!pt) return;
    const draggedX = which === 1 ? this.handleX1 : this.handleX2;
    const otherX = which === 1 ? this.handleX2 : this.handleX1;
    const draggedY = this.clamp(this.fromSvgY(pt.y), Y_MIN, Y_MAX);
    const otherY = this.lineYAt(otherX);

    const dx = which === 1 ? draggedX - otherX : otherX - draggedX;
    if (Math.abs(dx) < 1e-6) return;
    const newM =
      which === 1
        ? (otherY - draggedY) / (otherX - draggedX)
        : (draggedY - otherY) / (draggedX - otherX);
    const newB = draggedY - newM * draggedX;
    this.m.set(this.clamp(Math.round(newM * 10) / 10, -3, 3));
    this.b.set(this.clamp(Math.round(newB * 2) / 2, -5, 5));
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
