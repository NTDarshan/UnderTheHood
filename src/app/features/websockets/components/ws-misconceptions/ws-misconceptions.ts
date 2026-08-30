import { Component, computed, signal } from '@angular/core';

interface Misconception {
  myth: string;
  reality: string;
}

const MISCONCEPTIONS: Misconception[] = [
  { myth: 'WebSocket is just HTTP kept open.', reality: 'It starts as an HTTP request (the Upgrade handshake) but afterward speaks a different, framed protocol defined by RFC 6455 — not HTTP messages held on a long-lived connection.' },
  { myth: 'WebSocket is encrypted by default.', reality: 'ws:// carries plaintext, exactly like http:// does. Encryption comes from using wss:// (TLS), which you have to choose explicitly.' },
  { myth: 'WebSocket is always faster.', reality: 'The real difference is the communication model — a persistent, bidirectional channel — not raw speed. For occasional client-initiated requests, plain HTTP isn\'t slower in any way that matters.' },
  { myth: 'WebSocket replaces REST.', reality: 'They solve different problems. Resource CRUD, uploads, and cacheable retrieval still fit HTTP better; WebSocket is for a standing, bidirectional real-time channel. Most systems use both.' },
  { myth: 'One WebSocket message equals one TCP packet.', reality: 'A message becomes one or more WebSocket frames, which become however many TCP segments and network packets the transport layer decides — those counts don\'t have to match.' },
  { myth: 'WebSocket automatically scales to millions of connections.', reality: 'Every open connection consumes a file descriptor and memory on some server. Scaling to large numbers of connections requires horizontal scaling, OS tuning, and usually a pub/sub layer — none of it is automatic.' },
  { myth: 'Masking encrypts WebSocket data.', reality: 'Masking XORs the payload with a key that travels in plaintext in the same frame — trivially reversible by anyone reading the wire. Only TLS (wss://) provides confidentiality.' },
  { myth: 'Opening a WebSocket means the user is authorized for everything.', reality: 'A successful handshake only proves who is connected. Every subscription or action sent afterward still needs its own authorization check, same as individual API endpoints.' },
  { myth: 'Ping/pong is the same thing as an application heartbeat.', reality: 'Protocol ping/pong (control frames) only proves the transport is alive. An application-level heartbeat message can additionally prove the application logic on the other end is still responsive — they are related, not interchangeable.' },
];

@Component({
  selector: 'app-ws-misconceptions',
  standalone: true,
  template: `
    <section class="lab-section" id="misconceptions">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 022 — COMMON MISCONCEPTIONS</p>
        <h2 class="lab-title">Things that sound right about WebSockets, but aren't.</h2>
        <p class="lab-lede">Pick one — most people believe at least a few of these.</p>

        <div class="myth-grid">
          @for (m of misconceptions; track m.myth; let i = $index) {
            <button type="button" class="myth-card" [class.is-selected]="selectedIndex() === i" (click)="selectedIndex.set(i)">
              <span class="myth-tag mono">MYTH</span>
              <span class="myth-text">{{ m.myth }}</span>
            </button>
          }
        </div>

        <div class="lab-panel reality-panel">
          <span class="reality-tag mono">ACTUALLY</span>
          <p class="reality-text">{{ active().reality }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .myth-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 720px) { .myth-grid { grid-template-columns: 1fr 1fr; } }
    .myth-card { display: flex; flex-direction: column; gap: 8px; padding: 16px 18px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: left; transition: border-color 0.15s ease, transform 0.15s ease; }
    .myth-card:hover { transform: translateY(-2px); }
    .myth-card.is-selected { border-color: var(--danger); box-shadow: 0 0 18px -6px var(--danger); }
    .myth-tag { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--danger); }
    .myth-text { font-size: 0.9375rem; color: var(--text); line-height: 1.5; }
    .reality-panel { display: flex; flex-direction: column; gap: 10px; }
    .reality-tag { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); }
    .reality-text { font-size: 1rem; color: var(--text); line-height: 1.65; max-width: 640px; }
  `,
})
export class WsMisconceptions {
  protected readonly misconceptions = MISCONCEPTIONS;
  protected readonly selectedIndex = signal(0);
  protected readonly active = computed(() => this.misconceptions[this.selectedIndex()]);
}
