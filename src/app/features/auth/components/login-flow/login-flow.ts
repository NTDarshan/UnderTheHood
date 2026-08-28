import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type LoginState = 'idle' | 'checking' | 'success' | 'failure';

const KNOWN_ACCOUNTS: Record<string, string> = {
  'alice@example.com': 'hunter2',
  'bob@example.com': 'correct-horse',
};

@Component({
  selector: 'app-login-flow',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="login-flow">
      <div class="container">
        <p class="lab-index">AUTH / 08 — THE LOGIN FLOW</p>
        <h2 class="lab-title">What actually happens on POST /login.</h2>

        <div class="flow-chain mono">
          <span>User</span><span class="arrow">↓</span>
          <span>Login Form</span><span class="arrow">↓</span>
          <span>POST /login</span><span class="arrow">↓</span>
          <span>Find account</span><span class="arrow">↓</span>
          <span>Verify password</span><span class="arrow">↓</span>
          <span>Issue credential</span>
        </div>

        <div class="lab-panel login-panel">
          <p class="lab-note">Try: <code>alice&#64;example.com</code> / <code>hunter2</code>, a wrong password, or an unknown address.</p>
          <div class="login-fields">
            <div class="lab-field">
              <label for="login-email">Email</label>
              <input id="login-email" type="text" [ngModel]="email()" (ngModelChange)="email.set($event)" />
            </div>
            <div class="lab-field">
              <label for="login-pwd">Password</label>
              <input id="login-pwd" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" />
            </div>
          </div>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="submit()" [disabled]="state() === 'checking'">Log in</button>
          </div>

          <div class="login-stages mono">
            @for (s of stageIds; track s; let i = $index) {
              <span class="stage-dot" [class.is-active]="stageIndex() >= i">{{ s }}</span>
            }
          </div>

          @if (state() === 'success') {
            <p class="login-result is-ok">✓ Authenticated. A credential (session or token) is issued for subsequent requests.</p>
          } @else if (state() === 'failure') {
            <p class="login-result is-fail">✕ Invalid credentials.</p>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="generic-errors">
      <div class="container">
        <p class="lab-index">AUTH / 09 — GENERIC ERROR MESSAGES</p>
        <h2 class="lab-title">Why the server never says "user not found."</h2>

        <div class="enum-demo lab-panel">
          <p class="enum-label mono">ATTACKER TRIES THREE ADDRESSES</p>
          <div class="enum-grid">
            @for (attempt of enumAttempts; track attempt.email) {
              <div class="enum-row">
                <span class="enum-email mono">{{ attempt.email }}</span>
                <span class="enum-bad mono">"{{ attempt.badMessage }}"</span>
                <span class="enum-good mono">"Invalid credentials."</span>
              </div>
            }
          </div>
          <p class="lab-note">
            A specific message ("user not found" vs "wrong password") lets an attacker enumerate which
            addresses have accounts at all. A single generic message reveals nothing extra either way.
          </p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="timing-attacks">
      <div class="container">
        <p class="lab-index">AUTH / 10 — TIMING ATTACKS</p>
        <h2 class="lab-title">Even response speed can leak information.</h2>

        <div class="timing-grid">
          <div class="timing-card is-bad">
            <p class="timing-label mono">NAIVE IMPLEMENTATION</p>
            <div class="timing-row"><span>Unknown user</span><span class="timing-bar" style="width: 15%">10ms</span></div>
            <div class="timing-row"><span>Existing user, wrong password</span><span class="timing-bar" style="width: 85%">80ms</span></div>
            <p class="timing-note">Looking up the account and hashing the password takes measurably longer than an immediate "no such user" rejection.</p>
          </div>
          <div class="timing-card is-good">
            <p class="timing-label mono">IMPROVED BEHAVIOR</p>
            <div class="timing-row"><span>Unknown user</span><span class="timing-bar" style="width: 78%">76ms</span></div>
            <div class="timing-row"><span>Existing user, wrong password</span><span class="timing-bar" style="width: 82%">80ms</span></div>
            <p class="timing-note">Comparable authentication work runs either way, so the two cases are harder to tell apart by timing alone.</p>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Application-level timing can rarely be made perfectly constant across every environment.
          The goal is avoiding <em>obvious</em> timing differences and using appropriate constant-time
          comparisons where relevant — not an absolute guarantee.
        </p>
      </div>
    </section>
  `,
  styles: `
    .flow-chain { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .login-panel { margin-top: 24px; }
    .login-fields { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 14px; max-width: 360px; }
    @media (min-width: 500px) { .login-fields { grid-template-columns: 1fr 1fr; } }

    .login-stages { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px; }
    .stage-dot {
      font-size: 0.6875rem;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      color: var(--text-faint);
    }
    .stage-dot.is-active { border-color: var(--accent); color: var(--accent-strong); }

    .login-result { margin-top: 16px; font-size: 0.9375rem; font-weight: 600; }
    .login-result.is-ok { color: var(--accent-2); }
    .login-result.is-fail { color: var(--danger); }

    .enum-demo { margin-top: 32px; }
    .enum-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .enum-grid { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
    .enum-row { display: grid; grid-template-columns: 1fr; gap: 4px; padding: 10px 14px; background: var(--surface); border-radius: var(--radius-sm); border: 1px solid var(--border); }
    @media (min-width: 700px) { .enum-row { grid-template-columns: 1fr 1fr 1fr; align-items: center; } }
    .enum-email { font-size: 0.75rem; color: var(--text); }
    .enum-bad { font-size: 0.75rem; color: var(--danger); }
    .enum-good { font-size: 0.75rem; color: var(--accent-2); }

    .timing-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 800px) { .timing-grid { grid-template-columns: 1fr 1fr; } }

    .timing-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 22px; }
    .timing-card.is-bad { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .timing-card.is-good { border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }
    .timing-label { font-size: 0.6875rem; letter-spacing: 0.08em; margin-bottom: 12px; }
    .is-bad .timing-label { color: var(--danger); }
    .is-good .timing-label { color: var(--accent-2); }

    .timing-row { display: flex; align-items: center; gap: 10px; font-size: 0.8125rem; color: var(--text-muted); margin-top: 10px; }
    .timing-row span:first-child { flex: 0 0 170px; }
    .timing-bar {
      flex: 1;
      background: linear-gradient(90deg, var(--accent-2), var(--accent));
      color: #0a0c0f;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      text-align: right;
      min-width: 40px;
    }
    .timing-note { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class LoginFlow {
  protected readonly email = signal('alice@example.com');
  protected readonly password = signal('hunter2');
  protected readonly state = signal<LoginState>('idle');
  protected readonly stageIndex = signal(-1);
  protected readonly stageIds = ['form', 'request', 'lookup', 'verify', 'result'];

  protected readonly enumAttempts = [
    { email: 'alice@example.com', badMessage: 'Incorrect password.' },
    { email: 'bob@example.com', badMessage: 'Incorrect password.' },
    { email: 'admin@example.com', badMessage: 'User not found.' },
  ];

  async submit(): Promise<void> {
    this.state.set('checking');
    for (let i = 0; i < this.stageIds.length - 1; i++) {
      this.stageIndex.set(i);
      await wait(220);
    }

    const known = KNOWN_ACCOUNTS[this.email().trim().toLowerCase()];
    const success = known !== undefined && known === this.password();

    this.stageIndex.set(this.stageIds.length - 1);
    this.state.set(success ? 'success' : 'failure');
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
