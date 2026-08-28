import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-context-propagation-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="context-propagation">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 18 — CONTEXT PROPAGATION &amp; EXPLICIT PARAMETERS</p>
        <h2 class="lab-title">Context carries metadata. Business data still travels explicitly.</h2>

        <div class="lab-panel">
          <div class="graph mono">
            <div class="graph-node">Request <span class="graph-tag">requestId · traceId · cancellation</span></div>
            <div class="lab-flow-arrow">↓</div>
            <div class="graph-row">
              <div class="graph-node">Middleware</div>
              <div class="graph-node">Logging</div>
            </div>
            <div class="lab-flow-arrow">↓</div>
            <div class="graph-node">Controller</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="graph-node">Service</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="graph-row">
              <div class="graph-node">Repository</div>
              <div class="graph-node">External API</div>
            </div>
          </div>
          <p class="lab-note">Context metadata is available where appropriate — it doesn't mean every dependency should directly depend on a mutable context object.</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!useContext()" (click)="useContext.set(false)">Everything in Context</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="useContext()" (click)="useContext.set(true)">Explicit Parameters</button>
          </div>

          @if (!useContext()) {
            <pre class="lab-code mono">service.<span class="tok-key">createOrder</span>(context)
<span class="tok-dim">// context.userId, context.amount, context.productId, context.discount, ...</span></pre>
            <p class="lab-note lab-note-warn">Context has become a hidden dependency bag. Reading this signature tells you nothing about what the service actually needs.</p>
          } @else {
            <pre class="lab-code mono">service.<span class="tok-key">createOrder</span>(userId, productId, quantity)
<span class="tok-dim">// context still carries: traceId, correlationId, cancellation</span></pre>
            <p class="lab-note">The signature documents itself. Business data is explicit; only cross-cutting request metadata rides along in context.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .graph { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .graph-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .graph-node { font-size: 0.75rem; color: var(--text-muted); padding: 8px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); text-align: center; }
    .graph-tag { display: block; font-size: 0.625rem; color: var(--text-faint); margin-top: 2px; }
  `,
})
export class ContextPropagationLab {
  protected readonly useContext = signal(false);
}
