import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dev-tunnels',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-dev-tunnels">
      <div class="container">
        <p class="lab-index mono">19 — TESTING WEBHOOKS LOCALLY</p>
        <h2 class="lab-title">The provider can't reach localhost — so tunnel it</h2>
        <p class="lab-lede">
          During development your endpoint often runs on <span class="mono">localhost:3000</span>, which the
          public internet cannot reach. A tunnel gives it a temporary public URL that forwards traffic back to
          your machine.
        </p>

        <div class="lab-panel">
          <div class="topology">
            <div class="node"><span class="node-label mono">PROVIDER</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node is-tunnel"><span class="node-label mono">https://a1b2.tunnel.dev</span><span class="node-sub mono">public tunnel URL</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node"><span class="node-label mono">localhost:3000</span><span class="node-sub mono">your machine</span></div>
          </div>
          <button type="button" class="lab-btn lab-btn-primary" (click)="fire()">SEND A TEST EVENT THROUGH THE TUNNEL</button>
          @if (fired()) {
            <p class="lab-note">Request hit the tunnel's public URL, was forwarded over a persistent connection back to your local dev server, and your breakpoint or console.log fires exactly like a production request would.</p>
          }
          <p class="lab-note lab-note-warn">Tunnels are for local development and demos — not production infrastructure. They're a convenience for receiving real provider traffic while iterating, not a replacement for a properly deployed, monitored endpoint.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .topology { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .node { flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 18px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; }
    .node.is-tunnel { border-color: var(--info); }
    .node-label { font-size: 0.75rem; color: var(--text); font-weight: 700; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }
  `,
})
export class DevTunnels {
  protected readonly fired = signal(false);

  protected fire(): void {
    this.fired.set(true);
  }
}
