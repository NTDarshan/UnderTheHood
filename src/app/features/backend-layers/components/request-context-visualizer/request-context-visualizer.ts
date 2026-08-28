import { Component, signal } from '@angular/core';

type Phase = 'idle' | 'arrived' | 'authed' | 'active' | 'done';

@Component({
  selector: 'app-request-context-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="request-context">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 13 — REQUEST CONTEXT</p>
        <h2 class="lab-title">Metadata that travels alongside the request, not through every parameter list.</h2>
        <p class="lab-lede">
          Request context is request-scoped state — it lets components in the same request lifecycle read shared
          metadata without threading it through every method signature. It is not global state: it belongs to <strong>one</strong> request.
        </p>

        <div class="lab-panel">
          <div class="context-diagram mono">
            <div class="ctx-request">REQUEST</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="ctx-box" [class.is-filled]="phase() !== 'idle'">
              <p class="ctx-title">REQUEST CONTEXT</p>
              <p class="ctx-field">requestId: {{ phase() !== 'idle' ? 'req_7821' : '—' }}</p>
              <p class="ctx-field">userId: {{ phase() === 'authed' || phase() === 'active' || phase() === 'done' ? '42' : '—' }}</p>
              <p class="ctx-field">role: {{ phase() === 'authed' || phase() === 'active' || phase() === 'done' ? 'customer' : '—' }}</p>
              <p class="ctx-field">traceId: {{ phase() !== 'idle' ? 'trace_123' : '—' }}</p>
              <p class="ctx-field">cancellation: {{ phase() === 'done' ? 'n/a' : 'armed' }}</p>
            </div>
            <div class="lab-flow-arrow">↓</div>
            <div class="ctx-consumers">
              <span class="consumer" [class.is-active]="phase() === 'authed'">Middleware</span>
              <span class="consumer" [class.is-active]="phase() === 'active'">Controller</span>
              <span class="consumer" [class.is-active]="phase() === 'done'">Service</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()">Run Request Lifecycle</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <p class="lab-note">
            @switch (phase()) {
              @case ('idle') { No request yet. }
              @case ('arrived') { Request arrives — a request ID is generated. }
              @case ('authed') { Authentication middleware extracts userId and role, storing them on the context. }
              @case ('active') { Controller and service both read the same context — no need to pass it explicitly through every call. }
              @case ('done') { Request completes. The context disappears — it never outlives this one request. }
            }
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .context-diagram { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .ctx-request { font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); padding: 8px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); }
    .ctx-box { padding: 16px 22px; border-radius: var(--radius-lg); border: 1px solid var(--border-strong); background: var(--surface); text-align: center; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .ctx-box.is-filled { border-color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .ctx-title { font-size: 0.75rem; color: var(--accent-2); font-weight: 700; margin-bottom: 8px; }
    .ctx-field { font-size: 0.75rem; color: var(--text-muted); }
    .ctx-consumers { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .consumer { font-size: 0.75rem; color: var(--text-faint); border: 1px solid var(--border-strong); border-radius: 999px; padding: 5px 12px; transition: color 0.2s ease, border-color 0.2s ease; }
    .consumer.is-active { color: var(--accent-strong); border-color: var(--accent); }
  `,
})
export class RequestContextVisualizer {
  protected readonly phase = signal<Phase>('idle');

  run(): void {
    this.phase.set('arrived');
    setTimeout(() => this.phase.set('authed'), 600);
    setTimeout(() => this.phase.set('active'), 1200);
    setTimeout(() => this.phase.set('done'), 1900);
  }

  reset(): void {
    this.phase.set('idle');
  }
}
