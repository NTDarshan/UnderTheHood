import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-bad-backend-vs-layers',
  standalone: true,
  template: `
    <section class="lab-section" id="big-question">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 01 — THE BIG QUESTION</p>
        <h2 class="lab-title">Why do we split a backend into layers?</h2>
        <p class="lab-lede">
          Nothing forces you to. You could write the whole thing in one function. The question is what that costs you.
        </p>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="!split()" (click)="split.set(false)">One Function</button>
          <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="split()" (click)="split.set(true)">Split Into Layers</button>
        </div>

        <div class="lab-panel">
          @if (!split()) {
            <pre class="lab-code mono">function <span class="tok-key">handleCreateOrder</span>(req, res) {{ '{' }}
  // HTTP parsing
  // authentication
  // validation
  // business logic
  // SQL queries
  // email sending
  // logging
  // error handling
  // response formatting
{{ '}' }}</pre>
            <div class="consequence-row mono">
              <span class="consequence">Hard to test</span>
              <span class="consequence">Hard to change</span>
              <span class="consequence">Hard to reuse</span>
              <span class="consequence">Hard to understand</span>
            </div>
            <p class="lab-note lab-note-warn"><strong>~5000 lines, one function.</strong> Every concern is tangled with every other. Changing how emails are sent risks breaking SQL. Testing business logic means spinning up HTTP and a database.</p>
          } @else {
            <div class="layer-stack mono">
              <div class="layer-row">Middleware<span class="layer-note">cross-cutting: logging, auth, CORS</span></div>
              <div class="lab-flow-arrow">↓</div>
              <div class="layer-row">Controller<span class="layer-note">HTTP boundary</span></div>
              <div class="lab-flow-arrow">↓</div>
              <div class="layer-row">Service<span class="layer-note">business logic</span></div>
              <div class="lab-flow-arrow">↓</div>
              <div class="layer-row">Repository<span class="layer-note">data access</span></div>
            </div>
            <p class="lab-note"><strong>Separation of concerns.</strong> Each layer owns one kind of decision. You can test the service without HTTP. You can swap the database without touching business rules. Nobody has to read all 5000 lines to change one thing.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .consequence-row { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px; }
    .consequence { font-size: 0.75rem; color: var(--danger); border: 1px solid var(--danger); border-radius: 999px; padding: 4px 12px; }

    .layer-stack { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .layer-row { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 24px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font-weight: 600; font-size: 0.875rem; min-width: 220px; text-align: center; }
    .layer-note { font-weight: 400; font-size: 0.6875rem; color: var(--text-faint); }
  `,
})
export class BadBackendVsLayers {
  protected readonly split = signal(false);
}
