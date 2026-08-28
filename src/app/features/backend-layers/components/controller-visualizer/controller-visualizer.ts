import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-controller-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="controller">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 08 — CONTROLLER: THE HTTP BOUNDARY</p>
        <h2 class="lab-title">The controller is the border crossing between HTTP and application logic.</h2>

        <div class="lab-panel">
          <div class="chain mono">
            <div class="chain-node">HTTP</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node is-accent">CONTROLLER</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node">SERVICE</div>
          </div>

          <div class="should-grid">
            <div class="should-col">
              <p class="should-title mono">RESPONSIBILITIES</p>
              <p class="should-item">✓ Read the request</p>
              <p class="should-item">✓ Bind route/query/header/body data</p>
              <p class="should-item">✓ Validate boundary input</p>
              <p class="should-item">✓ Transform input where appropriate</p>
              <p class="should-item">✓ Call the service</p>
              <p class="should-item">✓ Convert the result into an HTTP response</p>
            </div>
            <div class="should-col">
              <p class="should-title mono is-danger">SHOULD NOT</p>
              <p class="should-item is-danger">✕ Complex business rules</p>
              <p class="should-item is-danger">✕ SQL queries</p>
              <p class="should-item is-danger">✕ Direct database manipulation</p>
              <p class="should-item is-danger">✕ External integration orchestration</p>
              <p class="should-item is-danger">✕ Repeated logging logic</p>
              <p class="should-item is-danger">✕ Global error handling everywhere</p>
            </div>
          </div>

          <p class="lab-note"><strong>Nuance:</strong> controllers can make HTTP-specific decisions — 200, 201, 204, 400, 401, 403, 404. But business logic itself shouldn't depend on those status codes.</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!thin()" (click)="thin.set(false)">Fat Controller</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="thin()" (click)="thin.set(true)">Thin Controller</button>
          </div>

          @if (!thin()) {
            <pre class="lab-code mono">function <span class="tok-key">createOrder</span>(req, res) {{ '{' }}
  authenticate(req)
  validate(req.body)
  calculateDiscount(req.body)
  checkInventory(req.body)
  execute(sql)
  sendEmail(req.body)
  formatResponse(res)
{{ '}' }}</pre>
          } @else {
            <pre class="lab-code mono">function <span class="tok-key">createOrder</span>(req, res) {{ '{' }}
  const input = <span class="tok-dim">parse</span>(req.body)
  <span class="tok-dim">validate</span>(input)
  const result = <span class="tok-key">service</span>.createOrder(input)
  return res.<span class="tok-status-ok">status(201)</span>.json(result)
{{ '}' }}</pre>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .chain-node { font-size: 0.8125rem; font-weight: 700; padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); text-align: center; min-width: 220px; }
    .chain-node.is-accent { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 14px var(--glow-accent); }

    .should-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 700px) { .should-grid { grid-template-columns: 1fr 1fr; } }
    .should-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .should-title.is-danger { color: var(--danger); }
    .should-item { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }
    .should-item.is-danger { color: var(--danger); opacity: 0.85; }
  `,
})
export class ControllerVisualizer {
  protected readonly thin = signal(false);
}
