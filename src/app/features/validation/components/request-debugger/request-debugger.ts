import { Component, computed, signal } from '@angular/core';
import { runOrderPipeline } from '../../engine/validation-simulator';

@Component({
  selector: 'app-request-debugger',
  standalone: true,
  template: `
    <section class="lab-section" id="request-debugger">
      <div class="container">
        <p class="lab-index">VALIDATION / 39 — REQUEST DEBUGGER</p>
        <h2 class="lab-title">Diagnose a broken request like a debugger, not a form.</h2>

        <div class="debugger-grid">
          <div class="debugger-panel">
            <p class="panel-title mono">INCOMING HTTP REQUEST</p>
            <pre class="lab-code mono">POST /orders

{{ '{' }}
  "quantity": "{{ quantity() }}",
  "productId": 123
{{ '}' }}</pre>
          </div>

          <div class="debugger-panel">
            <p class="panel-title mono">PIPELINE</p>
            <div class="stage-list mono">
              @for (s of result().stages; track s.id) {
                <p class="stage-row" [class.is-pass]="s.status === 'pass'" [class.is-fail]="s.status === 'fail'" [class.is-skip]="s.status === 'not-reached'">
                  {{ s.label }} — {{ s.status === 'pass' ? '✓' : s.status === 'fail' ? '✕' : 'NOT REACHED' }}
                </p>
              }
            </div>
          </div>

          <div class="debugger-panel">
            <p class="panel-title mono">CURRENT STATE</p>
            @if (result().finalIssues.length > 0) {
              @for (issue of result().finalIssues; track issue.field) {
                <p class="issue-line">{{ issue.field }}: {{ issue.message }}</p>
              }
            } @else {
              <p class="issue-line is-ok">Request is valid and reached the database.</p>
            }
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-danger" (click)="breakRequest()">Break Request</button>
          <button type="button" class="lab-btn lab-btn-primary" (click)="fixRequest()">Fix Request</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .debugger-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 900px) { .debugger-grid { grid-template-columns: repeat(3, 1fr); } }
    .debugger-panel { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .panel-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 12px; }

    .stage-list { display: flex; flex-direction: column; gap: 6px; }
    .stage-row { font-size: 0.8125rem; }
    .stage-row.is-pass { color: var(--accent-2); }
    .stage-row.is-fail { color: var(--danger); }
    .stage-row.is-skip { color: var(--text-faint); opacity: 0.6; }

    .issue-line { font-size: 0.8125rem; color: var(--danger); margin-top: 4px; }
    .issue-line.is-ok { color: var(--accent-2); }
  `,
})
export class RequestDebugger {
  protected readonly quantity = signal('abc');

  protected readonly result = computed(() =>
    runOrderPipeline({ productId: '123', quantity: this.quantity(), couponCode: '' }, true, 1000, 20),
  );

  breakRequest(): void {
    this.quantity.set('abc');
  }

  fixRequest(): void {
    this.quantity.set('2');
  }
}
