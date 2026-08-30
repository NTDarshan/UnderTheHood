import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const STRATEGIES = [
  { name: 'Cookie-based', detail: 'The browser automatically attaches session cookies during the handshake — works because the handshake is still an HTTP request.' },
  { name: 'Access token in URL/subprotocol', detail: 'A short-lived token passed as a query param or Sec-WebSocket-Protocol value, since custom headers aren’t always available to browser WebSocket clients.' },
  { name: 'Session-based', detail: 'The handshake request is matched against a server-side session store, same as any authenticated HTTP request.' },
  { name: 'Auth message after connect', detail: 'The connection opens first, then the client immediately sends an application-level "authenticate" message before anything else is trusted.' },
];

const RESOURCES = ['/orders/123', '/orders/456', '/orders/999'];

@Component({
  selector: 'app-auth-authz-lab',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="auth">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 015 — AUTHENTICATION & AUTHORIZATION</p>
        <h2 class="lab-title">Opening a connection isn't the same as being allowed to see everything on it.</h2>

        <app-explain-simply>
          Getting past the front door (authentication) tells the building who you are. It doesn't hand you keys
          to every office inside (authorization) — someone still has to check each door.
        </app-explain-simply>

        <p class="sub-heading mono">WHEN IS THE USER AUTHENTICATED?</p>
        <div class="auth-stack mono">
          <div class="stack-item">Browser</div>
          <span class="stack-arrow">↓</span>
          <div class="stack-item">HTTPS</div>
          <span class="stack-arrow">↓</span>
          <div class="stack-item stack-item-accent">Authentication</div>
          <span class="stack-arrow">↓</span>
          <div class="stack-item">WebSocket handshake</div>
          <span class="stack-arrow">↓</span>
          <div class="stack-item">WebSocket connection (OPEN)</div>
        </div>

        <div class="strategy-grid">
          @for (s of strategies; track s.name) {
            <div class="strategy-card">
              <p class="strategy-name mono">{{ s.name }}</p>
              <p class="strategy-detail">{{ s.detail }}</p>
            </div>
          }
        </div>

        <p class="sub-heading mono" style="margin-top: 40px;">AUTHORIZATION DURING THE CONNECTION</p>
        <p class="authz-lede">
          <span class="mono">USER = 42 · ROLE = USER</span> — already connected, already authenticated. Now try
          to subscribe to different order channels.
        </p>
        <div class="resource-row">
          @for (r of resources; track r) {
            <button type="button" class="lab-btn" [class.is-active]="target() === r" (click)="target.set(r)">{{ r }}</button>
          }
        </div>
        <button type="button" class="lab-btn lab-btn-primary" (click)="subscribe()">Subscribe to {{ target() }}</button>

        @if (result() === 'allowed') {
          <p class="authz-result authz-allowed mono">✓ AUTHORIZED — user 42 owns order 123, subscription granted.</p>
        } @else if (result() === 'denied') {
          <p class="authz-result authz-denied mono">✗ AUTHORIZED? NO → MESSAGE REJECTED — user 42 doesn't own {{ target() }}.</p>
        }

        <p class="authz-note">
          The WebSocket connection being <span class="mono">OPEN</span> only proves who is talking. Every
          individual subscription or action still needs its own authorization check — exactly like a normal
          API endpoint would enforce on each request.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sub-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-top: 32px; margin-bottom: 16px; }
    .auth-stack { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
    .stack-item { padding: 10px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-size: 0.8125rem; color: var(--text-muted); }
    .stack-item-accent { border-color: var(--accent-dim); color: var(--accent); }
    .stack-arrow { color: var(--text-faint); margin-left: 8px; }

    .strategy-grid { margin-top: 24px; display: grid; gap: 14px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .strategy-grid { grid-template-columns: 1fr 1fr; } }
    .strategy-card { padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); }
    .strategy-name { color: var(--accent-2); font-size: 0.8125rem; margin-bottom: 8px; }
    .strategy-detail { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .authz-lede { margin-top: 8px; max-width: 620px; color: var(--text-muted); font-size: 0.9375rem; }
    .resource-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .authz-result { margin-top: 16px; font-size: 0.875rem; padding: 10px 14px; border-radius: var(--radius-sm); }
    .authz-allowed { color: var(--accent-2); background: var(--surface); }
    .authz-denied { color: var(--danger); background: var(--surface); }
    .authz-note { margin-top: 20px; max-width: 640px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }
  `,
})
export class AuthAuthzLab {
  protected readonly strategies = STRATEGIES;
  protected readonly resources = RESOURCES;
  protected readonly target = signal(RESOURCES[0]);
  protected readonly result = signal<'idle' | 'allowed' | 'denied'>('idle');

  subscribe(): void {
    this.result.set(this.target() === '/orders/123' ? 'allowed' : 'denied');
  }
}
