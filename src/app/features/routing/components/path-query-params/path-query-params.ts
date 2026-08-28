import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface QueryPair {
  key: string;
  value: string;
}

function parseUrl(url: string): { path: string; query: QueryPair[] } {
  const [path, qs = ''] = url.split('?');
  const query: QueryPair[] = qs
    ? qs.split('&').filter(Boolean).map((pair) => {
        const [key, value = ''] = pair.split('=');
        return { key, value };
      })
    : [];
  return { path: path || '/', query };
}

@Component({
  selector: 'app-path-query-params',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="path-params">
      <div class="container">
        <p class="lab-index">ROUTING / 04 — PATH PARAMETERS</p>
        <h2 class="lab-title">A path parameter identifies a specific resource.</h2>
        <p class="lab-lede">
          <span class="mono">/users/123</span> means "I want resource 123" — the value is part of the
          resource's identity, not an option you're toggling.
        </p>
        <app-explain-simply>
          A path parameter is like a house number — 123 Main Street is a specific place, not "a street,
          filtered to number 123."
        </app-explain-simply>
      </div>
    </section>

    <section class="lab-section" id="query-params">
      <div class="container">
        <p class="lab-index">ROUTING / 05 — QUERY PARAMETERS</p>
        <h2 class="lab-title">A query parameter modifies how a resource is returned.</h2>
        <p class="lab-lede">
          <span class="mono">/users?page=2&amp;sort=name</span> means "I want users — but paginated, and
          sorted a certain way." Query parameters filter, sort, paginate, or search; they don't usually
          change which resource you mean.
        </p>

        <app-explain-simply>
          If a path parameter is a house number, a query parameter is more like "please deliver after 5pm,
          and leave it with the neighbor" — instructions about the request, not part of the address itself.
        </app-explain-simply>

        <div class="url-editor">
          <label class="lab-field" for="url-breakdown-input">
            <span>Edit the URL</span>
            <input
              id="url-breakdown-input"
              type="text"
              class="mono"
              spellcheck="false"
              [ngModel]="url()"
              (ngModelChange)="url.set($event)"
            />
          </label>

          <div class="breakdown-grid">
            <div class="breakdown-col path-col">
              <p class="breakdown-heading mono">PATH</p>
              <p class="breakdown-value mono">{{ parsed().path }}</p>
              <p class="breakdown-meaning">Identifies the resource being addressed.</p>
            </div>
            <div class="breakdown-col query-col">
              <p class="breakdown-heading mono">QUERY</p>
              @if (parsed().query.length) {
                <ul class="query-list mono">
                  @for (q of parsed().query; track q.key) {
                    <li><span class="q-key">{{ q.key }}</span> = {{ q.value }}</li>
                  }
                </ul>
              } @else {
                <p class="breakdown-value mono empty">none</p>
              }
              <p class="breakdown-meaning">Filters, sorts, or paginates the response — optional by nature.</p>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Rule of thumb: if removing the value would ask for a <em>different resource entirely</em>, it's a
          path parameter. If removing it would still return the same kind of resource — just unfiltered or
          in a default order — it's a query parameter.
        </p>
      </div>
    </section>
  `,
  styles: `
    .url-editor {
      margin-top: 28px;
    }

    .url-editor .lab-field input {
      max-width: 480px;
    }

    .breakdown-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 640px) {
      .breakdown-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .breakdown-col {
      padding: 20px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      background: var(--surface-raised);
    }

    .path-col {
      border-left: 3px solid var(--accent);
    }

    .query-col {
      border-left: 3px solid var(--accent-2);
    }

    .breakdown-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-bottom: 10px;
    }

    .breakdown-value {
      font-size: 1rem;
      color: var(--text);
    }

    .breakdown-value.empty {
      color: var(--text-faint);
      font-size: 0.875rem;
    }

    .breakdown-meaning {
      margin-top: 12px;
      font-size: 0.8125rem;
      color: var(--text-faint);
      line-height: 1.5;
    }

    .query-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9375rem;
    }

    .q-key {
      color: var(--accent-2);
    }
  `,
})
export class PathQueryParams {
  protected url = signal('/users/123?role=admin&page=2');

  protected readonly parsed = computed(() => parseUrl(this.url()));
}
