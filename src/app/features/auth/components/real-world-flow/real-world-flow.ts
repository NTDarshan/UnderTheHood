import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-real-world-flow',
  standalone: true,
  template: `
    <section class="lab-section" id="real-world">
      <div class="container">
        <p class="lab-index">AUTH / 49 — REAL-WORLD EXAMPLE</p>
        <h2 class="lab-title">Alice buys a product. Then Alice tries something else.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="runOrder()" [disabled]="playing()">▶ POST /orders — create an order</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="runDelete()" [disabled]="playing()">▶ DELETE /orders/456 — someone else's order</button>
        </div>

        <div class="rw-steps mono">
          @for (s of activeSteps(); track s; let i = $index) {
            <div class="rw-step" [class.is-active]="stepIndex() >= i">
              <span class="rw-index">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <span class="rw-text">{{ s }}</span>
            </div>
          }
        </div>

        @if (finished()) {
          <div class="rw-result" [class.is-ok]="mode() === 'order'" [class.is-fail]="mode() === 'delete'">
            @if (mode() === 'order') {
              <p>Authentication: ✓ &nbsp; Authorization: ✓ &nbsp; Response: 201 Created</p>
            } @else {
              <p>Authentication: ✓ &nbsp; Authorization: ✕ &nbsp; Response: 403 Forbidden</p>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .rw-steps { margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }
    .rw-step { display: flex; gap: 12px; align-items: baseline; padding: 8px 12px; border-radius: var(--radius-sm); opacity: 0.4; transition: opacity 0.2s ease, background 0.2s ease; }
    .rw-step.is-active { opacity: 1; background: var(--surface-raised); }
    .rw-index { color: var(--accent-2); font-size: 0.6875rem; flex-shrink: 0; }
    .rw-text { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-sans); }
    .rw-step.is-active .rw-text { color: var(--text); }

    .rw-result { margin-top: 20px; padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); font-size: 0.9375rem; font-weight: 600; }
    .rw-result.is-ok { border-color: var(--accent-2-dim); color: var(--accent-2); }
    .rw-result.is-fail { border-color: var(--danger); color: var(--danger); }
  `,
})
export class RealWorldFlow {
  protected readonly mode = signal<'order' | 'delete'>('order');
  protected readonly stepIndex = signal(-1);
  protected readonly playing = signal(false);
  protected readonly finished = signal(false);

  protected readonly orderSteps = [
    'Alice logs in',
    'Authentication succeeds — credential issued',
    'Client sends POST /orders with the credential',
    'Server authenticates the request',
    'Server authorizes: can Alice create orders? Yes',
    'Request body is validated',
    'Business logic runs',
    'Order is persisted to the database',
    'Response: 201 Created',
  ];

  protected readonly deleteSteps = [
    'Alice is already authenticated',
    'Client sends DELETE /orders/456',
    'Server authenticates the request — identity confirmed',
    'Server authorizes: does Alice own order 456? No',
    'Response: 403 Forbidden',
  ];

  protected readonly activeSteps = signal(this.orderSteps);

  async runOrder(): Promise<void> {
    if (this.playing()) return;
    this.mode.set('order');
    this.activeSteps.set(this.orderSteps);
    await this.play(this.orderSteps.length);
  }

  async runDelete(): Promise<void> {
    if (this.playing()) return;
    this.mode.set('delete');
    this.activeSteps.set(this.deleteSteps);
    await this.play(this.deleteSteps.length);
  }

  private async play(count: number): Promise<void> {
    this.playing.set(true);
    this.finished.set(false);
    this.stepIndex.set(-1);
    for (let i = 0; i < count; i++) {
      this.stepIndex.set(i);
      await wait(350);
    }
    this.finished.set(true);
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
