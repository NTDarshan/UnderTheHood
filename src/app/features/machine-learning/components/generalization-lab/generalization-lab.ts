import { Component, computed, signal } from '@angular/core';

type Complexity = 'simple' | 'balanced' | 'complex';

interface Point {
  x: number;
  y: number;
}

const PLANE_W = 600;
const PLANE_H = 340;

const TRAIN_POINTS: Point[] = [
  { x: 40, y: 290 },
  { x: 90, y: 270 },
  { x: 140, y: 250 },
  { x: 190, y: 245 },
  { x: 240, y: 205 },
  { x: 290, y: 195 },
  { x: 340, y: 160 },
  { x: 390, y: 150 },
  { x: 440, y: 110 },
  { x: 490, y: 95 },
];

const TEST_POINTS: Point[] = [
  { x: 65, y: 275 },
  { x: 165, y: 230 },
  { x: 265, y: 190 },
  { x: 365, y: 145 },
  { x: 465, y: 100 },
];

const PATHS: Record<Complexity, string> = {
  simple: 'M20,215 L560,185',
  balanced: 'M20,285 C150,260 250,200 350,155 C420,125 500,100 560,90',
  complex:
    'M40,290 C55,220 65,340 90,270 C110,340 120,180 140,250 C160,320 170,180 190,245 ' +
    'C215,150 225,260 240,205 C260,260 270,140 290,195 C315,100 325,220 340,160 ' +
    'C360,220 370,100 390,150 C410,90 425,180 440,110 C460,180 470,40 490,95',
};

const LABELS: Record<Complexity, string> = {
  simple: 'Very simple',
  balanced: 'Balanced',
  complex: 'Very complex',
};

const VERDICTS: Record<Complexity, { text: string; pillClass: string }> = {
  simple: { text: 'UNDERFITTING', pillClass: 'pill-danger' },
  balanced: { text: 'GOOD FIT', pillClass: 'pill-yes' },
  complex: { text: 'OVERFITTING', pillClass: 'pill-danger' },
};

function distanceToSegmentChain(point: Point, samples: Point[]): number {
  let best = Infinity;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    const d = Math.hypot(point.x - px, point.y - py);
    if (d < best) best = d;
  }
  return best;
}

const APPROX_SAMPLES: Record<Complexity, Point[]> = {
  simple: [
    { x: 20, y: 215 },
    { x: 560, y: 185 },
  ],
  balanced: [
    { x: 20, y: 285 },
    { x: 150, y: 260 },
    { x: 250, y: 200 },
    { x: 350, y: 155 },
    { x: 420, y: 125 },
    { x: 500, y: 100 },
    { x: 560, y: 90 },
  ],
  complex: [
    { x: 40, y: 290 },
    { x: 65, y: 340 },
    { x: 90, y: 270 },
    { x: 120, y: 180 },
    { x: 140, y: 250 },
    { x: 170, y: 180 },
    { x: 190, y: 245 },
    { x: 225, y: 260 },
    { x: 240, y: 205 },
    { x: 270, y: 140 },
    { x: 290, y: 195 },
    { x: 325, y: 220 },
    { x: 340, y: 160 },
    { x: 370, y: 100 },
    { x: 390, y: 150 },
    { x: 425, y: 180 },
    { x: 440, y: 110 },
    { x: 470, y: 40 },
    { x: 490, y: 95 },
  ],
};

@Component({
  selector: 'app-generalization-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="generalization">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 020 — GENERALIZATION</p>
        <h2 class="lab-title">A model that memorizes every dot has learned nothing useful.</h2>
        <p class="lab-lede">
          Pick how complex the fitted curve is allowed to be, then see what happens once data the model hasn't
          seen shows up.
        </p>

        <div class="lab-btn-row" role="tablist" aria-label="Model complexity">
          @for (c of complexities; track c) {
            <button type="button" class="lab-btn" role="tab" [class.is-active]="complexity() === c" (click)="complexity.set(c)">
              {{ labels[c] }}
            </button>
          }
        </div>

        <div class="lab-panel">
          <svg class="plane" [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH">
            @if (complexity(); as c) {
              <path [attr.d]="paths[c]" class="model-path" [class.path-danger]="verdicts[c].pillClass === 'pill-danger'" />
            }

            @for (p of trainPoints; track p.x) {
              <circle [attr.cx]="p.x" [attr.cy]="p.y" r="6" class="train-point" />
            }

            @if (complexity()) {
              @for (p of testPoints; track p.x) {
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="6" class="test-point" />
              }
            }
          </svg>

          <div class="legend-row">
            <p class="legend-item"><span class="legend-swatch legend-train"></span> Training data</p>
            <p class="legend-item"><span class="legend-swatch legend-test"></span> Unseen test data</p>
          </div>

          @if (complexity(); as c) {
            <div class="verdict-row">
              <span class="pill" [class]="verdicts[c].pillClass">{{ verdicts[c].text }}</span>
              <p class="verdict-caption">Avg. distance from curve to test points: {{ avgTestDistance()!.toFixed(1) }} px</p>
            </div>
          } @else {
            <p class="verdict-caption">Choose a complexity above to reveal how it does on unseen test points.</p>
          }
        </div>

        <p class="lab-note">
          The goal is not to memorize the training data — it's to generalize to data the model hasn't seen.
          (This connects to bias, variance, and regularization — deeper topics for another day.)
        </p>
      </div>
    </section>
  `,
  styles: `
    .plane { width: 100%; height: auto; aspect-ratio: 600 / 340; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-top: 20px; }

    .model-path { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linecap: round; }
    .model-path.path-danger { stroke: var(--danger); }

    .train-point { fill: var(--accent-2); stroke: var(--surface); stroke-width: 1.5; }
    .test-point { fill: none; stroke: var(--text-muted); stroke-width: 2; stroke-dasharray: 2 2; }

    .legend-row { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 14px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .legend-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; }
    .legend-train { background: var(--accent-2); }
    .legend-test { background: transparent; border: 2px dashed var(--text-muted); }

    .verdict-row { margin-top: 18px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .pill-danger { color: var(--danger); border-color: var(--danger); }
    .verdict-caption { font-size: 0.8125rem; color: var(--text-faint); }
  `,
})
export class GeneralizationLab {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly trainPoints = TRAIN_POINTS;
  protected readonly testPoints = TEST_POINTS;
  protected readonly complexities: Complexity[] = ['simple', 'balanced', 'complex'];
  protected readonly labels = LABELS;
  protected readonly paths = PATHS;
  protected readonly verdicts = VERDICTS;

  protected readonly complexity = signal<Complexity | null>(null);

  protected readonly avgTestDistance = computed(() => {
    const c = this.complexity();
    if (!c) return null;
    const samples = APPROX_SAMPLES[c];
    const total = TEST_POINTS.reduce((sum, p) => sum + distanceToSegmentChain(p, samples), 0);
    return total / TEST_POINTS.length;
  });
}
