import { Component, computed, signal } from '@angular/core';

interface CursorState {
  cursor: string | null;
  nextCursor: string;
}

const PAGES: CursorState[] = [
  { cursor: null, nextCursor: 'abc123' },
  { cursor: 'abc123', nextCursor: 'q7z9k2' },
  { cursor: 'q7z9k2', nextCursor: 'm4x1p8' },
];

interface ComparisonRow {
  aspect: string;
  offset: string;
  offsetKind: 'yes' | 'no' | 'conditional';
  cursor: string;
  cursorKind: 'yes' | 'no' | 'conditional';
}

const COMPARISON: ComparisonRow[] = [
  { aspect: 'Simplicity', offset: 'Simple — page and limit numbers', offsetKind: 'yes', cursor: 'Opaque token, more moving parts', cursorKind: 'conditional' },
  { aspect: 'Random page access', offset: '"Jump to page 40" works directly', offsetKind: 'yes', cursor: 'Not supported — only forward/backward from a cursor', cursorKind: 'no' },
  { aspect: 'Large datasets', offset: 'Deep offsets get slower to scan', offsetKind: 'no', cursor: 'Consistent performance regardless of depth', cursorKind: 'yes' },
  { aspect: 'Changing datasets', offset: 'Inserts/deletes can shift or duplicate rows across pages', offsetKind: 'no', cursor: 'Stable — a cursor anchors to a specific record', cursorKind: 'yes' },
  { aspect: 'Implementation complexity', offset: 'Low — LIMIT/OFFSET in the query', offsetKind: 'yes', cursor: 'Higher — requires an encodable, sortable anchor', cursorKind: 'no' },
];

@Component({
  selector: 'app-cursor-pagination-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="cursor-pagination">
      <div class="container">
        <p class="lab-index">REST API / 18 — CURSOR PAGINATION</p>
        <h2 class="lab-title">Instead of a page number, hand back a pointer to where you stopped.</h2>
        <p class="lab-lede">Cursor pagination trades "jump to page 40" for stability under a dataset that keeps changing underneath you.</p>

        <div class="lab-panel">
          <p class="lab-node">REQUEST</p>
          <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">{{ requestPath() }}</span></p>

          <p class="lab-node" style="margin-top: 18px;">RESPONSE</p>
          <p class="lab-code">{{ '{' }}
  <span class="tok-key">"data"</span>: [ …20 books… ],
  <span class="tok-key">"nextCursor"</span>: <span class="tok-status-ok">"{{ currentPage().nextCursor }}"</span>
{{ '}' }}</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="pageIndex() >= pages.length - 1" (click)="loadNext()">Load next page →</button>
            <button type="button" class="lab-btn" [disabled]="pageIndex() === 0" (click)="reset()">↻ Reset</button>
          </div>
          <p class="lab-note">Each click carries forward the previous response's <strong>nextCursor</strong> as this request's <strong>cursor</strong> parameter — the server uses it to resume exactly where the last page left off, without needing a numeric offset.</p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">OFFSET vs CURSOR — A TRADEOFF, NOT A HIERARCHY</p>
          <div class="cmp-table-wrap">
            <table class="cmp-table mono">
              <thead>
                <tr><th>Aspect</th><th>Offset</th><th>Cursor</th></tr>
              </thead>
              <tbody>
                @for (row of comparison; track row.aspect) {
                  <tr>
                    <td>{{ row.aspect }}</td>
                    <td><span class="pill" [class.pill-yes]="row.offsetKind === 'yes'" [class.pill-no]="row.offsetKind === 'no'" [class.pill-conditional]="row.offsetKind === 'conditional'">{{ row.offset }}</span></td>
                    <td><span class="pill" [class.pill-yes]="row.cursorKind === 'yes'" [class.pill-no]="row.cursorKind === 'no'" [class.pill-conditional]="row.cursorKind === 'conditional'">{{ row.cursor }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="lab-note">Neither approach is universally superior. Offset is simpler and supports random access; cursor is more stable and scales better on large, changing datasets. Pick based on what your API actually needs.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cmp-table-wrap { margin-top: 18px; overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .cmp-table th, .cmp-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .cmp-table th { color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.6875rem; }
  `,
})
export class CursorPaginationLab {
  protected readonly pages = PAGES;
  protected readonly comparison = COMPARISON;
  protected readonly pageIndex = signal(0);

  protected readonly currentPage = computed(() => this.pages[this.pageIndex()]);
  protected readonly requestPath = computed(() => {
    const cursor = this.currentPage().cursor;
    return cursor ? `/books?limit=20&cursor=${cursor}` : '/books?limit=20';
  });

  loadNext(): void {
    if (this.pageIndex() < this.pages.length - 1) this.pageIndex.update((i) => i + 1);
  }

  reset(): void {
    this.pageIndex.set(0);
  }
}
