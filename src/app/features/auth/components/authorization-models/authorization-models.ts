import { Component, signal } from '@angular/core';
import { Permission, ROLE_PERMISSIONS, Role } from '../../engine/auth-simulator';

const ROLES: Role[] = ['viewer', 'editor', 'admin'];
const PERMISSIONS: Permission[] = ['read', 'create', 'update', 'delete'];

@Component({
  selector: 'app-authorization-models',
  standalone: true,
  template: `
    <section class="lab-section" id="rbac">
      <div class="container">
        <p class="lab-index">AUTH / 32 — RBAC</p>
        <h2 class="lab-title">Role-Based Access Control: permissions attached to a role.</h2>

        <div class="matrix lab-panel">
          <div class="matrix-row matrix-head mono">
            <span></span>
            @for (p of permissions; track p) { <span>{{ p }}</span> }
          </div>
          @for (r of roles; track r) {
            <div class="matrix-row" [class.is-hovered]="hovered() === r">
              <span class="matrix-role mono" (mouseenter)="hovered.set(r)" (mouseleave)="hovered.set(null)">{{ r }}</span>
              @for (p of permissions; track p) {
                <span class="matrix-cell" [class.is-yes]="has(r, p)">{{ has(r, p) ? '✓' : '✕' }}</span>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="beyond-roles">
      <div class="container">
        <p class="lab-index">AUTH / 33 — AUTHORIZATION IS NOT JUST ROLES</p>
        <h2 class="lab-title">Alice is an Editor. Can she edit Document #123?</h2>

        <p class="lab-lede">A role alone often can't answer that — other factors matter:</p>
        <div class="factor-chips">
          @for (f of otherFactors; track f) { <span class="factor-chip mono">{{ f }}</span> }
        </div>
        <p class="lab-note">This gap is exactly what richer authorization models like ABAC and policy-based authorization exist to close.</p>
      </div>
    </section>

    <section class="lab-section" id="abac">
      <div class="container">
        <p class="lab-index">AUTH / 34 — ABAC</p>
        <h2 class="lab-title">Attribute-Based Access Control: the decision considers context.</h2>

        <div class="abac-diagram mono">
          <span>User</span><span class="plus">+</span><span>Resource</span><span class="plus">+</span><span>Action</span><span class="plus">+</span><span>Context</span>
          <div class="abac-arrow">↓</div>
          <span class="abac-policy">Policy</span>
          <div class="abac-arrow">↓</div>
          <span class="abac-decision">ALLOW / DENY</span>
        </div>

        <div class="lab-panel abac-example">
          <p class="example-line mono">user.department = Finance</p>
          <p class="example-line mono">resource.department = Finance</p>
          <p class="example-line mono">action = Read</p>
          <p class="example-policy">Policy: "Finance users can read Finance documents."</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="policy-based">
      <div class="container">
        <p class="lab-index">AUTH / 35 — POLICY-BASED AUTHORIZATION</p>
        <h2 class="lab-title">Claims describe the identity. Policy decides the outcome.</h2>

        <div class="flow-chain mono">
          <span>Request</span><span class="arrow">↓</span>
          <span>Authentication</span><span class="arrow">↓</span>
          <span>Claims / Attributes</span><span class="arrow">↓</span>
          <span>Policy</span><span class="arrow">↓</span>
          <span>Authorization Decision</span><span class="arrow">↓</span>
          <span>Allow / Deny</span>
        </div>
        <p class="lab-note">Authentication supplies identity-related information; authorization policies consume it to decide access.</p>
      </div>
    </section>
  `,
  styles: `
    .matrix { margin-top: 28px; overflow-x: auto; }
    .matrix-row { display: grid; grid-template-columns: 100px repeat(4, 1fr); gap: 8px; align-items: center; padding: 8px 0; }
    .matrix-row.matrix-head span { color: var(--text-faint); font-size: 0.6875rem; text-transform: uppercase; }
    .matrix-row + .matrix-row { border-top: 1px solid var(--border); }
    .matrix-role { color: var(--accent-2); font-size: 0.8125rem; cursor: default; }
    .matrix-cell { text-align: center; font-family: var(--font-mono); font-size: 0.875rem; color: var(--text-faint); }
    .matrix-cell.is-yes { color: var(--accent-2); font-weight: 700; }
    .matrix-row.is-hovered { background: var(--surface); }

    .factor-chips { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px; }
    .factor-chip { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); font-size: 0.8125rem; }

    .abac-diagram { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
    .abac-diagram > span:not(.abac-policy):not(.abac-decision) { display: inline; }
    .plus { color: var(--text-faint); margin: 0 6px; }
    .abac-arrow { color: var(--text-faint); font-size: 0.75rem; }
    .abac-policy, .abac-decision { padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); }
    .abac-decision { color: var(--accent-strong); border-color: var(--accent-dim); }

    .abac-example { margin-top: 20px; }
    .example-line { font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px; }
    .example-policy { margin-top: 12px; font-size: 0.9375rem; color: var(--accent-2); font-weight: 600; }

    .flow-chain { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }
  `,
})
export class AuthorizationModels {
  protected readonly roles = ROLES;
  protected readonly permissions = PERMISSIONS;
  protected readonly hovered = signal<Role | null>(null);

  protected readonly otherFactors = ['Ownership', 'Department', 'Resource state', 'Location', 'Time', 'Classification'];

  has(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  }
}
