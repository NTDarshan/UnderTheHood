import { Component, computed, signal } from '@angular/core';
import { calculatePagination } from '../../engine/rest-simulator';

interface EdgeCase {
  id: string;
  label: string;
  rawPage: number;
  rawLimit: number;
}

const TOTAL = 137;

const CASES: EdgeCase[] = [
  { id: 'default', label: 'page=1, limit=20 (normal)', rawPage: 1, rawLimit: 20 },
  { id: 'page-zero', label: 'page=0', rawPage: 0, rawLimit: 20 },
  { id: 'page-negative', label: 'page=-1', rawPage: -1, rawLimit: 20 },
  { id: 'limit-zero', label: 'limit=0', rawPage: 1, rawLimit: 0 },
  { id: 'limit-huge', label: 'limit=100000', rawPage: 1, rawLimit: 100000 },
  { id: 'page-beyond', label: 'page=999 (beyond final page)', rawPage: 999, rawLimit: 20 },
];

@Component({
  selector: 'app-pagination-edge-cases',
  standalone: true,
  template: `
    <section class="lab-section" id="pagination-edge-cases">
      <div class="container">
        <p class="lab-index">REST API / 19 — PAGINATION EDGE CASES</p>
        <h2 class="lab-title">Clients will send page=-1. Your server decides what happens next.</h2>
        <p class="lab-lede">Pick an edge case and compare what the client asked for against what the server actually used.</p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (c of cases; track c.id) {
              <button type="button" class="lab-btn" [class.is-active]="selected().id === c.id" (click)="select(c)">{{ c.label }}</button>
            }
          </div>

          <div class="compare-grid mono">
            <div class="compare-col">
              <p class="lab-node">RAW CLIENT INPUT</p>
              <p class="lab-code">{{ '{' }}
  <span class="tok-key">"page"</span>: <span class="tok-status-err">{{ selected().rawPage }}</span>,
  <span class="tok-key">"limit"</span>: <span class="tok-status-err">{{ selected().rawLimit }}</span>
{{ '}' }}</p>
            </div>
            <div class="compare-col">
              <p class="lab-node">SAFE SERVER RESULT</p>
              <p class="lab-code">{{ '{' }}
  <span class="tok-key">"page"</span>: <span class="tok-status-ok">{{ result().page }}</span>,
  <span class="tok-key">"limit"</span>: <span class="tok-status-ok">{{ result().limit }}</span>,
  <span class="tok-key">"totalPages"</span>: {{ result().totalPages }},
  <span class="tok-key">"offset"</span>: {{ result().offset }}
{{ '}' }}</p>
            </div>
          </div>

          <p class="verdict" [class.is-changed]="wasCorrected()">
            {{ wasCorrected() ? '⚠ The server corrected the client-supplied value rather than trusting it as-is.' : '✓ Client input was already within safe bounds — nothing to correct.' }}
          </p>
        </div>

        <p class="lab-note lab-note-warn">Pagination parameters are still client input. <strong>page</strong> and <strong>limit</strong> require the same validation discipline as any other request field — clamp, don't trust, and never let an out-of-range value reach the database layer unchecked.</p>
      </div>
    </section>
  `,
  styles: `
    .compare-grid { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .verdict { margin-top: 16px; font-size: 0.875rem; color: var(--accent-2); }
    .verdict.is-changed { color: var(--accent); }
  `,
})
export class PaginationEdgeCases {
  protected readonly cases = CASES;
  protected readonly total = TOTAL;
  protected readonly selected = signal<EdgeCase>(CASES[0]);

  protected readonly result = computed(() => calculatePagination(this.total, this.selected().rawPage, this.selected().rawLimit));

  protected readonly wasCorrected = computed(() => {
    const s = this.selected();
    const r = this.result();
    return s.rawPage !== r.page || s.rawLimit !== r.limit;
  });

  select(c: EdgeCase): void {
    this.selected.set(c);
  }
}
