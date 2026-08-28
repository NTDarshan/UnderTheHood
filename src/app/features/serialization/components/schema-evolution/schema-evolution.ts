import { Component, computed, signal } from '@angular/core';

type Presence = 'missing' | 'null' | 'present';

@Component({
  selector: 'app-schema-evolution',
  standalone: true,
  template: `
    <section class="lab-section" id="schema-evolution">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 16 — SCHEMA EVOLUTION</p>
        <h2 class="lab-title">APIs change. Old clients and new servers still have to talk.</h2>
        <p class="lab-lede">
          Schema-based formats like Protocol Buffers make this explicit — a schema defines the shape once,
          and both sides agree to honor it as it evolves.
        </p>

        <pre class="schema-snippet mono">message User {{ '{' }}
  string name = 1;
  int32 age = 2;
{{ '}' }}</pre>

        <div class="version-toggle lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="scenario() === 'old-to-new'" (click)="scenario.set('old-to-new')">
            Client V1 → Server V2
          </button>
          <button type="button" class="lab-btn" [class.is-active]="scenario() === 'new-to-old'" (click)="scenario.set('new-to-old')">
            Client V2 → Server V1
          </button>
        </div>

        <div class="version-panel lab-panel">
          @if (scenario() === 'old-to-new') {
            <p class="version-title mono">CLIENT (v1: name, age) → SERVER (v2: name, age, email)</p>
            <p class="version-body">
              The server expects an <span class="mono">email</span> field it now supports, but the older
              client never sends one. A well-designed v2 server treats it as optional and falls back to a
              default — this is <strong>backward compatibility</strong>.
            </p>
          } @else {
            <p class="version-title mono">CLIENT (v2: name, age, email) → SERVER (v1: name, age)</p>
            <p class="version-body">
              The client sends an extra <span class="mono">email</span> field the older server has never
              heard of. A well-designed v1 server simply ignores unknown fields rather than rejecting the
              whole request — this is <strong>forward compatibility</strong>.
            </p>
          }
        </div>

        <p class="lab-note">
          Exact compatibility rules depend on the format and API design — some systems reject unknown fields,
          others ignore them. The point is that schema evolution is a real, recurring problem, and it's a
          major reason serialization formats and schema discipline matter in practice.
        </p>
      </div>
    </section>

    <section class="lab-section" id="type-mismatch-null">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 16b — MISSING, NULL, AND WRONG TYPES</p>
        <h2 class="lab-title">Three ways a field can disappoint you.</h2>

        <div class="presence-picker lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="presence() === 'missing'" (click)="presence.set('missing')">Missing</button>
          <button type="button" class="lab-btn" [class.is-active]="presence() === 'null'" (click)="presence.set('null')">Null</button>
          <button type="button" class="lab-btn" [class.is-active]="presence() === 'present'" (click)="presence.set('present')">Present</button>
        </div>

        <div class="presence-grid">
          <pre class="presence-json mono">{{ presenceJson() }}</pre>
          <p class="presence-meaning">{{ presenceMeaning() }}</p>
        </div>

        <p class="lab-index anatomy-heading">TYPE MISMATCH</p>
        <div class="mismatch-grid">
          @for (m of mismatchExamples; track m.age) {
            <div class="mismatch-card" [class.is-fail]="!m.ok">
              <pre class="mismatch-json mono">{{ '{' }} "age": {{ m.age }} {{ '}' }}</pre>
              <p class="mismatch-verdict mono">{{ m.ok ? '✓ works' : '✕ ' + m.reason }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .schema-snippet {
      margin-top: 28px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 18px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.7;
      max-width: 320px;
    }

    .version-panel {
      max-width: 640px;
    }

    .version-title {
      font-size: 0.75rem;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    .version-body {
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.65;
    }

    .anatomy-heading {
      margin-top: 40px;
    }

    .presence-picker {
      margin-top: 24px;
    }

    .presence-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      align-items: center;
    }

    @media (min-width: 700px) {
      .presence-grid {
        grid-template-columns: auto 1fr;
      }
    }

    .presence-json {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .presence-meaning {
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .mismatch-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    @media (min-width: 700px) {
      .mismatch-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .mismatch-card {
      background: var(--surface-raised);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 14px 16px;
    }

    .mismatch-card.is-fail {
      border-color: var(--danger);
    }

    .mismatch-json {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .mismatch-verdict {
      margin-top: 10px;
      font-size: 0.75rem;
      color: var(--accent-2);
    }

    .mismatch-card.is-fail .mismatch-verdict {
      color: var(--danger);
    }
  `,
})
export class SchemaEvolution {
  protected readonly scenario = signal<'old-to-new' | 'new-to-old'>('old-to-new');
  protected readonly presence = signal<Presence>('present');

  protected readonly presenceJson = computed(() => {
    if (this.presence() === 'missing') return '{\n  "name": "Alice"\n}';
    if (this.presence() === 'null') return '{\n  "name": "Alice",\n  "phone": null\n}';
    return '{\n  "name": "Alice",\n  "phone": "555-0100"\n}';
  });

  protected readonly presenceMeaning = computed(() => {
    if (this.presence() === 'missing') return 'The field was never included. Depending on the contract, this might mean "not applicable" or "use the default."';
    if (this.presence() === 'null') return 'The field is explicitly present, with the value null — often meant as "intentionally has no value," distinct from never being sent at all.';
    return 'The field is present with a real value — the ordinary case.';
  });

  protected readonly mismatchExamples = [
    { age: '30', ok: true, reason: '' },
    { age: '"30"', ok: false, reason: 'string instead of number — may need conversion, or may be rejected' },
    { age: '"thirty"', ok: false, reason: 'cannot convert to a numeric value at all' },
  ];
}
