import { Component, computed, signal } from '@angular/core';

type Step = '1' | '2' | '3' | 'many';

type House = {
  id: number;
  size: number;
  bedrooms: number;
  age: number;
};

const HOUSES: House[] = [
  { id: 1, size: 750, bedrooms: 1, age: 5 },
  { id: 2, size: 900, bedrooms: 2, age: 12 },
  { id: 3, size: 1200, bedrooms: 2, age: 3 },
  { id: 4, size: 1450, bedrooms: 3, age: 20 },
  { id: 5, size: 1800, bedrooms: 3, age: 8 },
  { id: 6, size: 2100, bedrooms: 4, age: 15 },
  { id: 7, size: 2500, bedrooms: 4, age: 2 },
  { id: 8, size: 3000, bedrooms: 5, age: 25 },
];

const SIZE_MIN = 700;
const SIZE_MAX = 3050;
const BEDROOM_MIN = 0;
const BEDROOM_MAX = 6;
const AGE_MIN = 0;
const AGE_MAX = 28;

function scale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  const t = (value - min) / (max - min);
  return outMin + t * (outMax - outMin);
}

@Component({
  selector: 'app-feature-space',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="feature-space">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 005 — DATA AS GEOMETRY</p>
        <h2 class="lab-title">A row in a table is secretly a point in space.</h2>
        <p class="lab-lede">
          Same eight houses, every step. Only the number of features we plot changes — watch what "more
          features" actually means geometrically.
        </p>

        <div class="lab-btn-row" role="tablist" aria-label="Number of features">
          <button type="button" class="lab-btn" [class.is-active]="step() === '1'" (click)="step.set('1')">1 Feature</button>
          <button type="button" class="lab-btn" [class.is-active]="step() === '2'" (click)="step.set('2')">2 Features</button>
          <button type="button" class="lab-btn" [class.is-active]="step() === '3'" (click)="step.set('3')">3 Features</button>
          <button type="button" class="lab-btn" [class.is-active]="step() === 'many'" (click)="step.set('many')">Many Features</button>
        </div>

        <div class="lab-panel stage">

          <div class="step-panel" [class.is-visible]="step() === '1'">
            <p class="lab-note">Each house plotted by <strong>Size</strong> alone, on a single line.</p>
            <div class="number-line">
              <div class="number-line-track"></div>
              @for (h of houses; track h.id) {
                <div class="number-line-dot" [style.left.%]="sizePercent(h.size)" [title]="h.size + ' sqft'"></div>
              }
              <span class="number-line-label number-line-label-min">{{ sizeMin }} sqft</span>
              <span class="number-line-label number-line-label-max">{{ sizeMax }} sqft</span>
            </div>
            <p class="axis-caption mono">SIZE →</p>
          </div>

          <div class="step-panel" [class.is-visible]="step() === '2'">
            <p class="lab-note">The same houses, now positioned by <strong>Size</strong> (x) and <strong>Bedrooms</strong> (y).</p>
            <svg class="scatter-2d" viewBox="0 0 320 240" role="img" aria-label="Houses plotted by size and bedrooms">
              <line x1="30" y1="10" x2="30" y2="210" class="axis-line" />
              <line x1="30" y1="210" x2="310" y2="210" class="axis-line" />
              @for (h of houses; track h.id) {
                <circle [attr.cx]="30 + scatterX(h.size)" [attr.cy]="210 - scatterY(h.bedrooms)" r="6" class="scatter-dot">
                  <title>{{ h.size }} sqft · {{ h.bedrooms }} bd</title>
                </circle>
              }
              <text x="170" y="232" class="axis-text mono">SIZE →</text>
              <text x="8" y="110" class="axis-text mono" transform="rotate(-90 8 110)">BEDROOMS →</text>
            </svg>
          </div>

          <div class="step-panel" [class.is-visible]="step() === '3'">
            <p class="lab-note">Drag inside the box to rotate. Now <strong>Age</strong> becomes a third axis — the same houses, one more dimension.</p>
            <div
              class="scene-wrap"
              (pointerdown)="onPointerDown($event)"
              (pointermove)="onPointerMove($event)"
              (pointerup)="onPointerUp($event)"
              (pointercancel)="onPointerUp($event)"
            >
              <div class="scene" [style.transform]="sceneTransform()">
                <div class="axis axis-x"></div>
                <div class="axis axis-y"></div>
                <div class="axis axis-z"></div>
                <div class="axis-label axis-label-x">SIZE</div>
                <div class="axis-label axis-label-y">BEDROOMS</div>
                <div class="axis-label axis-label-z">AGE</div>
                @for (h of houses; track h.id) {
                  <div class="house-point" [style.transform]="pointTransform(h)"></div>
                }
              </div>
            </div>
            <p class="drag-hint mono">click + drag to rotate</p>
          </div>

          <div class="step-panel" [class.is-visible]="step() === 'many'">
            <span class="pill">conceptual representation</span>
            <p class="lab-note">
              We can't draw 100 dimensions on screen. But mathematically, each house is still just a point — a
              list of numbers — in a 100-dimensional feature space. Here's one example house, with many more
              feature columns than we could ever plot:
            </p>
            <div class="table-scroll">
              <table class="many-table mono">
                <thead>
                  <tr>
                    <th>Size</th><th>Bedrooms</th><th>Age</th><th>Location</th><th>...</th><th>Feature N</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1800</td><td>3</td><td>8</td><td>Suburb</td><td>...</td><td>0.42</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="lab-note">The math (distances, patterns, decision boundaries) still works the same way it did with 1, 2, or 3 features — we just lose the ability to literally see it.</p>
          </div>

        </div>
      </div>
    </section>
  `,
  styles: `
    .stage { position: relative; min-height: 420px; }
    .step-panel {
      position: absolute;
      inset: 24px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease;
    }
    .step-panel.is-visible { opacity: 1; pointer-events: auto; }
    @media (min-width: 640px) { .step-panel { inset: 32px; } }

    .number-line { position: relative; height: 60px; margin-top: 36px; }
    .number-line-track { position: absolute; top: 24px; left: 0; right: 0; height: 2px; background: var(--border-strong); }
    .number-line-dot {
      position: absolute;
      top: 16px;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--accent-2);
      box-shadow: 0 0 8px var(--glow-accent-2);
      transform: translateX(-50%);
    }
    .number-line-label { position: absolute; top: 34px; font-size: 0.6875rem; color: var(--text-faint); font-family: var(--font-mono); }
    .number-line-label-min { left: 0; }
    .number-line-label-max { right: 0; }
    .axis-caption { margin-top: 24px; font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }

    .scatter-2d { width: 100%; max-width: 400px; height: auto; margin-top: 16px; display: block; }
    .axis-line { stroke: var(--border-strong); stroke-width: 1.5; }
    .scatter-dot { fill: var(--accent-2); }
    .axis-text { fill: var(--text-faint); font-size: 10px; }

    .scene-wrap {
      margin-top: 20px;
      height: 260px;
      perspective: 900px;
      touch-action: none;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .scene-wrap:active { cursor: grabbing; }
    .scene {
      position: relative;
      width: 200px;
      height: 200px;
      transform-style: preserve-3d;
    }
    .axis { position: absolute; background: var(--border-strong); transform-style: preserve-3d; }
    .axis-x { width: 200px; height: 2px; top: 100px; left: 0; }
    .axis-y { width: 2px; height: 200px; top: 0; left: 100px; }
    .axis-z { width: 2px; height: 200px; top: 100px; left: 100px; transform: rotateX(90deg) translateZ(0) translateY(-100px); }
    .axis-label {
      position: absolute;
      font-family: var(--font-mono);
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      color: var(--text-faint);
      white-space: nowrap;
    }
    .axis-label-x { top: 108px; left: 190px; }
    .axis-label-y { top: -14px; left: 108px; }
    .axis-label-z { top: 100px; left: 4px; transform: rotateX(90deg) translateZ(96px); color: var(--text-faint); }
    .house-point {
      position: absolute;
      top: 100px; left: 100px;
      width: 14px; height: 14px;
      margin: -7px;
      border-radius: 50%;
      background: var(--accent-2);
      box-shadow: 0 0 8px var(--glow-accent-2);
    }
    .drag-hint { margin-top: 8px; text-align: center; font-size: 0.6875rem; color: var(--text-faint); }

    .table-scroll { overflow-x: auto; margin-top: 18px; }
    .many-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .many-table th, .many-table td { padding: 10px 14px; border: 1px solid var(--border); text-align: left; white-space: nowrap; }
    .many-table th { color: var(--text-muted); background: var(--surface); }
    .many-table td { color: var(--text); }
  `,
})
export class FeatureSpace {
  houses = HOUSES;
  sizeMin = SIZE_MIN;
  sizeMax = SIZE_MAX;

  step = signal<Step>('1');

  rotateX = signal<number>(-20);
  rotateY = signal<number>(25);
  private dragging = false;

  sceneTransform = computed(() => `rotateX(${this.rotateX()}deg) rotateY(${this.rotateY()}deg)`);

  sizePercent(size: number): number {
    return scale(size, SIZE_MIN, SIZE_MAX, 2, 98);
  }

  scatterX(size: number): number {
    return scale(size, SIZE_MIN, SIZE_MAX, 0, 280);
  }

  scatterY(bedrooms: number): number {
    return scale(bedrooms, BEDROOM_MIN, BEDROOM_MAX, 0, 190);
  }

  pointTransform(h: House): string {
    const x = scale(h.size, SIZE_MIN, SIZE_MAX, -90, 90);
    const y = scale(h.bedrooms, BEDROOM_MIN, BEDROOM_MAX, 90, -90);
    const z = scale(h.age, AGE_MIN, AGE_MAX, -90, 90);
    return `translate3d(${x}px, ${y}px, ${z}px)`;
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.rotateY.set(this.rotateY() + event.movementX * 0.5);
    const nextRotateX = this.rotateX() - event.movementY * 0.5;
    this.rotateX.set(Math.max(-85, Math.min(85, nextRotateX)));
  }

  onPointerUp(event: PointerEvent): void {
    this.dragging = false;
  }
}
