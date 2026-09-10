import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-secrets-management',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-secrets-management">
      <div class="container">
        <p class="lab-index mono">05 — SECRETS MANAGEMENT</p>
        <h2 class="lab-title">A secret that lives in source code is no longer a secret.</h2>
        <p class="lab-lede">
          Backend services talk to databases and cloud providers using credentials. Where those credentials live
          determines whether a leaked repository is a non-event or an incident.
        </p>

        <div class="lab-panel">
          <div class="topology">
            <div class="node node-backend">
              <span class="node-label mono">BACKEND</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-db">
              <span class="node-label mono">DATABASE</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-cloud">
              <span class="node-label mono">CLOUD</span>
            </div>
          </div>
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">The bad practice</h3>
          <p class="lab-note">A commit diff from a real-looking codebase — a hardcoded credential, checked into git.</p>
          <div class="diff-code mono">
            <div class="diff-line diff-context">  class DatabaseConfig {{ '{' }}</div>
            <div class="diff-line diff-context">    host = "prod-db.internal";</div>
            <div class="diff-line diff-added diff-bad">
              <span class="diff-marker">+</span>DATABASE_PASSWORD="hunter2"<span class="warn-icon" aria-hidden="true">&#9888;</span>
            </div>
            <div class="diff-line diff-context">    port = 5432;</div>
            <div class="diff-line diff-context">  {{ '}' }}</div>
          </div>
          <p class="lab-note lab-note-warn">
            Once this line is committed, the secret lives in every clone, every fork, and every CI log that checks
            out the branch — even if the line is deleted in a later commit, it stays in git history. The same risk
            applies to secrets baked into a Docker image layer, or shipped in frontend/client-side code where any
            user can read it.
          </p>
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">The fix, in three steps</h3>
          <div class="steps-tabs">
            <button type="button" class="lab-btn" [class.is-active]="step() === 1" (click)="step.set(1)">
              1. ENVIRONMENT VARIABLES
            </button>
            <button type="button" class="lab-btn" [class.is-active]="step() === 2" (click)="step.set(2)">
              2. SECRET STORES
            </button>
            <button type="button" class="lab-btn" [class.is-active]="step() === 3" (click)="step.set(3)">
              3. MANAGED / WORKLOAD IDENTITY
            </button>
          </div>

          @switch (step()) {
            @case (1) {
              <p class="step-desc">
                Move the value out of source and into an environment variable injected at runtime. Better than a
                hardcoded string — but env vars alone are still a static secret sitting in process memory, shell
                history, or a <span class="mono">.env</span> file that can itself get committed by mistake.
              </p>
            }
            @case (2) {
              <p class="step-desc">
                A dedicated secret store (like Vault, AWS Secrets Manager, or Azure Key Vault) holds the value
                encrypted, versioned, and access-controlled. The application fetches it at startup instead of reading
                it from its own configuration — this is the production-grade pattern, not environment variables
                alone.
              </p>
            }
            @case (3) {
              <p class="step-desc">
                The strongest pattern removes the long-lived secret entirely: the workload authenticates using an
                identity the cloud platform already trusts (a managed identity, IAM role, or service account), and
                the secret store hands it short-lived credentials on demand.
              </p>
            }
          }

          <div class="fix-diagram">
            <div class="fix-code mono">
              <div class="diff-line diff-context">  class DatabaseConfig {{ '{' }}</div>
              <div class="diff-line diff-context">    host = "prod-db.internal";</div>
              <div class="diff-line diff-good">DATABASE_PASSWORD=&dollar;{{ '{' }}DATABASE_PASSWORD{{ '}' }}</div>
              <div class="diff-line diff-context">    port = 5432;</div>
              <div class="diff-line diff-context">  {{ '}' }}</div>
            </div>
            <span class="fix-arrow" aria-hidden="true">&larr;</span>
            <div class="secret-store-box">
              <span class="store-label mono">SECRET STORE</span>
              <span class="store-sub mono">{{ storeLabel() }}</span>
            </div>
          </div>

          <p class="assertion mono">CODE does not contain SECRET.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #fbbf24;
    }

    .panel-heading { margin: 0 0 8px; font-size: 1.0625rem; color: var(--text); }

    .topology { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
    .node {
      flex: 1;
      min-width: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .node-label { font-size: 0.8125rem; color: var(--text); letter-spacing: 0.06em; font-weight: 700; }
    .node-db { border-color: color-mix(in srgb, var(--do-cyan) 35%, var(--border)); }
    .node-cloud { border-color: color-mix(in srgb, var(--do-violet) 35%, var(--border)); }

    .diff-code, .fix-code {
      margin-top: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      font-size: 0.8125rem;
      line-height: 1.8;
      overflow-x: auto;
    }
    .diff-line { white-space: pre; color: var(--text-muted); }
    .diff-context { color: var(--text-faint); }
    .diff-added { color: var(--text); }
    .diff-marker { color: var(--do-success); margin-right: 4px; }
    .diff-bad {
      background: color-mix(in srgb, var(--do-danger) 16%, transparent);
      border-left: 2px solid var(--do-danger);
      padding-left: 8px;
      color: var(--do-danger);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .warn-icon { color: var(--do-danger); }
    .diff-good {
      background: color-mix(in srgb, var(--do-success) 14%, transparent);
      border-left: 2px solid var(--do-success);
      padding-left: 8px;
      color: var(--do-success);
    }

    .steps-tabs { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px; }
    .step-desc { margin-top: 18px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; max-width: 660px; }

    .fix-diagram { margin-top: 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .fix-code { margin-top: 0; flex: 1; min-width: 260px; }
    .fix-arrow { color: var(--do-cyan); font-size: 1.25rem; }
    .secret-store-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 20px;
      background: var(--surface);
      border: 1px solid var(--do-cyan);
      border-radius: var(--radius-md);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-cyan) 20%, transparent);
    }
    .store-label { font-size: 0.75rem; font-weight: 700; color: var(--do-cyan); letter-spacing: 0.06em; }
    .store-sub { font-size: 0.6875rem; color: var(--text-faint); }

    .assertion {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--do-success);
      letter-spacing: 0.03em;
    }
  `,
})
export class SecretsManagement {
  protected readonly step = signal<1 | 2 | 3>(1);

  protected storeLabel(): string {
    switch (this.step()) {
      case 1:
        return 'value read from process env at boot';
      case 2:
        return 'encrypted, versioned, access-controlled';
      case 3:
        return 'short-lived credential via trusted identity';
    }
  }
}
