import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { parseIntStrict } from '../../engine/validation-simulator';

@Component({
  selector: 'app-type-validation-lab',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="type-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 06 — TYPE VALIDATION</p>
        <h2 class="lab-title">Does the incoming value have the expected type or shape?</h2>

        <p class="lab-lede">
          HTTP query parameters are commonly represented as text, so the application often needs to
          parse or convert them into the expected type before validation can even ask "is this acceptable?"
        </p>

        <div class="lab-panel type-panel">
          <div class="lab-field">
            <label for="type-page">?page=</label>
            <input id="type-page" type="text" [ngModel]="page()" (ngModelChange)="page.set($event)" />
          </div>

          <div class="type-steps mono">
            <p>Raw: "{{ page() }}"</p>
            <p class="arrow">↓ transform</p>
            @if (parsed().ok) {
              <p class="ok">Transformed: {{ parsed().value }}</p>
              <p class="arrow">↓ type validation</p>
              <p class="ok">integer? ✓</p>
            } @else {
              <p class="fail">Transformation failed: "{{ page() }}" cannot become a valid integer</p>
              <p class="arrow">↓</p>
              <p class="fail">400 Bad Request</p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .type-panel { margin-top: 24px; }
    .type-steps { margin-top: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem; color: var(--text-muted); }
    .arrow { color: var(--text-faint); font-size: 0.75rem; }
    .ok { color: var(--accent-2); }
    .fail { color: var(--danger); }
  `,
})
export class TypeValidationLab {
  protected readonly page = signal('2');
  protected readonly parsed = computed(() => parseIntStrict(this.page()));
}
