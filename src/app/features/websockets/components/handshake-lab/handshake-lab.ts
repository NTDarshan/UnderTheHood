import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

type Phase = 'idle' | 'sending' | 'processing' | 'responding' | 'upgraded';
type Scheme = 'ws' | 'wss';

@Component({
  selector: 'app-handshake-lab',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="lab-section" id="handshake">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 004 — THE HANDSHAKE</p>
        <h2 class="lab-title">A WebSocket connection is born inside a normal HTTP request.</h2>
        <p class="lab-lede">
          It has to start as HTTP so ordinary HTTP infrastructure — proxies, load balancers, firewalls — can
          participate in setting it up. Once both sides agree, the connection <em>upgrades</em> to a different protocol entirely.
        </p>

        <app-explain-simply>
          It's like knocking on a door in a language everyone understands ("Upgrade: websocket?"), and once
          the person on the other side says yes, you both switch to a private language for the rest of the
          conversation.
        </app-explain-simply>

        <div class="handshake-stage">
          <div class="hs-node" [class.is-active]="phase() !== 'idle' && phase() !== 'upgraded'">CLIENT</div>
          <div class="hs-wire">
            <div class="hs-packet hs-req" [class.is-flying]="phase() === 'sending'">
              <span class="mono">GET /chat — Upgrade: websocket</span>
            </div>
            <div class="hs-packet hs-res" [class.is-flying]="phase() === 'responding'">
              <span class="mono">101 Switching Protocols</span>
            </div>
          </div>
          <div class="hs-node" [class.is-active]="phase() === 'processing' || phase() === 'responding'">SERVER</div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="phase() !== 'idle' && phase() !== 'upgraded'">
            {{ phase() === 'upgraded' ? 'Replay handshake' : 'Send handshake request' }}
          </button>
        </div>

        <div class="hs-panels">
          <div class="hs-panel lab-code" [class.is-dim]="phase() === 'idle'">
            <p class="hs-panel-heading mono">CLIENT REQUEST (HTTP)</p>
            <p><span class="tok-method">GET</span> <span class="tok-key">/chat</span> HTTP/1.1</p>
            <p class="tok-dim">Host: example.com</p>
            <p><app-term def="Tells the server the client wants to switch protocols on this connection.">Upgrade</app-term>: websocket</p>
            <p><app-term def="Must be present alongside Upgrade to signal this is a connection-level negotiation, not a normal keep-alive.">Connection</app-term>: Upgrade</p>
            <p><app-term def="A random, base64-encoded value the client generates. The server transforms it to prove it actually understood the upgrade request — not a security secret.">Sec-WebSocket-Key</app-term>: dGhlIHNhbXBsZSBub25jZQ==</p>
            <p>Sec-WebSocket-Version: 13</p>
          </div>
          <div class="hs-panel lab-code" [class.is-dim]="phase() !== 'responding' && phase() !== 'upgraded'">
            <p class="hs-panel-heading mono">SERVER RESPONSE (HTTP)</p>
            <p>HTTP/1.1 <span class="tok-status-ok">101 Switching Protocols</span></p>
            <p class="tok-dim">Upgrade: websocket</p>
            <p class="tok-dim">Connection: Upgrade</p>
            <p><app-term def="Sec-WebSocket-Key combined with a fixed GUID, SHA-1 hashed, then base64-encoded — proof the server understood this specific handshake, not encryption or a real secret.">Sec-WebSocket-Accept</app-term>: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</p>
          </div>
        </div>

        <p class="why-101">
          Why <span class="mono">101</span> and not <span class="mono">200</span>? Because nothing was
          "successfully retrieved" — the server is saying "I agree to change protocols on this exact TCP
          connection," which is a different kind of answer than a normal resource response.
        </p>

        <div class="mode-flip">
          <div class="mode-card" [class.is-past]="phase() === 'upgraded'">
            <p class="mode-label mono">HTTP MODE</p>
            <p class="mode-detail">CLIENT → SERVER · REQUEST → RESPONSE</p>
          </div>
          <span class="mode-flip-arrow" [class.is-flipped]="phase() === 'upgraded'">→</span>
          <div class="mode-card mode-card-target" [class.is-active]="phase() === 'upgraded'">
            <p class="mode-label mono">WEBSOCKET MODE</p>
            <p class="mode-detail">CLIENT ⇄ SERVER · PERSISTENT, FRAMED PROTOCOL</p>
          </div>
        </div>
        <p class="mode-flip-note">
          The TCP connection never closed. What changed is the <em>protocol spoken over it</em> — from HTTP
          messages to WebSocket frames (RFC 6455).
        </p>

        <h3 class="scheme-heading">ws:// vs wss://</h3>
        <p class="scheme-lede">Same relationship as http:// and https:// — one adds TLS, the other doesn't.</p>
        <div class="scheme-row" role="group" aria-label="Scheme">
          <button type="button" class="lab-btn" [class.is-active]="scheme() === 'ws'" (click)="scheme.set('ws')">ws://</button>
          <button type="button" class="lab-btn" [class.is-active]="scheme() === 'wss'" (click)="scheme.set('wss')">wss://</button>
        </div>
        <div class="scheme-stack mono">
          <div class="stack-layer">Browser</div>
          <span class="stack-arrow">↓</span>
          @if (scheme() === 'wss') {
            <div class="stack-layer stack-layer-tls">TLS</div>
            <span class="stack-arrow">↓</span>
          }
          <div class="stack-layer">WebSocket</div>
        </div>
        <p class="scheme-explain">
          @if (scheme() === 'ws') {
            <span class="mono">ws://</span> — WebSocket traffic with no TLS. Frames travel in plaintext; anything on the network path can read them. Fine for local development, not for production.
          } @else {
            <span class="mono">wss://</span> — WebSocket over TLS. Everything after the handshake is encrypted in transit, same as the guarantee <span class="mono">https://</span> gives a normal request. This is what production applications use whenever the traffic needs confidentiality.
          }
        </p>
      </div>
    </section>
  `,
  styles: `
    .handshake-stage { display: flex; align-items: center; gap: 0; margin-top: 28px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px 16px; }
    .hs-node { flex-shrink: 0; width: 100px; height: 64px; display: flex; align-items: center; justify-content: center; text-align: center; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--text-faint); transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    @media (min-width: 640px) { .hs-node { width: 130px; } }
    .hs-node.is-active { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .hs-wire { position: relative; flex: 1; height: 64px; min-width: 80px; }
    .hs-packet { position: absolute; top: 8px; left: 4px; opacity: 0; font-size: 0.6875rem; color: var(--accent); white-space: nowrap; background: var(--surface); border: 1px solid var(--accent-dim); border-radius: 999px; padding: 4px 10px; }
    .hs-res { top: auto; bottom: 8px; color: var(--accent-2); border-color: var(--accent-2-dim); }
    .hs-req.is-flying { animation: hs-out 0.7s ease forwards; }
    .hs-res.is-flying { animation: hs-in 0.7s ease forwards; }
    @keyframes hs-out { 0% { left: 4px; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: calc(100% - 90px); opacity: 0; } }
    @keyframes hs-in { 0% { left: calc(100% - 90px); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 4px; opacity: 0; } }

    .hs-panels { margin-top: 28px; display: grid; gap: 20px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .hs-panels { grid-template-columns: 1fr 1fr; } }
    .hs-panel { transition: opacity 0.3s ease; }
    .hs-panel.is-dim { opacity: 0.35; }
    .hs-panel-heading { color: var(--accent-2); margin-bottom: 8px; font-size: 0.6875rem; letter-spacing: 0.08em; }
    .hs-panel p + p { margin-top: 4px; }

    .why-101 { margin-top: 20px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }

    .mode-flip { display: flex; align-items: center; gap: 16px; margin-top: 32px; flex-wrap: wrap; }
    .mode-card { flex: 1; min-width: 200px; padding: 16px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-raised); transition: opacity 0.4s ease, border-color 0.4s ease; }
    .mode-card.is-past { opacity: 0.4; }
    .mode-card-target { border-style: dashed; }
    .mode-card-target.is-active { opacity: 1; border-style: solid; border-color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .mode-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 6px; }
    .mode-detail { font-size: 0.8125rem; color: var(--text-muted); }
    .mode-flip-arrow { font-size: 1.5rem; color: var(--text-faint); transition: color 0.4s ease, transform 0.4s ease; }
    .mode-flip-arrow.is-flipped { color: var(--accent); transform: scale(1.2); }
    .mode-flip-note { margin-top: 12px; font-size: 0.8125rem; color: var(--text-faint); max-width: 620px; }
    .mode-flip-note em { color: var(--text-muted); font-style: normal; }

    .scheme-heading { margin-top: 48px; font-size: 1.25rem; color: var(--text); }
    .scheme-lede { margin-top: 8px; color: var(--text-muted); font-size: 0.9375rem; }
    .scheme-row { display: flex; gap: 8px; margin-top: 16px; }
    .scheme-stack { margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .stack-layer { padding: 10px 24px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-size: 0.8125rem; color: var(--text); }
    .stack-layer-tls { border-color: var(--accent-2-dim); color: var(--accent-2); }
    .stack-arrow { color: var(--text-faint); }
    .scheme-explain { margin-top: 16px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }
  `,
})
export class HandshakeLab {
  protected readonly phase = signal<Phase>('idle');
  protected readonly scheme = signal<Scheme>('wss');

  async run(): Promise<void> {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    this.phase.set('sending');
    await wait(700);
    this.phase.set('processing');
    await wait(500);
    this.phase.set('responding');
    await wait(700);
    this.phase.set('upgraded');
  }
}
