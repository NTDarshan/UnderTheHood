import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-rules-domain',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="validation-vs-business-rules">
      <div class="container">
        <p class="lab-index">VALIDATION / 24 — VALIDATION VS. BUSINESS RULES</p>
        <h2 class="lab-title">"Is the shape right?" is not "is this allowed to happen?"</h2>

        <div class="compare-grid">
          <div class="compare-card">
            <p class="compare-title mono">INPUT VALIDATION</p>
            <p class="compare-text">Is the input structurally acceptable? Example: "email must be a valid format."</p>
          </div>
          <div class="compare-card">
            <p class="compare-title mono">BUSINESS RULE</p>
            <p class="compare-text">Is this operation allowed according to domain behavior? Example: "a customer cannot place more than 5 active orders."</p>
          </div>
        </div>

        <p class="lab-note">These can overlap conceptually, but shouldn't all be dumped into one controller — the service/domain layer stays responsible for business behavior.</p>
      </div>
    </section>

    <section class="lab-section" id="domain-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 25 — DOMAIN VALIDATION</p>
        <h2 class="lab-title">Perfectly valid input. Still an invalid operation.</h2>

        <div class="lab-panel domain-panel">
          <div class="lab-field">
            <label for="withdraw-amount">Withdrawal amount</label>
            <input id="withdraw-amount" type="number" [ngModel]="amount()" (ngModelChange)="amount.set(+$event)" />
          </div>
          <p class="domain-line mono">Account balance: $50</p>

          <p class="domain-check">Input validation: amount is numeric — <span class="ok">✓</span></p>
          <p class="domain-check">
            Domain validation: can withdraw {{ '$' + amount() }}?
            <span [class.is-ok]="withinBalance()" [class.is-fail]="!withinBalance()">{{ withinBalance() ? '✓' : '✕' }}</span>
          </p>
        </div>

        <p class="lab-note">The input can be perfectly valid while the operation itself is invalid according to current domain state.</p>
      </div>
    </section>

    <section class="lab-section" id="db-constraints">
      <div class="container">
        <p class="lab-index">VALIDATION / 26 — DATABASE CONSTRAINTS ARE NOT A REPLACEMENT</p>
        <h2 class="lab-title">Three layers, each protecting something different.</h2>

        <div class="stack-list">
          <p class="stack-line">API Validation</p>
          <p class="stack-plus">+</p>
          <p class="stack-line">Business Rules</p>
          <p class="stack-plus">+</p>
          <p class="stack-line">Database Constraints (NOT NULL, UNIQUE, FOREIGN KEY, CHECK)</p>
        </div>

        <p class="lab-note lab-note-warn">
          Database constraints remain important for data integrity, but relying on database
          exceptions as the primary mechanism for rejecting predictable client input pushes the
          failure far downstream. The database is another safety boundary — not a substitute for the others.
        </p>
      </div>
    </section>
  `,
  styles: `
    .compare-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .compare-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .compare-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .domain-panel { margin-top: 24px; max-width: 400px; }
    .domain-line { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); }
    .domain-check { margin-top: 12px; font-size: 0.875rem; color: var(--text-muted); }
    .ok { color: var(--accent-2); font-weight: 700; }
    .is-fail { color: var(--danger); font-weight: 700; }
    .is-ok { color: var(--accent-2); font-weight: 700; }

    .stack-list { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .stack-line { padding: 8px 20px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); font-size: 0.8125rem; color: var(--text); }
    .stack-plus { color: var(--text-faint); }
  `,
})
export class BusinessRulesDomain {
  protected readonly amount = signal(100);
  protected readonly withinBalance = computed(() => this.amount() <= 50);
}
