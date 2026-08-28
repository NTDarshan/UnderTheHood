import { Component, computed, signal } from '@angular/core';

type Presence = 'absent' | 'null' | 'empty';

@Component({
  selector: 'app-nullable-optional-defaults',
  standalone: true,
  template: `
    <section class="lab-section" id="required-optional-nullable">
      <div class="container">
        <p class="lab-index">VALIDATION / 10 — REQUIRED VS. OPTIONAL VS. NULLABLE</p>
        <h2 class="lab-title">Three states that are easy to confuse.</h2>

        <div class="concept-grid">
          <div class="concept-card"><p class="concept-title mono">REQUIRED</p><p class="concept-example">email — must be present with a valid value</p></div>
          <div class="concept-card"><p class="concept-title mono">OPTIONAL</p><p class="concept-example">middleName — may be entirely absent</p></div>
          <div class="concept-card"><p class="concept-title mono">NULLABLE</p><p class="concept-example">nickname — may be explicitly set to null</p></div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="presence() === 'absent'" (click)="presence.set('absent')">Property absent</button>
          <button type="button" class="lab-btn" [class.is-active]="presence() === 'null'" (click)="presence.set('null')">Present as null</button>
          <button type="button" class="lab-btn" [class.is-active]="presence() === 'empty'" (click)="presence.set('empty')">Present as empty string</button>
        </div>

        <div class="lab-panel presence-panel">
          <pre class="lab-code mono">{{ presenceJson() }}</pre>
          <p class="presence-meaning">{{ presenceMeaning() }}</p>
        </div>

        <p class="lab-note lab-note-warn">These three representations are not automatically equivalent — the application must explicitly define what each one means.</p>
      </div>
    </section>

    <section class="lab-section" id="default-values">
      <div class="container">
        <p class="lab-index">VALIDATION / 11 — DEFAULT VALUES</p>
        <h2 class="lab-title">A default is a transformation decision, not validation.</h2>

        <div class="lab-panel default-panel">
          <p class="default-line mono">Incoming: {{ '{' }} "pageSize": null {{ '}' }}</p>
          <p class="default-arrow">↓ defaulting (a transformation)</p>
          <p class="default-line mono ok">pageSize → 20</p>
        </div>

        <div class="lab-panel default-panel">
          <p class="default-line mono">Incoming: {{ '{' }} "pageSize": 0 {{ '}' }}</p>
          <p class="default-arrow">↓ defaulting</p>
          <p class="default-line mono">0 is a present value — no default applies</p>
          <p class="default-arrow">↓ validation</p>
          <p class="default-line mono fail">✕ 0 is outside the allowed range</p>
        </div>

        <p class="lab-note">Defaulting decides what value to use when one wasn't supplied. Validation separately asks whether the final value — defaulted or not — is allowed.</p>
      </div>
    </section>
  `,
  styles: `
    .concept-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 800px) { .concept-grid { grid-template-columns: repeat(3, 1fr); } }
    .concept-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
    .concept-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 8px; }
    .concept-example { font-size: 0.8125rem; color: var(--text-muted); }

    .presence-panel { margin-top: 24px; }
    .presence-meaning { margin-top: 14px; font-size: 0.9375rem; color: var(--text-muted); }

    .default-panel { margin-top: 20px; }
    .default-line { font-size: 0.8125rem; color: var(--text-muted); }
    .default-line.ok { color: var(--accent-2); }
    .default-line.fail { color: var(--danger); }
    .default-arrow { font-size: 0.75rem; color: var(--text-faint); margin: 8px 0; }
  `,
})
export class NullableOptionalDefaults {
  protected readonly presence = signal<Presence>('absent');

  protected readonly presenceJson = computed(() => {
    if (this.presence() === 'absent') return '{}';
    if (this.presence() === 'null') return '{\n  "nickname": null\n}';
    return '{\n  "nickname": ""\n}';
  });

  protected readonly presenceMeaning = computed(() => {
    if (this.presence() === 'absent') return 'Absent typically means "no opinion supplied" — the application may apply a default or leave the existing value untouched (e.g. on a partial update).';
    if (this.presence() === 'null') return 'Explicit null often means "the client is deliberately clearing this value" — distinct from never having sent it.';
    return 'An empty string is a present, non-null value — the application must decide whether that counts as "no nickname" or is rejected outright.';
  });
}
