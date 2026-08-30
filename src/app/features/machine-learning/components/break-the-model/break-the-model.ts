import { Component, OnDestroy, signal } from '@angular/core';

type Visual = 'wrong-slope' | 'outliers' | 'overfit' | null;

interface Scenario {
  id: string;
  label: string;
  whatHappened: string;
  why: string;
  howToFix: string;
  visual: Visual;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'wrong-slope',
    label: 'Wrong slope',
    whatHappened:
      "The model draws a straight line, but its steepness clearly doesn't match the trend the data is showing — too shallow, too steep, or even tilted the wrong way.",
    why:
      "The slope parameter (m) never converged to the right value. Training may have stopped too early, the learning rate may be too small to move it far enough, or the optimization loop itself is broken.",
    howToFix:
      "Train for more iterations, check that the loss is actually decreasing over time, and nudge the learning rate up slightly if the slope is barely moving at all.",
    visual: 'wrong-slope',
  },
  {
    id: 'wrong-intercept',
    label: 'Wrong intercept',
    whatHappened:
      "The line has roughly the right steepness and direction, but the whole thing sits shifted up or down from the cloud of points — parallel to a good fit, just offset.",
    why:
      "The intercept parameter (b) hasn't converged yet — often because training settled the slope first and stopped before the offset caught up, or because the input features weren't centered, which makes the intercept slower to learn.",
    howToFix:
      "Keep training a bit longer, or center your features (subtract the mean) first — this alone tends to make the intercept converge far faster.",
    visual: null,
  },
  {
    id: 'too-few-examples',
    label: 'Too few examples',
    whatHappened:
      "The model fits the handful of points it saw almost perfectly, but the line swings wildly the moment a new point shows up — it doesn't hold up beyond its training data.",
    why:
      "A handful of points doesn't reveal the true underlying pattern — it only reveals whatever those specific points happen to look like, noise included.",
    howToFix:
      "Collect more data before trusting the fit, and use a technique like a held-out validation set (or cross-validation) to check whether the line still holds on data it never saw.",
    visual: null,
  },
  {
    id: 'outliers',
    label: 'Outliers',
    whatHappened:
      "One point sits far from the rest of the cluster, and the fitted line visibly tilts toward it — pulling away from the trend every other point agrees on.",
    why:
      "Squared error punishes large residuals heavily, so one distant point can dominate the total loss and drag the whole line toward itself, even against the wishes of every other point.",
    howToFix:
      "Investigate the outlier first — is it a data error or a genuine rare case? Consider a more robust loss (like mean absolute error) that punishes large errors less severely, or remove confirmed bad data.",
    visual: 'outliers',
  },
  {
    id: 'uneven-scale',
    label: 'Uneven feature scale',
    whatHappened:
      "With more than one feature, the model appears to almost completely ignore one of them — every prediction seems driven by only a single input.",
    why:
      "When one feature ranges in the thousands and another ranges between 0 and 1, gradient descent updates the large-scale feature's parameter far more aggressively each step, drowning out the smaller-scale feature's signal.",
    howToFix:
      "Normalize or standardize every feature to a comparable range before training, so no feature dominates purely because of the units it happens to be measured in.",
    visual: null,
  },
  {
    id: 'overly-complex',
    label: 'Overly complex model',
    whatHappened:
      "The model traces every wiggle in the training data almost exactly — and then produces wild, nonsensical predictions on new points just slightly outside what it already saw.",
    why:
      "A model with far more flexibility than the data actually justifies will happily fit noise as if it were signal. That's overfitting: perfect on training data, unreliable everywhere else.",
    howToFix:
      "Use a simpler model, add regularization to discourage extreme parameter values, gather more training data, or hold out a validation set that catches this gap before it reaches production.",
    visual: 'overfit',
  },
];

@Component({
  selector: 'app-break-the-model',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="break-the-model">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 023 — BREAK THE MODEL</p>
        <h2 class="lab-title">Every one of these has happened to a real model in production.</h2>
        <p class="lab-lede">Pick a way things go wrong, and see exactly what it looks like, why it happens, and how it gets fixed.</p>

        <div class="scenario-grid">
          @for (s of scenarios; track s.id) {
            <button type="button" class="scenario-btn" [class.is-active]="selected().id === s.id" (click)="select(s)">
              {{ s.label }}
            </button>
          }
        </div>

        <div class="lab-panel result-panel" [class.is-flashing]="flashing()">
          <p class="result-title mono">{{ selected().label.toUpperCase() }}</p>

          @switch (selected().visual) {
            @case ('wrong-slope') {
              <svg class="mini-visual" viewBox="0 0 160 100">
                <circle cx="20" cy="80" r="3" class="mini-point" />
                <circle cx="42" cy="68" r="3" class="mini-point" />
                <circle cx="65" cy="55" r="3" class="mini-point" />
                <circle cx="88" cy="42" r="3" class="mini-point" />
                <circle cx="112" cy="28" r="3" class="mini-point" />
                <circle cx="135" cy="16" r="3" class="mini-point" />
                <line x1="10" y1="60" x2="150" y2="45" class="mini-line" />
              </svg>
              <p class="mini-caption mono">the line barely rises while the points climb steeply</p>
            }
            @case ('outliers') {
              <svg class="mini-visual" viewBox="0 0 160 100">
                <circle cx="20" cy="72" r="3" class="mini-point" />
                <circle cx="38" cy="66" r="3" class="mini-point" />
                <circle cx="55" cy="60" r="3" class="mini-point" />
                <circle cx="72" cy="55" r="3" class="mini-point" />
                <circle cx="90" cy="50" r="3" class="mini-point" />
                <circle cx="150" cy="14" r="4" class="mini-point mini-point-outlier" />
                <line x1="10" y1="78" x2="120" y2="18" class="mini-line" />
                <line x1="10" y1="70" x2="120" y2="46" class="mini-line mini-line-ghost" />
              </svg>
              <p class="mini-caption mono">one far point tilts the whole line off the real trend</p>
            }
            @case ('overfit') {
              <svg class="mini-visual" viewBox="0 0 160 100">
                <circle cx="16" cy="70" r="3" class="mini-point" />
                <circle cx="38" cy="40" r="3" class="mini-point" />
                <circle cx="60" cy="66" r="3" class="mini-point" />
                <circle cx="84" cy="30" r="3" class="mini-point" />
                <circle cx="108" cy="62" r="3" class="mini-point" />
                <circle cx="132" cy="34" r="3" class="mini-point" />
                <path d="M16,70 C 27,20 32,20 38,40 C 46,62 52,72 60,66 C 70,20 76,18 84,30 C 96,66 100,70 108,62 C 118,20 124,22 132,34" class="mini-line" />
                <line x1="10" y1="58" x2="140" y2="42" class="mini-line mini-line-ghost" />
              </svg>
              <p class="mini-caption mono">the curve chases every point instead of the trend</p>
            }
          }

          <div class="result-row"><span class="result-label mono">WHAT HAPPENED</span><p>{{ selected().whatHappened }}</p></div>
          <div class="result-row"><span class="result-label mono">WHY</span><p>{{ selected().why }}</p></div>
          <div class="result-row"><span class="result-label mono">HOW TO FIX IT</span><p class="fix">{{ selected().howToFix }}</p></div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .scenario-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .scenario-btn { padding: 12px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); color: var(--text-muted); font-size: 0.875rem; text-align: left; transition: border-color 0.15s ease, color 0.15s ease; }
    .scenario-btn:hover { border-color: var(--danger); }
    .scenario-btn.is-active { border-color: var(--danger); color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface-elevated)); }

    .result-panel { margin-top: 20px; transition: box-shadow 0.15s ease, border-color 0.15s ease; }
    .result-panel.is-flashing { border-color: var(--danger); box-shadow: 0 0 0 1px var(--danger); animation: result-shake 0.35s ease; }
    @keyframes result-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
    .result-title { color: var(--danger); font-size: 1rem; margin-bottom: 18px; }

    .mini-visual { width: 200px; max-width: 100%; height: auto; aspect-ratio: 160 / 100; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 6px; }
    .mini-point { fill: var(--accent-2); }
    .mini-point-outlier { fill: var(--danger); }
    .mini-line { stroke: var(--accent); stroke-width: 2; fill: none; }
    .mini-line-ghost { stroke: var(--text-faint); stroke-width: 1.5; stroke-dasharray: 3 3; }
    .mini-caption { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 16px; }

    .result-row { margin-top: 14px; }
    .result-row:first-of-type { margin-top: 0; }
    .result-label { display: block; font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent-2); margin-bottom: 4px; }
    .result-row p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; max-width: 660px; }
    .fix { color: var(--text); }
  `,
})
export class BreakTheModel implements OnDestroy {
  protected readonly scenarios = SCENARIOS;
  protected readonly selected = signal<Scenario>(SCENARIOS[0]);
  protected readonly flashing = signal(false);

  private flashTimer?: ReturnType<typeof setTimeout>;

  select(s: Scenario): void {
    this.selected.set(s);
    this.flashing.set(true);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.flashing.set(false), 400);
  }

  ngOnDestroy(): void {
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }
}
