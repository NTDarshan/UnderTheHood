import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const CATEGORIES = [
  { name: 'Normalization', example: '"  JOHN@EXAMPLE.COM "', result: '"john@example.com"' },
  { name: 'Parsing', example: '"42"', result: '42' },
  { name: 'Type conversion', example: '"true"', result: 'true (boolean)' },
  { name: 'Trimming', example: '"  hello  "', result: '"hello"' },
  { name: 'Case normalization', example: '"CREATED_AT"', result: '"createdAt"' },
  { name: 'Formatting', example: '"2026-08-28"', result: 'Date representation' },
  { name: 'Mapping', example: '"CREATED_AT" (client field)', result: '"createdAt" (internal field)' },
  { name: 'Defaulting', example: 'pageSize: null', result: 'pageSize: 20' },
];

const SORT_MAP: Record<string, string> = { CREATED_AT: 'createdAt', NAME: 'name', PRICE: 'price' };

@Component({
  selector: 'app-transformation-lab',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="transformation-types">
      <div class="container">
        <p class="lab-index">VALIDATION / 33 — TRANSFORMATION TYPES</p>
        <h2 class="lab-title">Different kinds of "make this what the app expects."</h2>

        <div class="cat-grid">
          @for (c of categories; track c.name) {
            <div class="cat-card">
              <p class="cat-name mono">{{ c.name }}</p>
              <p class="cat-example mono">{{ c.example }}</p>
              <p class="cat-arrow">↓</p>
              <p class="cat-result mono">{{ c.result }}</p>
            </div>
          }
        </div>

        <p class="lab-note">Transformation should be deterministic, intentional, and documented — not an incidental side effect of parsing code.</p>
      </div>
    </section>

    <section class="lab-section" id="dangerous-transformation">
      <div class="container">
        <p class="lab-index">VALIDATION / 34 — TRANSFORMATION CAN BE DANGEROUS</p>
        <h2 class="lab-title">Silently changing meaning is worse than rejecting.</h2>

        <div class="lab-panel danger-panel">
          <div class="lab-field">
            <label for="amount-input">amount</label>
            <input id="amount-input" type="text" [ngModel]="amount()" (ngModelChange)="amount.set($event)" />
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!safeMode()" (click)="safeMode.set(false)">Unsafe: coerce failures to 0</button>
            <button type="button" class="lab-btn" [class.is-active]="safeMode()" (click)="safeMode.set(true)">Safe: reject unparseable input</button>
          </div>

          <div class="danger-result mono">
            @if (isNumeric()) {
              <p class="ok">"{{ amount() }}" → {{ +amount() }}</p>
            } @else if (!safeMode()) {
              <p class="fail">"{{ amount() }}" → 0 <span class="warn-tag">(silently wrong — changes meaning!)</span></p>
            } @else {
              <p class="fail">"{{ amount() }}" → parsing failure → 400 Bad Request</p>
            }
          </div>
        </div>

        <p class="lab-note lab-note-warn">Transformation must not silently turn invalid input into something that changes its meaning — "abc" quietly becoming 0 is usually dangerous, not helpful.</p>
      </div>
    </section>

    <section class="lab-section" id="whitelist-transformation">
      <div class="container">
        <p class="lab-index">VALIDATION / 35 — WHITELIST TRANSFORMATION</p>
        <h2 class="lab-title">Map only what you explicitly know about.</h2>

        <div class="lab-panel whitelist-panel">
          <div class="lab-field">
            <label for="sort-field-input">sort</label>
            <input id="sort-field-input" type="text" [ngModel]="sortField()" (ngModelChange)="sortField.set($event)" />
          </div>
          @if (mappedField()) {
            <p class="whitelist-result ok mono">"{{ sortField() }}" → "{{ mappedField() }}"</p>
          } @else {
            <p class="whitelist-result fail mono">"{{ sortField() }}" is not a known mapping — ✕ rejected</p>
          }
        </div>

        <p class="lab-note">Explicit mappings are safer than blindly trusting client-provided field names when constructing dynamic behavior like sort clauses.</p>
      </div>
    </section>
  `,
  styles: `
    .cat-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 700px) { .cat-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .cat-grid { grid-template-columns: repeat(4, 1fr); } }
    .cat-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; text-align: center; }
    .cat-name { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .cat-example { font-size: 0.75rem; color: var(--text-muted); }
    .cat-arrow { color: var(--text-faint); font-size: 0.75rem; margin: 4px 0; }
    .cat-result { font-size: 0.75rem; color: var(--accent-strong); }

    .danger-panel { margin-top: 24px; max-width: 420px; }
    .danger-result { margin-top: 16px; font-size: 0.875rem; }
    .ok { color: var(--accent-2); }
    .fail { color: var(--danger); }
    .warn-tag { font-size: 0.75rem; }

    .whitelist-panel { margin-top: 24px; max-width: 400px; }
    .whitelist-result { margin-top: 14px; font-size: 0.875rem; }
  `,
})
export class TransformationLab {
  protected readonly categories = CATEGORIES;

  protected readonly amount = signal('1000');
  protected readonly isNumeric = computed(() => /^-?\d+(\.\d+)?$/.test(this.amount().trim()));
  protected readonly safeMode = signal(true);

  protected readonly sortField = signal('CREATED_AT');
  protected readonly mappedField = computed(() => SORT_MAP[this.sortField().trim().toUpperCase()]);
}
