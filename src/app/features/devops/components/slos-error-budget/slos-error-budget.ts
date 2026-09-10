import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, signal } from '@angular/core';

type BudgetState = 'healthy' | 'warning' | 'exhausted';

const SLO_TARGET = 99.9;
const ERROR_BUDGET_PCT = 100 - SLO_TARGET; // 0.1% of requests may fail

@Component({
  selector: 'app-slos-error-budget',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section class="lab-section do-scene" id="do-slo">
      <div class="container">
        <p class="lab-index mono">05 — SLIs, SLOs, SLAs &amp; ERROR BUDGETS</p>
        <h2 class="lab-title">"99.9% uptime" is three different promises wearing one number</h2>
        <p class="lab-lede">
          These three terms get used interchangeably, but they answer different questions. Keep them separate and a
          lot of on-call arguments resolve themselves.
        </p>

        <div class="lab-panel">
          <div class="term-grid">
            <div class="term-tile">
              <span class="term-name mono">SLI</span>
              <span class="term-title">Service Level Indicator</span>
              <p class="term-copy">The measured thing. "What % of requests succeeded in the last 28 days?" — a number you actually collect.</p>
            </div>
            <div class="term-tile">
              <span class="term-name mono">SLO</span>
              <span class="term-title">Service Level Objective</span>
              <p class="term-copy">The internal target for that SLI. Our running example: <strong>99.9% of requests succeed</strong>. This is the goal the team engineers toward.</p>
            </div>
            <div class="term-tile">
              <span class="term-name mono">SLA</span>
              <span class="term-title">Service Level Agreement</span>
              <p class="term-copy">The external, contractual promise to customers — usually <strong>looser</strong> than the SLO, with real consequences (credits, penalties) if missed.</p>
            </div>
          </div>

          <div class="budget-section">
            <p class="budget-heading mono">ERROR BUDGET &mdash; SLO {{ SLO_TARGET }}%</p>
            <p class="budget-copy">
              An error budget is <span class="mono">1 &minus; SLO</span>: at a 99.9% target, {{ errorBudgetPct }}% of
              requests are allowed to fail over the rolling window before the SLO is breached. Every failure spends
              some of that budget.
            </p>

            <div class="gauge-row">
              <div class="gauge-track">
                <div class="gauge-fill" [class]="'is-' + budgetState()" [style.width.%]="budgetRemainingPct()"></div>
              </div>
              <span class="gauge-value mono" [class]="'is-' + budgetState()">{{ budgetRemainingPct() | number: '1.0-1' }}% left</span>
            </div>

            <div class="state-row">
              <span class="state-pill mono" [class.is-current]="budgetState() === 'healthy'">HEALTHY</span>
              <span class="state-pill mono" [class.is-current]="budgetState() === 'warning'">WARNING</span>
              <span class="state-pill mono" [class.is-current]="budgetState() === 'exhausted'">BUDGET EXHAUSTED</span>
            </div>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-danger" (click)="simulateFailure()" [disabled]="budgetState() === 'exhausted'">
                SIMULATE FAILING REQUESTS
              </button>
              <button type="button" class="lab-btn" (click)="reset()">RESET WINDOW</button>
            </div>

            @if (budgetState() === 'exhausted') {
              <div class="exhausted-banner" role="alert">
                <span class="mono">BUDGET EXHAUSTED</span>
                <p>
                  The SLO has effectively been breached for this window. Many teams treat this as a hard signal:
                  pause risky releases, freeze non-essential deploys, and reprioritize toward reliability work until
                  the budget recovers.
                </p>
              </div>
            } @else {
              <p class="lab-note">
                Once the budget is gone, it isn't just a dashboard turning red — it's usually the trigger for a real
                engineering decision: hold off on the next risky release and spend the sprint on reliability instead
                of new features.
              </p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #64748b;
    }

    .term-grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
    @media (min-width: 760px) { .term-grid { grid-template-columns: repeat(3, 1fr); } }
    .term-tile {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .term-name { font-size: 1rem; font-weight: 700; color: var(--do-cyan); }
    .term-title { font-size: 0.8125rem; font-weight: 600; color: var(--text); }
    .term-copy { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
    .term-copy strong { color: var(--text); }

    .budget-section { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
    .budget-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .budget-copy { margin-top: 8px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; max-width: 620px; }

    .gauge-row { margin-top: 20px; display: flex; align-items: center; gap: 12px; }
    .gauge-track {
      flex: 1;
      height: 14px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .gauge-fill { height: 100%; transition: width 0.35s ease, background 0.35s ease; }
    .gauge-fill.is-healthy { background: var(--do-success); }
    .gauge-fill.is-warning { background: var(--do-warning); }
    .gauge-fill.is-exhausted { background: var(--do-danger); }
    .gauge-value { font-size: 0.8125rem; font-weight: 700; min-width: 84px; text-align: right; color: var(--text); }
    .gauge-value.is-warning { color: var(--do-warning); }
    .gauge-value.is-exhausted { color: var(--do-danger); }

    .state-row { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
    .state-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      color: var(--text-faint);
      opacity: 0.55;
    }
    .state-pill.is-current { opacity: 1; color: var(--text); border-color: var(--do-accent); background: color-mix(in srgb, var(--do-accent) 12%, transparent); }

    .exhausted-banner {
      margin-top: 20px;
      padding: 16px 18px;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--do-danger) 45%, var(--border));
      background: color-mix(in srgb, var(--do-danger) 10%, var(--surface));
    }
    .exhausted-banner > span { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; color: var(--do-danger); }
    .exhausted-banner p { margin-top: 8px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class SlosErrorBudget implements OnDestroy {
  protected readonly SLO_TARGET = SLO_TARGET;
  protected readonly errorBudgetPct = Math.round(ERROR_BUDGET_PCT * 1000) / 1000;

  protected readonly budgetRemainingPct = signal(100);

  protected readonly budgetState = computed<BudgetState>(() => {
    const remaining = this.budgetRemainingPct();
    if (remaining <= 0) return 'exhausted';
    if (remaining <= 40) return 'warning';
    return 'healthy';
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected simulateFailure(): void {
    if (this.budgetState() === 'exhausted') return;
    this.clearTimer();
    this.timer = setInterval(() => {
      this.budgetRemainingPct.update((v) => Math.max(0, v - (6 + Math.random() * 6)));
      if (this.budgetRemainingPct() <= 0) {
        this.clearTimer();
      }
    }, 350);
  }

  protected reset(): void {
    this.clearTimer();
    this.budgetRemainingPct.set(100);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
