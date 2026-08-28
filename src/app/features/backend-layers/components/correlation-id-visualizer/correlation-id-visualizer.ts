import { Component, signal } from '@angular/core';
import { TRACE_LOG_TEMPLATE } from '../../engine/backend-simulator';

@Component({
  selector: 'app-correlation-id-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="correlation-id">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 15 — CORRELATION ID</p>
        <h2 class="lab-title">One ID, stitched across every service a request touches.</h2>

        <div class="lab-panel">
          <div class="services-chain mono">
            <span class="svc-node">Client</span><span class="lab-flow-arrow">↓</span>
            <span class="svc-node">API Gateway</span><span class="lab-flow-arrow">↓</span>
            <span class="svc-node">Order Service</span><span class="lab-flow-arrow">↓</span>
            <span class="svc-node">Payment Service</span><span class="lab-flow-arrow">↓</span>
            <span class="svc-node">Notification Service</span>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="play()">Trace Request (traceId = {{ traceId }})</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="log-lines mono">
            @for (line of visibleLog(); track $index) {
              <p class="log-line">[{{ traceId }}] {{ line.service }}: {{ line.message }}</p>
            }
          </div>
          <p class="lab-note">Every log line — across three separate services — carries the same <code class="mono">traceId</code>. That's what makes it possible to reconstruct one request's full journey from scattered logs.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .services-chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .svc-node { font-size: 0.8125rem; color: var(--text-muted); padding: 8px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface); min-width: 200px; text-align: center; }
    .log-lines { margin-top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; min-height: 40px; }
    .log-line { font-size: 0.8125rem; color: var(--accent-2); line-height: 1.7; }
  `,
})
export class CorrelationIdVisualizer {
  protected readonly traceId = '8f23a1';
  protected readonly template = TRACE_LOG_TEMPLATE;
  protected readonly visibleCount = signal(0);
  protected readonly visibleLog = signal<typeof TRACE_LOG_TEMPLATE>([]);

  play(): void {
    this.reset();
    this.template.forEach((line, i) => {
      setTimeout(() => {
        this.visibleLog.update((l) => [...l, line]);
      }, (i + 1) * 500);
    });
  }

  reset(): void {
    this.visibleLog.set([]);
  }
}
