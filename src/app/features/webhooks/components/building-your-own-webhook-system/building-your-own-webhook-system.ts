import { Component } from '@angular/core';

@Component({
  selector: 'app-building-your-own-webhook-system',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-building-own">
      <div class="container">
        <p class="lab-index mono">20 — NOW FLIP THE DIRECTION</p>
        <h2 class="lab-title">Everything above was about receiving. Now you're the sender.</h2>
        <p class="lab-lede">
          If your product notifies customers' systems when something happens in yours, you are now the provider —
          responsible for the same reliability and security guarantees you just spent this chapter demanding from
          others.
        </p>

        <div class="lab-panel">
          <div class="topology">
            <div class="node"><span class="node-label mono">YOUR APP'S EVENT</span><span class="node-sub mono">order.created</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node"><span class="node-label mono">OUTBOX</span><span class="node-sub mono">durable, transactional</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node"><span class="node-label mono">DISPATCHER</span><span class="node-sub mono">signs, sends, retries</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node"><span class="node-label mono">CUSTOMER'S ENDPOINT</span><span class="node-sub mono">someone else's receiver</span></div>
          </div>
          <p class="lab-note">The next several sections build this pipeline piece by piece: durably capturing the event, dispatching it reliably, tracking delivery state, and giving yourself the observability to know when it's silently failing.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .topology { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
    .node { flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 18px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; }
    .node-label { font-size: 0.75rem; color: var(--text); font-weight: 700; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }
  `,
})
export class BuildingYourOwnWebhookSystem {}
