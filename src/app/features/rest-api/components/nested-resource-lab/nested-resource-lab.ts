import { Component, computed, signal } from '@angular/core';

type Shape = 'flat' | 'nested';

interface ShapeInfo {
  id: Shape;
  url: string;
  label: string;
  pros: string[];
  cons: string[];
}

const SHAPES: ShapeInfo[] = [
  {
    id: 'nested',
    url: 'GET /books/42/reviews',
    label: 'Nested path',
    pros: [
      'Communicates the relationship strongly: a review belongs to exactly one book.',
      'The book ID is validated as part of routing — a natural place to 404 on a missing book.',
      'Reads naturally when reviews only ever make sense in the context of a book.',
    ],
    cons: [
      'Awkward if a review ever needs to be addressed on its own, e.g. GET /reviews/9 — now the same resource has two identities.',
      'Nesting can grow deep and unwieldy for further sub-resources (e.g. /books/42/reviews/9/replies).',
    ],
  },
  {
    id: 'flat',
    url: 'GET /reviews?bookId=42',
    label: 'Flat path with query filter',
    pros: [
      'Reviews are globally addressable resources: GET /reviews/9 is a stable, first-class identity.',
      'Filtering, sorting, and pagination compose naturally at one flat collection instead of duplicating them under every parent.',
      'Simpler when reviews are queried across many books, not just within one.',
    ],
    cons: [
      'The relationship to the book is implicit — a filter, not a structural fact of the URL.',
      'Nothing about the URL itself signals that "reviews belong to books" the way nesting does.',
    ],
  },
];

@Component({
  selector: 'app-nested-resource-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="nested-resources">
      <div class="container">
        <p class="lab-index">REST API / 34 — NESTED RESOURCE DESIGN</p>
        <h2 class="lab-title">"Get reviews for book 42." Two valid URLs, two different answers to "what is a review?"</h2>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (s of shapes; track s.id) {
              <button type="button" class="lab-btn" [class.is-active]="active() === s.id" (click)="active.set(s.id)">
                {{ s.label }}
              </button>
            }
          </div>

          <p class="lab-code"><span class="tok-method">{{ current().url.split(' ')[0] }}</span> {{ current().url.split(' ')[1] }}</p>

          <div class="compare-grid">
            <div class="compare-col">
              <p class="lab-node compare-heading">Why it fits</p>
              @for (p of current().pros; track p) {
                <p class="compare-line pill-yes-line">{{ p }}</p>
              }
            </div>
            <div class="compare-col">
              <p class="lab-node compare-heading">Where it strains</p>
              @for (c of current().cons; track c) {
                <p class="compare-line pill-no-line">{{ c }}</p>
              }
            </div>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Neither shape is universally correct. The deciding question is whether the sub-resource has independent
          identity and addressability — if a review is only ever meaningful attached to its book, nest it; if it is
          also queried, linked, and looked up on its own across the whole system, a flat collection with a filter is
          often simpler.
        </p>
      </div>
    </section>
  `,
  styles: `
    .compare-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 640px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-heading { margin-bottom: 10px; }
    .compare-col { padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .compare-line { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; padding-left: 14px; position: relative; margin-top: 8px; }
    .compare-line:first-of-type { margin-top: 0; }
    .compare-line::before { content: ''; position: absolute; left: 0; top: 8px; width: 5px; height: 5px; border-radius: 50%; }
    .pill-yes-line::before { background: var(--accent-2); }
    .pill-no-line::before { background: var(--text-faint); }
  `,
})
export class NestedResourceLab {
  protected readonly shapes = SHAPES;
  protected readonly active = signal<Shape>('nested');
  protected readonly current = computed(() => this.shapes.find((s) => s.id === this.active())!);
}
