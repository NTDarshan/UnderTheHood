import { Component, computed, signal } from '@angular/core';

type Role = 'user' | 'moderator' | 'admin';
type Action = 'read' | 'write' | 'delete' | 'manage_users';

interface ActionDef {
  id: Action;
  label: string;
}

const ACTIONS: ActionDef[] = [
  { id: 'read', label: 'READ' },
  { id: 'write', label: 'WRITE' },
  { id: 'delete', label: 'DELETE' },
  { id: 'manage_users', label: 'MANAGE USERS' },
];

const ROLES: { id: Role; label: string }[] = [
  { id: 'user', label: 'USER' },
  { id: 'moderator', label: 'MODERATOR' },
  { id: 'admin', label: 'ADMIN' },
];

const PERMISSIONS: Record<Role, Action[]> = {
  user: ['read'],
  moderator: ['read', 'write'],
  admin: ['read', 'write', 'delete', 'manage_users'],
};

@Component({
  selector: 'app-authorization-basics',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="authorization-basics">
      <div class="container">
        <p class="lab-index">14 — AUTHORIZATION</p>
        <h2 class="lab-title">Logging in answers one question. It doesn't answer the second one.</h2>
        <p class="lab-lede">
          Authentication and authorization are two separate gates, checked separately — and confusing them is where
          a lot of real vulnerabilities start.
        </p>

        <div class="lab-panel">
          <div class="pipeline">
            <div class="pipe-stage">
              <span class="pill pill-yes">STAGE 1</span>
              <p class="stage-q">"Who are you?"</p>
              <p class="stage-name auth-color">AUTHENTICATION</p>
              <p class="stage-desc">Verifies identity — a password, a token, a session.</p>
            </div>
            <span class="lab-flow-arrow pipe-arrow">→</span>
            <div class="pipe-stage">
              <span class="pill pill-conditional">STAGE 2</span>
              <p class="stage-q">"What can you access?"</p>
              <p class="stage-name authz-color">AUTHORIZATION</p>
              <p class="stage-desc">Checks permissions — for every sensitive action, not just once.</p>
            </div>
          </div>

          <p class="lab-node section-gap">TRY IT — PICK A ROLE, THEN ATTEMPT AN ACTION</p>

          <div class="lab-btn-row" role="group" aria-label="Select role">
            @for (r of roles; track r.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="role() === r.id"
                [attr.aria-pressed]="role() === r.id"
                (click)="setRole(r.id)"
              >{{ r.label }}</button>
            }
          </div>

          <div class="action-grid">
            @for (a of actions; track a.id) {
              <button
                type="button"
                class="action-cell"
                [class.is-allowed]="isAllowed(a.id)"
                [class.is-denied]="lastAttempt()?.action === a.id && !isAllowed(a.id)"
                (click)="attempt(a.id)"
              >
                <span class="action-label mono">{{ a.label }}</span>
                <span class="action-status mono">{{ isAllowed(a.id) ? 'ALLOWED FOR ' + roleLabel() : 'NOT ALLOWED' }}</span>
              </button>
            }
          </div>

          @if (lastAttempt(); as attempt) {
            <div class="result-box" [class.result-allow]="attempt.allowed" [class.result-deny]="!attempt.allowed">
              <span class="pill" [class.pill-yes]="attempt.allowed" [class.pill-no]="!attempt.allowed">
                {{ attempt.allowed ? 'ALLOW' : 'DENY' }}
              </span>
              <p class="result-text">
                {{ roleLabel() }} attempted <strong>{{ actionLabel(attempt.action) }}</strong> —
                {{ attempt.allowed
                  ? roleLabel() + ' is permitted to perform this action.'
                  : roleLabel() + ' does not have permission to perform this action.' }}
              </p>
            </div>
          }

          <p class="lab-note">
            Authentication does not imply authorization. Being logged in only establishes identity — a separate
            check decides what that identity may do, and that check must run on every sensitive action, not just
            once at login.
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

    .pipeline {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .pipe-stage {
      flex: 1 1 220px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .pipe-arrow { font-size: 1.5rem; color: var(--text-faint); }

    .stage-q {
      margin-top: 12px;
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--text);
    }

    .stage-name {
      margin-top: 6px;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .auth-color { color: var(--c-client); }
    .authz-color { color: var(--suspicious); }

    .stage-desc {
      margin-top: 8px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .section-gap { margin-top: 32px; }

    .action-grid {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .action-cell {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
      padding: 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-muted);
      transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    }

    .action-cell:hover {
      border-color: var(--text-faint);
    }

    .action-cell.is-allowed {
      border-color: var(--trust);
      color: var(--trust);
      background: color-mix(in srgb, var(--trust) 10%, var(--surface));
    }

    .action-cell.is-denied {
      border-color: var(--attack);
      color: var(--attack);
      background: color-mix(in srgb, var(--attack) 10%, var(--surface));
    }

    .action-label {
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .action-status {
      font-size: 0.6875rem;
      opacity: 0.85;
    }

    .result-box {
      margin-top: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
    }

    .result-allow { border-color: var(--trust); }
    .result-deny { border-color: var(--attack); }

    .result-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .result-text strong { color: var(--text); }
  `,
})
export class AuthorizationBasics {
  protected readonly roles = ROLES;
  protected readonly actions = ACTIONS;

  protected readonly role = signal<Role>('user');
  protected readonly lastAttempt = signal<{ action: Action; allowed: boolean } | null>(null);

  protected readonly roleLabel = computed(() => ROLES.find((r) => r.id === this.role())!.label);

  isAllowed(action: Action): boolean {
    return PERMISSIONS[this.role()].includes(action);
  }

  actionLabel(action: Action): string {
    return ACTIONS.find((a) => a.id === action)!.label;
  }

  setRole(role: Role): void {
    this.role.set(role);
    this.lastAttempt.set(null);
  }

  attempt(action: Action): void {
    this.lastAttempt.set({ action, allowed: this.isAllowed(action) });
  }
}
