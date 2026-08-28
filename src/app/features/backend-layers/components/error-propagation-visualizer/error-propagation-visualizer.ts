import { Component, signal } from '@angular/core';

type Phase = 'idle' | 'thrown' | 'service' | 'controller' | 'handler' | 'response';

@Component({
  selector: 'app-error-propagation-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="error-propagation">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 07 — ERROR PROPAGATION</p>
        <h2 class="lab-title">An exception travels back up the same layers it came down through.</h2>

        <div class="lab-panel">
          <div class="chain mono">
            <div class="chain-node" [class.is-hot]="phase() === 'idle'">Controller</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node" [class.is-hot]="phase() === 'idle'">Service</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node" [class.is-hot]="phase() === 'idle'">Repository</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node is-boom" [class.is-hot]="phase() === 'thrown'">💥 Exception</div>
          </div>

          @if (phase() !== 'idle' && phase() !== 'thrown') {
            <div class="chain mono" style="margin-top:20px">
              <div class="chain-node" [class.is-hot]="phase() === 'service'">Repository ↑</div>
              <div class="lab-flow-arrow">↑</div>
              <div class="chain-node" [class.is-hot]="phase() === 'controller'">Service ↑</div>
              <div class="lab-flow-arrow">↑</div>
              <div class="chain-node" [class.is-hot]="phase() === 'handler'">Controller ↑</div>
              <div class="lab-flow-arrow">↑</div>
              <div class="chain-node" [class.is-hot]="phase() === 'response'">Error-Handling Middleware</div>
            </div>
          }

          @if (phase() === 'response') {
            <div class="response-box mono">
              <p class="response-status">500 Internal Server Error</p>
              <p class="response-body">{{ '{' }} "error": "Internal Server Error" {{ '}' }}</p>
              <p class="response-hidden">✕ stack trace · ✕ SQL query · ✕ connection string</p>
            </div>
            <p class="lab-note">Centralized error handling means no individual controller had to write its own try/catch/response-formatting logic — and internal detail never reaches the client.</p>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="run()">Throw Exception</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .chain-node { font-size: 0.8125rem; font-weight: 700; padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-faint); text-align: center; min-width: 240px; transition: all 0.2s ease; }
    .chain-node.is-hot { color: var(--danger); border-color: var(--danger); box-shadow: 0 0 14px rgba(255, 93, 93, 0.3); }
    .chain-node.is-boom { color: var(--text-faint); }

    .response-box { margin-top: 24px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 16px; }
    .response-status { color: var(--danger); font-weight: 700; font-size: 0.875rem; }
    .response-body { color: var(--text-muted); font-size: 0.8125rem; margin-top: 6px; }
    .response-hidden { color: var(--text-faint); font-size: 0.75rem; margin-top: 10px; }
  `,
})
export class ErrorPropagationVisualizer {
  protected readonly phase = signal<Phase>('idle');

  run(): void {
    this.phase.set('thrown');
    setTimeout(() => this.phase.set('service'), 500);
    setTimeout(() => this.phase.set('controller'), 1000);
    setTimeout(() => this.phase.set('handler'), 1500);
    setTimeout(() => this.phase.set('response'), 2000);
  }

  reset(): void {
    this.phase.set('idle');
  }
}
