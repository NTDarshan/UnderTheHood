import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-why-validation-exists',
  standalone: true,
  template: `
    <section class="lab-section" id="why-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 03 — WHY VALIDATION EXISTS</p>
        <h2 class="lab-title">Where should a bad request fail — at the door, or three rooms in?</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="!withValidation()" (click)="withValidation.set(false)">Without validation</button>
          <button type="button" class="lab-btn" [class.is-active]="withValidation()" (click)="withValidation.set(true)">With validation</button>
        </div>

        <pre class="lab-code mono request-sample">{{ '{' }}
  "email": "hello",
  "age": 400,
  "dateOfBirth": "2037-99-99"
{{ '}' }}</pre>

        <div class="lab-panel flow-panel">
          @if (!withValidation()) {
            <div class="flow-chain mono">
              <span>Client</span><span class="arrow">↓</span>
              <span>Backend</span><span class="arrow">↓</span>
              <span>Service</span><span class="arrow">↓</span>
              <span>Database</span><span class="arrow">↓</span>
              <span class="tok-danger">💥 Error</span>
            </div>
            <ul class="bad-list">
              <li>Database error — malformed date can't be stored</li>
              <li>Business logic exception — deep in the call stack</li>
              <li>Unexpected application state</li>
              <li>Generic 500 Internal Server Error</li>
            </ul>
          } @else {
            <div class="flow-chain mono">
              <span>Client</span><span class="arrow">↓</span>
              <span>Backend boundary</span><span class="arrow">↓</span>
              <span>Validation</span><span class="arrow">↓</span>
              <span class="tok-ok">400 Bad Request</span>
            </div>
            <p class="good-result">Clear validation errors, returned immediately — the service layer and database are never touched.</p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Validation moves predictable client-input failures away from deep infrastructure and
          business logic. It does not guarantee that 500 errors can never happen for other reasons.
        </p>
      </div>
    </section>
  `,
  styles: `
    .request-sample { margin-top: 28px; max-width: 360px; color: var(--danger); }
    .flow-panel { margin-top: 20px; }
    .flow-chain { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); align-items: center; }
    .flow-chain .arrow { color: var(--text-faint); }
    .tok-danger { color: var(--danger); font-weight: 700; }
    .tok-ok { color: var(--accent-2); font-weight: 700; }

    .bad-list { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
    .bad-list li { font-size: 0.875rem; color: var(--danger); padding-left: 16px; position: relative; }
    .bad-list li::before { content: '✕'; position: absolute; left: 0; }

    .good-result { margin-top: 16px; font-size: 0.875rem; color: var(--accent-2); }
  `,
})
export class WhyValidationExists {
  protected readonly withValidation = signal(false);
}
