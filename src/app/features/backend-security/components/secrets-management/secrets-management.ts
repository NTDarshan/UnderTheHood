import { Component, signal } from '@angular/core';

interface SecretKind {
  id: string;
  label: string;
  example: string;
}

interface Practice {
  id: string;
  label: string;
  detail: string;
}

const SECRET_KINDS: SecretKind[] = [
  { id: 'db', label: 'Database password', example: 'DB_PASSWORD' },
  { id: 'api', label: 'API key', example: 'PAYMENTS_API_KEY' },
  { id: 'signing', label: 'Signing secret', example: 'JWT_SIGNING_SECRET' },
  { id: 'cloud', label: 'Cloud credential', example: 'CLOUD_ACCESS_KEY' },
];

const IDENTITIES = ['Contractor', 'Ex-employee', 'CI bot', 'Anyone w/ repo clone'];

const PRACTICES: Practice[] = [
  {
    id: 'rotation',
    label: 'Rotation',
    detail: 'Regularly replacing secrets limits how long a leaked one stays useful.',
  },
  {
    id: 'least-priv',
    label: 'Least privilege',
    detail: 'A secret should only grant access to what is actually needed — see the next lab.',
  },
  {
    id: 'scanning',
    label: 'Secret scanning',
    detail: 'Automated tooling that catches secrets accidentally committed, before or after they reach a shared repository.',
  },
  {
    id: 'env-sep',
    label: 'Environment separation',
    detail: 'Development, staging, and production should use different secrets, so a leak in one environment does not compromise another.',
  },
];

type Path = 'bad' | 'good';

@Component({
  selector: 'app-secrets-management',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="secrets-management">
      <div class="container">
        <p class="lab-index">24 — SECRETS MANAGEMENT</p>
        <h2 class="lab-title">A secret is only safe if it never has to be typed into a file someone else can read.</h2>
        <p class="lab-lede">
          This application needs four kinds of secrets to run. How those secrets get from "exists" to "the app can
          use it" determines who else ends up able to see them.
        </p>

        <div class="secret-kinds" role="list">
          @for (k of secretKinds; track k.id) {
            <div class="kind-chip mono" role="listitem">{{ k.label }}</div>
          }
        </div>

        <div class="lab-btn-row" role="group" aria-label="Choose a path">
          <button
            type="button"
            class="lab-btn lab-btn-danger"
            [class.is-active]="path() === 'bad'"
            [attr.aria-pressed]="path() === 'bad'"
            (click)="path.set('bad')"
          >
            Path: hardcoded
          </button>
          <button
            type="button"
            class="lab-btn lab-btn-primary"
            [class.is-active]="path() === 'good'"
            [attr.aria-pressed]="path() === 'good'"
            (click)="path.set('good')"
          >
            Path: secret store
          </button>
        </div>

        <div class="lab-panel">
          @if (path() === 'bad') {
            <div class="flow-col">
              <p class="lab-node">SOURCE FILE — config.js</p>
              <pre class="lab-code"><code><span class="tok-dim">// fictional example — never do this</span>
<span class="tok-key">const</span> DB_PASSWORD = <span class="tok-status-err">"demo_hunter2_fake"</span>;
<span class="tok-key">const</span> PAYMENTS_API_KEY = <span class="tok-status-err">"sk_demo_00000000fake"</span>;</code></pre>

              <div class="flow-arrow-row">
                <span class="lab-flow-arrow">↓ committed to</span>
              </div>

              <div class="repo-box" [class.is-attack]="revealed()">
                <span class="mono repo-icon" aria-hidden="true">[repo]</span>
                <p class="lab-node">SOURCE CONTROL</p>
              </div>

              <div class="flow-arrow-row">
                <span class="lab-flow-arrow">↓ readable by</span>
              </div>

              <div class="identity-row">
                @for (id of identities; track id) {
                  <div class="identity-chip mono" [class.is-attack]="revealed()">{{ id }}</div>
                }
              </div>

              <button type="button" class="lab-btn lab-btn-danger" (click)="reveal()">
                {{ revealed() ? 'Everyone above can read the same value' : 'Reveal who can read it' }}
              </button>

              @if (revealed()) {
                <p class="lab-note lab-note-warn" role="status">
                  <strong>Deleting the secret from the latest commit does not remove it.</strong> The old commit
                  that introduced it typically still exists in repository history — anyone with clone access can
                  check it out.
                </p>
              }
            </div>
          } @else {
            <div class="flow-col">
              <div class="vault-box">
                <span class="mono vault-icon" aria-hidden="true">[vault]</span>
                <p class="lab-node">SECRET STORE</p>
                <p class="vault-caption mono">DB_PASSWORD = {{ activeSecret() }}</p>
              </div>

              <div class="flow-arrow-row">
                <span class="lab-flow-arrow">↓ injected at runtime</span>
              </div>

              <p class="lab-node">SOURCE FILE — config.js</p>
              <pre class="lab-code"><code><span class="tok-dim">// no literal value ever appears here</span>
<span class="tok-key">const</span> DB_PASSWORD = process.<span class="tok-status-ok">env</span>.DB_PASSWORD;</code></pre>

              <div class="flow-arrow-row">
                <span class="lab-flow-arrow">↓ picked up by</span>
              </div>

              <div class="app-box" [class.is-trust]="true">
                <p class="lab-node">RUNNING APPLICATION</p>
                <p class="app-caption mono">Received {{ activeSecret() }} as an environment variable at startup.</p>
              </div>

              <button type="button" class="lab-btn lab-btn-primary" (click)="rotate()">Rotate secret</button>
              @if (rotating()) {
                <p class="rotate-line mono" role="status">
                  <span class="old-secret">{{ previousSecret() }}</span>
                  <span class="lab-flow-arrow">→</span>
                  <span class="new-secret">{{ activeSecret() }}</span>
                  — application picked up the new value with zero code changes.
                </p>
              }
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Secrets should never be embedded in source code or committed to a repository — even a since-deleted
          commit typically remains in history.
        </p>

        <div class="practice-grid">
          @for (p of practices; track p.id) {
            <div class="practice-card">
              <p class="pill pill-yes">{{ p.label }}</p>
              <p class="practice-detail">{{ p.detail }}</p>
            </div>
          }
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

    .secret-kinds { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .kind-chip { font-size: 0.75rem; padding: 7px 12px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text-muted); background: var(--surface); }

    .flow-col { display: flex; flex-direction: column; align-items: stretch; gap: 4px; max-width: 480px; margin-inline: auto; }
    .flow-arrow-row { text-align: center; padding-block: 4px; }

    .repo-box, .vault-box, .app-box {
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface);
      padding: 16px;
      text-align: center;
      transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
    }
    .repo-box.is-attack { border-color: var(--attack); background: color-mix(in srgb, var(--attack) 12%, var(--surface)); box-shadow: 0 0 16px color-mix(in srgb, var(--attack) 30%, transparent); }
    .repo-icon, .vault-icon { font-size: 0.75rem; color: var(--text-faint); }
    .vault-box { border-color: var(--trust); }
    .vault-caption, .app-caption { margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); }
    .app-box.is-trust { border-color: var(--trust); }

    .identity-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-block: 8px 14px; }
    .identity-chip { font-size: 0.6875rem; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-faint); transition: border-color 0.25s ease, color 0.25s ease; }
    .identity-chip.is-attack { border-color: var(--attack); color: var(--attack); }

    .rotate-line { margin-top: 14px; text-align: center; font-size: 0.8125rem; color: var(--text-muted); }
    .old-secret { color: var(--text-faint); text-decoration: line-through; }
    .new-secret { color: var(--trust); font-weight: 600; }

    .practice-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .practice-grid { grid-template-columns: 1fr 1fr; } }
    .practice-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
    .practice-detail { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class SecretsManagement {
  protected readonly secretKinds = SECRET_KINDS;
  protected readonly identities = IDENTITIES;
  protected readonly practices = PRACTICES;

  protected readonly path = signal<Path>('bad');
  protected readonly revealed = signal(false);
  protected readonly rotating = signal(false);

  private readonly secretGenerations = ['s3cr3t_v1_fake', 's3cr3t_v2_fake', 's3cr3t_v3_fake'];
  private readonly genIndex = signal(0);

  protected readonly activeSecret = () => this.secretGenerations[this.genIndex() % this.secretGenerations.length];
  protected readonly previousSecret = () =>
    this.secretGenerations[
      (this.genIndex() - 1 + this.secretGenerations.length) % this.secretGenerations.length
    ];

  protected reveal(): void {
    this.revealed.set(true);
  }

  protected rotate(): void {
    this.genIndex.update((n) => n + 1);
    this.rotating.set(true);
  }
}
