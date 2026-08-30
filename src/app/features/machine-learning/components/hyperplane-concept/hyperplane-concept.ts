import { Component, signal } from '@angular/core';

type Panel = 1 | 2 | 3;

@Component({
  selector: 'app-hyperplane-concept',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="hyperplane">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 012 — THE HYPERPLANE</p>
        <h2 class="lab-title">The same idea, one dimension at a time.</h2>
        <p class="lab-lede">
          A line, a plane, and a hyperplane are not three different tools — they are the same separating
          surface, generalized to however many features the data has.
        </p>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="panel() === 1" (click)="panel.set(1)">1 feature</button>
          <button type="button" class="lab-btn" [class.is-active]="panel() === 2" (click)="panel.set(2)">2 features</button>
          <button type="button" class="lab-btn" [class.is-active]="panel() === 3" (click)="panel.set(3)">Many features</button>
        </div>

        <div class="lab-panel">
          @if (panel() === 1) {
            <div class="panel-body">
              <svg class="viz viz-line" viewBox="0 0 400 200">
                <line x1="20" y1="180" x2="380" y2="180" class="axis" />
                <line x1="20" y1="20" x2="20" y2="180" class="axis" />
                <line x1="40" y1="150" x2="360" y2="40" class="model-line" />
                <circle cx="200" cy="95" r="7" class="point" />
              </svg>
              <p class="panel-caption">A prediction is a point on a <strong>LINE.</strong></p>
              <p class="panel-detail">
                With one feature, the model's decision surface collapses to a single straight line drawn
                across a 1-dimensional input axis.
              </p>
            </div>
          }

          @if (panel() === 2) {
            <div class="panel-body">
              <svg class="viz viz-plane" viewBox="0 0 400 220">
                <polygon points="60,170 340,170 300,40 100,40" class="model-plane" />
                <line x1="20" y1="190" x2="380" y2="190" class="axis" />
                <line x1="60" y1="200" x2="120" y2="20" class="axis-3d" />
                <circle cx="210" cy="105" r="7" class="point" />
              </svg>
              <p class="panel-caption">A prediction is a point on a <strong>PLANE</strong> in 3D.</p>
              <p class="panel-detail">
                Add a second feature and the decision surface becomes a flat plane floating in a
                3-dimensional space — still flat, still the same kind of boundary, just one dimension up.
              </p>
            </div>
          }

          @if (panel() === 3) {
            <div class="panel-body">
              <div class="many-viz">
                <div class="schematic-shape"></div>
                <span class="pill pill-conditional schematic-badge">
                  Visual representation of a higher-dimensional concept — not a literal drawing
                </span>
              </div>
              <p class="panel-caption">A prediction is a point relative to a <strong>HYPERPLANE.</strong></p>
              <p class="panel-detail">
                A hyperplane is the generalization of a line or plane used to separate or model data in a
                feature space of any number of dimensions. Nobody can draw a 50-dimensional surface — the
                shape above is only a stand-in for "one flat dividing surface," not an actual rendering of it.
              </p>
            </div>
          }
        </div>

        <div class="lab-panel recap-panel">
          <p class="lab-node">The same pattern, generalized</p>
          <div class="recap-row mono">
            <span class="recap-step">LINE</span>
            <span class="lab-flow-arrow">→ one more feature →</span>
            <span class="recap-step">PLANE</span>
            <span class="lab-flow-arrow">→ many more features →</span>
            <span class="recap-step">HYPERPLANE</span>
          </div>
          <p class="panel-detail">
            In every case, the surface is defined the same way — a linear combination of the inputs set
            equal to a constant. What changes across the three panels is only how many dimensions the
            surface has to live in, never the underlying rule that builds it.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .panel-body { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
    .viz { width: 100%; max-width: 420px; height: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .axis { stroke: var(--border-strong); stroke-width: 1.5; }
    .axis-3d { stroke: var(--border-strong); stroke-width: 1.5; stroke-dasharray: 4 4; }
    .model-line { stroke: var(--accent); stroke-width: 3; }
    .model-plane { fill: color-mix(in srgb, var(--accent) 22%, transparent); stroke: var(--accent); stroke-width: 2; }
    .point { fill: var(--accent-strong); }

    .many-viz { position: relative; width: 100%; max-width: 420px; height: 220px; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .schematic-shape {
      width: 78%;
      height: 62%;
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 30%, transparent), color-mix(in srgb, var(--accent-2) 18%, transparent));
      border: 1.5px dashed var(--accent-dim);
      border-radius: var(--radius-lg);
      transform: perspective(600px) rotateX(35deg) rotateZ(-6deg);
      -webkit-mask-image: radial-gradient(ellipse at center, black 55%, transparent 92%);
      mask-image: radial-gradient(ellipse at center, black 55%, transparent 92%);
    }
    .schematic-badge { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); white-space: normal; text-align: center; max-width: 88%; padding: 8px 14px; line-height: 1.4; }

    .panel-caption { font-size: 1.0625rem; color: var(--text); }
    .panel-caption strong { color: var(--accent-strong); }
    .panel-detail { max-width: 640px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }

    .recap-panel { display: flex; flex-direction: column; gap: 14px; }
    .recap-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.875rem; }
    .recap-step { padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--accent-strong); font-weight: 700; }
  `,
})
export class HyperplaneConcept {
  protected readonly panel = signal<Panel>(1);
}
