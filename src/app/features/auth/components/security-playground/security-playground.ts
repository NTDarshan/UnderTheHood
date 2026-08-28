import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthMethod, Permission, Role, checkAccess } from '../../engine/auth-simulator';

@Component({
  selector: 'app-security-playground',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="security-playground">
      <div class="container">
        <p class="lab-index">AUTH / 50 — SECURITY PLAYGROUND</p>
        <h2 class="lab-title">Every control here actually changes the outcome. Break it.</h2>

        <div class="lab-panel playground-panel">
          <div class="pg-controls">
            <div class="lab-field">
              <label for="pg-method">Authentication method</label>
              <select id="pg-method" [ngModel]="method()" (ngModelChange)="method.set($event)">
                <option value="session">Session</option>
                <option value="jwt">JWT</option>
                <option value="api-key">API Key</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="pg-identity">Identity present</label>
              <select id="pg-identity" [ngModel]="hasIdentity()" (ngModelChange)="hasIdentity.set($event)">
                <option [ngValue]="true">Alice (valid)</option>
                <option [ngValue]="false">None</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="pg-role">Role</label>
              <select id="pg-role" [ngModel]="role()" (ngModelChange)="role.set($event)" [disabled]="!hasIdentity()">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="pg-action">Requested action</label>
              <select id="pg-action" [ngModel]="action()" (ngModelChange)="action.set($event)">
                <option value="read">Read</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="pg-owner">Resource owner</label>
              <select id="pg-owner" [ngModel]="resourceOwner()" (ngModelChange)="resourceOwner.set($event)">
                <option value="Alice">Alice (self)</option>
                <option value="Someone Else">Someone else</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="pg-expired">Token expiration</label>
              <select id="pg-expired" [ngModel]="expired()" (ngModelChange)="expired.set($event)">
                <option [ngValue]="false">Not expired</option>
                <option [ngValue]="true">Expired</option>
              </select>
            </div>
          </div>

          <div class="pg-output">
            <div class="pg-line">
              <span class="pg-key mono">AUTHENTICATION</span>
              <span class="pg-value" [class.is-ok]="result().authenticated" [class.is-fail]="!result().authenticated">
                {{ result().authenticated ? '✓' : '✕' }}
              </span>
            </div>
            <div class="pg-line">
              <span class="pg-key mono">AUTHORIZATION</span>
              <span class="pg-value" [class.is-ok]="result().authorized" [class.is-fail]="!result().authorized">
                {{ result().authorized ? '✓' : '✕' }}
              </span>
            </div>
            <div class="pg-line pg-final">
              <span class="pg-key mono">RESULT</span>
              <span class="pg-value" [class.is-ok]="result().authorized" [class.is-fail]="!result().authorized">{{ result().statusLabel }}</span>
            </div>
          </div>
          <p class="pg-reason">{{ result().reason }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .playground-panel { margin-top: 24px; }
    .pg-controls { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .pg-controls { grid-template-columns: repeat(3, 1fr); } }

    .pg-output { margin-top: 28px; display: flex; flex-direction: column; gap: 8px; padding-top: 20px; border-top: 1px solid var(--border); }
    .pg-line { display: flex; justify-content: space-between; align-items: center; }
    .pg-key { font-size: 0.75rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .pg-value { font-size: 0.9375rem; font-weight: 700; }
    .pg-value.is-ok { color: var(--accent-2); }
    .pg-value.is-fail { color: var(--danger); }
    .pg-final .pg-value { font-size: 1.0625rem; }

    .pg-reason { margin-top: 14px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class SecurityPlayground {
  protected readonly method = signal<AuthMethod>('session');
  protected readonly hasIdentity = signal(true);
  protected readonly role = signal<Role>('viewer');
  protected readonly action = signal<Permission>('delete');
  protected readonly resourceOwner = signal('Alice');
  protected readonly expired = signal(false);

  protected readonly result = computed(() => {
    if (this.expired() && this.hasIdentity()) {
      return {
        authenticated: false,
        authorized: false,
        status: 401 as const,
        statusLabel: '401 Unauthorized',
        reason: `The ${this.method()} credential has expired — the server no longer treats it as a valid identity.`,
      };
    }
    return checkAccess(
      this.hasIdentity() ? { name: 'Alice', role: this.role(), department: 'finance' } : null,
      this.action(),
      { owner: this.resourceOwner(), department: 'finance' },
    );
  });
}
