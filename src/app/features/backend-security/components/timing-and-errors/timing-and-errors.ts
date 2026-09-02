import { Component, computed, signal } from '@angular/core';

const REAL_USERNAMES = ['diego', 'priya', 'admin'];

const BASE_FAST_MS = 10; // username doesn't exist, short-circuits
const BASE_SLOW_MS = 100; // username exists, password hash gets checked

@Component({
  selector: 'app-timing-and-errors',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="timing-and-errors">
      <div class="container">
        <p class="lab-index">19 — TIMING ATTACKS &amp; GENERIC ERROR MESSAGES</p>
        <h2 class="lab-title">Anything measurably different is a signal an attacker can use.</h2>
        <p class="lab-lede">
          Two internal code paths that feel equivalent from the outside — "user doesn't exist" and "wrong
          password" — can leak information through how long they take to answer, or through what they say.
        </p>

        <!-- PART A: TIMING -->
        <div class="lab-panel">
          <p class="lab-node">PART A — TIMING</p>
          <p class="layer-desc">
            Request A logs in with a username that doesn't exist. Request B logs in with a real username and the
            wrong password. Watch how long each takes.
          </p>

          <div class="timing-rows">
            <div class="timing-row">
              <span class="mono timing-label">Request A &mdash; unknown username</span>
              <div class="timing-track">
                <div class="timing-bar bar-a" [style.width.%]="fastPct()"></div>
              </div>
              <span class="mono timing-value">{{ fastMs() }}ms</span>
            </div>
            <div class="timing-row">
              <span class="mono timing-label">Request B &mdash; real username, wrong password</span>
              <div class="timing-track">
                <div class="timing-bar bar-b" [style.width.%]="slowPct()"></div>
              </div>
              <span class="mono timing-value">{{ slowMs() }}ms</span>
            </div>
          </div>

          <p class="lab-note lab-note-warn">
            An attacker trying many usernames and measuring response time can infer <strong>which usernames exist
            in the system</strong> purely from how long the server took to respond &mdash; even if the final response
            text is completely identical in both cases. A fast reply means the lookup short-circuited; a slow
            reply means it proceeded to actually check a password hash.
          </p>

          <p class="lab-node mitigation-heading">MITIGATIONS &mdash; toggle to see the bars converge</p>
          <div class="lab-btn-row" role="group" aria-label="Timing mitigations">
            <button type="button" class="lab-btn" [class.is-active]="consistentProcessing()" [attr.aria-pressed]="consistentProcessing()" (click)="consistentProcessing.set(!consistentProcessing())">
              CONSISTENT PROCESSING
            </button>
            <button type="button" class="lab-btn" [class.is-active]="constantTimeCompare()" [attr.aria-pressed]="constantTimeCompare()" (click)="constantTimeCompare.set(!constantTimeCompare())">
              CONSTANT-TIME COMPARISON
            </button>
            <button type="button" class="lab-btn" [class.is-active]="uniformErrors()" [attr.aria-pressed]="uniformErrors()" (click)="uniformErrors.set(!uniformErrors())">
              UNIFORM ERROR HANDLING
            </button>
          </div>
          <ul class="mitigation-list">
            <li><strong>Consistent processing</strong> &mdash; always do a comparable amount of work regardless of whether the user exists (e.g. hash a dummy password anyway).</li>
            <li><strong>Constant-time comparison</strong> &mdash; compare secrets without returning early on the first mismatched byte.</li>
            <li><strong>Uniform error handling</strong> &mdash; pairs with Part B below: make the visible response identical too.</li>
          </ul>
        </div>

        <!-- PART B: GENERIC ERRORS -->
        <div class="lab-panel">
          <p class="lab-node">PART B &mdash; GENERIC ERROR MESSAGES</p>
          <p class="layer-desc">Try logging in with a few usernames below and compare the error text between modes.</p>

          <div class="lab-btn-row" role="group" aria-label="Error message mode">
            <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="errorMode() === 'bad'" (click)="errorMode.set('bad')">BAD: SPECIFIC ERRORS</button>
            <button type="button" class="lab-btn" [class.is-active]="errorMode() === 'good'" (click)="errorMode.set('good')">GOOD: GENERIC ERRORS</button>
          </div>

          <div class="login-sim">
            <div class="lab-field">
              <label for="username-input">Username to try</label>
              <input id="username-input" class="mono" type="text" [value]="username()" (input)="setUsername($event)" placeholder="try: diego, priya, ghost..." />
            </div>
            <div class="lab-btn-row try-row">
              @for (u of tryUsernames; track u) {
                <button type="button" class="lab-btn quick-btn" (click)="tryUsername(u)">{{ u }}</button>
              }
            </div>

            @if (loginAttempt(); as attempt) {
              <div class="attempt-result" [class.exists]="attempt.exists">
                <span class="mono attempt-user">username: {{ attempt.username }}</span>
                <span class="pill" [class.pill-no]="!attempt.leaksExistence" [class.pill-conditional]="attempt.leaksExistence">
                  {{ attempt.message }}
                </span>
              </div>
            }
          </div>

          @if (errorMode() === 'bad') {
            <p class="lab-note lab-note-warn">
              The attacker can now enumerate which usernames exist just by reading the error text, without needing
              to time anything &mdash; "User not found" versus "Incorrect password" is a direct, textual signal.
            </p>
          } @else {
            <p class="lab-note">
              The signal is gone: every attempt above returns the identical <span class="mono">"Invalid
              credentials"</span> response, whether the username exists or not.
            </p>
          }
        </div>

        <p class="lab-note closing-note">
          An attacker looks for <strong>any</strong> distinguishable signal &mdash; response text, response time,
          response headers, even response size. Real defense means making legitimately different internal code
          paths look identical from the outside, on every one of those channels at once.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .layer-desc { margin-top: 10px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .timing-rows { margin-top: 22px; display: flex; flex-direction: column; gap: 16px; }
    .timing-row { display: grid; grid-template-columns: 220px 1fr 60px; align-items: center; gap: 14px; }
    .timing-label { font-size: 0.75rem; color: var(--text-muted); }
    .timing-track { height: 18px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border-strong); overflow: hidden; }
    .timing-bar { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
    .bar-a { background: linear-gradient(90deg, var(--c-server), var(--trust)); }
    .bar-b { background: linear-gradient(90deg, var(--suspicious), var(--attack)); }
    .timing-value { font-size: 0.8125rem; color: var(--text); text-align: right; }

    .mitigation-heading { margin-top: 26px; }
    .mitigation-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; padding-left: 18px; list-style: disc; }
    .mitigation-list strong { color: var(--text); }

    .login-sim { margin-top: 20px; }
    .try-row { margin-top: 10px; }
    .quick-btn { padding: 6px 12px; font-size: 0.75rem; }

    .attempt-result { margin-top: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .attempt-result.exists { border-color: var(--suspicious); }
    .attempt-user { font-size: 0.8125rem; color: var(--text); }

    .closing-note { margin-top: 8px; max-width: 720px; }
  `,
})
export class TimingAndErrors {
  protected readonly tryUsernames = ['diego', 'priya', 'ghost123'];

  // Part A signals
  protected readonly consistentProcessing = signal(false);
  protected readonly constantTimeCompare = signal(false);
  protected readonly uniformErrors = signal(false);

  protected readonly mitigationCount = computed(
    () => [this.consistentProcessing(), this.constantTimeCompare(), this.uniformErrors()].filter(Boolean).length,
  );

  protected readonly fastMs = computed(() => {
    const closeness = this.mitigationCount() / 3;
    return Math.round(BASE_FAST_MS + (BASE_SLOW_MS - BASE_FAST_MS) * closeness);
  });

  protected readonly slowMs = computed(() => BASE_SLOW_MS);

  protected readonly fastPct = computed(() => (this.fastMs() / BASE_SLOW_MS) * 100);
  protected readonly slowPct = computed(() => (this.slowMs() / BASE_SLOW_MS) * 100);

  // Part B signals
  protected readonly errorMode = signal<'bad' | 'good'>('bad');
  protected readonly username = signal('diego');

  protected readonly loginAttempt = computed(() => {
    const uname = this.username().trim();
    if (!uname) return null;
    const exists = REAL_USERNAMES.includes(uname.toLowerCase());
    if (this.errorMode() === 'good') {
      return { username: uname, exists, message: 'Invalid credentials', leaksExistence: false };
    }
    return {
      username: uname,
      exists,
      message: exists ? 'Incorrect password' : 'User not found',
      leaksExistence: true,
    };
  });

  setUsername(ev: Event): void {
    this.username.set((ev.target as HTMLInputElement).value);
  }

  tryUsername(u: string): void {
    this.username.set(u);
  }
}
