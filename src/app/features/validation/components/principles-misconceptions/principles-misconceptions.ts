import { Component } from '@angular/core';

@Component({
  selector: 'app-principles-misconceptions',
  standalone: true,
  template: `
    <section class="lab-section" id="design-principles">
      <div class="container">
        <p class="lab-index">VALIDATION / 44 — VALIDATION PIPELINE DESIGN PRINCIPLES</p>
        <h2 class="lab-title">Ten habits worth keeping.</h2>

        <div class="principles-list">
          @for (p of principles; track p; let i = $index) {
            <div class="principle-item">
              <span class="principle-index mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <p class="principle-text">{{ p }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="misconceptions">
      <div class="container">
        <p class="lab-index">VALIDATION / 45 — COMMON MISCONCEPTIONS</p>
        <h2 class="lab-title">Myth vs. reality.</h2>

        <div class="myth-grid">
          @for (m of myths; track m.myth) {
            <div class="myth-card">
              <p class="myth-label mono">MYTH</p>
              <p class="myth-text">"{{ m.myth }}"</p>
              <p class="reality-label mono">REALITY</p>
              <p class="reality-text">{{ m.reality }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .principles-list { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 14px; max-width: 720px; }
    @media (min-width: 700px) { .principles-list { grid-template-columns: 1fr 1fr; } }
    .principle-item { display: flex; gap: 12px; align-items: flex-start; }
    .principle-index { color: var(--accent-2); font-size: 0.75rem; flex-shrink: 0; padding-top: 2px; }
    .principle-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .myth-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 800px) { .myth-grid { grid-template-columns: 1fr 1fr; } }
    .myth-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .myth-label { font-size: 0.6875rem; color: var(--danger); letter-spacing: 0.06em; }
    .myth-text { margin-top: 6px; font-size: 0.9375rem; color: var(--text); font-style: italic; }
    .reality-label { margin-top: 14px; font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; }
    .reality-text { margin-top: 6px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class PrinciplesMisconceptions {
  protected readonly principles = [
    'Validate at trust boundaries.',
    'Validate before expensive downstream work.',
    'Transform intentionally.',
    'Do not silently hide invalid input.',
    'Keep business rules in appropriate domain/application layers.',
    'Never rely solely on frontend validation.',
    'Do not expose internal models unnecessarily.',
    'Use allowlists where the accepted set is known.',
    'Return structured validation errors.',
    'Keep validation behavior consistent and observable.',
  ];

  protected readonly myths = [
    { myth: 'Frontend validation protects the backend.', reality: 'Frontend validation primarily improves UX. The backend is the security and data-integrity boundary.' },
    { myth: 'If the JSON is valid, the request is valid.', reality: 'Valid JSON only means the serialization syntax is valid — the application data inside can still be invalid.' },
    { myth: 'Validation belongs only in the controller.', reality: 'Boundary validation lives near the input boundary; business/domain rules belong in appropriate application/domain layers.' },
    { myth: 'Transformation and validation are the same.', reality: 'Transformation changes representation. Validation determines acceptability.' },
    { myth: 'Database constraints make API validation unnecessary.', reality: 'Database constraints protect persistence integrity; API validation gives earlier, clearer boundary protection.' },
    { myth: 'If the user is authenticated, their input can be trusted.', reality: 'Identity does not make input valid — authentication and validation answer different questions.' },
    { myth: 'A DTO is just extra code.', reality: 'A DTO defines an explicit API contract and prevents accidental exposure or modification of internal models.' },
  ];
}
