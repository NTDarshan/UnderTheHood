import { Component, computed, signal } from '@angular/core';

type Cls = 'A' | 'B';

interface TrainingPoint {
  x: number;
  y: number;
  cls: Cls;
}

const PLANE_W = 560;
const PLANE_H = 360;

const TRAINING_POINTS: TrainingPoint[] = [
  { x: 120, y: 260, cls: 'A' },
  { x: 150, y: 230, cls: 'A' },
  { x: 100, y: 210, cls: 'A' },
  { x: 170, y: 280, cls: 'A' },
  { x: 140, y: 300, cls: 'A' },
  { x: 200, y: 240, cls: 'A' },
  { x: 90, y: 260, cls: 'A' },
  { x: 220, y: 210, cls: 'A' },
  { x: 160, y: 190, cls: 'A' },
  { x: 400, y: 120, cls: 'B' },
  { x: 430, y: 150, cls: 'B' },
  { x: 380, y: 90, cls: 'B' },
  { x: 450, y: 100, cls: 'B' },
  { x: 410, y: 180, cls: 'B' },
  { x: 470, y: 140, cls: 'B' },
  { x: 350, y: 140, cls: 'B' },
  { x: 340, y: 100, cls: 'B' },
  { x: 300, y: 170, cls: 'B' },
];

const K_OPTIONS = [1, 3, 5, 7] as const;

@Component({
  selector: 'app-knn-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="knn">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 015 — INSTANCE-BASED LEARNING: K-NEAREST NEIGHBORS</p>
        <h2 class="lab-title">To classify a new point, just ask its neighbors.</h2>
        <p class="lab-lede">
          Drag the star anywhere on the plane. K-Nearest Neighbors doesn't fit an equation to the data — it
          waits until prediction time, measures the distance to every stored training point, and lets the
          closest K of them vote.
        </p>

        <div class="lab-panel">
          <svg
            class="plane"
            [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH"
            (pointermove)="onPointerMove($event)"
            (pointerup)="stopDrag()"
            (pointerleave)="stopDrag()"
          >
            @for (n of neighbors(); track n.point.x + '-' + n.point.y) {
              <line
                [attr.x1]="newPoint().x" [attr.y1]="newPoint().y"
                [attr.x2]="n.point.x" [attr.y2]="n.point.y"
                class="neighbor-line"
              />
            }

            @for (p of trainingPoints; track p.x + '-' + p.y) {
              <circle
                [attr.cx]="p.x" [attr.cy]="p.y" r="7"
                class="data-point"
                [class.data-point-a]="p.cls === 'A'"
                [class.data-point-b]="p.cls === 'B'"
                [class.is-neighbor]="isNeighbor(p)"
              />
            }

            <path
              [attr.d]="starPath()"
              class="new-point"
              (pointerdown)="startDrag($event)"
            />
          </svg>

          <div class="k-row">
            <span class="k-label mono">K =</span>
            <div class="lab-btn-row k-btn-row">
              @for (opt of kOptions; track opt) {
                <button type="button" class="lab-btn" [class.is-active]="k() === opt" (click)="k.set(opt)">{{ opt }}</button>
              }
            </div>
          </div>

          <p class="prediction mono">
            Predicted: Class {{ prediction().cls }} ({{ prediction().count }} of {{ k() }} neighbors)
          </p>

          <p class="lab-note-warn lab-note">
            K is chosen before training — a hyperparameter, not something the model learns on its own (unlike,
            say, the slope of a fitted line).
          </p>
        </div>

        <div class="pros-cons">
          <div class="pros-col">
            <p class="col-heading mono pill pill-yes">PROS</p>
            <ul class="col-list">
              <li>Simple to understand</li>
              <li>Flexible — can model complex local patterns</li>
              <li>No training phase required up front</li>
            </ul>
          </div>
          <div class="cons-col">
            <p class="col-heading mono pill pill-conditional">CONS</p>
            <ul class="col-list">
              <li>Prediction cost grows with dataset size (must compare against every stored point)</li>
              <li>Memory usage — the entire training set must be kept</li>
              <li>Sensitive to feature scaling (a feature covered in a later section)</li>
              <li>Choice of distance metric matters (not always plain Euclidean distance)</li>
            </ul>
          </div>
        </div>

        <p class="lab-note">
          <strong>Instance-based learning:</strong> store the examples, delay generalization until prediction
          time — prediction depends on similarity/distance to what's already been seen.
        </p>
      </div>
    </section>
  `,
  styles: `
    .plane { width: 100%; height: auto; aspect-ratio: 560 / 360; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); touch-action: none; }

    .data-point { fill: var(--accent-2); stroke: none; transition: filter 0.2s ease, r 0.2s ease; }
    .data-point-a { fill: var(--accent-2); }
    .data-point-b { fill: var(--accent); }
    .data-point.is-neighbor { filter: drop-shadow(0 0 6px currentColor); stroke: var(--text); stroke-width: 1.5; r: 9; }

    .neighbor-line { stroke: var(--text-faint); stroke-width: 1; stroke-dasharray: 4 3; }

    .new-point { fill: var(--accent-strong); stroke: var(--accent-strong); filter: drop-shadow(0 0 8px var(--glow-accent)); cursor: grab; }
    .new-point:active { cursor: grabbing; }

    .k-row { display: flex; align-items: center; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
    .k-label { color: var(--text-muted); font-size: 0.875rem; }
    .k-btn-row { margin-top: 0; }

    .prediction { margin-top: 18px; font-size: 1rem; color: var(--text); }

    .pros-cons { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 700px) { .pros-cons { grid-template-columns: 1fr 1fr; } }
    .col-heading { display: inline-flex; margin-bottom: 12px; }
    .col-list { display: flex; flex-direction: column; gap: 10px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.5; padding-left: 20px; }
    .col-list li { list-style: disc; }
  `,
})
export class KnnLab {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly trainingPoints = TRAINING_POINTS;
  protected readonly kOptions = K_OPTIONS;

  protected readonly k = signal<number>(3);
  protected readonly newPoint = signal<{ x: number; y: number }>({ x: 280, y: 190 });
  protected readonly dragging = signal(false);

  private svgEl: SVGSVGElement | null = null;

  protected readonly ranked = computed(() => {
    const np = this.newPoint();
    return TRAINING_POINTS.map((point) => ({
      point,
      dist: Math.hypot(point.x - np.x, point.y - np.y),
    })).sort((a, b) => a.dist - b.dist);
  });

  protected readonly neighbors = computed(() => this.ranked().slice(0, this.k()));

  protected readonly prediction = computed(() => {
    const chosen = this.neighbors();
    const countA = chosen.filter((n) => n.point.cls === 'A').length;
    const countB = chosen.length - countA;
    return countA >= countB ? { cls: 'A' as Cls, count: countA } : { cls: 'B' as Cls, count: countB };
  });

  protected readonly starPath = computed(() => {
    const { x, y } = this.newPoint();
    const r = 11;
    const points: string[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      points.push(`${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`);
    }
    return `M ${points.join(' L ')} Z`;
  });

  protected isNeighbor(p: TrainingPoint): boolean {
    return this.neighbors().some((n) => n.point === p);
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
    this.newPoint.set({
      x: this.clamp(pt.x, 0, this.planeW),
      y: this.clamp(pt.y, 0, this.planeH),
    });
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
