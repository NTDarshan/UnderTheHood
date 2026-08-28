import { Component, computed, signal } from '@angular/core';

interface FieldDetail {
  id: string;
  type: string;
  meaning: string;
  requirement: string;
  naming: string;
}

const FIELDS: Record<string, FieldDetail> = {
  id: {
    id: 'id',
    type: 'number',
    meaning: 'The unique identifier of this book resource.',
    requirement: 'Always present — required in every response.',
    naming: 'Short, unqualified "id" is conventional for a resource\'s own identifier.',
  },
  title: {
    id: 'title',
    type: 'string',
    meaning: 'The book\'s title, as displayed to a reader.',
    requirement: 'Always present — required.',
    naming: 'Plain noun, camelCase — no abbreviation needed since it\'s unambiguous.',
  },
  author: {
    id: 'author',
    type: 'object',
    meaning: 'A nested representation of the author — not just an ID, but a small embedded resource.',
    requirement: 'Always present — required.',
    naming: 'Singular noun; the nested object reuses "id" and "name" the same way a top-level author resource would.',
  },
  'author.id': {
    id: 'author.id',
    type: 'number',
    meaning: 'The unique identifier of the nested author resource.',
    requirement: 'Required whenever "author" is present.',
    naming: 'Same "id" convention as the top-level resource — consistent naming even when nested.',
  },
  'author.name': {
    id: 'author.name',
    type: 'string',
    meaning: 'The author\'s display name.',
    requirement: 'Required whenever "author" is present.',
    naming: '"name" rather than "authorName" — the field already lives inside the author object, so re-qualifying it would be redundant.',
  },
  createdAt: {
    id: 'createdAt',
    type: 'string (ISO 8601 timestamp)',
    meaning: 'When this book resource was created, in UTC.',
    requirement: 'Always present — required, server-assigned, never client-writable.',
    naming: 'camelCase compound with an explicit "At" suffix marking it as a point in time, distinguishing it from a duration or boolean.',
  },
};

@Component({
  selector: 'app-json-contract-explorer',
  standalone: true,
  template: `
    <section class="lab-section" id="json-contract">
      <div class="container">
        <p class="lab-index">REST API / 24 — THE JSON CONTRACT</p>
        <h2 class="lab-title">Every field in a response is a promise to whoever reads it.</h2>
        <p class="lab-lede">Click any field below to see exactly what it means, whether it's required, and why it's named the way it is.</p>

        <div class="lab-panel">
          <p class="lab-code contract-json mono">{{ '{' }}
  <span class="field" [class.is-selected]="selected() === 'id'" (click)="select('id')">"id"</span>: <span class="tok-status-ok">42</span>,
  <span class="field" [class.is-selected]="selected() === 'title'" (click)="select('title')">"title"</span>: <span class="tok-status-ok">"Clean Architecture"</span>,
  <span class="field" [class.is-selected]="selected() === 'author'" (click)="select('author')">"author"</span>: {{ '{' }}
    <span class="field" [class.is-selected]="selected() === 'author.id'" (click)="select('author.id')">"id"</span>: <span class="tok-status-ok">10</span>,
    <span class="field" [class.is-selected]="selected() === 'author.name'" (click)="select('author.name')">"name"</span>: <span class="tok-status-ok">"Robert Martin"</span>
  {{ '}' }},
  <span class="field" [class.is-selected]="selected() === 'createdAt'" (click)="select('createdAt')">"createdAt"</span>: <span class="tok-status-ok">"2026-08-28T12:30:00Z"</span>
{{ '}' }}</p>

          @if (detail(); as d) {
            <div class="detail-panel">
              <p class="lab-node">{{ d.id }}</p>
              <dl class="detail-list mono">
                <dt>Type</dt><dd>{{ d.type }}</dd>
                <dt>Meaning</dt><dd>{{ d.meaning }}</dd>
                <dt>Required?</dt><dd>{{ d.requirement }}</dd>
                <dt>Naming convention</dt><dd>{{ d.naming }}</dd>
              </dl>
            </div>
          } @else {
            <p class="lab-note">Click a field name above to inspect it.</p>
          }
        </div>

        <p class="lab-note">This is the same representation-boundary idea from the Serialization chapter — a JSON contract is that representation designed deliberately, field by field, rather than left to whatever an object happened to serialize into.</p>
      </div>
    </section>
  `,
  styles: `
    .contract-json { font-size: 0.875rem; }
    .field { cursor: pointer; color: var(--text); border-bottom: 1px dashed var(--border-strong); }
    .field:hover { color: var(--accent-strong); border-color: var(--accent); }
    .field.is-selected { color: var(--accent-strong); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }

    .detail-panel { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .detail-list { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; }
    .detail-list dt { color: var(--text-faint); font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .detail-list dd { margin: 0; color: var(--text-muted); font-size: 0.8125rem; line-height: 1.55; }
  `,
})
export class JsonContractExplorer {
  protected readonly selected = signal<string | null>(null);

  protected readonly detail = computed(() => {
    const id = this.selected();
    return id ? (FIELDS[id] ?? null) : null;
  });

  select(fieldId: string): void {
    this.selected.set(fieldId);
  }
}
