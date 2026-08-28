import { Component, computed, signal } from '@angular/core';
import { lintUrl } from '../../engine/rest-simulator';

interface FieldCheck {
  id: string;
  label: string;
  level: 'pass' | 'warn' | 'fail';
  message: string;
}

@Component({
  selector: 'app-final-challenge',
  standalone: true,
  template: `
    <section class="lab-section" id="final-challenge">
      <div class="container">
        <p class="lab-index">REST API / 51 — BUILD YOUR API: FINAL CHALLENGE</p>
        <h2 class="lab-title">Design a Book Management API.</h2>
        <p class="lab-lede">Requirements: list books, get one book, create a book, update a book's title, delete a book, filter books by author, sort by creation date, paginate results, and return appropriate errors.</p>

        <div class="lab-panel">
          <h3 class="sub-heading">List books (filter, sort, paginate)</h3>
          <div class="lab-field">
            <label for="list-url">Full URL</label>
            <input id="list-url" type="text" [value]="listUrl()" (input)="listUrl.set(input($event))" />
          </div>

          <h3 class="sub-heading" style="margin-top: 28px;">Create a book</h3>
          <div class="pair-fields">
            <div class="lab-field">
              <label for="create-method">Method</label>
              <input id="create-method" type="text" [value]="createMethod()" (input)="createMethod.set(input($event))" />
            </div>
            <div class="lab-field">
              <label for="create-url">URL</label>
              <input id="create-url" type="text" [value]="createUrl()" (input)="createUrl.set(input($event))" />
            </div>
          </div>

          <h3 class="sub-heading" style="margin-top: 28px;">Update a book's title</h3>
          <div class="pair-fields">
            <div class="lab-field">
              <label for="update-method">Method</label>
              <input id="update-method" type="text" [value]="updateMethod()" (input)="updateMethod.set(input($event))" />
            </div>
            <div class="lab-field">
              <label for="update-url">URL</label>
              <input id="update-url" type="text" [value]="updateUrl()" (input)="updateUrl.set(input($event))" />
            </div>
          </div>

          <h3 class="sub-heading" style="margin-top: 28px;">Delete a book</h3>
          <div class="pair-fields">
            <div class="lab-field">
              <label for="delete-method">Method</label>
              <input id="delete-method" type="text" [value]="deleteMethod()" (input)="deleteMethod.set(input($event))" />
            </div>
            <div class="lab-field">
              <label for="delete-url">URL</label>
              <input id="delete-url" type="text" [value]="deleteUrl()" (input)="deleteUrl.set(input($event))" />
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="check()">Check My Design</button>
            <button type="button" class="lab-btn" (click)="toggleSolution()">{{ showSolution() ? 'Hide' : 'Show' }} Recommended Solution</button>
          </div>

          @if (checked()) {
            <div class="result-list">
              @for (r of results(); track r.id) {
                <p class="result-row">
                  <span class="pill" [class.pill-yes]="r.level === 'pass'" [class.pill-conditional]="r.level === 'warn'" [class.pill-no]="r.level === 'fail'">{{ r.level.toUpperCase() }}</span>
                  <strong>{{ r.label }}</strong> — {{ r.message }}
                </p>
              }
            </div>
          }

          @if (showSolution()) {
            <div class="solution-box">
              <p class="solution-title mono">RECOMMENDED SOLUTION</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/api/v1/books?author=X&amp;sortBy=createdAt&amp;page=1&amp;limit=20</span></p>
              <p class="lab-code"><span class="tok-method">POST</span> <span class="tok-key">/api/v1/books</span></p>
              <p class="lab-code"><span class="tok-method">PATCH</span> <span class="tok-key">/api/v1/books/{{ '{' }}id{{ '}' }}</span></p>
              <p class="lab-code"><span class="tok-method">DELETE</span> <span class="tok-key">/api/v1/books/{{ '{' }}id{{ '}' }}</span></p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .sub-heading { font-size: 1rem; color: var(--text); margin-bottom: 12px; }
    .pair-fields { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 640px) { .pair-fields { grid-template-columns: 140px 1fr; } }

    .result-list { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
    .result-row { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; display: flex; align-items: baseline; gap: 10px; }
    .result-row strong { color: var(--text); }
    .result-row .pill { flex-shrink: 0; }

    .solution-box { margin-top: 24px; padding: 18px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .solution-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 12px; }
    .solution-box .lab-code { margin-top: 8px; }
  `,
})
export class FinalChallenge {
  protected readonly listUrl = signal('/api/v1/books?author=martin&sortBy=createdAt&page=1&limit=20');
  protected readonly createMethod = signal('POST');
  protected readonly createUrl = signal('/api/v1/books');
  protected readonly updateMethod = signal('PATCH');
  protected readonly updateUrl = signal('/api/v1/books/42');
  protected readonly deleteMethod = signal('DELETE');
  protected readonly deleteUrl = signal('/api/v1/books/42');

  protected readonly checked = signal(false);
  protected readonly showSolution = signal(false);

  protected readonly results = computed<FieldCheck[]>(() => {
    const out: FieldCheck[] = [];

    const listWarnings = lintUrl(this.listUrl());
    const listHasQuery = this.listUrl().includes('?');
    if (!listHasQuery) {
      out.push({ id: 'list', label: 'List books', level: 'fail', message: 'No query string found — filtering, sorting, and pagination all rely on query parameters.' });
    } else if (listWarnings.length > 0) {
      out.push({ id: 'list', label: 'List books', level: 'warn', message: listWarnings.map((w) => w.message).join(' ') });
    } else {
      out.push({ id: 'list', label: 'List books', level: 'pass', message: 'Resource-oriented path with query parameters for filter/sort/pagination.' });
    }

    const createWarnings = lintUrl(this.createUrl());
    if (this.createMethod().trim().toUpperCase() !== 'POST') {
      out.push({ id: 'create', label: 'Create a book', level: 'fail', message: 'Creating a new resource in a collection is conventionally POST.' });
    } else if (!/^\/[a-z0-9/-]*books\/?$/i.test(this.createUrl().split('?')[0])) {
      out.push({ id: 'create', label: 'Create a book', level: 'warn', message: 'Expected the path to end at the collection itself (…/books), not an individual item.' });
    } else if (createWarnings.length > 0) {
      out.push({ id: 'create', label: 'Create a book', level: 'warn', message: createWarnings.map((w) => w.message).join(' ') });
    } else {
      out.push({ id: 'create', label: 'Create a book', level: 'pass', message: 'POST against the collection path — correct method and correct shape.' });
    }

    const updateMethodOk = ['PUT', 'PATCH'].includes(this.updateMethod().trim().toUpperCase());
    if (!updateMethodOk) {
      out.push({ id: 'update', label: "Update a book's title", level: 'fail', message: 'Updating one field should use PUT (full replace) or PATCH (partial update), not ' + this.updateMethod() + '.' });
    } else if (!/\/\d+$|\/\{?id\}?$/i.test(this.updateUrl().split('?')[0])) {
      out.push({ id: 'update', label: "Update a book's title", level: 'warn', message: 'Expected the path to target one specific book by ID (…/books/{id}).' });
    } else if (this.updateMethod().trim().toUpperCase() === 'PUT') {
      out.push({ id: 'update', label: "Update a book's title", level: 'warn', message: 'PUT works, but sending only the title risks wiping other fields if the server treats it as a full replace — PATCH is the safer fit for updating one field.' });
    } else {
      out.push({ id: 'update', label: "Update a book's title", level: 'pass', message: 'PATCH against a single resource — a partial update, correctly scoped to one field.' });
    }

    if (this.deleteMethod().trim().toUpperCase() !== 'DELETE') {
      out.push({ id: 'delete', label: 'Delete a book', level: 'fail', message: 'Removing a resource is conventionally DELETE, not ' + this.deleteMethod() + '.' });
    } else if (!/\/\d+$|\/\{?id\}?$/i.test(this.deleteUrl().split('?')[0])) {
      out.push({ id: 'delete', label: 'Delete a book', level: 'warn', message: 'Expected the path to target one specific book by ID (…/books/{id}).' });
    } else {
      out.push({ id: 'delete', label: 'Delete a book', level: 'pass', message: 'DELETE against a single resource — correct method and correct shape.' });
    }

    return out;
  });

  input(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  check(): void {
    this.checked.set(true);
  }

  toggleSolution(): void {
    this.showSolution.update((s) => !s);
  }
}
