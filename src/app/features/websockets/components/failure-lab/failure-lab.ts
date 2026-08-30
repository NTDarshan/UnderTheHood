import { Component, signal } from '@angular/core';

interface Failure {
  id: string;
  label: string;
  what: string;
  why: string;
  experience: string;
  mitigation: string;
}

const FAILURES: Failure[] = [
  {
    id: 'network', label: 'Network failure',
    what: 'The TCP connection between client and server drops without a close handshake.',
    why: 'Wi-Fi drops, a phone goes into a tunnel, a NAT/router silently forgets the connection state.',
    experience: 'No error message — messages just stop arriving. onclose eventually fires with code 1006.',
    mitigation: 'Ping/pong (or an application heartbeat) to detect it faster, then reconnect with exponential backoff and jitter.',
  },
  {
    id: 'restart', label: 'Server restart',
    what: 'The process holding thousands of connections exits.',
    why: 'A deploy, a crash, an out-of-memory kill.',
    experience: 'Every client on that instance disconnects at the same instant.',
    mitigation: 'Rolling restarts, connection draining before shutdown, client-side reconnect with backoff+jitter to avoid a thundering herd.',
  },
  {
    id: 'slow-client', label: 'Slow client',
    what: 'One client\'s consume rate falls behind the server\'s send rate.',
    why: 'Bad network, an overloaded device, a tab in the background throttled by the browser.',
    experience: 'That one client sees stale or delayed data; if unmanaged, everyone else is unaffected — but the server\'s memory for that connection\'s buffer keeps growing.',
    mitigation: 'Backpressure handling — bounded buffers, message coalescing, or disconnecting consumers that fall too far behind.',
  },
  {
    id: 'too-many', label: 'Too many connections',
    what: 'The server hits its file-descriptor or memory limit.',
    why: 'More clients connected than the process (or host) was provisioned to hold.',
    experience: 'New connection attempts fail outright; existing connections may also start failing under memory pressure.',
    mitigation: 'Horizontal scaling with a load balancer, raised OS limits, connection-count alerts before the ceiling is hit.',
  },
  {
    id: 'pubsub-down', label: 'Pub/Sub failure',
    what: 'The message broker connecting WebSocket server instances goes down or partitions.',
    why: 'The broker itself crashed, or a network partition separates it from some servers.',
    experience: 'Clients stay connected and the UI looks fine — but events published on one server silently stop reaching clients on other servers.',
    mitigation: 'A highly-available broker cluster, monitoring cross-server delivery specifically (not just "is the broker up"), and alerting on publish/receive mismatches.',
  },
  {
    id: 'auth-fail', label: 'Authentication failure',
    what: 'A handshake or post-connect auth message fails validation.',
    why: 'Expired token, revoked session, clock skew invalidating a signed token.',
    experience: 'Connection refused at handshake, or accepted then immediately closed with a policy-violation code.',
    mitigation: 'Clear close codes/reasons the client can act on (e.g. refresh token and retry), rate-limited retry to avoid hammering auth on failure.',
  },
  {
    id: 'lb-fail', label: 'Load balancer failure',
    what: 'The load balancer instance routing connections becomes unavailable.',
    why: 'Infrastructure outage, misconfiguration, certificate expiry.',
    experience: 'New connections can\'t be established at all; existing ones may or may not be affected depending on architecture.',
    mitigation: 'Redundant load balancers, health checks, and failover — this is standard HA infrastructure practice, not WebSocket-specific.',
  },
  {
    id: 'storm', label: 'Reconnect storm',
    what: 'A mass disconnect (see "server restart") causes every client to retry at once.',
    why: 'No backoff or jitter in the client\'s reconnect logic.',
    experience: 'The server (and auth, and pub/sub) gets hit with a spike that can look like a DoS attack, sometimes causing a second wave of failures.',
    mitigation: 'Exponential backoff with jitter, staggered client rollout, connection-rate limiting on the server.',
  },
  {
    id: 'flood', label: 'Message flood',
    what: 'A client (buggy or malicious) sends messages far faster than intended.',
    why: 'A client-side bug in a retry loop, or a deliberate abuse attempt.',
    experience: 'That connection\'s handling starves other work on the same server process if unbounded.',
    mitigation: 'Per-connection rate limiting, message size caps, and disconnecting connections that exceed a sane threshold.',
  },
];

@Component({
  selector: 'app-failure-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="failure-lab">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 021 — FAILURE LAB</p>
        <h2 class="lab-title">Break the system on purpose.</h2>
        <p class="lab-lede">Every real-time system fails eventually. Pick a failure and see what actually happens.</p>

        <div class="failure-grid">
          @for (f of failures; track f.id) {
            <button type="button" class="failure-btn" [class.is-active]="selected().id === f.id" (click)="select(f)">
              {{ f.label }}
            </button>
          }
        </div>

        <div class="lab-panel result-panel" [class.is-flashing]="flashing()">
          <p class="result-title mono">{{ selected().label.toUpperCase() }}</p>
          <div class="result-row"><span class="result-label mono">WHAT FAILED</span><p>{{ selected().what }}</p></div>
          <div class="result-row"><span class="result-label mono">WHY IT FAILED</span><p>{{ selected().why }}</p></div>
          <div class="result-row"><span class="result-label mono">WHAT THE USER EXPERIENCES</span><p>{{ selected().experience }}</p></div>
          <div class="result-row"><span class="result-label mono">HOW PRODUCTION MITIGATES IT</span><p class="mitigation">{{ selected().mitigation }}</p></div>
          <button type="button" class="lab-btn lab-btn-danger" (click)="inject()">Inject this failure</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .failure-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .failure-btn { padding: 12px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); color: var(--text-muted); font-size: 0.875rem; text-align: left; transition: border-color 0.15s ease, color 0.15s ease; }
    .failure-btn:hover { border-color: var(--danger); }
    .failure-btn.is-active { border-color: var(--danger); color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface-elevated)); }

    .result-panel { margin-top: 20px; transition: box-shadow 0.15s ease, border-color 0.15s ease; }
    .result-panel.is-flashing { border-color: var(--danger); box-shadow: 0 0 0 1px var(--danger); animation: result-shake 0.35s ease; }
    @keyframes result-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
    .result-title { color: var(--danger); font-size: 1rem; margin-bottom: 18px; }
    .result-row { margin-top: 14px; }
    .result-row:first-of-type { margin-top: 0; }
    .result-label { display: block; font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent-2); margin-bottom: 4px; }
    .result-row p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; max-width: 660px; }
    .mitigation { color: var(--text); }

    .result-panel .lab-btn { margin-top: 22px; }
  `,
})
export class FailureLab {
  protected readonly failures = FAILURES;
  protected readonly selected = signal<Failure>(FAILURES[0]);
  protected readonly flashing = signal(false);

  select(f: Failure): void {
    this.selected.set(f);
    this.flashing.set(false);
  }

  inject(): void {
    this.flashing.set(true);
    setTimeout(() => this.flashing.set(false), 400);
  }
}
