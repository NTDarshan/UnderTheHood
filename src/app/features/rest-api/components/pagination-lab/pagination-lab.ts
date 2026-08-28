import { Component, computed, signal } from '@angular/core';
import { calculatePagination } from '../../engine/rest-simulator';

const DATASET_TOTAL = 137;

@Component({
  selector: 'app-pagination-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="pagination">
      <div class="container">
        <p class="lab-index">REST API / 17 — PAGINATION</p>
        <h2 class="lab-title">A million rows will never fit in one response.</h2>
        <p class="lab-lede">Pagination isn't a formal REST requirement — but returning an entire collection in one response is a production hazard, not a design choice.</p>

        <div class="lab-panel">
          <p class="lab-node">WITHOUT PAGINATION</p>
          <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books</span> <span class="tok-dim">— 1,000,000 rows in the table</span></p>
          <ul class="warn-list">
            <li class="lab-note lab-note-warn">Huge response payload — megabytes of JSON for one request.</li>
            <li class="lab-note lab-note-warn">The database must read and serialize every matching row.</li>
            <li class="lab-note lab-note-warn">High memory pressure on both server and client.</li>
            <li class="lab-note lab-note-warn">Slow over the network, slow to parse, slow to render.</li>
            <li class="lab-note lab-note-warn">Poor UX — nobody scrolls through a million rows anyway.</li>
          </ul>
          <p class="lab-node" style="margin-top: 20px;">WITH PAGINATION</p>
          <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books?page=3&amp;limit=20</span> <span class="tok-dim">— 20 rows, one page</span></p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">TRY IT — PAGINATION PLAYGROUND</p>
          <p class="lab-note">Simulated dataset of {{ total }} records. Adjust <strong>page</strong> and <strong>limit</strong> and watch the engine compute the response shape.</p>

          <div class="controls-row">
            <div class="lab-field">
              <label for="page-input">page</label>
              <input id="page-input" type="number" [value]="page()" (input)="onPage($event)" />
            </div>
            <div class="lab-field">
              <label for="limit-input">limit</label>
              <input id="limit-input" type="number" [value]="limit()" (input)="onLimit($event)" />
            </div>
          </div>

          <p class="lab-code">{{ '{' }}
  <span class="tok-key">"data"</span>: [ …{{ result().lastIndex - result().firstIndex + 1 }} books… ],
  <span class="tok-key">"page"</span>: {{ result().page }},
  <span class="tok-key">"limit"</span>: {{ result().limit }},
  <span class="tok-key">"total"</span>: {{ result().total }},
  <span class="tok-key">"totalPages"</span>: {{ result().totalPages }}
{{ '}' }}</p>
          <p class="range-readout mono">records {{ result().firstIndex }}–{{ result().lastIndex }} of {{ result().total }}</p>

          <p class="lab-node" style="margin-top: 24px;">OFFSET VISUALIZATION</p>
          <div class="offset-bar">
            <div class="seg seg-skip" [style.width.%]="pct().skipped" title="skipped"></div>
            <div class="seg seg-return" [style.width.%]="pct().returned" title="returned"></div>
            <div class="seg seg-remain" [style.width.%]="pct().remaining" title="remaining"></div>
          </div>
          <div class="offset-legend mono">
            <span><i class="dot dot-skip"></i> skipped ({{ result().offset }})</span>
            <span><i class="dot dot-return"></i> returned ({{ result().limit }})</span>
            <span><i class="dot dot-remain"></i> remaining ({{ remaining() }})</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .warn-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .warn-list li { margin: 0; }
    .controls-row { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 20px; max-width: 320px; }
    .range-readout { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); }

    .offset-bar { margin-top: 14px; display: flex; width: 100%; height: 28px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-strong); }
    .seg { height: 100%; transition: width 0.2s ease; }
    .seg-skip { background: var(--border-strong); }
    .seg-return { background: var(--accent); }
    .seg-remain { background: var(--surface); }

    .offset-legend { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.75rem; color: var(--text-muted); }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .dot-skip { background: var(--border-strong); }
    .dot-return { background: var(--accent); }
    .dot-remain { background: var(--surface-elevated); border: 1px solid var(--border-strong); }
  `,
})
export class PaginationLab {
  protected readonly total = DATASET_TOTAL;
  protected readonly page = signal(3);
  protected readonly limit = signal(20);

  protected readonly result = computed(() => calculatePagination(this.total, this.page(), this.limit()));

  protected readonly remaining = computed(() => Math.max(0, this.total - this.result().offset - this.result().limit));

  protected readonly pct = computed(() => {
    const r = this.result();
    const denom = Math.max(1, this.total);
    const skipped = (r.offset / denom) * 100;
    const returned = (r.limit / denom) * 100;
    const remaining = Math.max(0, 100 - skipped - returned);
    return { skipped, returned, remaining };
  });

  onPage(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.page.set(Number.isFinite(v) ? v : 1);
  }

  onLimit(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.limit.set(Number.isFinite(v) ? v : 20);
  }
}
