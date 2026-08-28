import { Component, computed, signal } from '@angular/core';
import { SAMPLE_BOOKS } from '../../engine/rest-simulator';

type StatusFilter = 'any' | 'published' | 'draft' | 'archived';

@Component({
  selector: 'app-filtering-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="filtering">
      <div class="container">
        <p class="lab-index">REST API / 21 — FILTERING</p>
        <h2 class="lab-title">A collection endpoint is a query surface, not just a dump.</h2>
        <p class="lab-lede">Filtering narrows a collection down to what the client actually needs, expressed as query parameters combined with AND logic.</p>

        <div class="lab-panel">
          <div class="filter-controls">
            <div class="lab-field">
              <label for="status-select">status</label>
              <select id="status-select" [value]="status()" (change)="onStatus($event)">
                <option value="any">any</option>
                <option value="published">published</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="author-input">author</label>
              <input id="author-input" type="text" placeholder="e.g. martin" [value]="author()" (input)="onAuthor($event)" />
            </div>
            <div class="lab-field">
              <label for="min-price-input">minPrice</label>
              <input id="min-price-input" type="number" [value]="minPrice()" (input)="onMinPrice($event)" />
            </div>
            <div class="lab-field">
              <label for="max-price-input">maxPrice</label>
              <input id="max-price-input" type="number" [value]="maxPrice()" (input)="onMaxPrice($event)" />
            </div>
          </div>

          <p class="lab-code mono"><span class="tok-method">GET</span> <span class="tok-key">/books{{ queryString() }}</span></p>

          <div class="results-count mono">{{ filteredBooks().length }} of {{ totalBooks }} books match</div>
          <div class="book-list mono">
            @for (b of filteredBooks(); track b.id) {
              <p class="book-row">
                <span class="tok-key">{{ b.title }}</span>
                <span class="tok-dim">— {{ b.author }} · {{ b.status }} · \${{ b.price }}</span>
              </p>
            } @empty {
              <p class="lab-note">No books match these filters.</p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .filter-controls { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 640px; }
    @media (min-width: 640px) { .filter-controls { grid-template-columns: 1fr 1fr; } }
    .results-count { margin-top: 16px; font-size: 0.75rem; color: var(--text-faint); }
    .book-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .book-row { font-size: 0.8125rem; }
  `,
})
export class FilteringLab {
  protected readonly totalBooks = SAMPLE_BOOKS.length;

  protected readonly status = signal<StatusFilter>('any');
  protected readonly author = signal('');
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);

  protected readonly filteredBooks = computed(() => {
    const status = this.status();
    const author = this.author().trim().toLowerCase();
    const min = this.minPrice();
    const max = this.maxPrice();

    return SAMPLE_BOOKS.filter((b) => {
      if (status !== 'any' && b.status !== status) return false;
      if (author && !b.author.toLowerCase().includes(author)) return false;
      if (min !== null && b.price < min) return false;
      if (max !== null && b.price > max) return false;
      return true;
    });
  });

  protected readonly queryString = computed(() => {
    const parts: string[] = [];
    if (this.status() !== 'any') parts.push(`status=${this.status()}`);
    if (this.author().trim()) parts.push(`author=${this.author().trim()}`);
    if (this.minPrice() !== null) parts.push(`minPrice=${this.minPrice()}`);
    if (this.maxPrice() !== null) parts.push(`maxPrice=${this.maxPrice()}`);
    return parts.length ? `?${parts.join('&')}` : '';
  });

  onStatus(ev: Event): void {
    this.status.set((ev.target as HTMLSelectElement).value as StatusFilter);
  }

  onAuthor(ev: Event): void {
    this.author.set((ev.target as HTMLInputElement).value);
  }

  onMinPrice(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.minPrice.set(v === '' ? null : Number(v));
  }

  onMaxPrice(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.maxPrice.set(v === '' ? null : Number(v));
  }
}
