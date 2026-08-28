import { Component, computed, signal } from '@angular/core';

interface Crime {
  id: string;
  code: string;
  explanation: string;
}

const CRIMES: Crime[] = [
  {
    id: 'verb-get',
    code: 'GET /getBooks',
    explanation: 'The verb "get" is redundant — the GET method already says this is a read. The URL should just name the resource: GET /books.',
  },
  {
    id: 'verb-post',
    code: 'POST /deleteBook',
    explanation: 'Using POST with a verb in the path to perform a delete ignores DELETE entirely and hides the real operation behind an ad-hoc endpoint name.',
  },
  {
    id: 'verb-get-delete',
    code: 'GET /books/42/delete',
    explanation: 'GET is defined as a safe method — it must not cause side effects. Triggering a delete on GET means the operation can be triggered by link prefetching, crawlers, or browser history alone.',
  },
  {
    id: 'sort-injection',
    code: 'GET /books?sort=anything',
    explanation: 'Passing a client-supplied field straight into a sort/query clause with no allowlist risks exposing internal field names or enabling injection-style abuse.',
  },
  {
    id: 'unbounded-limit',
    code: 'GET /books?limit=99999999',
    explanation: 'An unbounded or unchecked limit lets one request force the server to load and serialize a huge result set — a cheap way to degrade or take down the service.',
  },
  {
    id: 'inconsistent-naming',
    code: 'GET /book, POST /books, GET /Books/42',
    explanation: 'Three different casings and pluralizations for what should be the same resource. Inconsistent naming forces every client integration to memorize exceptions instead of a predictable pattern.',
  },
  {
    id: 'empty-404',
    code: 'GET /books (0 results) → 404 Not Found',
    explanation: 'An empty collection is still a successful lookup — it should return 200 OK with an empty array. 404 is for a specific resource that does not exist, not "nothing matched."',
  },
  {
    id: 'fake-200-error',
    code: '200 OK { "error": true, "message": "Book not found" }',
    explanation: 'Burying an error inside a 200 OK body defeats the entire point of HTTP status codes — clients, proxies, and monitoring all read the status first, and this one lies to all of them.',
  },
  {
    id: '500-for-validation',
    code: 'POST /books { title: "" } → 500 Internal Server Error',
    explanation: 'A missing required field is a predictable, client-caused problem — that is exactly what 400 (or 422) is for. 500 should be reserved for genuinely unexpected server failures.',
  },
  {
    id: 'inconsistent-fields',
    code: '{ "book_title": "..." } vs { "bookTitle": "..." } across endpoints',
    explanation: 'The same concept named differently in different responses forces every consumer to maintain a mental mapping table instead of relying on one consistent field name.',
  },
  {
    id: 'leaky-entities',
    code: '{ "id": 42, "passwordHash": "...", "internalFlags": 7 }',
    explanation: 'Returning the raw database entity leaks internal-only fields (password hashes, internal flags, foreign keys meant for joins) that were never meant to cross the API boundary.',
  },
];

@Component({
  selector: 'app-api-crime-scene',
  standalone: true,
  template: `
    <section class="lab-section" id="crime-scene">
      <div class="container">
        <p class="lab-index">REST API / 36 — API CRIME SCENE</p>
        <h2 class="lab-title">Eleven real API design crimes. Click each to see the case file.</h2>
        <p class="lab-lede">Investigated {{ investigated().size }} / {{ crimes.length }}.</p>

        <div class="lab-panel">
          <div class="crime-grid">
            @for (c of crimes; track c.id) {
              <button type="button" class="crime-card" [class.is-investigated]="investigated().has(c.id)" (click)="investigate(c.id)">
                <p class="lab-code crime-code">{{ c.code }}</p>
                @if (investigated().has(c.id)) {
                  <p class="crime-explanation">{{ c.explanation }}</p>
                } @else {
                  <p class="crime-hint mono">Click to investigate →</p>
                }
              </button>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .crime-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .crime-grid { grid-template-columns: 1fr 1fr; } }

    .crime-card { text-align: left; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-elevated); transition: border-color 0.15s ease; }
    .crime-card:hover { border-color: var(--accent); }
    .crime-card.is-investigated { border-color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 6%, var(--surface-elevated)); }

    .crime-code { margin: 0; background: transparent; border: none; padding: 0; font-size: 0.8125rem; }
    .crime-hint { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); }
    .crime-explanation { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class ApiCrimeScene {
  protected readonly crimes = CRIMES;
  protected readonly investigated = signal<ReadonlySet<string>>(new Set());

  investigate(id: string): void {
    const next = new Set(this.investigated());
    next.add(id);
    this.investigated.set(next);
  }
}
