import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isSyntacticallyValidEmail, isValidIsoDate, isValidPhone, normalizePhone } from '../../engine/validation-simulator';

type Format = 'email' | 'phone' | 'date';

@Component({
  selector: 'app-syntax-semantic-validation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="syntactic-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 07 — SYNTACTIC VALIDATION</p>
        <h2 class="lab-title">"Does this value follow the expected format?"</h2>

        <div class="lab-btn-row">
          @for (f of formats; track f) {
            <button type="button" class="lab-btn" [class.is-active]="format() === f" (click)="setFormat(f)">{{ f }}</button>
          }
        </div>

        <div class="lab-panel syntax-panel">
          <div class="lab-field">
            <label for="syntax-input">Value</label>
            <input id="syntax-input" type="text" [ngModel]="value()" (ngModelChange)="value.set($event)" />
          </div>
          <p class="syntax-result" [class.is-ok]="isValid()" [class.is-fail]="!isValid()">
            {{ isValid() ? '✓ Valid format' : '✕ Invalid format' }}
          </p>
        </div>

        <p class="lab-note lab-note-warn">
          Syntactic validation does not necessarily answer "does this value make business sense?" — that is semantic validation, next.
        </p>
      </div>
    </section>

    <section class="lab-section" id="semantic-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 08 — SEMANTIC VALIDATION</p>
        <h2 class="lab-title">Looks valid. Still wrong.</h2>

        <div class="semantic-grid">
          <div class="semantic-card">
            <p class="sem-title mono">dateOfBirth: 2045-01-01</p>
            <p class="sem-line ok">✓ valid date format</p>
            <p class="sem-line fail">✕ future birth date</p>
          </div>
          <div class="semantic-card">
            <p class="sem-title mono">age: 400</p>
            <p class="sem-line ok">✓ number</p>
            <p class="sem-line ok">✓ numeric</p>
            <p class="sem-line fail">✕ not a plausible age</p>
          </div>
        </div>

        <p class="lab-note">A value can be syntactically valid while still being meaningless or unacceptable in context — semantic validation checks that context.</p>
      </div>
    </section>
  `,
  styles: `
    .syntax-panel { margin-top: 24px; max-width: 360px; }
    .syntax-result { margin-top: 16px; font-size: 0.9375rem; font-weight: 600; }
    .syntax-result.is-ok { color: var(--accent-2); }
    .syntax-result.is-fail { color: var(--danger); }

    .semantic-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .semantic-grid { grid-template-columns: 1fr 1fr; } }
    .semantic-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .sem-title { font-size: 0.8125rem; color: var(--accent-strong); margin-bottom: 10px; }
    .sem-line { font-size: 0.875rem; margin-top: 4px; }
    .sem-line.ok { color: var(--accent-2); }
    .sem-line.fail { color: var(--danger); }
  `,
})
export class SyntaxSemanticValidation {
  protected readonly formats: Format[] = ['email', 'phone', 'date'];
  protected readonly format = signal<Format>('email');
  protected readonly value = signal('john@example.com');

  protected readonly isValid = computed(() => {
    const v = this.value();
    if (this.format() === 'email') return isSyntacticallyValidEmail(v);
    if (this.format() === 'phone') return isValidPhone(normalizePhone(v));
    return isValidIsoDate(v);
  });

  setFormat(f: Format): void {
    this.format.set(f);
    this.value.set(f === 'email' ? 'john@example.com' : f === 'phone' ? '+91 9876543210' : '2026-08-28');
  }
}
