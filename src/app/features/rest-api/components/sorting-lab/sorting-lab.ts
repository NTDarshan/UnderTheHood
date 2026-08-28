import { Component, computed, signal } from '@angular/core';
import { isSortFieldAllowed, SAMPLE_BOOKS, SampleBook } from '../../engine/rest-simulator';

type SortField = 'title' | 'createdAt' | 'price' | 'someUnknownField';
type SortOrder = 'asc' | 'desc';

const FIELD_OPTIONS: { id: SortField; label: string }[] = [
  { id: 'title', label: 'title' },
  { id: 'createdAt', label: 'createdAt' },
  { id: 'price', label: 'price' },
  { id: 'someUnknownField', label: 'someUnknownField' },
];

@Component({
  selector: 'app-sorting-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="sorting">
      <div class="container">
        <p class="lab-index">REST API / 20 — SORTING</p>
        <h2 class="lab-title">A client-chosen field name is not a safe thing to hand to your query.</h2>
        <p class="lab-lede">Sorting looks trivial until a client asks the server to sort by a field that doesn't exist — or shouldn't be exposed.</p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (f of fieldOptions; track f.id) {
              <button type="button" class="lab-btn" [class.is-active]="sortBy() === f.id" (click)="sortBy.set(f.id)">{{ f.label }}</button>
            }
          </div>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="sortOrder() === 'asc'" (click)="sortOrder.set('asc')">asc ↑</button>
            <button type="button" class="lab-btn" [class.is-active]="sortOrder() === 'desc'" (click)="sortOrder.set('desc')">desc ↓</button>
          </div>

          <p class="lab-code mono"><span class="tok-method">GET</span> <span class="tok-key">/books?sortBy={{ sortBy() }}&amp;sortOrder={{ sortOrder() }}</span></p>

          @if (!allowed()) {
            <p class="rejected mono">✕ 400 Bad Request — "{{ sortBy() }}" is not on the server's sort allowlist.</p>
            <p class="lab-note lab-note-warn">The server must not blindly inject a client-supplied field name into a dynamic <code>ORDER BY</code>. An explicit allowlist (or an allowlist-backed mapping to real column names) is what stands between "sort by price" and a client probing for fields it was never meant to see — the same validation discipline from the Validation chapter, applied to a query parameter instead of a request body.</p>
          } @else {
            <div class="book-list mono">
              @for (b of sortedBooks(); track b.id) {
                <p class="book-row">
                  <span class="tok-key">{{ b.title }}</span>
                  <span class="tok-dim">— {{ b.author }} · {{ b.createdAt }} · \${{ b.price }}</span>
                </p>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .rejected { margin-top: 20px; font-size: 0.875rem; color: var(--danger); font-weight: 600; }
    .book-list { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
    .book-row { font-size: 0.8125rem; }
  `,
})
export class SortingLab {
  protected readonly fieldOptions = FIELD_OPTIONS;
  protected readonly sortBy = signal<SortField>('title');
  protected readonly sortOrder = signal<SortOrder>('asc');

  protected readonly allowed = computed(() => isSortFieldAllowed(this.sortBy()));

  protected readonly sortedBooks = computed<SampleBook[]>(() => {
    if (!this.allowed()) return [];
    const field = this.sortBy() as 'title' | 'createdAt' | 'price';
    const order = this.sortOrder();
    const copy = [...SAMPLE_BOOKS];
    copy.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });
    return copy;
  });
}
