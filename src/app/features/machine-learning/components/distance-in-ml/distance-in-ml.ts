import { Component, computed, signal } from '@angular/core';

const PLANE_W = 500;
const PLANE_H = 380;

const LINE_X1 = 40;
const LINE_Y1 = 340;
const LINE_X2 = 460;
const LINE_Y2 = 40;

const CLASS_A: Array<[number, number]> = [
  [90, 300],
  [140, 260],
  [90, 220],
  [180, 300],
  [130, 330],
  [60, 250],
];

const CLASS_B: Array<[number, number]> = [
  [400, 90],
  [350, 130],
  [410, 160],
  [320, 70],
  [370, 200],
  [430, 220],
];

const FAR_THRESHOLD = 90;
const NEAR_THRESHOLD = 30;

@Component({
  selector: 'app-distance-in-ml',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="distance-ml">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 014 — WHY DISTANCE MATTERS IN ML</p>
        <h2 class="lab-title">Drag the test point — watch its distance to the boundary change.</h2>
        <p class="lab-lede">
          The diagonal line is a decision boundary separating two classes. Drag the star anywhere and its
          real perpendicular distance to that line is computed live.
        </p>

        <div class="lab-panel">
          <svg
            class="plane"
            [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH"
            (pointermove)="onPointerMove($event)"
            (pointerup)="stopDrag()"
            (pointerleave)="stopDrag()"
          >
            <line [attr.x1]="lineX1" [attr.y1]="lineY1" [attr.x2]="lineX2" [attr.y2]="lineY2" class="boundary-line" />

            @for (p of classA; track $index) {
              <circle [attr.cx]="p[0]" [attr.cy]="p[1]" r="7" class="dot dot-a" />
            }
            @for (p of classB; track $index) {
              <circle [attr.cx]="p[0]" [attr.cy]="p[1]" r="7" class="dot dot-b" />
            }

            <line
              [attr.x1]="testX()" [attr.y1]="testY()"
              [attr.x2]="footPoint().x" [attr.y2]="footPoint().y"
              class="drop-line"
            />

            <path
              [attr.d]="starPath()"
              class="test-point"
              [class.is-dragging]="dragging()"
              (pointerdown)="startDrag($event)"
            />
          </svg>

          <div class="readout-row">
            <p class="distance-readout mono">Distance to boundary: {{ distance().toFixed(1) }}</p>
            <p class="distance-label" [class.is-far]="isFar()" [class.is-near]="isNear()">{{ distanceLabel() }}</p>
          </div>
        </div>

        <div class="claim-box">
          <p class="claim-wrong mono">✗ "Distance from the boundary IS the model's confidence/probability."</p>
          <p class="claim-right">
            <strong>FALSE.</strong> Geometric distance from a decision boundary is not automatically the same
            thing as a predicted probability or confidence score — even though intuitively "farther = more
            confident" often holds in practice, they are not mathematically the same thing. Turning a distance
            into a probability requires an extra, separate step (for example a calibration function), and that
            step depends on the model — it isn't a free consequence of geometry alone.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .plane { width: 100%; height: auto; aspect-ratio: 500 / 380; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); touch-action: none; }

    .boundary-line { stroke: var(--accent); stroke-width: 2.5; }
    .dot-a { fill: var(--accent-2); }
    .dot-b { fill: var(--accent); }

    .drop-line { stroke: var(--danger); stroke-width: 1.5; stroke-dasharray: 5 4; }

    .test-point { fill: var(--accent-strong); stroke: var(--surface); stroke-width: 1.5; cursor: grab; filter: drop-shadow(0 0 6px var(--glow-accent)); }
    .test-point.is-dragging { cursor: grabbing; }

    .readout-row { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .distance-readout { font-size: 1rem; color: var(--accent-2); }
    .distance-label { font-size: 0.9375rem; color: var(--text-muted); }
    .distance-label.is-far { color: var(--accent-2); }
    .distance-label.is-near { color: var(--danger); }

    .claim-box { margin-top: 28px; max-width: 700px; padding: 20px 22px; background: var(--surface-raised); border-left: 2px solid var(--danger); border-radius: var(--radius-sm); }
    .claim-wrong { color: var(--danger); font-size: 0.875rem; margin-bottom: 10px; text-decoration: line-through; text-decoration-thickness: 2px; }
    .claim-right { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .claim-right strong { color: var(--text); }
  `,
})
export class DistanceInMl {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly lineX1 = LINE_X1;
  protected readonly lineY1 = LINE_Y1;
  protected readonly lineX2 = LINE_X2;
  protected readonly lineY2 = LINE_Y2;
  protected readonly classA = CLASS_A;
  protected readonly classB = CLASS_B;

  protected readonly testX = signal<number>(250);
  protected readonly testY = signal<number>(190);
  protected readonly dragging = signal(false);

  private svgEl: SVGSVGElement | null = null;

  protected readonly distance = computed(() => {
    const dx = LINE_X2 - LINE_X1;
    const dy = LINE_Y2 - LINE_Y1;
    const num = Math.abs(dy * this.testX() - dx * this.testY() + LINE_X2 * LINE_Y1 - LINE_Y2 * LINE_X1);
    const den = Math.sqrt(dx * dx + dy * dy);
    return num / den;
  });

  protected readonly footPoint = computed(() => {
    const dx = LINE_X2 - LINE_X1;
    const dy = LINE_Y2 - LINE_Y1;
    const lenSq = dx * dx + dy * dy;
    const t = ((this.testX() - LINE_X1) * dx + (this.testY() - LINE_Y1) * dy) / lenSq;
    return { x: LINE_X1 + t * dx, y: LINE_Y1 + t * dy };
  });

  protected readonly isFar = computed(() => this.distance() >= FAR_THRESHOLD);
  protected readonly isNear = computed(() => this.distance() <= NEAR_THRESHOLD);

  protected readonly distanceLabel = computed(() => {
    if (this.isFar()) return 'Far from the boundary — strong separation.';
    if (this.isNear()) return 'Near the boundary — more uncertain, more sensitive to noise.';
    return 'Moderate distance from the boundary.';
  });

  protected readonly starPath = computed(() => this.buildStar(this.testX(), this.testY(), 11));

  private buildStar(cx: number, cy: number, r: number): string {
    const points: string[] = [];
    const inner = r * 0.45;
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? r : inner;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(' ') + ' Z';
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

  startDrag(ev: PointerEvent): void {
    ev.preventDefault();
    this.svgEl = (ev.currentTarget as SVGPathElement).ownerSVGElement;
    this.dragging.set(true);
  }

  stopDrag(): void {
    this.dragging.set(false);
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging()) return;
    if (!this.svgEl) this.svgEl = ev.currentTarget as SVGSVGElement;
    const pt = this.svgPointFromClient(ev);
    if (!pt) return;
    this.testX.set(this.clamp(pt.x, 0, this.planeW));
    this.testY.set(this.clamp(pt.y, 0, this.planeH));
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
