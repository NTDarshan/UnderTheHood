import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dto-overposting',
  standalone: true,
  template: `
    <section class="lab-section" id="dto-vs-domain">
      <div class="container">
        <p class="lab-index">VALIDATION / 36 — REQUEST DTO VS. DOMAIN MODEL</p>
        <h2 class="lab-title">The client should never fill out the database row directly.</h2>

        <div class="flow-chain mono">
          <span>CreateUserRequest</span><span class="arrow">↓</span>
          <span>Validation</span><span class="arrow">↓</span>
          <span>Mapping</span><span class="arrow">↓</span>
          <span>Domain / User Model</span><span class="arrow">↓</span>
          <span>Business Logic</span>
        </div>

        <div class="entity-compare">
          <div class="entity-card">
            <p class="entity-title mono">DATABASE ENTITY: User</p>
            <p class="entity-field">id</p>
            <p class="entity-field">email</p>
            <p class="entity-field danger">passwordHash</p>
            <p class="entity-field danger">role</p>
            <p class="entity-field">createdAt</p>
          </div>
          <div class="entity-card">
            <p class="entity-title mono">CreateUserRequest (DTO)</p>
            <p class="entity-field">email</p>
            <p class="entity-field">password</p>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Accepting the database/domain entity directly as the API request model risks over-posting,
          tight coupling, exposing internal fields, and unintended writable properties.
        </p>
      </div>
    </section>

    <section class="lab-section" id="overposting">
      <div class="container">
        <p class="lab-index">VALIDATION / 37 — OVERPOSTING / MASS ASSIGNMENT</p>
        <h2 class="lab-title">Just because a field exists doesn't mean the client controls it.</h2>

        <pre class="lab-code mono attack-body">{{ '{' }}
  "name": "John",
  "phone": "555-0100",
  "role": "Admin"
{{ '}' }}</pre>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="!useAllowlist()" (click)="useAllowlist.set(false)">Bad: map every property blindly</button>
          <button type="button" class="lab-btn" [class.is-active]="useAllowlist()" (click)="useAllowlist.set(true)">Good: explicit allowlisted DTO</button>
        </div>

        <div class="lab-panel mapped-panel">
          @if (!useAllowlist()) {
            <pre class="lab-code mono is-bad">{{ '{' }}
  "name": "John",
  "phone": "555-0100",
  "role": "Admin"
{{ '}' }}</pre>
            <p class="lab-note lab-note-warn">The attacker just silently granted themselves an Admin role.</p>
          } @else {
            <pre class="lab-code mono is-good">{{ '{' }}
  "name": "John",
  "phone": "555-0100"
{{ '}' }}</pre>
            <p class="lab-note">"role" is not part of UpdateProfileRequest, so it's simply never mapped — ignored, not silently trusted.</p>
          }
        </div>

        <p class="lab-note lab-note-warn">Never let the client control a field simply because it exists on an internal model.</p>
      </div>
    </section>
  `,
  styles: `
    .flow-chain { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .entity-compare { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .entity-compare { grid-template-columns: 1fr 1fr; } }
    .entity-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
    .entity-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .entity-field { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px; }
    .entity-field.danger { color: var(--danger); }

    .attack-body { margin-top: 28px; max-width: 340px; color: var(--danger); }

    .mapped-panel { margin-top: 20px; }
    .lab-code.is-bad { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .lab-code.is-good { color: var(--accent-2); border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }
  `,
})
export class DtoOverposting {
  protected readonly useAllowlist = signal(true);
}
