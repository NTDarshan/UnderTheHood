import { Component, signal } from '@angular/core';

type Role = 'user' | 'admin';

type TreeNodeKey = 'authn' | 'function' | 'object' | 'field';

interface TreeNode {
  key: TreeNodeKey;
  question: string;
  layer: string;
  example: string;
}

const TREE_NODES: TreeNode[] = [
  {
    key: 'authn',
    question: 'Is the user authenticated?',
    layer: 'Identity',
    example: 'A request with no valid session or token is rejected before anything else is even considered.',
  },
  {
    key: 'function',
    question: 'Does the user have the required role/permission? (function-level)',
    layer: 'Function-level authorization',
    example: 'A regular user calling POST /admin/users/delete directly — the UI never links to it, but the route itself must still refuse them.',
  },
  {
    key: 'object',
    question: 'Does the user own or have rights to this specific object? (object-level)',
    layer: 'Object-level authorization',
    example: 'A regular user can legitimately call GET /orders/{id} — but only for an id that is actually theirs. See lab 16.',
  },
  {
    key: 'field',
    question: 'Is this specific field/action allowed for this user? (field-level)',
    layer: 'Field/property-level authorization',
    example: "A user editing their own profile can update 'displayName', but 'isAdmin' and other users' 'internalNotes' must stay blocked even though the record itself is theirs.",
  },
];

@Component({
  selector: 'app-authorization-vulnerabilities',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="authorization-vulnerabilities">
      <div class="container">
        <p class="lab-index">17 — AUTHORIZATION VULNERABILITIES, EXPANDED</p>
        <h2 class="lab-title">Authorization isn't one check. It's a stack of them.</h2>
        <p class="lab-lede">
          Object-level checks (lab 16) are one layer of a bigger picture. A request can pass every earlier layer
          and still be denied at a later one — function, object, and field authorization each ask a different
          question.
        </p>

        <!-- FUNCTION-LEVEL -->
        <div class="lab-panel">
          <p class="lab-node">LAYER 1 — FUNCTION-LEVEL AUTHORIZATION</p>
          <p class="layer-desc">
            Can this user call this endpoint or route at all, regardless of which object it touches? Hiding a
            link in the UI is not a security control — the route itself has to check.
          </p>

          <div class="lab-btn-row" role="group" aria-label="Choose calling user's role">
            <button type="button" class="lab-btn" [class.is-active]="role() === 'user'" (click)="role.set('user')">
              LOGGED IN AS: REGULAR USER
            </button>
            <button type="button" class="lab-btn" [class.is-active]="role() === 'admin'" (click)="role.set('admin')">
              LOGGED IN AS: ADMIN
            </button>
          </div>

          <div class="endpoint-row">
            <span class="mono endpoint-path">POST /admin/users/{{ '{' }}id{{ '}' }}/delete</span>
            <span class="mono note-ui">(no link to this exists anywhere in the UI for a regular user)</span>
          </div>

          <div class="verdict-row" [class.is-allow]="role() === 'admin'" [class.is-deny]="role() === 'user'">
            <span class="gate-icon-sm" [class.gt-trust]="role() === 'admin'" [class.gt-attack]="role() === 'user'">
              {{ role() === 'admin' ? '✓' : '✗' }}
            </span>
            <span class="pill" [class.pill-yes]="role() === 'admin'" [class.pill-no]="role() === 'user'">
              {{ role() === 'admin' ? '200 OK — action performed' : '403 FORBIDDEN' }}
            </span>
            <span class="verdict-note mono">
              {{ role() === 'admin' ? 'admin role required, and present' : 'regular users are denied even if they discover and call this URL directly' }}
            </span>
          </div>
        </div>

        <!-- OBJECT-LEVEL RECAP -->
        <div class="lab-panel">
          <p class="lab-node">LAYER 2 — OBJECT-LEVEL AUTHORIZATION (RECAP)</p>
          <p class="layer-desc">
            The user is allowed to call this endpoint in general — but is <em>this specific resource</em> theirs?
            Passing layer 1 says nothing about layer 2.
          </p>
          <div class="recap-row">
            <span class="mono">GET /orders/456</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="pill pill-yes">user CAN call this route</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="pill pill-conditional">but is order 456 THEIRS?</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="mono text-faint">see lab 16 — BOLA / IDOR for the full walkthrough</span>
          </div>
        </div>

        <!-- FIELD-LEVEL -->
        <div class="lab-panel">
          <p class="lab-node">LAYER 3 — FIELD/PROPERTY-LEVEL AUTHORIZATION</p>
          <p class="layer-desc">
            The user owns this exact record — but should every field on it be visible or editable to them?
            Ownership of the record is not permission to touch every property on it.
          </p>

          <div class="profile-record">
            <p class="mono record-title">GET/PATCH /users/me/profile — record owned by the requesting user</p>
            <div class="field-grid">
              <div class="field-row">
                <span class="mono field-name">displayName</span>
                <span class="field-value">Diego Ruiz</span>
                <span class="pill pill-yes">view + edit</span>
              </div>
              <div class="field-row">
                <span class="mono field-name">email</span>
                <span class="field-value">diego&#64;example.com</span>
                <span class="pill pill-yes">view + edit</span>
              </div>
              <div class="field-row is-blocked">
                <span class="mono field-name">isAdmin</span>
                <span class="field-value">false</span>
                <span class="pill blocked-pill">BLOCKED — even for the owner</span>
              </div>
              <div class="field-row is-blocked">
                <span class="mono field-name">internalNotes</span>
                <span class="field-value">(support-team notes about this user)</span>
                <span class="pill blocked-pill">BLOCKED — even for the owner</span>
              </div>
            </div>
          </div>
          <p class="lab-note">
            A user editing their own profile is exactly the case where object-level authorization already says
            <strong>yes</strong> — this is their record. Field-level authorization is the separate check that still
            says no to specific properties: a client sending <code class="mono">{{ '{' }} "isAdmin": true {{ '}' }}</code>
            in a PATCH body must be rejected on that field, not silently accepted because the object check passed.
          </p>
        </div>

        <!-- DECISION TREE -->
        <div class="lab-panel">
          <p class="lab-node">THE FULL DECISION PATH</p>
          <p class="layer-desc">Click each question to see the concrete example tied to that layer.</p>

          <div class="tree">
            @for (node of nodes; track node.key; let last = $last) {
              <button
                type="button"
                class="tree-node"
                [class.is-active]="activeNode() === node.key"
                (click)="toggleNode(node.key)"
                [attr.aria-expanded]="activeNode() === node.key"
              >
                <span class="tree-q mono">{{ node.question }}</span>
                <span class="tree-branches">
                  <span class="pill pill-no">NO &rarr; deny</span>
                  <span class="pill pill-yes">YES &rarr; next check</span>
                </span>
              </button>
              @if (activeNode() === node.key) {
                <div class="tree-example">
                  <span class="lab-node tree-example-tag">{{ node.layer }}</span>
                  <p>{{ node.example }}</p>
                </div>
              }
              @if (!last) {
                <div class="tree-arrow mono">&darr;</div>
              }
            }
            <div class="tree-arrow mono">&darr;</div>
            <div class="tree-allow">
              <span class="pill pill-yes">ALLOW</span>
              <span class="mono">— every layer passed for this exact user, route, object, and field</span>
            </div>
          </div>
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

    .layer-desc { margin-top: 10px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .endpoint-row { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; }
    .endpoint-path { font-size: 0.9375rem; color: var(--text); }
    .note-ui { font-size: 0.75rem; color: var(--text-faint); }

    .verdict-row { margin-top: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .verdict-row.is-allow { border-color: var(--trust); }
    .verdict-row.is-deny { border-color: var(--attack); }
    .verdict-note { font-size: 0.75rem; color: var(--text-muted); }

    .gate-icon-sm {
      width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
      font-weight: 900; border: 2px solid var(--border-strong); color: var(--text-faint); flex-shrink: 0;
    }
    .gate-icon-sm.gt-trust { color: var(--trust); border-color: var(--trust); }
    .gate-icon-sm.gt-attack { color: var(--attack); border-color: var(--attack); }

    .recap-row { margin-top: 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 0.875rem; }
    .text-faint { color: var(--text-faint); }

    .record-title { color: var(--text-muted); font-size: 0.75rem; }
    .field-grid { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
    .field-row {
      display: grid; grid-template-columns: 160px 1fr auto; gap: 12px; align-items: center;
      padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface);
    }
    .field-row.is-blocked { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 8%, var(--surface)); }
    .field-name { color: var(--text); font-size: 0.8125rem; }
    .field-value { color: var(--text-muted); font-size: 0.8125rem; }
    .blocked-pill { color: var(--blocked); border-color: var(--blocked); }

    .tree { display: flex; flex-direction: column; align-items: stretch; gap: 0; margin-top: 18px; }
    .tree-node {
      text-align: left; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
      padding: 14px 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md);
      color: var(--text); transition: border-color 0.15s ease;
    }
    .tree-node:hover { border-color: var(--c-client); }
    .tree-node.is-active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .tree-q { font-size: 0.8125rem; }
    .tree-branches { display: flex; gap: 8px; }
    .tree-example { margin: 8px 0 0; padding: 12px 16px; background: color-mix(in srgb, var(--accent) 8%, var(--surface)); border-left: 2px solid var(--accent); border-radius: var(--radius-sm); font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
    .tree-example-tag { display: block; margin-bottom: 6px; color: var(--accent-2); }
    .tree-arrow { text-align: center; color: var(--text-faint); padding: 4px 0; }
    .tree-allow { margin-top: 4px; padding: 14px 16px; border: 1px solid var(--trust); border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px; background: color-mix(in srgb, var(--trust) 8%, var(--surface)); font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class AuthorizationVulnerabilities {
  protected readonly nodes = TREE_NODES;
  protected readonly role = signal<Role>('user');
  protected readonly activeNode = signal<TreeNodeKey | null>(null);

  toggleNode(key: TreeNodeKey): void {
    this.activeNode.update((cur) => (cur === key ? null : key));
  }
}
