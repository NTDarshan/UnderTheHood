import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const RESIDUALS = [2, -3, 1, -4];

@Component({
  selector: 'app-squared-error-mse',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="squared-error">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 009 — WHY SQUARE THE ERROR?</p>
        <h2 class="lab-title">Four errors walk into a sum. Three of them cancel out.</h2>
        <p class="lab-lede">
          A model made four predictions. Each one missed by a different amount — some too high, some too low.
          How do we turn those four numbers into one honest score for "how wrong was this model"?
        </p>

        <app-explain-simply>
          If you're off by +2 one day and -2 the next, your average error looks like zero — even though you
          were wrong both times. Squaring first means every miss counts, regardless of direction.
        </app-explain-simply>

        <div class="chip-row">
          @for (r of residuals; track $index) {
            <div class="chip">
              <p class="chip-label mono">residual {{ $index + 1 }}</p>
              <p class="chip-value mono" [class.is-squared]="squared()">
                {{ squared() ? squares[$index] : (r > 0 ? '+' + r : r) }}
              </p>
            </div>
          }
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="sum()">
            Sum them
          </button>
          <button type="button" class="lab-btn" [class.is-active]="squared()" (click)="squareToggle()">
            {{ squared() ? 'Show raw residuals' : 'Square them instead' }}
          </button>
        </div>

        @if (summed() && !squared()) {
          <p class="result-line mono">(+2) + (-3) + (+1) + (-4) = {{ naiveSum() }}</p>
          <p class="lab-note-warn">
            Positive and negative errors cancel out — this hides how wrong the model really is.
          </p>
        }

        @if (squared()) {
          <p class="result-line mono">4² + 3² + 1² + 4² = {{ squares.join(' + ') }} — all positive now.</p>

          <div class="bar-compare">
            <div class="bar-col">
              <p class="bar-heading mono">ERROR OF 1</p>
              <div class="bar-track">
                <div class="bar bar-small" [style.height.%]="(1 / 16) * 100"></div>
              </div>
              <p class="bar-caption mono">1² = 1</p>
            </div>
            <div class="bar-col">
              <p class="bar-heading mono">ERROR OF 4</p>
              <div class="bar-track">
                <div class="bar bar-large" [style.height.%]="(16 / 16) * 100"></div>
              </div>
              <p class="bar-caption mono">4² = 16</p>
            </div>
          </div>
          <p class="bar-note">
            Doubling the error doesn't double the penalty — a residual of 4 is only 4× a residual of 1, but its
            squared penalty is 16× as large. Squaring punishes large errors disproportionately more than small ones.
          </p>

          <div class="mse-panel">
            <p class="mse-heading mono">MEAN SQUARED ERROR (MSE)</p>
            <p class="mse-formula mono">MSE = ({{ squares.join(' + ') }}) / {{ squares.length }} = {{ mse() }}</p>
          </div>

          <p class="lab-note">
            MSE is one possible way to measure error — not the only one. Later models may use different loss
            functions entirely.
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .chip-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }
    .chip { padding: 16px 20px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface); min-width: 110px; text-align: center; }
    .chip-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 8px; }
    .chip-value { font-size: 1.5rem; color: var(--danger); transition: color 0.4s ease; }
    .chip-value.is-squared { color: var(--danger); }

    .result-line { margin-top: 20px; font-size: 1rem; color: var(--text); }

    .bar-compare { display: flex; gap: 32px; margin-top: 28px; align-items: flex-end; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .bar-heading { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .bar-track { width: 64px; height: 160px; display: flex; align-items: flex-end; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .bar { width: 100%; border-radius: 2px 2px 0 0; transition: height 0.7s ease; }
    .bar-small { background: var(--accent-2); }
    .bar-large { background: var(--danger); }
    .bar-caption { font-size: 0.75rem; color: var(--text-muted); }

    .bar-note { margin-top: 16px; max-width: 620px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .mse-panel { margin-top: 28px; padding: 20px 24px; background: var(--surface-raised); border-left: 2px solid var(--accent); border-radius: var(--radius-sm); max-width: 640px; }
    .mse-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent); margin-bottom: 10px; }
    .mse-formula { font-size: 1rem; color: var(--text); }
  `,
})
export class SquaredErrorMse {
  protected readonly residuals = RESIDUALS;
  protected readonly squares = RESIDUALS.map((r) => r * r);

  protected readonly summed = signal(false);
  protected readonly squared = signal(false);

  protected readonly naiveSum = computed(() => this.residuals.reduce((a, b) => a + b, 0));
  protected readonly mse = computed(() => {
    const total = this.squares.reduce((a, b) => a + b, 0);
    return total / this.squares.length;
  });

  sum(): void {
    this.summed.set(true);
  }

  squareToggle(): void {
    this.squared.update((v) => !v);
  }
}
