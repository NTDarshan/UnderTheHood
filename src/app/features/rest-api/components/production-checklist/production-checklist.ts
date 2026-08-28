import { Component, computed, signal } from '@angular/core';

interface ChecklistItem {
  id: string;
  label: string;
}

interface ChecklistGroup {
  id: string;
  label: string;
  items: ChecklistItem[];
}

const GROUPS: ChecklistGroup[] = [
  {
    id: 'resource-design',
    label: 'RESOURCE DESIGN',
    items: [
      { id: 'resource-urls', label: 'Resource-oriented URLs' },
      { id: 'consistent-naming', label: 'Consistent naming' },
      { id: 'clear-relationships', label: 'Clear relationships' },
      { id: 'avoid-deep-nesting', label: 'Avoid unnecessary deep nesting' },
    ],
  },
  {
    id: 'http',
    label: 'HTTP',
    items: [
      { id: 'correct-methods', label: 'Correct method semantics' },
      { id: 'correct-status', label: 'Correct status codes' },
      { id: 'idempotency', label: 'Idempotency understood' },
      { id: 'safe-methods', label: 'Safe methods understood' },
    ],
  },
  {
    id: 'list-apis',
    label: 'LIST APIs',
    items: [
      { id: 'pagination', label: 'Pagination' },
      { id: 'filtering', label: 'Filtering' },
      { id: 'sorting', label: 'Sorting' },
      { id: 'sane-limits', label: 'Sane limits' },
      { id: 'empty-collections', label: 'Empty collections return empty data' },
    ],
  },
  {
    id: 'contract',
    label: 'CONTRACT',
    items: [
      { id: 'consistent-fields', label: 'Consistent field names' },
      { id: 'consistent-shape', label: 'Consistent response shape' },
      { id: 'structured-errors', label: 'Structured errors' },
      { id: 'optional-required', label: 'Clear optional/required semantics' },
    ],
  },
  {
    id: 'security',
    label: 'SECURITY',
    items: [
      { id: 'authentication', label: 'Authentication' },
      { id: 'authorization', label: 'Authorization' },
      { id: 'validation', label: 'Validation' },
      { id: 'rate-limiting', label: 'Rate limiting where appropriate' },
      { id: 'no-sensitive-leak', label: 'No sensitive data leakage' },
    ],
  },
  {
    id: 'evolution',
    label: 'EVOLUTION',
    items: [
      { id: 'versioning-strategy', label: 'Versioning strategy' },
      { id: 'backward-compat', label: 'Backward compatibility' },
      { id: 'breaking-change-awareness', label: 'Breaking-change awareness' },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

@Component({
  selector: 'app-production-checklist',
  standalone: true,
  template: `
    <section class="lab-section" id="production-checklist">
      <div class="container">
        <p class="lab-index">REST API / 45 — PRODUCTION API CHECKLIST</p>
        <h2 class="lab-title">Before this API ships, check every box honestly.</h2>

        <div class="lab-panel">
          <p class="progress-line mono">{{ checkedCount() }} / {{ totalCount }} checked</p>

          @for (g of groups; track g.id) {
            <div class="group-block">
              <p class="group-label mono">{{ g.label }}</p>
              <div class="item-list">
                @for (item of g.items; track item.id) {
                  <label class="item-row">
                    <input type="checkbox" [checked]="checked()[item.id]" (change)="toggle(item.id)" />
                    <span>{{ item.label }}</span>
                  </label>
                }
              </div>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="reset()">↻ Reset</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .progress-line { font-size: 1rem; color: var(--accent-strong); }
    .group-block { margin-top: 28px; }
    .group-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.08em; margin-bottom: 12px; }
    .item-list { display: flex; flex-direction: column; gap: 8px; }
    .item-row { display: flex; align-items: center; gap: 10px; font-size: 0.875rem; color: var(--text-muted); }
    .item-row input { width: 16px; height: 16px; accent-color: var(--accent); }
  `,
})
export class ProductionChecklist {
  protected readonly groups = GROUPS;
  protected readonly totalCount = ALL_ITEMS.length;
  protected readonly checked = signal<Record<string, boolean>>(
    Object.fromEntries(ALL_ITEMS.map((i) => [i.id, false])),
  );

  protected readonly checkedCount = computed(() => Object.values(this.checked()).filter(Boolean).length);

  toggle(id: string): void {
    this.checked.update((c) => ({ ...c, [id]: !c[id] }));
  }

  reset(): void {
    this.checked.set(Object.fromEntries(ALL_ITEMS.map((i) => [i.id, false])));
  }
}
