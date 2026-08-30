import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface House {
  size: number;
  bedrooms: number;
  price: number;
}

const HOUSES: House[] = [
  { size: 900, bedrooms: 1, price: 180000 },
  { size: 1200, bedrooms: 2, price: 240000 },
  { size: 1450, bedrooms: 2, price: 275000 },
  { size: 1600, bedrooms: 3, price: 310000 },
  { size: 1750, bedrooms: 3, price: 340000 },
  { size: 1900, bedrooms: 3, price: 375000 },
  { size: 2100, bedrooms: 4, price: 420000 },
  { size: 2250, bedrooms: 4, price: 455000 },
  { size: 2400, bedrooms: 4, price: 490000 },
  { size: 2650, bedrooms: 5, price: 545000 },
  { size: 2850, bedrooms: 5, price: 590000 },
  { size: 3100, bedrooms: 5, price: 650000 },
];

const AXIS_LEN = 260;

const SIZE_MIN = 800;
const SIZE_MAX = 3200;
const BED_MIN = 0;
const BED_MAX = 6;
const PRICE_MIN = 150000;
const PRICE_MAX = 700000;

function normalize(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * AXIS_LEN;
}

interface Point3d {
  x: number;
  y: number;
  z: number;
}

@Component({
  selector: 'app-feature-space-3d',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="feature-space-3d">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 010 — INTO THE THIRD DIMENSION</p>
        <h2 class="lab-title">One more feature, and the line stops being enough.</h2>
        <p class="lab-lede">
          Each dot below is one house — plotted by size, bedrooms, and price at the same time. Drag to rotate
          and look at it from every angle.
        </p>

        <app-explain-simply>
          Think of this like a 3D scatter plot you could actually walk around — every house is a point floating
          in space, positioned by three numbers instead of two.
        </app-explain-simply>

        <div class="scene-stage">
          <div
            class="scene"
            [style.transform]="'rotateX(' + rotX() + 'deg) rotateY(' + rotY() + 'deg)'"
            (pointerdown)="onPointerDown($event)"
            (pointermove)="onPointerMove($event)"
            (pointerup)="onPointerUp()"
            (pointerleave)="onPointerUp()"
          >
            <div class="axis axis-x"></div>
            <div class="axis-label axis-label-x mono">Size</div>
            <div class="axis axis-y"></div>
            <div class="axis-label axis-label-y mono">Bedrooms</div>
            <div class="axis axis-z"></div>
            <div class="axis-label axis-label-z mono">Price</div>

            @for (p of points; track $index) {
              <div class="dot" [style.transform]="'translate3d(' + p.x + 'px, ' + p.y + 'px, ' + p.z + 'px)'"></div>
            }

            @if (showPlane()) {
              <div class="plane"></div>
            }
          </div>
        </div>

        <p class="drag-hint mono">drag to rotate</p>

        <p class="transition-beat">
          In 2D, we can fit a <strong>line</strong> through the data. In 3D... we need something with one more
          dimension: a <strong>plane</strong>.
        </p>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="showPlane()" (click)="togglePlane()">
            {{ showPlane() ? 'Hide the candidate plane' : 'Show a candidate plane' }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .scene-stage { margin-top: 32px; height: 380px; display: flex; align-items: center; justify-content: center; perspective: 900px; }
    .scene { position: relative; width: 260px; height: 260px; transform-style: preserve-3d; cursor: grab; touch-action: none; }

    .axis { position: absolute; background: var(--border-strong); }
    .axis-x { width: 260px; height: 2px; top: 130px; left: 0; transform: translateZ(0); }
    .axis-y { width: 2px; height: 260px; top: 0; left: 130px; transform: translateZ(0); }
    .axis-z { width: 2px; height: 260px; top: 130px; left: 130px; transform: rotateX(90deg) translateZ(0); transform-origin: top; }

    .axis-label { position: absolute; font-size: 0.6875rem; letter-spacing: 0.05em; color: var(--text-faint); white-space: nowrap; }
    .axis-label-x { top: 138px; left: 264px; }
    .axis-label-y { top: -22px; left: 136px; }
    .axis-label-z { top: 130px; left: 136px; transform: translateZ(140px) rotateX(90deg); }

    .dot { position: absolute; top: 130px; left: 130px; width: 12px; height: 12px; margin: -6px; border-radius: 50%; background: var(--accent-2); box-shadow: 0 0 10px var(--glow-accent-2); }

    .plane { position: absolute; top: 130px; left: 130px; width: 260px; height: 260px; margin: -130px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid var(--accent-dim); transform: translateZ(30px) rotateX(60deg) rotateZ(-10deg); }

    .drag-hint { text-align: center; margin-top: 8px; font-size: 0.6875rem; color: var(--text-faint); }

    .transition-beat { margin-top: 32px; max-width: 620px; font-size: 1rem; color: var(--text-muted); line-height: 1.65; }
    .transition-beat strong { color: var(--accent); }

    .lab-btn-row { margin-top: 20px; }
  `,
})
export class FeatureSpace3d {
  protected readonly rotX = signal(-20);
  protected readonly rotY = signal(30);
  protected readonly showPlane = signal(false);

  protected readonly points: Point3d[] = HOUSES.map((h) => ({
    x: normalize(h.size, SIZE_MIN, SIZE_MAX) - AXIS_LEN / 2,
    y: normalize(h.bedrooms, BED_MIN, BED_MAX) - AXIS_LEN / 2,
    z: normalize(h.price, PRICE_MIN, PRICE_MAX) - AXIS_LEN / 2,
  }));

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  togglePlane(): void {
    this.showPlane.update((v) => !v);
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.rotY.update((v) => v + dx * 0.5);
    this.rotX.update((v) => v - dy * 0.5);
  }

  onPointerUp(): void {
    this.dragging = false;
  }
}
