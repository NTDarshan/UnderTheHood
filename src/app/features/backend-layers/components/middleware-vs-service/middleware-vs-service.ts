import { Component } from '@angular/core';

@Component({
  selector: 'app-middleware-vs-service',
  standalone: true,
  template: `
    <section class="lab-section" id="middleware-vs-service">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 24 — MIDDLEWARE vs CONTROLLER vs SERVICE</p>
        <h2 class="lab-title">"Does this apply across many endpoints, or is it one specific use case?"</h2>

        <div class="lab-panel">
          <div class="pair-grid">
            <div class="pair-col">
              <p class="pair-title mono">MIDDLEWARE</p>
              <p class="pair-sub">Cross-cutting request pipeline behavior</p>
              <p class="pair-item">Logging</p>
              <p class="pair-item">Authentication</p>
              <p class="pair-item">Rate limiting</p>
              <p class="pair-item">CORS</p>
              <p class="pair-item">Request IDs</p>
              <p class="pair-item">Error handling</p>
            </div>
            <div class="pair-col">
              <p class="pair-title mono is-accent">SERVICE</p>
              <p class="pair-sub">Application/business behavior</p>
              <p class="pair-item">Create order</p>
              <p class="pair-item">Transfer money</p>
              <p class="pair-item">Calculate pricing</p>
              <p class="pair-item">Cancel subscription</p>
            </div>
          </div>

          <div class="example-rows mono">
            <p class="example-row"><span class="ex-behavior">Logging all requests</span><span class="ex-answer">→ Middleware</span></p>
            <p class="example-row"><span class="ex-behavior">Read POST /orders body</span><span class="ex-answer">→ Controller</span></p>
            <p class="example-row"><span class="ex-behavior">Authentication for every protected endpoint</span><span class="ex-answer">→ Middleware</span></p>
            <p class="example-row"><span class="ex-behavior">Convert create-order result to HTTP 201</span><span class="ex-answer">→ Controller</span></p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .pair-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 700px) { .pair-grid { grid-template-columns: 1fr 1fr; } }
    .pair-title { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .pair-title.is-accent { color: var(--accent-2); }
    .pair-sub { font-size: 0.75rem; color: var(--text-faint); margin-top: 2px; margin-bottom: 10px; }
    .pair-item { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }

    .example-rows { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
    .example-row { display: flex; justify-content: space-between; gap: 12px; font-size: 0.8125rem; }
    .ex-behavior { color: var(--text-muted); }
    .ex-answer { color: var(--accent-strong); font-weight: 600; white-space: nowrap; }
  `,
})
export class MiddlewareVsService {}
