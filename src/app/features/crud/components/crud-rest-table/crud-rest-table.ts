import { Component, OnDestroy, signal } from '@angular/core';

interface CrudRow {
  op: string;
  method: string;
  url: string;
  response: string;
  opId: 'create' | 'read-collection' | 'read-one' | 'update' | 'partial-update' | 'delete';
  requestBody: string | null;
  note: string;
}

const ROWS: CrudRow[] = [
  {
    op: 'Create',
    method: 'POST',
    url: '/api/books',
    response: '201 Created',
    opId: 'create',
    requestBody: '{ "title": "Dune", "author": "Frank Herbert" }',
    note: 'A new book resource is created. The response points at the new resource, typically via a Location header.',
  },
  {
    op: 'Read collection',
    method: 'GET',
    url: '/api/books',
    response: '200 OK',
    opId: 'read-collection',
    requestBody: null,
    note: 'Returns a list of books. Zero matches is still 200 — an empty array, not an error.',
  },
  {
    op: 'Read one',
    method: 'GET',
    url: '/api/books/42',
    response: '200 OK',
    opId: 'read-one',
    requestBody: null,
    note: 'Returns a single book by id. If book 42 does not exist, this becomes 404, not 200.',
  },
  {
    op: 'Update',
    method: 'PUT',
    url: '/api/books/42',
    response: '200 OK / 204',
    opId: 'update',
    requestBody: '{ "title": "Dune", "author": "Frank Herbert", "genre": "Sci-Fi", "price": 12.99, "status": "in-stock" }',
    note: 'Replaces the entire book with the given representation. Fields left out are effectively cleared.',
  },
  {
    op: 'Partial update',
    method: 'PATCH',
    url: '/api/books/42',
    response: '200 OK / 204',
    opId: 'partial-update',
    requestBody: '{ "price": 9.99 }',
    note: 'Changes only the fields provided. The rest of the book is left untouched.',
  },
  {
    op: 'Delete',
    method: 'DELETE',
    url: '/api/books/42',
    response: '204 No Content',
    opId: 'delete',
    requestBody: null,
    note: 'The book stops existing. There is nothing left to return, hence no response body.',
  },
];

@Component({
  selector: 'app-crud-rest-table',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-rest-table">
      <div class="container">
        <p class="lab-index mono">09 — CRUD + REST</p>
        <h2 class="lab-title">Four operations, mapped onto HTTP</h2>
        <p class="lab-lede">
          REST gives CRUD a concrete shape: a resource URL and a method that says what you intend to do to it.
          Click any row to watch the request travel from client to server and see what comes back.
        </p>

        <div class="lab-panel">
          <div class="rest-table mono" role="table" aria-label="CRUD to REST mapping for the Books resource">
            <div class="rest-row rest-head" role="row">
              <span role="columnheader">Operation</span>
              <span role="columnheader">Method</span>
              <span role="columnheader">Example</span>
              <span role="columnheader">Response</span>
            </div>
            @for (row of rows; track row.opId; let i = $index) {
              <button
                type="button"
                class="rest-row rest-row-btn"
                role="row"
                [attr.data-method]="row.method"
                [class.is-active]="selected() === i"
                [attr.aria-expanded]="selected() === i"
                (click)="select(i)"
              >
                <span role="cell" class="rest-op">{{ row.op }}</span>
                <span role="cell" class="tok-method">{{ row.method }}</span>
                <span role="cell" class="tok-key">{{ row.url }}</span>
                <span role="cell" class="rest-response">{{ row.response }}</span>
              </button>
              @if (selected() === i) {
                <div class="detail-panel" role="row">
                  <div class="wire">
                    <span class="wire-chip mono" [class.is-lit]="wireStage() >= 1">CLIENT</span>
                    <div class="wire-track">
                      <div class="wire-line"></div>
                      <div class="wire-packet mono" [class.is-request]="wireStage() === 1" [class.is-response]="wireStage() === 3" [class.is-hidden]="wireStage() === 0 || wireStage() === 2">
                        {{ wireStage() === 3 ? row.response : row.method }}
                      </div>
                    </div>
                    <span class="wire-chip mono" [class.is-lit]="wireStage() === 2 || wireStage() === 3">SERVER</span>
                  </div>

                  <p class="lab-code">
                    <span class="tok-method">{{ row.method }}</span>
                    <span class="tok-key">{{ row.url }}</span>
                    @if (row.requestBody) {
                      <br /><span class="tok-dim">{{ row.requestBody }}</span>
                    }
                    <br /><span class="tok-dim">&darr;</span>
                    <br /><span class="tok-status-ok">{{ row.response }}</span>
                  </p>
                  <p class="detail-note">{{ row.note }}</p>
                </div>
              }
            }
          </div>
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

    .rest-table { display: flex; flex-direction: column; gap: 4px; }
    .rest-row { display: grid; grid-template-columns: 1.1fr 0.7fr 1.6fr 1fr; gap: 10px; align-items: center; padding: 12px 14px; font-size: 0.8125rem; }
    .rest-head { color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.6875rem; }
    .rest-row-btn { width: 100%; text-align: left; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text-muted); transition: border-color 0.15s ease, background 0.15s ease; }
    .rest-row-btn:hover { border-color: var(--accent-dim); }
    .rest-row-btn.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
    .rest-op { color: var(--text); font-family: var(--font-sans); }
    .rest-response { color: var(--cr-cyan); }

    .detail-panel { padding: 20px; background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); margin: 2px 0 10px; }

    .wire { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
    .wire-chip { flex-shrink: 0; padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-faint); font-size: 0.6875rem; letter-spacing: 0.06em; transition: color 0.2s ease, border-color 0.2s ease; }
    .wire-chip.is-lit { color: var(--cr-accent); border-color: var(--cr-accent); }
    .wire-track { position: relative; flex: 1; height: 2px; background: var(--border-strong); }
    .wire-line { position: absolute; inset: 0; }
    .wire-packet {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
      font-size: 0.6875rem;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--cr-accent);
      background: color-mix(in srgb, var(--cr-accent) 18%, var(--surface));
      color: var(--cr-accent);
      white-space: nowrap;
      transition: left 0.5s ease, opacity 0.2s ease, border-color 0.5s ease, background 0.5s ease, color 0.5s ease;
      opacity: 1;
    }
    .wire-packet.is-hidden { opacity: 0; }
    .wire-packet.is-request { left: 100%; }
    .wire-packet.is-response { left: 0%; border-color: var(--cr-cyan); background: color-mix(in srgb, var(--cr-cyan) 18%, var(--surface)); color: var(--cr-cyan); }

    .detail-note { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; font-family: var(--font-sans); }

    @media (max-width: 720px) {
      .rest-row { grid-template-columns: 1fr 1fr; row-gap: 6px; }
      .rest-op { grid-column: 1 / -1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .wire-packet { transition: opacity 0.15s ease; }
    }
  `,
})
export class CrudRestTable implements OnDestroy {
  protected readonly rows = ROWS;
  protected readonly selected = signal<number | null>(null);
  protected readonly wireStage = signal(0);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected select(index: number): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];

    if (this.selected() === index) {
      this.selected.set(null);
      this.wireStage.set(0);
      return;
    }

    this.selected.set(index);
    this.wireStage.set(0);
    this.timers.push(setTimeout(() => this.wireStage.set(1), 60));
    this.timers.push(setTimeout(() => this.wireStage.set(2), 500));
    this.timers.push(setTimeout(() => this.wireStage.set(3), 700));
    this.timers.push(setTimeout(() => this.wireStage.set(0), 1200));
  }
}
