import { Component, computed, signal } from '@angular/core';

type MechanismId = 'password' | 'session' | 'token' | 'oauth' | 'apikey';

interface Mechanism {
  id: MechanismId;
  label: string;
  summary: string;
  flow: string[];
}

const MECHANISMS: Mechanism[] = [
  {
    id: 'password',
    label: 'Password',
    summary: 'The user proves identity by demonstrating knowledge of a secret only they should know.',
    flow: ['User', 'submits password', 'Server verifies', 'Identity confirmed'],
  },
  {
    id: 'session',
    label: 'Session',
    summary: 'After one login, the server remembers who you are via an identifier it stored earlier.',
    flow: ['Browser', 'sends session ID', 'Server looks it up', 'Identity resolved'],
  },
  {
    id: 'token',
    label: 'Token',
    summary: 'A signed, portable credential the client holds and presents with each request.',
    flow: ['Client', 'presents signed token', 'Server verifies signature', 'Identity confirmed'],
  },
  {
    id: 'oauth',
    label: 'OAuth / OIDC',
    summary: 'Authentication is delegated to a trusted third-party identity provider.',
    flow: ['User', 'authenticates at provider', 'Provider vouches', 'App trusts identity'],
  },
  {
    id: 'apikey',
    label: 'API key',
    summary: 'A static credential identifying an application or service, not a human.',
    flow: ['Application', 'sends API key', 'Server matches key', 'Application identified'],
  },
];

@Component({
  selector: 'app-authentication-basics',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="authentication-basics">
      <div class="container">
        <p class="lab-index">08 — AUTHENTICATION</p>
        <h2 class="lab-title">Who are you?</h2>
        <p class="lab-lede">
          Authentication is the process of establishing identity. A system challenges a claim ("I am this user")
          and checks proof before trusting it. Once identity is established, it's typically carried forward for
          the rest of a session or request — but establishing identity is only half the story.
        </p>

        <div class="lab-panel">
          <p class="lab-node">IDENTITY VERIFICATION FLOW</p>
          <div class="verify-flow" aria-label="Authentication flow">
            <div class="flow-node node-client">
              <span class="mono node-label">USER</span>
              <span class="node-sub">claims an identity</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-gate" [class.is-checking]="checking()">
              <span class="mono node-label">GATE</span>
              <span class="node-sub">{{ checking() ? 'verifying…' : 'checks proof' }}</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node node-trust" [class.is-verified]="verified()">
              <span class="mono node-label">{{ verified() ? 'AUTHENTICATED' : 'UNVERIFIED' }}</span>
              <span class="node-sub">{{ verified() ? 'identity confirmed' : 'not yet proven' }}</span>
            </div>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Run verification">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runVerification()" [disabled]="checking()">
              {{ checking() ? 'Verifying…' : 'Run verification' }}
            </button>
            @if (verified()) {
              <button type="button" class="lab-btn" (click)="reset()">Reset</button>
            }
          </div>

          <p class="lab-note lab-note-warn">
            <strong>Authentication establishes identity — it does not by itself decide what that identity is
            allowed to do.</strong> Knowing who someone is and knowing what they may do are two separate
            questions, checked at two separate moments.
          </p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">FIVE WAYS TO ESTABLISH IDENTITY</p>
          <div class="lab-btn-row" role="tablist" aria-label="Authentication mechanisms">
            @for (m of mechanisms; track m.id) {
              <button
                type="button"
                class="lab-btn"
                role="tab"
                [class.is-active]="activeMechanism().id === m.id"
                [attr.aria-selected]="activeMechanism().id === m.id"
                (click)="selectMechanism(m.id)"
              >
                {{ m.label }}
              </button>
            }
          </div>

          <div class="mech-detail" role="tabpanel">
            <p class="mech-summary">{{ activeMechanism().summary }}</p>
            <div class="mini-flow" aria-label="mechanism flow">
              @for (step of activeMechanism().flow; track $index) {
                <span class="mini-flow-step mono">{{ step }}</span>
                @if (!$last) {
                  <span class="lab-flow-arrow">&rarr;</span>
                }
              }
            </div>
          </div>
        </div>

        <div class="lab-panel contrast-panel">
          <p class="lab-node">THE DISTINCTION THAT MATTERS</p>
          <div class="contrast-grid">
            <div class="contrast-box identity-box">
              <p class="contrast-title mono">IDENTITY</p>
              <p class="contrast-desc">Who you are — established once, typically per session or token.</p>
              <p class="contrast-when mono">checked at login</p>
            </div>
            <div class="contrast-box permission-box">
              <p class="contrast-title mono">PERMISSION</p>
              <p class="contrast-desc">What you're allowed to do — checked separately, per action.</p>
              <p class="contrast-when mono">checked every action</p>
            </div>
          </div>
          <p class="lab-note">
            This distinction — authentication (identity) versus authorization (permission) — is the foundation
            the rest of this chapter builds on.
          </p>
        </div>
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

    .verify-flow { margin-top: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .flow-node {
      display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center;
      min-width: 140px; padding: 14px 16px; border-radius: var(--radius-md);
      border: 1px solid var(--border-strong); background: var(--surface); text-align: center;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }
    .node-label { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .node-sub { font-size: 0.75rem; color: var(--text-faint); }
    .node-client { border-color: var(--c-client); }
    .node-gate.is-checking { border-color: var(--suspicious); box-shadow: 0 0 14px color-mix(in srgb, var(--suspicious) 40%, transparent); }
    .node-trust.is-verified { border-color: var(--trust); background: color-mix(in srgb, var(--trust) 12%, var(--surface)); }
    .node-trust.is-verified .node-label { color: var(--trust); }

    .mech-detail { margin-top: 22px; padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .mech-summary { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.55; }
    .mini-flow { margin-top: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .mini-flow-step { font-size: 0.75rem; color: var(--text); background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); padding: 5px 9px; }

    .contrast-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .contrast-box { padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); }
    .identity-box { border-color: var(--c-client); }
    .permission-box { border-color: var(--trust); }
    .contrast-title { font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.08em; }
    .identity-box .contrast-title { color: var(--c-client); }
    .permission-box .contrast-title { color: var(--trust); }
    .contrast-desc { margin-top: 10px; color: var(--text-muted); font-size: 0.875rem; line-height: 1.5; }
    .contrast-when { margin-top: 12px; font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; text-transform: uppercase; }
  `,
})
export class AuthenticationBasics {
  protected readonly mechanisms = MECHANISMS;

  protected readonly checking = signal(false);
  protected readonly verified = signal(false);
  protected readonly activeMechanismId = signal<MechanismId>('password');

  protected readonly activeMechanism = computed(
    () => this.mechanisms.find((m) => m.id === this.activeMechanismId())!,
  );

  private timer: ReturnType<typeof setTimeout> | null = null;

  protected selectMechanism(id: MechanismId): void {
    this.activeMechanismId.set(id);
  }

  protected runVerification(): void {
    if (this.timer) clearTimeout(this.timer);
    this.checking.set(true);
    this.verified.set(false);
    this.timer = setTimeout(() => {
      this.checking.set(false);
      this.verified.set(true);
    }, 700);
  }

  protected reset(): void {
    if (this.timer) clearTimeout(this.timer);
    this.checking.set(false);
    this.verified.set(false);
  }
}
