import { Component } from '@angular/core';

interface BookRow {
  title: string;
  author: string;
  category: string;
  price: string;
}

const BOOKS: BookRow[] = [
  { title: 'Clean Code', author: 'Robert Martin', category: 'Programming', price: '$35' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', category: 'Architecture', price: '$49' },
  { title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', category: 'Programming', price: '$41' },
];

@Component({
  selector: 'app-crud-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section cr-scene" id="crud-hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">CRUD</p>
        <h1 class="hero-title">Almost every feature eventually becomes CRUD.</h1>
        <p class="hero-lede">
          Create. Read. Update. Delete. Four simple operations that quietly power thousands of features inside
          modern applications.
        </p>

        <div class="lab-panel app-preview" aria-label="Mini preview of a books library app">
          <div class="app-chrome">
            <span class="app-dot" aria-hidden="true"></span>
            <span class="app-dot" aria-hidden="true"></span>
            <span class="app-dot" aria-hidden="true"></span>
            <span class="app-title mono">BOOKS</span>
          </div>

          <div class="app-toolbar">
            <div class="fake-input mono" aria-hidden="true">
              <span class="fake-icon">&#9906;</span>
              <span class="fake-placeholder">Search by title or author&hellip;</span>
            </div>
            <button type="button" class="lab-btn lab-btn-primary" disabled aria-disabled="true">+ Add Book</button>
          </div>

          <ul class="book-list">
            @for (book of books; track book.title) {
              <li class="book-row">
                <div class="book-main">
                  <span class="book-title">{{ book.title }}</span>
                  <span class="book-author mono">{{ book.author }}</span>
                </div>
                <span class="pill book-category mono">{{ book.category }}</span>
                <span class="book-price mono">{{ book.price }}</span>
              </li>
            }
          </ul>
        </div>

        <p class="watch-line mono">Now watch what happens underneath.</p>

        <div class="cta-row">
          <a class="lab-btn lab-btn-primary" href="#why-crud-exists" (click)="scrollToNext($event)">Explore CRUD &rarr;</a>
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

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { color: var(--cr-accent); margin-bottom: 16px; }
    .eyebrow::before { background: var(--cr-accent); box-shadow: 0 0 8px color-mix(in srgb, var(--cr-accent) 45%, transparent); }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 820px; }
    .hero-lede { margin-top: 18px; max-width: 660px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

    .app-preview { margin-top: 40px; max-width: 560px; padding: 0; overflow: hidden; }

    .app-chrome {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .app-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); }
    .app-title { margin-left: 8px; font-size: 0.6875rem; letter-spacing: 0.14em; color: var(--text-faint); }

    .app-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .fake-input {
      flex: 1;
      min-width: 160px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--text-faint);
      font-size: 0.75rem;
    }
    .fake-icon { opacity: 0.6; }
    .app-toolbar .lab-btn { opacity: 0.75; cursor: default; }

    .book-list { padding: 8px 20px 20px; }
    .book-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
    }
    .book-row:last-child { border-bottom: none; }
    .book-main { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .book-title { font-size: 0.9375rem; font-weight: 600; color: var(--text); }
    .book-author { font-size: 0.6875rem; color: var(--text-faint); }
    .book-category { flex-shrink: 0; color: var(--cr-cyan); border-color: var(--accent-2-dim); }
    .book-price { flex-shrink: 0; font-size: 0.8125rem; color: var(--text-muted); min-width: 42px; text-align: right; }

    .watch-line { margin-top: 28px; font-size: 0.8125rem; letter-spacing: 0.06em; color: var(--text-faint); text-transform: uppercase; }

    .cta-row { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 12px; }
  `,
})
export class CrudHero {
  protected readonly books = BOOKS;

  protected scrollToNext(event: Event): void {
    event.preventDefault();
    const target = document.getElementById('why-crud-exists');
    if (!target) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}
