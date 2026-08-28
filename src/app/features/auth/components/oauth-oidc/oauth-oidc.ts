import { Component, computed, signal } from '@angular/core';

interface OAuthRole {
  id: string;
  name: string;
  detail: string;
}

const ROLES: OAuthRole[] = [
  { id: 'owner', name: 'Resource Owner', detail: 'The user — the one who owns the data and can grant access to it.' },
  { id: 'client', name: 'Client', detail: 'The application requesting access on the user\'s behalf.' },
  { id: 'auth-server', name: 'Authorization Server', detail: 'Authenticates the user and issues authorization artifacts and tokens.' },
  { id: 'resource-server', name: 'Resource Server', detail: 'Hosts the protected resources and accepts tokens to authorize access to them.' },
];

const FLOW_STEPS = [
  'User opens the client application',
  'Client redirects to the Authorization Server',
  'User authenticates with the Authorization Server',
  'User grants consent for the requested scopes',
  'Authorization Server issues an Authorization Code',
  'Client sends the code to the Token Endpoint',
  'Token Endpoint returns an Access Token',
  'Client calls the Resource Server with the Access Token',
];

@Component({
  selector: 'app-oauth-oidc',
  standalone: true,
  template: `
    <section class="lab-section" id="oauth">
      <div class="container">
        <p class="lab-index">AUTH / 25 — OAUTH 2.0</p>
        <h2 class="lab-title">The problem OAuth exists to avoid.</h2>

        <div class="bad-good">
          <div class="flow-card is-bad">
            <p class="flow-label mono">BAD</p>
            <p class="flow-text mono">Application: "Give me your Google password."</p>
            <p class="flow-note">The application would hold the user's actual credential for another system entirely — a total loss of scoped, revocable trust.</p>
          </div>
          <div class="flow-card is-good">
            <p class="flow-label mono">INSTEAD</p>
            <div class="flow-chain mono">
              <span>User</span><span class="arrow">↓</span>
              <span>Client App</span><span class="arrow">↓</span>
              <span>Authorization Server</span><span class="arrow">↓</span>
              <span>User grants permission</span><span class="arrow">↓</span>
              <span>Authorization Code</span><span class="arrow">↓</span>
              <span>Token</span><span class="arrow">↓</span>
              <span>Resource Server</span>
            </div>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          OAuth 2.0 is primarily an <strong>authorization / delegation framework</strong> — not simply
          "Login with Google." Identity is a separate concern, layered on top (see OpenID Connect below).
        </p>
      </div>
    </section>

    <section class="lab-section" id="oauth-roles">
      <div class="container">
        <p class="lab-index">AUTH / 26 — OAUTH ROLES</p>
        <h2 class="lab-title">Four participants, one delegated trust.</h2>

        <div class="role-grid">
          @for (r of roles; track r.id) {
            <button type="button" class="role-card" [class.is-active]="activeRole() === r.id" (click)="activeRole.set(r.id)">
              <span class="role-name mono">{{ r.name }}</span>
            </button>
          }
        </div>
        <p class="role-detail">{{ activeRoleDetail() }}</p>
      </div>
    </section>

    <section class="lab-section" id="oauth-flow">
      <div class="container">
        <p class="lab-index">AUTH / 27 — AUTHORIZATION CODE FLOW</p>
        <h2 class="lab-title">Watch the delegation happen, step by step.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="playing()">▶ Run the flow</button>
        </div>

        <div class="steps-list mono">
          @for (s of flowSteps; track s; let i = $index) {
            <div class="step-row" [class.is-active]="stepIndex() >= i">
              <span class="step-index">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <span class="step-text">{{ s }}</span>
            </div>
          }
        </div>

        <p class="lab-note">
          <strong>PKCE</strong> protects this flow against interception or substitution of the
          authorization code — it is widely used for public clients such as mobile and single-page apps.
          This lab shows the conceptual shape of the flow; it does not implement a production OAuth client.
        </p>
      </div>
    </section>

    <section class="lab-section" id="scopes">
      <div class="container">
        <p class="lab-index">AUTH / 28 — SCOPES</p>
        <h2 class="lab-title">Delegated permission, not a blank check.</h2>

        <div class="lab-panel scope-panel">
          <p class="scope-line mono">User granted: <span class="scope-chip granted">profile.read</span> <span class="scope-chip granted">invoices.read</span></p>
          <p class="scope-line mono">Application requests: <span class="scope-chip requested">invoices.delete</span></p>
          <div class="scope-result is-fail">
            <span>Authentication: ✓</span>
            <span>Scope: ✕</span>
            <span>Access: DENIED</span>
          </div>
          <p class="lab-note">Scopes express what was actually delegated — a valid, authenticated token still can't act outside the scopes it was granted.</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="oidc">
      <div class="container">
        <p class="lab-index">AUTH / 29 — OPENID CONNECT</p>
        <h2 class="lab-title">OAuth grants access. OIDC establishes identity.</h2>

        <div class="oidc-grid">
          <div class="oidc-card">
            <p class="oidc-title mono">OAUTH 2.0</p>
            <p class="oidc-sub">Authorization / Delegation</p>
          </div>
          <div class="oidc-card">
            <p class="oidc-title mono">OPENID CONNECT</p>
            <p class="oidc-sub">Authentication / Identity layer built on OAuth 2.0</p>
          </div>
        </div>

        <div class="flow-chain mono">
          <span>User</span><span class="arrow">↓</span>
          <span>Identity Provider</span><span class="arrow">↓</span>
          <span>Authentication</span><span class="arrow">↓</span>
          <span>ID Token</span><span class="arrow">↓</span>
          <span>Application</span>
        </div>

        <p class="lab-note lab-note-warn">
          An OAuth <strong>access token</strong> authorizes access to a resource. An OIDC
          <strong>ID token</strong> conveys identity information about the user to the client. They are
          not interchangeable, even though both can appear in the same login flow.
        </p>
      </div>
    </section>
  `,
  styles: `
    .bad-good { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 850px) { .bad-good { grid-template-columns: 1fr 1fr; } }
    .flow-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 22px; }
    .flow-card.is-bad { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .flow-card.is-good { border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }
    .flow-label { font-size: 0.6875rem; letter-spacing: 0.1em; }
    .is-bad .flow-label { color: var(--danger); }
    .is-good .flow-label { color: var(--accent-2); }
    .flow-text { margin-top: 12px; font-size: 0.875rem; color: var(--text); }
    .flow-note { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .flow-chain { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .role-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (min-width: 700px) { .role-grid { grid-template-columns: repeat(4, 1fr); } }
    .role-card { padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); }
    .role-card.is-active { border-color: var(--accent); color: var(--text); box-shadow: 0 0 16px var(--glow-accent); }
    .role-name { font-size: 0.75rem; font-weight: 600; }
    .role-detail { margin-top: 18px; font-size: 0.9375rem; color: var(--text-muted); max-width: 560px; line-height: 1.6; }

    .steps-list { margin-top: 24px; display: flex; flex-direction: column; gap: 6px; }
    .step-row { display: flex; gap: 12px; align-items: baseline; padding: 8px 12px; border-radius: var(--radius-sm); opacity: 0.4; transition: opacity 0.25s ease, background 0.25s ease; }
    .step-row.is-active { opacity: 1; background: var(--surface-raised); }
    .step-index { color: var(--accent-2); font-size: 0.6875rem; flex-shrink: 0; }
    .step-text { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-sans); }
    .step-row.is-active .step-text { color: var(--text); }

    .scope-panel { margin-top: 24px; }
    .scope-line { font-size: 0.8125rem; color: var(--text-muted); margin-top: 8px; }
    .scope-chip { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.6875rem; margin-left: 4px; }
    .scope-chip.granted { border: 1px solid var(--accent-2-dim); color: var(--accent-2); }
    .scope-chip.requested { border: 1px solid var(--danger); color: var(--danger); }
    .scope-result { margin-top: 18px; display: flex; gap: 20px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 700; color: var(--danger); }

    .oidc-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .oidc-grid { grid-template-columns: 1fr 1fr; } }
    .oidc-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; text-align: center; }
    .oidc-title { font-size: 0.875rem; color: var(--accent-strong); }
    .oidc-sub { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class OAuthOidc {
  protected readonly roles = ROLES;
  protected readonly activeRole = signal('owner');
  protected readonly activeRoleDetail = computed(() => this.roles.find((r) => r.id === this.activeRole())?.detail ?? '');

  protected readonly flowSteps = FLOW_STEPS;
  protected readonly stepIndex = signal(-1);
  protected readonly playing = signal(false);

  async run(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    this.stepIndex.set(-1);
    for (let i = 0; i < this.flowSteps.length; i++) {
      this.stepIndex.set(i);
      await wait(400);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
