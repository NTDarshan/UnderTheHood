import { Component, signal } from '@angular/core';

type St = 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING' | 'EXHAUSTED';

@Component({
  selector: 'app-delivery-state-machine',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-state-machine">
      <div class="container">
        <p class="lab-index mono">23 — THE DELIVERY STATE MACHINE</p>
        <h2 class="lab-title">Every delivery moves through a small, well-defined set of states</h2>
        <p class="lab-lede">Click a state to jump there and see the transitions available from it.</p>

        <div class="lab-panel">
          <div class="state-grid">
            @for (s of states; track s) {
              <button type="button" class="state-node mono" [class.is-current]="current() === s" (click)="current.set(s)">{{ s }}</button>
            }
          </div>
          <div class="transitions-panel">
            <p class="body-label mono">FROM {{ current() }}</p>
            <ul class="transition-list mono">
              @for (t of transitionsFor(current()); track t) { <li>{{ t }}</li> }
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .state-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .state-node { all: unset; cursor: pointer; font-size: 0.75rem; padding: 10px 16px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); background: var(--surface); transition: all 0.2s ease; }
    .state-node:hover { border-color: var(--pending); }
    .state-node.is-current { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 15%, var(--surface)); }
    .transitions-panel { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 10px; }
    .transition-list { display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .transition-list li { padding-left: 14px; position: relative; }
    .transition-list li::before { content: '→'; position: absolute; left: 0; color: var(--pending); }
  `,
})
export class DeliveryStateMachine {
  protected readonly states: St[] = ['PENDING', 'SENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'EXHAUSTED'];
  protected readonly current = signal<St>('PENDING');

  protected transitionsFor(s: St): string[] {
    switch (s) {
      case 'PENDING': return ['SENDING — dispatcher picks it up and sends the HTTP request'];
      case 'SENDING': return ['DELIVERED — receiver returns 2xx', 'FAILED — receiver returns non-2xx, times out, or connection fails'];
      case 'DELIVERED': return ['(terminal — no further transitions)'];
      case 'FAILED': return ['RETRYING — if attempts remain within policy', 'EXHAUSTED — if retry limit or time budget is used up'];
      case 'RETRYING': return ['SENDING — next attempt fires after its backoff delay'];
      case 'EXHAUSTED': return ['SENDING — only via a manual retry/replay action, not automatically'];
    }
  }
}
