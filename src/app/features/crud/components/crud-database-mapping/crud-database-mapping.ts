import { Component, computed, signal } from '@angular/core';

interface CrudRow {
  id: string;
  verb: string;
  sqlOp: string;
  sql: string;
}

const ROWS: CrudRow[] = [
  {
    id: 'create',
    verb: 'CREATE',
    sqlOp: 'INSERT',
    sql: 'INSERT INTO books (title, author, genre, price, status)\nVALUES (\'Dune\', \'Frank Herbert\', \'Sci-Fi\', 12.99, \'in_stock\');',
  },
  {
    id: 'read',
    verb: 'READ',
    sqlOp: 'SELECT',
    sql: 'SELECT id, title, author, genre, price, status\nFROM books\nWHERE id = 42;',
  },
  {
    id: 'update',
    verb: 'UPDATE',
    sqlOp: 'UPDATE',
    sql: 'UPDATE books\nSET price = 45.00\nWHERE id = 42;',
  },
  {
    id: 'delete',
    verb: 'DELETE',
    sqlOp: 'DELETE',
    sql: 'DELETE FROM books\nWHERE id = 42;',
  },
];

const LAYERS = [
  { id: 'api', label: 'API', detail: 'PATCH /api/books/42 { price: 45 }' },
  { id: 'repo', label: 'Repository', detail: 'BooksRepository.updatePrice(42, 45)' },
  { id: 'orm', label: 'ORM / SQL', detail: 'UPDATE books SET price = 45.00 WHERE id = 42;' },
  { id: 'db', label: 'Database', detail: 'Row 42 mutated, write committed to disk' },
];

@Component({
  selector: 'app-crud-database-mapping',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-database-mapping">
      <div class="container">
        <p class="lab-index mono">14 — CRUD + DATABASE</p>
        <h2 class="lab-title">What CRUD actually turns into underneath</h2>
        <p class="lab-lede">
          "CRUD" is a mental model for the API, not a database feature. Every one of the four operations resolves
          to a specific SQL statement once it reaches the database layer.
        </p>

        <div class="lab-panel">
          <div class="mapping-grid">
            @for (r of rows; track r.id) {
              <button
                type="button"
                class="mapping-row"
                [class.is-active]="activeId() === r.id"
                (click)="activeId.set(r.id)"
              >
                <span class="verb-chip mono">{{ r.verb }}</span>
                <span class="mapping-arrow" aria-hidden="true">→</span>
                <span class="sql-chip mono">{{ r.sqlOp }}</span>
              </button>
            }
          </div>

          @if (active(); as r) {
            <pre class="lab-code mono sql-preview">{{ r.sql }}</pre>
          }
        </div>

        <div class="lab-panel layers-panel">
          <p class="lab-node">Request → database, layer by layer</p>
          <div class="layers-flow">
            @for (l of layers; track l.id; let last = $last) {
              <div class="layer-node" [class.is-db]="l.id === 'db'">
                <p class="layer-label mono">{{ l.label }}</p>
                <p class="layer-detail mono">{{ l.detail }}</p>
              </div>
              @if (!last) {
                <span class="layer-arrow" aria-hidden="true">↓</span>
              }
            }
          </div>
        </div>

        <p class="lab-note">
          The API layer speaks in application verbs — Create, Read, Update, Delete. The repository translates a
          call like <span class="mono">updatePrice(42, 45)</span> into a query. The ORM (or hand-written SQL)
          turns that into the exact statement the database engine executes. The database itself has no concept of
          "CRUD" — it only ever sees <span class="mono">INSERT</span>, <span class="mono">SELECT</span>,
          <span class="mono">UPDATE</span>, and <span class="mono">DELETE</span> against rows and indexes.
        </p>
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

    .mapping-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mapping-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      color: var(--text);
      text-align: left;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .mapping-row:hover {
      border-color: var(--cr-accent);
    }
    .mapping-row.is-active {
      border-color: var(--cr-accent);
      background: color-mix(in srgb, var(--cr-accent) 10%, var(--surface-elevated));
    }

    .verb-chip {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--cr-accent);
      min-width: 76px;
    }
    .mapping-arrow {
      color: var(--text-faint);
    }
    .sql-chip {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--cr-cyan);
    }

    .sql-preview {
      margin-top: 20px;
    }

    .layers-panel {
      margin-top: 20px;
    }

    .layers-flow {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
    }

    .layer-node {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      background: var(--surface);
    }
    .layer-node.is-db {
      border-color: color-mix(in srgb, var(--cr-violet) 45%, var(--border));
      background: color-mix(in srgb, var(--cr-violet) 8%, var(--surface));
    }

    .layer-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text);
    }
    .layer-detail {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .layer-arrow {
      align-self: center;
      color: var(--text-faint);
      font-size: 0.875rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .mapping-row {
        transition: none;
      }
    }
  `,
})
export class CrudDatabaseMapping {
  protected readonly rows = ROWS;
  protected readonly layers = LAYERS;
  protected readonly activeId = signal(ROWS[0].id);
  protected readonly active = computed(() => this.rows.find((r) => r.id === this.activeId()) ?? null);
}
