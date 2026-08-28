import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dependency-direction',
  standalone: true,
  template: `
    <section class="lab-section" id="dependency-direction">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 22 — DEPENDENCY DIRECTION &amp; TESTABILITY</p>
        <h2 class="lab-title">Depend on an abstraction, not a concrete database.</h2>

        <div class="lab-panel">
          <div class="dep-chain mono">
            <div class="dep-node">Controller</div>
            <div class="lab-flow-arrow">↓ depends on</div>
            <div class="dep-node">Service</div>
            <div class="lab-flow-arrow">↓ depends on</div>
            <div class="dep-node is-abstract">IRepository <span class="dep-tag">(interface)</span></div>
            <div class="lab-flow-arrow">↑ implements</div>
            <div class="dep-node">SQL Repository</div>
          </div>
          <p class="lab-note">Business logic should not become tightly coupled to a specific persistence implementation. The service depends on a contract; a concrete repository implements it. This is dependency inversion, kept conceptual.</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!mock()" (click)="mock.set(false)">Real Repository</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="mock()" (click)="mock.set(true)">Mock Repository</button>
          </div>

          <div class="test-diagram mono">
            <div class="dep-node">Unit Test</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="dep-node">Service.placeOrder()</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="dep-node" [class.is-off]="mock()">Database</div>
            <div class="dep-node" [class.is-off]="!mock()">Fake Repository (in-memory)</div>
          </div>
          <p class="lab-note">
            @if (mock()) {
              <strong>Database OFF, Fake Repository ON.</strong> The service still runs its exact logic — no HTTP server, no network, no real database needed to test business rules.
            } @else {
              <strong>Real repository wired in.</strong> This is what runs in production — slower and heavier to test against directly.
            }
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .dep-chain, .test-diagram { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .test-diagram { margin-top: 20px; }
    .dep-node { font-size: 0.8125rem; color: var(--text-muted); padding: 10px 20px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface); text-align: center; min-width: 220px; transition: opacity 0.2s ease; }
    .dep-node.is-abstract { color: var(--accent-2); border-style: dashed; border-color: var(--accent-2-dim); }
    .dep-node.is-off { opacity: 0.3; text-decoration: line-through; }
    .dep-tag { font-size: 0.6875rem; color: var(--text-faint); }
  `,
})
export class DependencyDirection {
  protected readonly mock = signal(true);
}
