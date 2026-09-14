import { Component } from '@angular/core';

interface NotEqualRow {
  id: string;
  label: string;
}

interface LayerDef {
  id: string;
  term: string;
  desc: string;
}

interface MappingRow {
  crud: string;
  http: string;
  sql: string;
  opId: string;
}

const NOT_EQUAL: NotEqualRow[] = [
  { id: 'sql', label: 'CRUD &ne; SQL' },
  { id: 'rest', label: 'CRUD &ne; REST' },
  { id: 'http', label: 'CRUD &ne; HTTP' },
];

const LAYERS: LayerDef[] = [
  { id: 'crud', term: 'CRUD', desc: 'Conceptual operations you perform on a resource.' },
  { id: 'http', term: 'HTTP', desc: 'The communication mechanism a client and server speak over the network.' },
  { id: 'rest', term: 'REST', desc: 'An architectural style for organizing HTTP APIs around resources.' },
  { id: 'sql', term: 'SQL', desc: 'A database query language for reading and writing rows.' },
  { id: 'app', term: 'Application layers', desc: 'The implementation structure — controllers, services, repositories — that ties it all together.' },
];

const MAPPING: MappingRow[] = [
  { crud: 'CREATE', http: 'POST', sql: 'INSERT', opId: 'create' },
  { crud: 'READ', http: 'GET', sql: 'SELECT', opId: 'read' },
  { crud: 'UPDATE', http: 'PUT / PATCH', sql: 'UPDATE', opId: 'update' },
  { crud: 'DELETE', http: 'DELETE', sql: 'DELETE', opId: 'delete' },
];

@Component({
  selector: 'app-crud-vs-database-rest-http',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-not-database">
      <div class="container">
        <p class="lab-index mono">03 — CRUD IS A MENTAL MODEL</p>
        <h2 class="lab-title">CRUD is not a database. It's not even a protocol.</h2>
        <p class="lab-lede">
          It's easy to conflate CRUD with the tools most commonly used to implement it. They're related, but they
          are not the same thing &mdash; and confusing them makes systems harder to reason about.
        </p>

        <div class="lab-panel">
          <div class="not-equal-row">
            @for (row of notEqual; track row.id) {
              <div class="not-equal-item">
                <span class="not-equal-label mono" [innerHTML]="row.label"></span>
              </div>
            }
          </div>

          <div class="clarify-list">
            @for (layer of layers; track layer.id) {
              <div class="clarify-row">
                <span class="clarify-term mono">{{ layer.term }}</span>
                <span class="clarify-desc">{{ layer.desc }}</span>
              </div>
            }
          </div>
        </div>

        <div class="lab-panel mapping-panel">
          <p class="mapping-title mono">A COMMON MAPPING</p>
          <div class="mapping-grid" role="table" aria-label="CRUD to HTTP to SQL mapping">
            <div class="mapping-head mono" role="row">
              <span role="columnheader">CRUD</span>
              <span role="columnheader">HTTP</span>
              <span role="columnheader">SQL</span>
            </div>
            @for (row of mapping; track row.opId) {
              <div class="mapping-row" [attr.data-op]="row.opId" role="row">
                <span class="mono op-cell" role="cell">{{ row.crud }}</span>
                <span class="mono http-cell" role="cell">{{ row.http }}</span>
                <span class="mono sql-cell" role="cell">{{ row.sql }}</span>
              </div>
            }
          </div>
          <p class="lab-note mapping-footnote">
            This is a common mapping, not a strict law. A REST API might use POST for a partial update; a GraphQL
            mutation might do a delete without ever using the word "DELETE"; a CLI tool might implement full CRUD
            with zero HTTP or SQL involved at all.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cr-scene {
      --cr-accent: var(--accent);
      --cr-cyan: var(--accent-2);
      --cr-violet: #a78bfa;
      --cr-success: #4ade80;
      --cr-warning: #fbbf24;
      --cr-danger: var(--danger);
    }

    .not-equal-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    @media (min-width: 640px) {
      .not-equal-row { grid-template-columns: repeat(3, 1fr); }
    }
    .not-equal-item {
      padding: 16px;
      text-align: center;
      background: var(--surface);
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-md);
    }
    .not-equal-label {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--cr-danger);
      letter-spacing: 0.02em;
    }

    .clarify-list {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .clarify-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
      background: var(--surface-elevated);
      border-left: 2px solid var(--cr-cyan);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    @media (min-width: 640px) {
      .clarify-row { flex-direction: row; align-items: baseline; gap: 16px; }
    }
    .clarify-term { font-size: 0.8125rem; font-weight: 700; color: var(--text); letter-spacing: 0.04em; min-width: 160px; flex-shrink: 0; }
    .clarify-desc { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .mapping-panel { margin-top: 24px; }
    .mapping-title { font-size: 0.75rem; letter-spacing: 0.14em; color: var(--text-faint); margin-bottom: 18px; }

    .mapping-grid {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .mapping-head, .mapping-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
    }
    .mapping-head span {
      padding: 10px 14px;
      background: var(--surface);
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--text-faint);
    }
    .mapping-row span {
      padding: 14px;
      background: var(--surface-elevated);
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .op-cell { color: var(--text); }
    .http-cell { color: var(--cr-accent); }
    .sql-cell { color: var(--cr-cyan); }

    .mapping-row[data-op='delete'] .op-cell,
    .mapping-row[data-op='delete'] .http-cell,
    .mapping-row[data-op='delete'] .sql-cell { color: var(--cr-danger); }

    .mapping-footnote { margin-top: 18px; font-size: 0.75rem; color: var(--text-faint); }
  `,
})
export class CrudVsDatabaseRestHttp {
  protected readonly notEqual = NOT_EQUAL;
  protected readonly layers = LAYERS;
  protected readonly mapping = MAPPING;
}
