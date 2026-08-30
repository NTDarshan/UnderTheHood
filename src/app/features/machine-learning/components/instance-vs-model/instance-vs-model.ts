import { Component, computed, signal } from '@angular/core';

interface CompareRow {
  label: string;
  instance: string;
  model: string;
}

const ROWS: CompareRow[] = [
  { label: 'Training', instance: 'Minimal / generalized storage', model: 'Learn parameters' },
  { label: 'Prediction', instance: 'Compare with stored examples', model: 'Use learned model' },
  { label: 'Memory', instance: 'Higher — must keep all examples', model: 'Usually smaller after training' },
  { label: 'Prediction speed', instance: 'Potentially expensive, grows with data size', model: 'Usually faster, independent of training set size' },
];

const X_MIN = 0;
const X_MAX = 10;
const Y_MIN = 0;
const Y_MAX = 10;
const PLANE_W = 260;
const PLANE_H = 200;

const M = 0.75;
const B = 1.5;

const DATA_POINTS: { x: number; y: number }[] = [
  { x: 1, y: 2 },
  { x: 2, y: 3 },
  { x: 3, y: 4 },
  { x: 4, y: 4.5 },
  { x: 5, y: 5.5 },
  { x: 6, y: 6 },
  { x: 7, y: 6.8 },
  { x: 8, y: 7.5 },
];

const NEW_POINT = { x: 4.5, y: 5 };
const NEAREST_COUNT = 3;

@Component({
  selector: 'app-instance-vs-model',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="instance-vs-model">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 017 — INSTANCE-BASED VS MODEL-BASED</p>
        <h2 class="lab-title">Same data, two entirely different ways to answer "what's this new point?"</h2>
        <p class="lab-lede">
          Both paradigms learn from the same training set. They differ in what they keep, and what they do the
          moment a new point shows up.
        </p>

        <div class="table-scroll">
          <table class="matrix">
            <thead>
              <tr>
                <th class="row-label-col"></th>
                <th>Instance-Based</th>
                <th>Model-Based</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rows; track r.label) {
                <tr>
                  <td class="row-label">{{ r.label }}</td>
                  <td>{{ r.instance }}</td>
                  <td>{{ r.model }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <p class="section-heading mono">WHAT HAPPENS WHEN A NEW POINT ARRIVES?</p>

        <div class="side-by-side">
          <div class="side-col">
            <p class="side-heading mono">INSTANCE-BASED</p>
            <svg class="plane" [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH">
              @for (p of dataPoints; track p.x + '-' + p.y) {
                <circle
                  [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(p.y)" r="5"
                  class="data-point" [class.is-neighbor]="revealed() && isNearest(p)"
                />
              }
              @if (revealed()) {
                @for (p of nearestPoints(); track p.x + '-' + p.y) {
                  <line
                    [attr.x1]="toSvgX(newPoint.x)" [attr.y1]="toSvgY(newPoint.y)"
                    [attr.x2]="toSvgX(p.x)" [attr.y2]="toSvgY(p.y)"
                    class="compare-line"
                  />
                }
              }
              <circle
                [attr.cx]="toSvgX(newPoint.x)" [attr.cy]="toSvgY(newPoint.y)" r="6"
                class="new-point" [class.is-revealed]="revealed()"
              />
            </svg>
            <p class="side-caption">
              @if (revealed()) {
                Compares the new point against stored examples — highlights the {{ nearestCount }} closest ones.
              } @else {
                Waiting — click the button below.
              }
            </p>
          </div>

          <div class="side-col">
            <p class="side-heading mono">MODEL-BASED</p>
            <svg class="plane" [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH">
              @for (p of dataPoints; track p.x + '-' + p.y) {
                <circle [attr.cx]="toSvgX(p.x)" [attr.cy]="toSvgY(p.y)" r="5" class="data-point" />
              }
              <line
                [attr.x1]="toSvgX(xMin)" [attr.y1]="toSvgY(lineYAt(xMin))"
                [attr.x2]="toSvgX(xMax)" [attr.y2]="toSvgY(lineYAt(xMax))"
                class="model-line"
              />
              @if (revealed()) {
                <circle
                  [attr.cx]="toSvgX(newPoint.x)" [attr.cy]="toSvgY(lineYAt(newPoint.x))" r="6"
                  class="new-point is-revealed"
                />
              }
            </svg>
            <p class="side-caption">
              @if (revealed()) {
                The model just evaluates itself at x = {{ newPoint.x }} — no comparison to stored data needed.
              } @else {
                Waiting — click the button below.
              }
            </p>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="revealed()" (click)="reveal()">
            A new point arrives
          </button>
          <button type="button" class="lab-btn" (click)="resetDemo()">Reset</button>
        </div>

        <p class="lab-note">
          These are conceptual categories, not rigid boxes — real systems can and do combine both ideas.
        </p>
      </div>
    </section>
  `,
  styles: `
    .table-scroll { margin-top: 28px; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); }
    .matrix { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .matrix th, .matrix td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
    .row-label-col { width: 160px; }
    .row-label { color: var(--text-faint); font-size: 0.75rem; background: var(--surface-raised); }
    .matrix thead th { background: var(--surface-elevated); color: var(--text-muted); }
    .matrix tbody td { color: var(--text-muted); }
    .matrix tbody tr:last-child td { border-bottom: none; }

    .section-heading { margin-top: 40px; color: var(--accent-2); font-size: 0.75rem; letter-spacing: 0.08em; }

    .side-by-side { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 20px; }
    @media (min-width: 700px) { .side-by-side { grid-template-columns: 1fr 1fr; } }

    .side-col { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .side-heading { color: var(--text-muted); font-size: 0.75rem; letter-spacing: 0.06em; margin-bottom: 12px; }
    .plane { width: 100%; height: auto; aspect-ratio: 260 / 200; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .data-point { fill: var(--accent-2); transition: filter 0.2s ease; }
    .data-point.is-neighbor { filter: drop-shadow(0 0 6px var(--accent-2)); stroke: var(--text); stroke-width: 1; }

    .compare-line { stroke: var(--text-faint); stroke-width: 1; stroke-dasharray: 3 3; }

    .model-line { stroke: var(--accent); stroke-width: 2.5; }

    .new-point { fill: var(--text-faint); opacity: 0.4; transition: fill 0.3s ease, opacity 0.3s ease, filter 0.3s ease; }
    .new-point.is-revealed { fill: var(--accent-strong); opacity: 1; filter: drop-shadow(0 0 7px var(--glow-accent)); }

    .side-caption { margin-top: 12px; color: var(--text-muted); font-size: 0.8125rem; line-height: 1.5; min-height: 2.5em; }
  `,
})
export class InstanceVsModel {
  protected readonly rows = ROWS;
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly xMin = X_MIN;
  protected readonly xMax = X_MAX;
  protected readonly dataPoints = DATA_POINTS;
  protected readonly newPoint = NEW_POINT;
  protected readonly nearestCount = NEAREST_COUNT;

  protected readonly revealed = signal(false);

  protected readonly nearestPoints = computed(() => {
    if (!this.revealed()) return [];
    return [...DATA_POINTS]
      .sort((a, b) => this.dist(a) - this.dist(b))
      .slice(0, NEAREST_COUNT);
  });

  private dist(p: { x: number; y: number }): number {
    return Math.hypot(p.x - NEW_POINT.x, p.y - NEW_POINT.y);
  }

  protected isNearest(p: { x: number; y: number }): boolean {
    return this.nearestPoints().some((n) => n === p);
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

  reveal(): void {
    this.revealed.set(true);
  }

  resetDemo(): void {
    this.revealed.set(false);
  }
}
