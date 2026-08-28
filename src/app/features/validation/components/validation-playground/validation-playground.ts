import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { runOrderPipeline } from '../../engine/validation-simulator';

@Component({
  selector: 'app-validation-playground',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="validation-playground">
      <div class="container">
        <p class="lab-index">VALIDATION / 38 — VALIDATION PIPELINE PLAYGROUND</p>
        <h2 class="lab-title">Edit the request. Watch invalid input die at the boundary.</h2>

        <div class="lab-panel playground-panel">
          <div class="pg-controls">
            <div class="lab-field">
              <label for="pg-productId">productId</label>
              <input id="pg-productId" type="text" [ngModel]="productId()" (ngModelChange)="productId.set($event)" />
            </div>
            <div class="lab-field">
              <label for="pg-quantity">quantity</label>
              <input id="pg-quantity" type="text" [ngModel]="quantity()" (ngModelChange)="quantity.set($event)" />
            </div>
            <div class="lab-field">
              <label for="pg-coupon">couponCode</label>
              <input id="pg-coupon" type="text" [ngModel]="couponCode()" (ngModelChange)="couponCode.set($event)" />
            </div>
            <div class="lab-field">
              <label for="pg-authorized">Authorized to create orders?</label>
              <select id="pg-authorized" [ngModel]="authorized()" (ngModelChange)="authorized.set($event)">
                <option [ngValue]="true">Yes</option>
                <option [ngValue]="false">No</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="pg-balance">Account balance ($)</label>
              <input id="pg-balance" type="number" [ngModel]="balance()" (ngModelChange)="balance.set(+$event)" />
            </div>
          </div>

          <div class="pipeline mono">
            @for (s of result().stages; track s.id) {
              <div class="pl-stage" [class.is-pass]="s.status === 'pass'" [class.is-fail]="s.status === 'fail'" [class.is-skip]="s.status === 'not-reached'">
                <span class="pl-icon">{{ s.status === 'pass' ? '✓' : s.status === 'fail' ? '✕' : '○' }}</span>
                <span class="pl-label">{{ s.label }}</span>
                @if (s.detail) { <span class="pl-detail">{{ s.detail }}</span> }
                @if (s.status === 'not-reached') { <span class="pl-detail">NOT REACHED</span> }
              </div>
            }
          </div>
        </div>

        <p class="lab-note">
          Invalid input is rejected at the boundary before unnecessary downstream work happens —
          notice how a failure anywhere marks every later stage NOT REACHED instead of continuing.
        </p>
      </div>
    </section>
  `,
  styles: `
    .playground-panel { margin-top: 24px; }
    .pg-controls { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .pg-controls { grid-template-columns: repeat(3, 1fr); } }

    .pipeline { margin-top: 28px; display: flex; flex-direction: column; gap: 6px; padding-top: 20px; border-top: 1px solid var(--border); }
    .pl-stage { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--surface); }
    .pl-icon { font-weight: 700; }
    .pl-label { font-weight: 700; font-size: 0.8125rem; min-width: 90px; }
    .pl-detail { font-size: 0.75rem; color: var(--text-faint); font-family: var(--font-sans); }

    .pl-stage.is-pass { color: var(--accent-2); }
    .pl-stage.is-fail { color: var(--danger); }
    .pl-stage.is-skip { color: var(--text-faint); opacity: 0.5; }
  `,
})
export class ValidationPlayground {
  protected readonly productId = signal('101');
  protected readonly quantity = signal('2');
  protected readonly couponCode = signal('SAVE20');
  protected readonly authorized = signal(true);
  protected readonly balance = signal(100);

  protected readonly result = computed(() =>
    runOrderPipeline({ productId: this.productId(), quantity: this.quantity(), couponCode: this.couponCode() }, this.authorized(), this.balance(), 20),
  );
}
