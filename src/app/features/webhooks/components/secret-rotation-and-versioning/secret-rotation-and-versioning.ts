import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-secret-rotation-and-versioning',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-rotation-versioning">
      <div class="container">
        <p class="lab-index mono">25 — SECRETS ROTATE, PAYLOADS EVOLVE</p>
        <h2 class="lab-title">Two things a webhook contract has to survive changing</h2>
        <p class="lab-lede">A production webhook system eventually has to rotate its signing secret and evolve its payload shape — without breaking every receiver on the day it happens.</p>

        <div class="lab-panel">
          <p class="body-label mono">SECRET ROTATION WINDOW</p>
          <div class="rotation-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="advanceRotation()" [disabled]="rotationStep() >= 2">{{ rotationStep() >= 2 ? 'ROTATION COMPLETE' : 'ADVANCE ROTATION' }}</button>
          </div>
          <div class="rotation-state mono">
            <div class="rot-item" [class.is-active]="rotationStep() >= 0"><span>OLD SECRET</span><span>{{ rotationStep() < 2 ? 'accepted' : 'removed' }}</span></div>
            <div class="rot-item" [class.is-active]="rotationStep() >= 1"><span>NEW SECRET</span><span>{{ rotationStep() >= 1 ? 'accepted' : 'not yet issued' }}</span></div>
          </div>
          <p class="lab-note">During the window both secrets verify successfully, so in-flight deliveries signed with the old secret still pass. Only once every receiver has confirmed the new secret works is the old one removed. Keeping that window small limits how long a leaked old secret stays useful.</p>
        </div>

        <div class="lab-panel">
          <p class="body-label mono">PAYLOAD VERSIONING</p>
          <div class="version-cols">
            <div class="version-col">
              <p class="col-heading mono">v1 PAYLOAD</p>
              <pre class="lab-code mono">{{ '{' }}
  "type": "order.created",
  "orderId": "ord_881"
{{ '}' }}</pre>
            </div>
            <div class="version-col">
              <p class="col-heading mono">v2 PAYLOAD (added field)</p>
              <pre class="lab-code mono">{{ '{' }}
  "type": "order.created",
  "orderId": "ord_881",
  "currency": "USD"
{{ '}' }}</pre>
            </div>
          </div>
          <p class="lab-note">A receiver built to tolerate unknown/optional fields keeps working unmodified when <span class="mono">currency</span> is added — this is specifically about the webhook contract, not general API design: don't hard-fail on fields you don't recognize.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 12px; }
    .rotation-state { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .rot-item { display: flex; justify-content: space-between; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-faint); font-size: 0.75rem; }
    .rot-item.is-active { border-color: var(--security); color: var(--text); }
    .version-cols { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 720px) { .version-cols { grid-template-columns: 1fr 1fr; } }
    .col-heading { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 8px; }
    .lab-code { margin: 0; }
  `,
})
export class SecretRotationAndVersioning {
  protected readonly rotationStep = signal(0);

  protected advanceRotation(): void {
    this.rotationStep.update((s) => Math.min(2, s + 1));
  }
}
