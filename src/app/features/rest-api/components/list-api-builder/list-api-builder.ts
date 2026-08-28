import { Component, computed, signal } from '@angular/core';
import { calculatePagination, SAMPLE_BOOKS } from '../../engine/rest-simulator';

type StatusFilter = 'any' | 'published' | 'draft' | 'archived';
type SortField = 'title' | 'createdAt' | 'price';
type SortOrder = 'asc' | 'desc';
type Stage = 'filter' | 'sort' | 'pagination' | 'response';

const TOTAL = 137;

interface NamingRow {
  concept: string;
  consistent: string;
  inconsistent: string;
}

const NAMING_ROWS: NamingRow[] = [
  { concept: 'page number', consistent: 'page', inconsistent: 'p / pg / pageNo / page_number' },
  { concept: 'page size', consistent: 'limit', inconsistent: 'size / count / perPage' },
  { concept: 'sort field', consistent: 'sortBy', inconsistent: 'sort_by / orderBy / sort' },
  { concept: 'sort direction', consistent: 'sortOrder', inconsistent: 'sortingDirection / dir / order' },
  { concept: 'status filter', consistent: 'status', inconsistent: 'state / filterStatus' },
  { concept: 'free-text search', consistent: 'search', inconsistent: 'q / query / keyword' },
];

@Component({
  selector: 'app-list-api-builder',
  standalone: true,
  template: `
    <section class="lab-section" id="list-api-builder">
      <div class="container">
        <p class="lab-index">REST API / 22 — THE COMPLETE LIST API</p>
        <h2 class="lab-title">Filter, sort, and paginate — one pipeline, one query string.</h2>
        <p class="lab-lede">A real list endpoint combines all three concerns. Each stage narrows or reorders what the previous stage produced.</p>

        <div class="lab-panel">
          <div class="pipeline mono">
            <span class="stage" [class.is-active]="activeStage() === 'filter'" (mouseenter)="activeStage.set('filter')">Filter</span>
            <span class="lab-flow-arrow">→</span>
            <span class="stage" [class.is-active]="activeStage() === 'sort'" (mouseenter)="activeStage.set('sort')">Sort</span>
            <span class="lab-flow-arrow">→</span>
            <span class="stage" [class.is-active]="activeStage() === 'pagination'" (mouseenter)="activeStage.set('pagination')">Pagination</span>
            <span class="lab-flow-arrow">→</span>
            <span class="stage" [class.is-active]="activeStage() === 'response'" (mouseenter)="activeStage.set('response')">Response</span>
          </div>

          <div class="filter-controls">
            <div class="lab-field">
              <label for="lb-status">status</label>
              <select id="lb-status" [value]="status()" (change)="onStatus($event)" (focus)="activeStage.set('filter')">
                <option value="any">any</option>
                <option value="published">published</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="lb-author">author</label>
              <input id="lb-author" type="text" [value]="author()" (input)="onAuthor($event)" (focus)="activeStage.set('filter')" />
            </div>
            <div class="lab-field">
              <label for="lb-sortby">sortBy</label>
              <select id="lb-sortby" [value]="sortBy()" (change)="onSortBy($event)" (focus)="activeStage.set('sort')">
                <option value="title">title</option>
                <option value="createdAt">createdAt</option>
                <option value="price">price</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="lb-sortorder">sortOrder</label>
              <select id="lb-sortorder" [value]="sortOrder()" (change)="onSortOrder($event)" (focus)="activeStage.set('sort')">
                <option value="asc">asc</option>
                <option value="desc">desc</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="lb-page">page</label>
              <input id="lb-page" type="number" [value]="page()" (input)="onPage($event)" (focus)="activeStage.set('pagination')" />
            </div>
            <div class="lab-field">
              <label for="lb-limit">limit</label>
              <input id="lb-limit" type="number" [value]="limit()" (input)="onLimit($event)" (focus)="activeStage.set('pagination')" />
            </div>
          </div>

          <p class="lab-code mono" (mouseenter)="activeStage.set('response')"><span class="tok-method">GET</span> <span class="tok-key">/books{{ queryString() }}</span></p>

          <p class="lab-node">MATCHING SAMPLE (from the 8-book demo set, filtered + sorted)</p>
          <div class="book-list mono">
            @for (b of pipeline().sorted; track b.id) {
              <p class="book-row"><span class="tok-key">{{ b.title }}</span> <span class="tok-dim">— {{ b.author }} · {{ b.status }} · \${{ b.price }}</span></p>
            } @empty {
              <p class="lab-note">No books match these filters.</p>
            }
          </div>

          <p class="lab-node" style="margin-top: 20px;">PAGINATED RESPONSE SHAPE (applied to the full simulated {{ total }}-record dataset)</p>
          <p class="lab-code">{{ '{' }}
  <span class="tok-key">"data"</span>: [ …{{ pageResult().lastIndex - pageResult().firstIndex + 1 }} books… ],
  <span class="tok-key">"page"</span>: {{ pageResult().page }},
  <span class="tok-key">"limit"</span>: {{ pageResult().limit }},
  <span class="tok-key">"total"</span>: {{ pageResult().total }},
  <span class="tok-key">"totalPages"</span>: {{ pageResult().totalPages }}
{{ '}' }}</p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">QUERY PARAMETER NAMING</p>
          <div class="cmp-table-wrap">
            <table class="cmp-table mono">
              <thead><tr><th>Concept</th><th>Consistent</th><th>Inconsistent variants</th></tr></thead>
              <tbody>
                @for (row of namingRows; track row.concept) {
                  <tr>
                    <td>{{ row.concept }}</td>
                    <td><span class="pill pill-yes">{{ row.consistent }}</span></td>
                    <td><span class="pill pill-no">{{ row.inconsistent }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="lab-note lab-note-warn">The specific convention can vary between organizations — <strong>page</strong> vs <strong>pageNo</strong> is a coin flip. What actually matters is <strong>consistency</strong>: picking one convention and using it everywhere across your own API.</p>
        </div>

        <div class="lab-panel two-col">
          <div class="card">
            <p class="lab-node">FILTER — status=published</p>
            <p class="lab-note">An exact constraint. The client knows precisely what value it wants and the field either matches or it doesn't.</p>
          </div>
          <div class="card">
            <p class="lab-node">SEARCH — search=architecture</p>
            <p class="lab-note">Free-text matching. The client supplies a fragment and the server decides what counts as relevant — titles, descriptions, or both.</p>
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">API DEFAULTS</p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="showDefaults.set(true)">Send GET /books with no params</button>
          </div>
          @if (showDefaults()) {
            <p class="lab-code mono">{{ '{' }}
  <span class="tok-key">"page"</span>: 1,
  <span class="tok-key">"limit"</span>: 20,
  <span class="tok-key">"sortBy"</span>: <span class="tok-status-ok">"createdAt"</span>,
  <span class="tok-key">"sortOrder"</span>: <span class="tok-status-ok">"desc"</span>
{{ '}' }}</p>
            <p class="lab-note">No query string doesn't mean no behavior — it means the server's defaults apply. Defaults should be predictable, documented, stable across releases, and reasonable for the typical caller.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .pipeline { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 20px; }
    .stage { padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.15s ease; }
    .stage.is-active { border-color: var(--accent); color: var(--accent-strong); background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated)); }
    .filter-controls { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 560px; margin-bottom: 20px; }
    @media (min-width: 640px) { .filter-controls { grid-template-columns: repeat(3, 1fr); } }
    .book-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .book-row { font-size: 0.8125rem; }
    .cmp-table-wrap { margin-top: 16px; overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .cmp-table th, .cmp-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .cmp-table th { color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.6875rem; }
    .two-col { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 640px) { .two-col { grid-template-columns: 1fr 1fr; } }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
  `,
})
export class ListApiBuilder {
  protected readonly total = TOTAL;
  protected readonly namingRows = NAMING_ROWS;

  protected readonly status = signal<StatusFilter>('any');
  protected readonly author = signal('');
  protected readonly sortBy = signal<SortField>('title');
  protected readonly sortOrder = signal<SortOrder>('asc');
  protected readonly page = signal(1);
  protected readonly limit = signal(20);
  protected readonly activeStage = signal<Stage>('filter');
  protected readonly showDefaults = signal(false);

  protected readonly pipeline = computed(() => {
    const status = this.status();
    const author = this.author().trim().toLowerCase();

    const filtered = SAMPLE_BOOKS.filter((b) => {
      if (status !== 'any' && b.status !== status) return false;
      if (author && !b.author.toLowerCase().includes(author)) return false;
      return true;
    });

    const field = this.sortBy();
    const order = this.sortOrder();
    const sorted = [...filtered].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });

    return { filtered, sorted };
  });

  protected readonly pageResult = computed(() => calculatePagination(this.total, this.page(), this.limit()));

  protected readonly queryString = computed(() => {
    const parts: string[] = [];
    if (this.status() !== 'any') parts.push(`status=${this.status()}`);
    if (this.author().trim()) parts.push(`author=${this.author().trim()}`);
    parts.push(`sortBy=${this.sortBy()}`);
    parts.push(`sortOrder=${this.sortOrder()}`);
    parts.push(`page=${this.page()}`);
    parts.push(`limit=${this.limit()}`);
    return `?${parts.join('&')}`;
  });

  onStatus(ev: Event): void {
    this.status.set((ev.target as HTMLSelectElement).value as StatusFilter);
  }

  onAuthor(ev: Event): void {
    this.author.set((ev.target as HTMLInputElement).value);
  }

  onSortBy(ev: Event): void {
    this.sortBy.set((ev.target as HTMLSelectElement).value as SortField);
  }

  onSortOrder(ev: Event): void {
    this.sortOrder.set((ev.target as HTMLSelectElement).value as SortOrder);
  }

  onPage(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.page.set(Number.isFinite(v) ? v : 1);
  }

  onLimit(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.limit.set(Number.isFinite(v) ? v : 20);
  }
}
