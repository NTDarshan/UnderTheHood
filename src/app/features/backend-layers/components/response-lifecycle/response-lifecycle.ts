import { Component } from '@angular/core';

@Component({
  selector: 'app-response-lifecycle',
  standalone: true,
  template: `
    <section class="lab-section" id="response-lifecycle">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 21 — THE RESPONSE JOURNEY</p>
        <h2 class="lab-title">The response isn't just "database → client." Each layer has its own representation.</h2>

        <div class="lab-panel">
          <div class="transform-cols">
            <div class="transform-col">
              <p class="tcol-title mono">REQUEST DIRECTION</p>
              <div class="tcol-chain mono">
                <div class="tnode">HTTP Request DTO</div>
                <div class="lab-flow-arrow">↓ Controller</div>
                <div class="tnode">Command / Application Input</div>
                <div class="lab-flow-arrow">↓ Service</div>
                <div class="tnode">Domain Model</div>
                <div class="lab-flow-arrow">↓ Repository</div>
                <div class="tnode">Persistence Model</div>
                <div class="lab-flow-arrow">↓</div>
                <div class="tnode is-end">Database</div>
              </div>
            </div>
            <div class="transform-col">
              <p class="tcol-title mono">RESPONSE DIRECTION</p>
              <div class="tcol-chain mono">
                <div class="tnode is-end">Database</div>
                <div class="lab-flow-arrow">↓</div>
                <div class="tnode">Persistence Model</div>
                <div class="lab-flow-arrow">↓ Service</div>
                <div class="tnode">Domain / Application Result</div>
                <div class="lab-flow-arrow">↓ Controller</div>
                <div class="tnode">Response DTO</div>
                <div class="lab-flow-arrow">↓</div>
                <div class="tnode is-end">HTTP</div>
              </div>
            </div>
          </div>
          <p class="lab-note">Different architectures use different models for this — this isn't a mandatory structure, but separating representations at each boundary reduces coupling between layers.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .transform-cols { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 800px) { .transform-cols { grid-template-columns: 1fr 1fr; } }
    .tcol-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 12px; }
    .tcol-chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .tnode { font-size: 0.75rem; color: var(--text-muted); padding: 8px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); text-align: center; width: 100%; }
    .tnode.is-end { color: var(--text-faint); background: transparent; }
  `,
})
export class ResponseLifecycle {}
