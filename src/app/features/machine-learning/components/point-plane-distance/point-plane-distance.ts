import { Component, computed, signal } from '@angular/core';

const A = 1;
const B = 1;
const C = 1;
const D = -3;

const SCALE = 40;

@Component({
  selector: 'app-point-plane-distance',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="point-plane-distance">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 013 — DISTANCE FROM A POINT TO A PLANE</p>
        <h2 class="lab-title">How far is a point from a flat surface?</h2>
        <p class="lab-lede">
          Drag the sliders to move the point around. The plane stays fixed at
          <span class="mono">x + y + z = 3</span> — watch the shortest distance update live.
        </p>

        <div class="lab-panel">
          <div class="scene-grid">
            <div class="scene-wrap" (pointerdown)="startDrag($event)">
              <div class="scene" [style.transform]="sceneTransform()">
                <div class="plane-face" [style.transform]="planeTransform()"></div>

                <div class="axis axis-x"></div>
                <div class="axis axis-y"></div>
                <div class="axis axis-z"></div>

                <div class="point-marker" [style.transform]="pointTransform()"></div>

                <div class="drop-line" [style.width.px]="dropLineLength()" [style.transform]="dropLineTransform()"></div>
              </div>
            </div>

            <div class="controls-col">
              <div class="lab-field">
                <label for="x0-slider">x0</label>
                <input id="x0-slider" type="range" min="-3" max="3" step="0.1" [value]="x0()" (input)="setX0($event)" />
              </div>
              <div class="lab-field">
                <label for="y0-slider">y0</label>
                <input id="y0-slider" type="range" min="-3" max="3" step="0.1" [value]="y0()" (input)="setY0($event)" />
              </div>
              <div class="lab-field">
                <label for="z0-slider">z0</label>
                <input id="z0-slider" type="range" min="-3" max="3" step="0.1" [value]="z0()" (input)="setZ0($event)" />
              </div>

              <p class="distance-readout mono">Shortest distance: {{ distance().toFixed(3) }}</p>
              <p class="drag-hint">Drag inside the box to rotate the scene.</p>
            </div>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="showGeometry()" (click)="showGeometry.set(!showGeometry())">
            {{ showGeometry() ? 'Hide the geometry' : 'Show the geometry' }}
          </button>
          <button type="button" class="lab-btn" [class.is-active]="showFormula()" (click)="showFormula.set(!showFormula())">
            {{ showFormula() ? 'Hide the formula' : 'Show the formula' }}
          </button>
        </div>

        @if (showGeometry()) {
          <div class="lab-panel">
            <p class="lab-node">Why perpendicular is the shortest path</p>
            <p class="panel-detail">
              Of every path you could draw from the point to the plane, the perpendicular one — the dashed
              segment shown above — is the shortest. Any other path reaches the plane at an angle, which
              means it has to travel further before it gets there. This is the same reason a straight drop
              from a ceiling to the floor is shorter than a diagonal one.
            </p>
          </div>
        }

        @if (showFormula()) {
          <div class="lab-panel">
            <p class="lab-node">The formula, with your current numbers plugged in</p>
            <p class="lab-code mono">distance = |A·x0 + B·y0 + C·z0 + D| / √(A² + B² + C²)</p>
            <p class="lab-code mono">{{ substitutedFormula() }}</p>
          </div>
        }

        <p class="closing-line">
          This kind of distance calculation underlies how some models measure how far a point lies from a
          decision boundary — covered next.
        </p>
      </div>
    </section>
  `,
  styles: `
    .scene-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
    @media (min-width: 900px) { .scene-grid { grid-template-columns: 3fr 2fr; align-items: center; } }

    .scene-wrap { width: 100%; aspect-ratio: 1 / 1; max-width: 420px; perspective: 900px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); touch-action: none; cursor: grab; }
    .scene { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; }

    .axis { position: absolute; top: 50%; left: 50%; background: var(--border-strong); }
    .axis-x { width: 260px; height: 1.5px; transform: translate(-50%, -50%) rotateX(0deg) rotateY(0deg); }
    .axis-y { width: 1.5px; height: 260px; transform: translate(-50%, -50%); }
    .axis-z { width: 260px; height: 1.5px; transform: translate(-50%, -50%) rotateY(90deg); }

    .plane-face {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 300px;
      height: 300px;
      margin: -150px 0 0 -150px;
      background: color-mix(in srgb, var(--accent) 26%, transparent);
      border: 1.5px solid var(--accent);
    }

    .point-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      margin: -8px 0 0 -8px;
      border-radius: 50%;
      background: var(--accent-strong);
      box-shadow: 0 0 14px var(--glow-accent);
    }

    .drop-line {
      position: absolute;
      top: 50%;
      left: 50%;
      height: 2px;
      margin-top: -1px;
      background-image: repeating-linear-gradient(to right, var(--danger) 0 6px, transparent 6px 11px);
      transform-origin: left center;
    }

    .controls-col { display: flex; flex-direction: column; gap: 16px; }
    .distance-readout { font-size: 1.125rem; color: var(--accent-2); }
    .drag-hint { font-size: 0.75rem; color: var(--text-faint); margin-top: -8px; }

    .panel-detail { max-width: 640px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .closing-line { margin-top: 28px; max-width: 640px; color: var(--text); font-size: 0.9375rem; line-height: 1.6; border-left: 2px solid var(--accent-2-dim); padding-left: 14px; }
  `,
})
export class PointPlaneDistance {
  protected readonly x0 = signal<number>(1);
  protected readonly y0 = signal<number>(1);
  protected readonly z0 = signal<number>(4);

  protected readonly rotX = signal<number>(-18);
  protected readonly rotY = signal<number>(28);

  protected readonly showGeometry = signal(false);
  protected readonly showFormula = signal(false);

  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  protected readonly distance = computed(() => {
    const num = Math.abs(A * this.x0() + B * this.y0() + C * this.z0() + D);
    const den = Math.sqrt(A * A + B * B + C * C);
    return num / den;
  });

  protected readonly substitutedFormula = computed(() => {
    const x0 = this.x0().toFixed(1);
    const y0 = this.y0().toFixed(1);
    const z0 = this.z0().toFixed(1);
    const num = Math.abs(A * this.x0() + B * this.y0() + C * this.z0() + D).toFixed(3);
    const den = Math.sqrt(A * A + B * B + C * C).toFixed(3);
    return `|${A}·${x0} + ${B}·${y0} + ${C}·${z0} + (${D})| / √(${A}² + ${B}² + ${C}²) = ${num} / ${den} = ${this.distance().toFixed(3)}`;
  });

  protected readonly sceneTransform = computed(() => `rotateX(${this.rotX()}deg) rotateY(${this.rotY()}deg)`);

  protected readonly planeTransform = computed(() => `translateZ(${(-D / C) * SCALE}px) rotateX(-35deg)`);

  protected readonly pointTransform = computed(
    () => `translate3d(${this.x0() * SCALE}px, ${-this.y0() * SCALE}px, ${this.z0() * SCALE}px)`,
  );

  private readonly footPoint = computed(() => {
    const x0 = this.x0();
    const y0 = this.y0();
    const z0 = this.z0();
    const denomSq = A * A + B * B + C * C;
    const t = (A * x0 + B * y0 + C * z0 + D) / denomSq;
    return { x: x0 - A * t, y: y0 - B * t, z: z0 - C * t };
  });

  protected readonly dropLineLength = computed(() => this.distance() * SCALE);

  protected readonly dropLineTransform = computed(() => {
    const p = { x: this.x0() * SCALE, y: -this.y0() * SCALE, z: this.z0() * SCALE };
    const f = this.footPoint();
    const q = { x: f.x * SCALE, y: -f.y * SCALE, z: f.z * SCALE };
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const dz = q.z - p.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const yaw = Math.atan2(dz, dx) * (180 / Math.PI);
    const pitch = Math.asin(dy / len) * (180 / Math.PI);
    return `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${-yaw}deg) rotateZ(${pitch}deg)`;
  });

  setX0(ev: Event): void {
    this.x0.set(+(ev.target as HTMLInputElement).value);
  }

  setY0(ev: Event): void {
    this.y0.set(+(ev.target as HTMLInputElement).value);
  }

  setZ0(ev: Event): void {
    this.z0.set(+(ev.target as HTMLInputElement).value);
  }

  startDrag(ev: PointerEvent): void {
    this.dragging = true;
    this.lastPointerX = ev.clientX;
    this.lastPointerY = ev.clientY;
    const move = (moveEv: PointerEvent) => {
      if (!this.dragging) return;
      const dx = moveEv.clientX - this.lastPointerX;
      const dy = moveEv.clientY - this.lastPointerY;
      this.lastPointerX = moveEv.clientX;
      this.lastPointerY = moveEv.clientY;
      this.rotY.set(this.rotY() + dx * 0.4);
      this.rotX.set(this.clamp(this.rotX() - dy * 0.4, -85, 85));
    };
    const up = () => {
      this.dragging = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
