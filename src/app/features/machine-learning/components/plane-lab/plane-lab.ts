import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Param = 'a' | 'b' | 'c';

interface Point3d {
  x: number;
  y: number;
  z: number;
}

const CLOUD: Point3d[] = [
  { x: -90, y: -60, z: 10 },
  { x: -60, y: 40, z: -20 },
  { x: -30, y: -20, z: 30 },
  { x: 0, y: 70, z: -10 },
  { x: 20, y: -50, z: 15 },
  { x: 50, y: 20, z: -30 },
  { x: 70, y: -30, z: 25 },
  { x: 90, y: 60, z: -5 },
  { x: -10, y: 10, z: 40 },
  { x: 35, y: -70, z: -15 },
];

const BREAKDOWN: Record<Param, string> = {
  a: "Controls the plane's orientation/tilt along that axis.",
  b: "Controls the plane's orientation/tilt along that axis.",
  c: "Controls the plane's vertical offset — like the intercept b in the line equation, generalized to one more dimension.",
};

@Component({
  selector: 'app-plane-lab',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="plane-lab">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 011 — THE EQUATION OF A PLANE</p>
        <h2 class="lab-title">Three numbers. One tilting, floating plane.</h2>
        <p class="lab-lede">
          Drag the sliders and watch the plane respond. Each coefficient controls one specific thing about its
          shape and position.
        </p>

        <app-explain-simply>
          A line is "y = mx + b" — a slope and a starting height. A plane is the same idea with one more
          direction to slope in: two slopes and a starting height.
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
            @for (p of cloud; track $index) {
              <div class="dot" [style.transform]="'translate3d(' + p.x + 'px, ' + p.y + 'px, ' + p.z + 'px)'"></div>
            }
            <div class="plane" [style.transform]="planeTransform()"></div>
          </div>
        </div>
        <p class="drag-hint mono">drag the scene to rotate — sliders shape the plane</p>

        <p class="equation mono">z = {{ a().toFixed(1) }}x + {{ b().toFixed(1) }}y + {{ c().toFixed(1) }}</p>

        <div class="controls">
          <div class="control-row">
            <button type="button" class="control-label mono" [class.is-active]="selected() === 'a'" (click)="select('a')">a = {{ a().toFixed(1) }}</button>
            <input type="range" min="-2" max="2" step="0.1" [value]="a()" (input)="onA($event)" />
          </div>
          <div class="control-row">
            <button type="button" class="control-label mono" [class.is-active]="selected() === 'b'" (click)="select('b')">b = {{ b().toFixed(1) }}</button>
            <input type="range" min="-2" max="2" step="0.1" [value]="b()" (input)="onB($event)" />
          </div>
          <div class="control-row">
            <button type="button" class="control-label mono" [class.is-active]="selected() === 'c'" (click)="select('c')">c = {{ c().toFixed(1) }}</button>
            <input type="range" min="-3" max="3" step="0.2" [value]="c()" (input)="onC($event)" />
          </div>
        </div>

        @if (selected(); as sel) {
          <p class="breakdown-note">{{ breakdown[sel] }}</p>
        }

        <p class="lab-note">
          y = mx + b (a line, 1 feature) becomes z = ax + by + c (a plane, 2 features). Add more features, and
          this pattern generalizes further — into something called a hyperplane, covered next.
        </p>
      </div>
    </section>
  `,
  styles: `
    .scene-stage { margin-top: 32px; height: 340px; display: flex; align-items: center; justify-content: center; perspective: 900px; }
    .scene { position: relative; width: 220px; height: 220px; transform-style: preserve-3d; cursor: grab; touch-action: none; }

    .dot { position: absolute; top: 110px; left: 110px; width: 12px; height: 12px; margin: -6px; border-radius: 50%; background: var(--accent-2); box-shadow: 0 0 10px var(--glow-accent-2); }

    .plane { position: absolute; top: 110px; left: 110px; width: 220px; height: 220px; margin: -110px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid var(--accent-dim); transition: transform 0.05s linear; }

    .drag-hint { text-align: center; margin-top: 8px; font-size: 0.6875rem; color: var(--text-faint); }

    .equation { margin-top: 24px; font-size: 1.25rem; color: var(--accent); text-align: center; }

    .controls { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; max-width: 480px; }
    .control-row { display: flex; align-items: center; gap: 16px; }
    .control-label { flex-shrink: 0; width: 90px; text-align: left; background: none; border: none; padding: 4px 8px; border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.9375rem; cursor: pointer; }
    .control-label.is-active { color: var(--accent); background: var(--surface-raised); }
    .control-row input[type='range'] { flex: 1; accent-color: var(--accent); }

    .breakdown-note { margin-top: 16px; max-width: 560px; padding: 14px 18px; background: var(--surface-raised); border-left: 2px solid var(--accent-2-dim); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
  `,
})
export class PlaneLab {
  protected readonly cloud = CLOUD;
  protected readonly breakdown = BREAKDOWN;

  protected readonly a = signal<number>(0.6);
  protected readonly b = signal<number>(0.3);
  protected readonly c = signal<number>(0);
  protected readonly selected = signal<Param | null>(null);

  protected readonly rotX = signal(-25);
  protected readonly rotY = signal(25);

  protected readonly planeTransform = computed(() => {
    const rotYDeg = Math.atan(this.a()) * (180 / Math.PI);
    const rotXDeg = -Math.atan(this.b()) * (180 / Math.PI);
    const zOffset = this.c() * 20;
    return `translateZ(${zOffset}px) rotateY(${rotYDeg}deg) rotateX(${rotXDeg}deg)`;
  });

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  select(param: Param): void {
    this.selected.update((current) => (current === param ? null : param));
  }

  onA(event: Event): void {
    this.a.set(parseFloat((event.target as HTMLInputElement).value));
  }

  onB(event: Event): void {
    this.b.set(parseFloat((event.target as HTMLInputElement).value));
  }

  onC(event: Event): void {
    this.c.set(parseFloat((event.target as HTMLInputElement).value));
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
