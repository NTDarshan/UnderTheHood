import { Component, OnDestroy, signal } from '@angular/core';

type EventType =
  | 'login-success'
  | 'login-failure'
  | 'authz-denied'
  | 'rate-limit'
  | 'suspicious'
  | 'password-reset'
  | 'admin-action';

interface LogDetail {
  user: string;
  ip: string;
  traceId: string;
  request: string;
  action: string;
}

interface LogEvent {
  id: number;
  type: EventType;
  label: string;
  line: string;
  detail?: LogDetail;
}

const TYPE_META: Record<EventType, { badge: string; tone: string }> = {
  'login-success': { badge: 'LOGIN OK', tone: 'trust' },
  'login-failure': { badge: 'LOGIN FAIL', tone: 'suspicious' },
  'authz-denied': { badge: 'AUTHZ DENIED', tone: 'suspicious' },
  'rate-limit': { badge: 'RATE LIMITED', tone: 'suspicious' },
  suspicious: { badge: 'SUSPICIOUS', tone: 'attack' },
  'password-reset': { badge: 'PASSWORD RESET', tone: 'trust' },
  'admin-action': { badge: 'ADMIN ACTION', tone: 'admin' },
};

const SCRIPT: Array<Omit<LogEvent, 'id'>> = [
  {
    type: 'login-success',
    label: 'Login success',
    line: 'user=jsmith ip=203.0.113.4 result=success',
    detail: { user: 'jsmith', ip: '203.0.113.4', traceId: 'tr-8f21a0', request: 'POST /auth/login', action: 'session issued' },
  },
  { type: 'login-failure', label: 'Login failure', line: 'user=jsmith ip=198.51.100.9 result=bad_password' },
  { type: 'login-failure', label: 'Login failure', line: 'user=mchen ip=198.51.100.9 result=bad_password' },
  { type: 'login-failure', label: 'Login failure', line: 'user=agupta ip=198.51.100.9 result=bad_password' },
  {
    type: 'rate-limit',
    label: 'Rate limit exceeded',
    line: 'ip=198.51.100.9 endpoint=/auth/login requests=42/min limit=10/min',
    detail: { user: '(unauthenticated)', ip: '198.51.100.9', traceId: 'tr-c710e2', request: 'POST /auth/login', action: 'rate limit triggered, IP throttled' },
  },
  { type: 'authz-denied', label: 'Authorization denied', line: 'user=jsmith resource=/admin/users result=403_forbidden' },
  {
    type: 'suspicious',
    label: 'Suspicious request',
    line: 'ip=198.51.100.9 pattern=credential_stuffing usernames_tried=37',
    detail: { user: '(multiple)', ip: '198.51.100.9', traceId: 'tr-c710e2', request: 'POST /auth/login ×37', action: 'flagged as credential stuffing' },
  },
  {
    type: 'password-reset',
    label: 'Password reset',
    line: 'user=jsmith ip=203.0.113.4 result=reset_link_sent',
    detail: { user: 'jsmith', ip: '203.0.113.4', traceId: 'tr-4b19aa', request: 'POST /auth/reset-password', action: 'reset link issued' },
  },
  {
    type: 'admin-action',
    label: 'Admin action',
    line: 'user=rking action=grant_role role=billing_admin target=mchen',
    detail: { user: 'rking', ip: '203.0.113.9', traceId: 'tr-91dd6c', request: 'POST /admin/roles', action: 'granted billing_admin to mchen' },
  },
];

let idCounter = 0;

@Component({
  selector: 'app-security-logging-auditing',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-logging">
      <div class="container">
        <p class="lab-index">30 &mdash; SECURITY LOGGING &amp; AUDITING</p>
        <h2 class="lab-title">You can't respond to what you can't see.</h2>
        <p class="lab-lede">
          A security console watches the same event stream every request produces. Individually the lines look
          routine; correlated together they reveal what actually happened.
        </p>

        <div class="lab-panel">
          <div class="pipeline mono" aria-label="Logging pipeline">
            <span class="pipe-node">APPLICATION</span>
            <span class="pipe-arrow" aria-hidden="true">&rarr;</span>
            <span class="pipe-node">STRUCTURED LOGS</span>
            <span class="pipe-arrow" aria-hidden="true">&rarr;</span>
            <span class="pipe-node">SECURITY MONITORING</span>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="streaming()" [attr.aria-pressed]="streaming()" (click)="toggleStream()">
              {{ streaming() ? 'Pause feed' : 'Resume feed' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="console-grid">
            <div class="feed" role="log" aria-live="polite" aria-label="Security event feed">
              @for (e of events(); track e.id) {
                <button
                  type="button"
                  class="feed-row"
                  [class.feed-row-selected]="selected()?.id === e.id"
                  [disabled]="!e.detail"
                  (click)="select(e)"
                >
                  <span class="badge mono" [class]="'tone-' + meta(e.type).tone">{{ meta(e.type).badge }}</span>
                  <span class="feed-line mono">{{ e.line }}</span>
                  @if (e.detail) {
                    <span class="feed-hint mono">view detail</span>
                  }
                </button>
              }
              @if (events().length === 0) {
                <p class="lab-note">Feed paused. Resume to start streaming events.</p>
              }
            </div>

            <div class="detail-panel">
              <p class="side-label mono">CORRELATED DETAIL</p>
              @if (selected(); as s) {
                <dl class="detail-list">
                  <dt>USER</dt><dd>{{ s.detail!.user }}</dd>
                  <dt>IP</dt><dd>{{ s.detail!.ip }}</dd>
                  <dt>TRACE ID</dt><dd class="mono">{{ s.detail!.traceId }}</dd>
                  <dt>REQUEST</dt><dd class="mono">{{ s.detail!.request }}</dd>
                  <dt>ACTION</dt><dd>{{ s.detail!.action }}</dd>
                </dl>
                <p class="detail-note">
                  Correlating USER, IP and TRACE ID across multiple log lines is what lets an investigator
                  reconstruct what actually happened &mdash; a single line rarely tells the whole story.
                </p>
              } @else {
                <p class="lab-note">Select a log entry with a "view detail" tag to see its correlated fields.</p>
              }
            </div>
          </div>

          <p class="side-label mono redacted-label">WHAT NEVER GETS LOGGED</p>
          <pre class="lab-code redacted-line"><span class="tok-key">user=jsmith</span> <span class="tok-key">action=login</span> <span class="tok-dim">password:</span> <span class="tok-status-err">[REDACTED]</span> <span class="tok-dim">token:</span> <span class="tok-status-err">[REDACTED]</span></pre>

          <p class="lab-note lab-note-warn">
            Security controls need observability &mdash; an attack you can't see is an attack you can't respond to.
          </p>
          <p class="lab-note lab-note-warn">
            Never log passwords, tokens, or other sensitive secrets. Redact them at the point of logging, not
            after the fact.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
    }

    .pipeline { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.75rem; color: var(--text-muted); }
    .pipe-node { padding: 6px 10px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text); }
    .pipe-arrow { color: var(--text-faint); }

    .console-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 22px; }
    @media (min-width: 860px) { .console-grid { grid-template-columns: 1.4fr 1fr; } }

    .feed {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 360px;
      overflow-y: auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 10px;
    }

    .feed-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 10px;
      text-align: left;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      color: var(--text-muted);
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .feed-row:not(:disabled):hover { border-color: var(--accent); }
    .feed-row:disabled { cursor: default; opacity: 0.85; }
    .feed-row-selected { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 10%, var(--surface-elevated)); }

    .badge { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.05em; padding: 3px 7px; border-radius: 999px; border: 1px solid var(--border-strong); white-space: nowrap; }
    .tone-trust { color: var(--trust); border-color: color-mix(in srgb, var(--trust) 50%, var(--border-strong)); }
    .tone-suspicious { color: var(--suspicious); border-color: color-mix(in srgb, var(--suspicious) 50%, var(--border-strong)); }
    .tone-attack { color: var(--attack); border-color: color-mix(in srgb, var(--attack) 50%, var(--border-strong)); }
    .tone-admin { color: var(--trust); border-color: var(--trust); background: color-mix(in srgb, var(--trust) 14%, transparent); }

    .feed-line { font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .feed-hint { font-size: 0.625rem; color: var(--accent-2); white-space: nowrap; }

    .detail-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .side-label { color: var(--text-faint); letter-spacing: 0.1em; font-size: 0.6875rem; margin-bottom: 10px; }

    .detail-list { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 0.8125rem; }
    .detail-list dt { color: var(--text-faint); letter-spacing: 0.06em; font-family: var(--font-mono); font-size: 0.6875rem; }
    .detail-list dd { margin: 0; color: var(--text); }

    .detail-note { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; }

    .redacted-label { margin-top: 28px; }
    .redacted-line { margin-top: 0; }
  `,
})
export class SecurityLoggingAuditing implements OnDestroy {
  protected readonly streaming = signal(true);
  protected readonly events = signal<LogEvent[]>([]);
  protected readonly selected = signal<LogEvent | null>(null);

  private timer: ReturnType<typeof setInterval> | null = null;
  private scriptIndex = 0;

  constructor() {
    this.startTimer();
  }

  meta(type: EventType) {
    return TYPE_META[type];
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      const def = SCRIPT[this.scriptIndex % SCRIPT.length];
      this.scriptIndex += 1;
      const event: LogEvent = { id: idCounter++, ...def };
      this.events.update((list) => [event, ...list].slice(0, 12));
    }, 1400);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggleStream(): void {
    this.streaming.update((v) => !v);
    if (this.streaming()) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  reset(): void {
    this.stopTimer();
    this.events.set([]);
    this.selected.set(null);
    this.scriptIndex = 0;
    this.streaming.set(true);
    this.startTimer();
  }

  select(e: LogEvent): void {
    if (!e.detail) return;
    this.selected.set(e);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
