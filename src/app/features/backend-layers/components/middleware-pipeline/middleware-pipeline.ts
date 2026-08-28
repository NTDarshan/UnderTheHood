import { Component } from '@angular/core';

@Component({
  selector: 'app-middleware-pipeline',
  standalone: true,
  template: `
    <section class="lab-section" id="middleware-pipeline">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 04 — MIDDLEWARE: THE PIPELINE</p>
        <h2 class="lab-title">Every middleware gets the same three things: request, response, next().</h2>
        <p class="lab-lede">
          A middleware can inspect the request, modify request/response state, do cross-cutting work, then either call
          <code class="mono">next()</code> to continue the chain or short-circuit it entirely.
        </p>

        <div class="lab-panel">
          <div class="chain mono">
            <div class="chain-node">REQUEST</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node is-mw">Logging Middleware</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node is-mw">Authentication Middleware</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node is-mw">Rate Limit Middleware</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node">ROUTER</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node">CONTROLLER</div>
          </div>

          <div class="contract-grid mono">
            <div class="contract-item"><span class="contract-num">1</span> Inspect the request</div>
            <div class="contract-item"><span class="contract-num">2</span> Modify request/response state</div>
            <div class="contract-item"><span class="contract-num">3</span> Perform cross-cutting work</div>
            <div class="contract-item"><span class="contract-num">4</span> Call next()</div>
            <div class="contract-item"><span class="contract-num">5</span> Short-circuit the request</div>
            <div class="contract-item"><span class="contract-num">6</span> Handle/propagate errors</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .chain-node { font-size: 0.8125rem; font-weight: 700; padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); text-align: center; min-width: 220px; }
    .chain-node.is-mw { color: var(--accent-strong); border-color: var(--accent-dim); }

    .contract-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 700px) { .contract-grid { grid-template-columns: repeat(2, 1fr); } }
    .contract-item { font-size: 0.8125rem; color: var(--text-muted); display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .contract-num { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--accent-2-dim); color: var(--accent-2); font-size: 0.6875rem; flex-shrink: 0; }
  `,
})
export class MiddlewarePipeline {}
