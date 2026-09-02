import { Component, computed, signal } from '@angular/core';

type Role = 'user' | 'moderator' | 'admin';
type Permission = 'read' | 'create' | 'update' | 'delete' | 'manage_users';

const ROLES: { id: Role; label: string }[] = [
  { id: 'user', label: 'USER' },
  { id: 'moderator', label: 'MODERATOR' },
  { id: 'admin', label: 'ADMIN' },
];

const PERMISSIONS: { id: Permission; label: string }[] = [
  { id: 'read', label: 'READ' },
  { id: 'create', label: 'CREATE' },
  { id: 'update', label: 'UPDATE' },
  { id: 'delete', label: 'DELETE' },
  { id: 'manage_users', label: 'MANAGE USERS' },
];

const DEFAULT_MATRIX: Record<Role, Record<Permission, boolean>> = {
  user: { read: true, create: false, update: false, delete: false, manage_users: false },
  moderator: { read: true, create: true, update: true, delete: false, manage_users: false },
  admin: { read: true, create: true, update: true, delete: true, manage_users: true },
};

function cloneMatrix(): Record<Role, Record<Permission, boolean>> {
  return {
    user: { ...DEFAULT_MATRIX.user },
    moderator: { ...DEFAULT_MATRIX.moderator },
    admin: { ...DEFAULT_MATRIX.admin },
  };
}

@Component({
  selector: 'app-rbac-matrix',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="rbac-matrix">
      <div class="container">
        <p class="lab-index">15 — RBAC (ROLE-BASED ACCESS CONTROL)</p>
        <h2 class="lab-title">RBAC is just a table. Roles down the side, permissions across the top.</h2>
        <p class="lab-lede">
          Toggle the matrix to change what each role can do, then run a request through it and watch the exact
          lookup that decides allow or deny.
        </p>

        <div class="lab-panel">
          <p class="lab-node">PERMISSION MATRIX — CLICK A CELL TO TOGGLE</p>

          <div class="matrix-scroll">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="corner-cell"></th>
                  @for (p of permissions; track p.id) {
                    <th class="mono col-head">{{ p.label }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (r of roles; track r.id) {
                  <tr>
                    <th class="mono row-head" scope="row">{{ r.label }}</th>
                    @for (p of permissions; track p.id) {
                      <td class="cell-td">
                        <button
                          type="button"
                          class="cell-toggle"
                          [class.is-on]="matrix()[r.id][p.id]"
                          [attr.aria-pressed]="matrix()[r.id][p.id]"
                          [attr.aria-label]="r.label + ' — ' + p.label"
                          (click)="toggle(r.id, p.id)"
                        >
                          {{ matrix()[r.id][p.id] ? 'YES' : 'NO' }}
                        </button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="lab-node section-gap">TRY A REQUEST</p>

          <div class="try-row">
            <div class="lab-field">
              <label for="rbac-role-select">Role</label>
              <select id="rbac-role-select" [value]="tryRole()" (change)="setTryRole($event)">
                @for (r of roles; track r.id) {
                  <option [value]="r.id">{{ r.label }}</option>
                }
              </select>
            </div>
            <div class="lab-field">
              <label for="rbac-action-select">Action</label>
              <select id="rbac-action-select" [value]="tryPermission()" (change)="setTryPermission($event)">
                @for (p of permissions; track p.id) {
                  <option [value]="p.id">{{ p.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="result-box" [class.result-allow]="tryAllowed()" [class.result-deny]="!tryAllowed()">
            <span class="pill" [class.pill-yes]="tryAllowed()" [class.pill-no]="!tryAllowed()">
              {{ tryAllowed() ? 'ALLOW' : 'DENY' }}
            </span>
            <div class="result-body">
              <p class="lookup-line mono">Role → Permissions → Resource/action</p>
              <p class="lookup-line mono">
                {{ tryRoleLabel() }} has {{ tryPermissionLabel() }}? {{ tryAllowed() ? 'Yes → ALLOW' : 'No → DENY' }}
              </p>
            </div>
          </div>

          <p class="lab-note">
            RBAC is an authorization model — what can this role do — not an authentication mechanism. RBAC assumes
            identity is already established by the time this check runs.
          </p>
          <p class="lab-note lab-note-warn">
            RBAC alone doesn't answer "can THIS user access THIS specific object" — e.g. can user_482 read invoice
            #91, not just "can a user read invoices." That's a distinct problem, covered next: BOLA / IDOR.
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

    .matrix-scroll {
      margin-top: 16px;
      overflow-x: auto;
    }

    .matrix-table {
      border-collapse: collapse;
      width: 100%;
      min-width: 560px;
    }

    .corner-cell { border: none; }

    .col-head,
    .row-head {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--text-faint);
      text-align: center;
      padding: 8px 6px;
    }

    .row-head {
      text-align: left;
      color: var(--text);
      padding-right: 14px;
      white-space: nowrap;
    }

    .cell-td {
      padding: 5px;
      text-align: center;
    }

    .cell-toggle {
      width: 100%;
      min-width: 64px;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 9px 6px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    }

    .cell-toggle:hover {
      border-color: var(--text-muted);
    }

    .cell-toggle.is-on {
      border-color: var(--trust);
      color: var(--trust);
      background: color-mix(in srgb, var(--trust) 12%, var(--surface));
    }

    .section-gap { margin-top: 32px; }

    .try-row {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
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

    .result-body { display: flex; flex-direction: column; gap: 4px; }

    .lookup-line {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `,
})
export class RbacMatrix {
  protected readonly roles = ROLES;
  protected readonly permissions = PERMISSIONS;

  protected readonly matrix = signal(cloneMatrix());

  protected readonly tryRole = signal<Role>('moderator');
  protected readonly tryPermission = signal<Permission>('update');

  protected readonly tryAllowed = computed(() => this.matrix()[this.tryRole()][this.tryPermission()]);
  protected readonly tryRoleLabel = computed(() => ROLES.find((r) => r.id === this.tryRole())!.label);
  protected readonly tryPermissionLabel = computed(
    () => PERMISSIONS.find((p) => p.id === this.tryPermission())!.label,
  );

  toggle(role: Role, permission: Permission): void {
    this.matrix.update((m) => ({
      ...m,
      [role]: { ...m[role], [permission]: !m[role][permission] },
    }));
  }

  setTryRole(ev: Event): void {
    this.tryRole.set((ev.target as HTMLSelectElement).value as Role);
  }

  setTryPermission(ev: Event): void {
    this.tryPermission.set((ev.target as HTMLSelectElement).value as Permission);
  }
}
