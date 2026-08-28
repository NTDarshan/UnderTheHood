import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role, checkAccess } from '../../engine/auth-simulator';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

@Component({
  selector: 'app-auth-vs-authz',
  standalone: true,
  imports: [FormsModule, TermTip],
  template: `
    <section class="lab-section" id="auth-vs-authz">
      <div class="container">
        <p class="lab-index">AUTH / 03 — AUTHENTICATION VS. AUTHORIZATION</p>
        <h2 class="lab-title">Two different questions, asked in sequence.</h2>

        <div class="compare-grid">
          <div class="compare-card">
            <p class="compare-title mono">AUTHENTICATION</p>
            <p class="compare-question">"Who are you?"</p>
            <ul>
              <li>Username + password</li>
              <li>Passkey</li>
              <li><app-term def="A second proof of identity beyond a password, e.g. a one-time code or hardware key.">MFA</app-term></li>
              <li>Session</li>
              <li>Access token</li>
              <li>Certificate</li>
            </ul>
          </div>
          <div class="compare-card">
            <p class="compare-title mono">AUTHORIZATION</p>
            <p class="compare-question">"What are you allowed to do?"</p>
            <ul>
              <li>Read</li>
              <li>Create</li>
              <li>Update</li>
              <li>Delete</li>
              <li>Approve</li>
              <li>Administer</li>
            </ul>
          </div>
        </div>

        <div class="lab-panel scenario">
          <p class="scenario-label mono">INTERACTIVE SCENARIO</p>
          <div class="scenario-controls">
            <div class="lab-field">
              <label for="role-select">Role</label>
              <select id="role-select" [ngModel]="role()" (ngModelChange)="role.set($event)">
                <option value="editor">Editor (read, create, update)</option>
                <option value="admin">Admin (read, create, update, delete)</option>
                <option value="viewer">Viewer (read only)</option>
              </select>
            </div>
          </div>

          <p class="scenario-request lab-code mono">DELETE /documents/123</p>

          <div class="scenario-steps">
            <p class="step">Authentication: <span class="ok">✓ Alice identified</span></p>
            <p class="step">
              Authorization:
              @if (result().authorized) {
                <span class="ok">✓ {{ role() }} permission includes delete</span>
              } @else {
                <span class="fail">✕ Alice does not have delete permission</span>
              }
            </p>
          </div>

          <p class="scenario-final mono" [class.is-ok]="result().authorized" [class.is-fail]="!result().authorized">
            {{ result().statusLabel }}
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .compare-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 800px) {
      .compare-grid { grid-template-columns: 1fr 1fr; }
    }

    .compare-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .compare-title { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--accent-2); }
    .compare-question { margin-top: 8px; font-size: 1.25rem; font-weight: 700; color: var(--text); }

    .compare-card ul { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .compare-card li {
      font-size: 0.875rem;
      color: var(--text-muted);
      padding-left: 16px;
      position: relative;
    }
    .compare-card li::before { content: '›'; position: absolute; left: 0; color: var(--accent-2); }

    .scenario { margin-top: 32px; }
    .scenario-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .scenario-controls { margin-top: 16px; max-width: 320px; }

    .scenario-request { margin-top: 20px; color: var(--accent); font-weight: 700; }

    .scenario-steps { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .step { font-size: 0.9375rem; color: var(--text-muted); }
    .ok { color: var(--accent-2); font-weight: 600; }
    .fail { color: var(--danger); font-weight: 600; }

    .scenario-final {
      margin-top: 18px;
      display: inline-block;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 0.8125rem;
      border: 1px solid var(--border-strong);
    }
    .scenario-final.is-ok { border-color: var(--accent-2); color: var(--accent-2); }
    .scenario-final.is-fail { border-color: var(--danger); color: var(--danger); }
  `,
})
export class AuthVsAuthz {
  protected readonly role = signal<Role>('editor');
  protected readonly result = computed(() => checkAccess({ name: 'Alice', role: this.role(), department: 'finance' }, 'delete'));
}
