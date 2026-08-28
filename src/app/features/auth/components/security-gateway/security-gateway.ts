import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permission, Role, checkAccess } from '../../engine/auth-simulator';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-security-gateway',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="gateway">
      <div class="container">
        <p class="lab-index">AUTH / 02 — THE SECURITY GATEWAY</p>
        <h2 class="lab-title">Think of the API as a building with two doors.</h2>
        <p class="lab-lede">
          Change the identity, role, permission and requested action below, then watch the request
          pass through both gates before it can ever reach the resource.
        </p>

        <div class="gateway-layout lab-panel">
          <div class="gateway-controls">
            <div class="lab-field">
              <label for="gw-identity">Identity</label>
              <select id="gw-identity" [ngModel]="loggedIn()" (ngModelChange)="loggedIn.set($event)">
                <option [ngValue]="true">Authenticated (Alice)</option>
                <option [ngValue]="false">No valid identity</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="gw-role">Role</label>
              <select id="gw-role" [ngModel]="role()" (ngModelChange)="role.set($event)" [disabled]="!loggedIn()">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="gw-action">Requested action</label>
              <select id="gw-action" [ngModel]="action()" (ngModelChange)="action.set($event)">
                <option value="read">Read</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
          </div>

          <div class="gateway-building mono">
            <p class="building-label">SECURE API</p>
            <div class="gate" [class.is-pass]="result().authenticated" [class.is-fail]="!result().authenticated">
              <p class="gate-title">AUTH GATE</p>
              <p class="gate-sub">WHO ARE YOU?</p>
              <p class="gate-verdict">{{ result().authenticated ? '✓ IDENTIFIED' : '✕ NO IDENTITY' }}</p>
            </div>
            <div class="gate-arrow">↓</div>
            <div class="gate" [class.is-pass]="result().authenticated && result().authorized" [class.is-fail]="result().authenticated && !result().authorized" [class.is-skip]="!result().authenticated">
              <p class="gate-title">AUTHZ GATE</p>
              <p class="gate-sub">WHAT CAN YOU DO?</p>
              <p class="gate-verdict">
                @if (!result().authenticated) { — skipped — }
                @else { {{ result().authorized ? '✓ PERMITTED' : '✕ NOT PERMITTED' }} }
              </p>
            </div>
            <div class="gate-arrow">↓</div>
            <div class="resource" [class.is-reached]="result().authorized">RESOURCE</div>
          </div>
        </div>

        <div class="verdict-banner" [class.is-allow]="result().authorized" [class.is-deny]="!result().authorized">
          <span class="verdict-status mono">{{ result().statusLabel }}</span>
          <span class="verdict-reason">{{ result().reason }}</span>
        </div>

        <app-explain-simply>
          Two separate doors guard the resource. The first one just checks your ID card exists —
          it doesn't care what you're here to do. Only after you're identified does the second door
          check whether your badge actually lets you into this specific room.
        </app-explain-simply>
      </div>
    </section>
  `,
  styles: `
    .gateway-layout {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 28px;
    }

    @media (min-width: 900px) {
      .gateway-layout { grid-template-columns: 240px 1fr; }
    }

    .gateway-controls { display: flex; flex-direction: column; gap: 16px; }

    .gateway-building {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
      padding: 24px;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-lg);
    }

    .building-label { font-size: 0.6875rem; letter-spacing: 0.12em; color: var(--text-faint); margin-bottom: 8px; }

    .gate {
      width: 100%;
      max-width: 320px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }

    .gate-title { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .gate-sub { font-size: 0.625rem; color: var(--text-faint); margin-top: 2px; }
    .gate-verdict { margin-top: 8px; font-size: 0.75rem; font-weight: 600; }

    .gate.is-pass { border-color: var(--accent-2); box-shadow: 0 0 18px var(--glow-accent-2); }
    .gate.is-pass .gate-verdict { color: var(--accent-2); }
    .gate.is-fail { border-color: var(--danger); }
    .gate.is-fail .gate-verdict { color: var(--danger); }
    .gate.is-skip { opacity: 0.45; }

    .gate-arrow { color: var(--border-strong); }

    .resource {
      margin-top: 4px;
      padding: 10px 24px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      color: var(--text-faint);
      font-size: 0.75rem;
    }

    .resource.is-reached { border-color: var(--accent); color: var(--accent-strong); box-shadow: 0 0 16px var(--glow-accent); }

    .verdict-banner {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
    }

    .verdict-status { font-size: 0.8125rem; font-weight: 700; }
    .verdict-reason { font-size: 0.875rem; color: var(--text-muted); }

    .verdict-banner.is-allow { border-color: var(--accent-2-dim); }
    .verdict-banner.is-allow .verdict-status { color: var(--accent-2); }
    .verdict-banner.is-deny { border-color: var(--danger); }
    .verdict-banner.is-deny .verdict-status { color: var(--danger); }
  `,
})
export class SecurityGateway {
  protected readonly loggedIn = signal(true);
  protected readonly role = signal<Role>('viewer');
  protected readonly action = signal<Permission>('read');

  protected readonly result = computed(() =>
    checkAccess(this.loggedIn() ? { name: 'Alice', role: this.role(), department: 'finance' } : null, this.action()),
  );
}
