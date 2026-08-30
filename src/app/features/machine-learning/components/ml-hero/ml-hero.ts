import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';

type Point = { x: number; y: number };
type Handle = 'left' | 'right';

const POINTS: Point[] = [
  { x: 60, y: 260 },
  { x: 105, y: 270 },
  { x: 150, y: 225 },
  { x: 195, y: 240 },
  { x: 240, y: 190 },
  { x: 285, y: 205 },
  { x: 330, y: 150 },
  { x: 375, y: 165 },
  { x: 420, y: 110 },
  { x: 465, y: 130 },
  { x: 510, y: 80 },
  { x: 555, y: 95 },
  { x: 600, y: 50 },
];

const X_MIN = 60;
const X_MAX = 600;
const Y_MIN = 10;
const Y_MAX = 310;

function clamp(v: number): number {
  return Math.min(Y_MAX, Math.max(Y_MIN, v));
}

@Component({
  selector: 'app-ml-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section" id="ml-landing">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">MACHINE LEARNING</p>
        <h1 class="hero-title">Teach a machine to find the pattern.</h1>
        <p class="hero-lede">
          Machine learning looks complicated until you can see what the model is actually doing.
        </p>

        <p class="prompt-line">Can you find the pattern?</p>
        <p class="prompt-hint mono">Drag either copper handle to reshape the line.</p>

        <div class="canvas-wrap">
          <svg
            #svgEl
            viewBox="0 0 640 320"
            class="canvas-svg"
            role="img"
            aria-label="Scattered data points with a draggable line the learner can reposition to fit them"
          >
            <line x1="60" [attr.y1]="leftY()" x2="600" [attr.y2]="rightY()" class="fit-line" />
            @for (p of points; track p.x) {
              <circle [attr.cx]="p.x" [attr.cy]="p.y" r="5" class="data-point" />
            }
            <circle
              cx="60"
              [attr.cy]="leftY()"
              r="10"
              class="handle"
              [class.is-dragging]="dragging() === 'left'"
              (pointerdown)="startDrag('left', $event)"
            ></circle>
            <circle
              cx="600"
              [attr.cy]="rightY()"
              r="10"
              class="handle"
              [class.is-dragging]="dragging() === 'right'"
              (pointerdown)="startDrag('right', $event)"
            ></circle>
          </svg>

          @if (readoutKind()) {
            <p class="readout mono" [class.is-warmer]="readoutKind() === 'warmer'" [class.is-colder]="readoutKind() === 'colder'">
              {{ readoutKind() === 'warmer' ? 'Getting warmer…' : 'Getting colder…' }}
            </p>
          }
        </div>

        @if (hasInteracted()) {
          <p class="insight-line">
            This is the beginning of machine learning — a model trying to capture the pattern in data.
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-2); margin-bottom: 16px; }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 900px; }
    .hero-lede { margin-top: 20px; max-width: 620px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

    .prompt-line { margin-top: 40px; font-size: 1.125rem; color: var(--text); font-weight: 600; }
    .prompt-hint { margin-top: 6px; font-size: 0.75rem; color: var(--text-faint); letter-spacing: 0.03em; }

    .canvas-wrap { position: relative; margin-top: 20px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }

    .canvas-svg { display: block; width: 100%; height: auto; touch-action: none; }

    .fit-line { stroke: var(--accent); stroke-width: 3; }

    .data-point { fill: var(--accent-2); }

    .handle { fill: var(--surface); stroke: var(--accent); stroke-width: 2.5; cursor: grab; filter: drop-shadow(0 0 4px var(--glow-accent)); }
    .handle.is-dragging { fill: var(--accent-strong); stroke: var(--accent-strong); cursor: grabbing; filter: drop-shadow(0 0 10px var(--glow-accent)); }

    .readout { margin-top: 12px; font-size: 0.8125rem; letter-spacing: 0.04em; }
    .readout.is-warmer { color: var(--accent-2); }
    .readout.is-colder { color: var(--danger); }

    .insight-line { margin-top: 20px; max-width: 620px; font-size: 1rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class MlHero implements OnDestroy {
  @ViewChild('svgEl') private svgRef?: ElementRef<SVGSVGElement>;

  protected readonly points = POINTS;
  protected readonly leftY = signal<number>(210);
  protected readonly rightY = signal<number>(90);
  protected readonly dragging = signal<Handle | null>(null);
  protected readonly hasInteracted = signal(false);
  protected readonly readoutKind = signal<'warmer' | 'colder' | null>(null);

  private activeHandle: Handle | null = null;
  private dragStartClientY = 0;
  private dragStartLeftY = 0;
  private dragStartRightY = 0;
  private lastScore = this.computeScore();

  private readonly onPointerMove = (event: PointerEvent) => this.handlePointerMove(event);
  private readonly onPointerUp = () => this.endDrag();

  startDrag(handle: Handle, event: PointerEvent): void {
    event.preventDefault();
    this.activeHandle = handle;
    this.dragging.set(handle);
    this.dragStartClientY = event.clientY;
    this.dragStartLeftY = this.leftY();
    this.dragStartRightY = this.rightY();
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.activeHandle || !this.svgRef) return;
    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const scale = rect.height === 0 ? 1 : 320 / rect.height;
    const deltaSvg = (event.clientY - this.dragStartClientY) * scale;

    if (this.activeHandle === 'left') {
      this.leftY.set(clamp(this.dragStartLeftY + deltaSvg));
    } else {
      this.rightY.set(clamp(this.dragStartRightY + deltaSvg));
    }

    this.hasInteracted.set(true);
    const newScore = this.computeScore();
    if (newScore < this.lastScore - 0.75) {
      this.readoutKind.set('warmer');
    } else if (newScore > this.lastScore + 0.75) {
      this.readoutKind.set('colder');
    }
    this.lastScore = newScore;
  }

  private endDrag(): void {
    this.activeHandle = null;
    this.dragging.set(null);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private computeScore(): number {
    return this.points.reduce((sum, p) => sum + Math.abs(p.y - this.lineYAt(p.x)), 0);
  }

  private lineYAt(x: number): number {
    const t = (x - X_MIN) / (X_MAX - X_MIN);
    return this.leftY() + (this.rightY() - this.leftY()) * t;
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }
}
