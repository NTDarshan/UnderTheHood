import { Component, computed, signal } from '@angular/core';

interface Toggle {
  id: string;
  label: string;
  onNote: string;
  offNote: string;
}

const TOGGLES: Toggle[] = [
  { id: 'resource-url', label: 'Resource-oriented URL', onNote: 'Paths name resources, not actions — e.g. /books, not /getBooks.', offNote: 'URLs likely embed verbs or actions instead of naming resources.' },
  { id: 'method-semantics', label: 'Correct HTTP method semantics', onNote: 'GET/POST/PUT/PATCH/DELETE are used the way clients and caches expect.', offNote: 'Methods may be used in ways that surprise clients, proxies, or caches.' },
  { id: 'pagination', label: 'Pagination present', onNote: 'Collection endpoints cap result size instead of returning everything.', offNote: 'A large collection could return an unbounded, unpageable result set.' },
  { id: 'sort-allowlist', label: 'Sort field allowlisted', onNote: 'Sort fields are checked against a server allowlist before hitting the query.', offNote: 'A client-supplied sort field could reach the query unchecked.' },
  { id: 'field-naming', label: 'Consistent field naming', onNote: 'Field casing and naming stay uniform across every endpoint.', offNote: 'Field names likely drift between camelCase, snake_case, and abbreviations.' },
  { id: 'structured-errors', label: 'Structured error responses', onNote: 'Errors return a predictable shape clients can parse programmatically.', offNote: 'Error responses may be ad hoc strings clients cannot reliably parse.' },
  { id: 'versioning', label: 'Versioning strategy chosen', onNote: 'A deliberate versioning approach exists for when the contract must change.', offNote: 'No plan exists for introducing a breaking change safely.' },
  { id: 'no-sensitive-leak', label: 'No sensitive data leakage', onNote: 'Responses withhold passwords, tokens, and internal fields clients should never see.', offNote: 'A response may be leaking fields that should never reach a client.' },
];

@Component({
  selector: 'app-api-design-score',
  standalone: true,
  template: `
    <section class="lab-section" id="design-score">
      <div class="container">
        <p class="lab-index">REST API / 43 — API DESIGN SCORE</p>
        <h2 class="lab-title">Toggle the decisions. Watch the score move.</h2>
        <p class="lab-lede">Flip each design decision on or off as if it were true of your API right now.</p>

        <div class="lab-panel">
          <p class="score-display mono">API DESIGN QUALITY: {{ score() }} / 100</p>
          <p class="lab-note"><strong>UnderTheHood Design Heuristic</strong> — this is not an objective industry-standard score. It's a simple teaching heuristic: each toggle is worth an equal share of 100 points, meant to make tradeoffs visible, not to certify an API as "good" or "bad."</p>

          <div class="toggle-list">
            @for (t of toggles; track t.id) {
              <label class="toggle-row">
                <input type="checkbox" [checked]="state()[t.id]" (change)="flip(t.id)" />
                <span class="toggle-label">{{ t.label }}</span>
              </label>
            }
          </div>

          <div class="category-list">
            @for (t of toggles; track t.id) {
              <p class="category-row" [class.is-earning]="state()[t.id]" [class.is-losing]="!state()[t.id]">
                <span class="pill" [class.pill-yes]="state()[t.id]" [class.pill-no]="!state()[t.id]">{{ state()[t.id] ? 'EARNING' : 'LOSING' }}</span>
                {{ t.label }} — {{ state()[t.id] ? t.onNote : t.offNote }}
              </p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .score-display { font-size: 1.5rem; color: var(--accent-strong); }
    .toggle-list { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
    .toggle-row { display: flex; align-items: center; gap: 10px; font-size: 0.875rem; color: var(--text); }
    .toggle-row input { width: 16px; height: 16px; accent-color: var(--accent); }

    .category-list { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
    .category-row { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; display: flex; align-items: baseline; gap: 10px; }
    .category-row .pill { flex-shrink: 0; }
  `,
})
export class ApiDesignScore {
  protected readonly toggles = TOGGLES;
  protected readonly state = signal<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.id, true])),
  );

  protected readonly score = computed(() => {
    const s = this.state();
    const onCount = TOGGLES.filter((t) => s[t.id]).length;
    return Math.round((onCount / TOGGLES.length) * 100);
  });

  flip(id: string): void {
    this.state.update((s) => ({ ...s, [id]: !s[id] }));
  }
}
