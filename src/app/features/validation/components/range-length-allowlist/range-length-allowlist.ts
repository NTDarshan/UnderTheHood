import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const ALLOWED_SORT_FIELDS = ['name', 'createdAt', 'price'];

@Component({
  selector: 'app-range-length-allowlist',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="range-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 12 — RANGE VALIDATION</p>
        <h2 class="lab-title">Not every number is a valid number.</h2>

        <div class="lab-panel range-panel">
          <label for="age-slider" class="range-label mono">age: {{ age() }} (allowed 18–100)</label>
          <input id="age-slider" type="range" min="0" max="120" [ngModel]="age()" (ngModelChange)="age.set(+$event)" />
          <p class="range-result" [class.is-ok]="ageValid()" [class.is-fail]="!ageValid()">{{ ageValid() ? '✓ within range' : '✕ outside allowed range' }}</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="length-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 13 — LENGTH VALIDATION</p>
        <h2 class="lab-title">Constraints should reflect real requirements, not arbitrary limits.</h2>

        <div class="lab-panel length-panel">
          <div class="lab-field">
            <label for="username-input">Username (3–30 characters)</label>
            <input id="username-input" type="text" [ngModel]="username()" (ngModelChange)="username.set($event)" />
          </div>
          <p class="length-counter mono">{{ username().length }} / 30</p>
          <p class="length-result" [class.is-ok]="usernameValid()" [class.is-fail]="!usernameValid()">
            {{ usernameValid() ? '✓ Valid length' : '✕ Must be between 3 and 30 characters' }}
          </p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="allowlist-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 14 — ALLOWLIST VS. DENYLIST</p>
        <h2 class="lab-title">Accept only what belongs to a known set — don't just reject the bad ones you thought of.</h2>

        <div class="lab-panel allow-panel">
          <div class="lab-field">
            <label for="sort-input">sortBy</label>
            <input id="sort-input" type="text" [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" />
          </div>
          <p class="allow-set mono">Allowed set: {{ allowed.join(', ') }}</p>
          <p class="allow-result" [class.is-ok]="sortValid()" [class.is-fail]="!sortValid()">
            {{ sortValid() ? '✓ Accepted' : '✕ Rejected — not in the allowed set' }}
          </p>
        </div>

        <p class="lab-note">
          Allowlists are especially useful for fields like sort columns, filter operators, enum-like
          values, file extensions, and supported formats — anywhere trying to enumerate every bad value
          in advance ("denylisting") would be an endless, losing game.
        </p>
      </div>
    </section>
  `,
  styles: `
    .range-panel { margin-top: 24px; max-width: 420px; }
    .range-label { font-size: 0.8125rem; color: var(--text-muted); }
    .range-panel input[type='range'] { width: 100%; margin-top: 12px; accent-color: var(--accent); }
    .range-result { margin-top: 12px; font-size: 0.875rem; font-weight: 600; }
    .range-result.is-ok { color: var(--accent-2); }
    .range-result.is-fail { color: var(--danger); }

    .length-panel { margin-top: 24px; max-width: 360px; }
    .length-counter { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); }
    .length-result { margin-top: 10px; font-size: 0.875rem; font-weight: 600; }
    .length-result.is-ok { color: var(--accent-2); }
    .length-result.is-fail { color: var(--danger); }

    .allow-panel { margin-top: 24px; max-width: 400px; }
    .allow-set { margin-top: 12px; font-size: 0.75rem; color: var(--text-faint); }
    .allow-result { margin-top: 10px; font-size: 0.875rem; font-weight: 600; }
    .allow-result.is-ok { color: var(--accent-2); }
    .allow-result.is-fail { color: var(--danger); }
  `,
})
export class RangeLengthAllowlist {
  protected readonly age = signal(25);
  protected readonly ageValid = computed(() => this.age() >= 18 && this.age() <= 100);

  protected readonly username = signal('john_doe');
  protected readonly usernameValid = computed(() => this.username().length >= 3 && this.username().length <= 30);

  protected readonly allowed = ALLOWED_SORT_FIELDS;
  protected readonly sortBy = signal('name');
  protected readonly sortValid = computed(() => this.allowed.includes(this.sortBy()));
}
