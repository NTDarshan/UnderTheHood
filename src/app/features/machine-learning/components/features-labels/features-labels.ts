import { Component, computed, signal } from '@angular/core';

type Role = 'feature' | 'label' | 'unmarked';
type ColumnKey = 'size' | 'bedrooms' | 'age' | 'location' | 'price';

type HouseRow = {
  size: number;
  bedrooms: number;
  age: number;
  location: string;
  price: string;
};

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'size', label: 'Size (sqft)' },
  { key: 'bedrooms', label: 'Bedrooms' },
  { key: 'age', label: 'Age (yrs)' },
  { key: 'location', label: 'Location' },
  { key: 'price', label: 'Price' },
];

const ROWS: HouseRow[] = [
  { size: 750, bedrooms: 1, age: 5, location: 'Suburb', price: '₹42L' },
  { size: 1200, bedrooms: 2, age: 12, location: 'City center', price: '₹80L' },
  { size: 900, bedrooms: 2, age: 3, location: 'Suburb', price: '₹65L' },
  { size: 1800, bedrooms: 3, age: 20, location: 'Outskirts', price: '₹1.2Cr' },
  { size: 2100, bedrooms: 4, age: 8, location: 'City center', price: '₹1.6Cr' },
  { size: 1450, bedrooms: 3, age: 15, location: 'Suburb', price: '₹95L' },
];

function nextRole(role: Role): Role {
  if (role === 'unmarked') return 'feature';
  if (role === 'feature') return 'label';
  return 'unmarked';
}

@Component({
  selector: 'app-features-labels',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="features-labels">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 004 — FEATURES AND LABELS</p>
        <h2 class="lab-title">The same table can be five different problems.</h2>
        <p class="lab-lede">
          Click any column header to cycle its role. Whatever you mark as the label is the thing the model is
          trying to predict — everything else marked as a feature is what it's allowed to use to predict it.
        </p>

        <div class="lab-panel">
          <div class="table-scroll">
            <table class="house-table mono">
              <thead>
                <tr>
                  @for (col of columns; track col.key) {
                    <th
                      [class.is-feature]="roles()[col.key] === 'feature'"
                      [class.is-label]="roles()[col.key] === 'label'"
                      (click)="cycleRole(col.key)"
                      role="button"
                      [attr.aria-pressed]="roles()[col.key] !== 'unmarked'"
                    >
                      {{ col.label }}
                      <span class="role-tag">
                        {{ roles()[col.key] === 'feature' ? 'FEATURE' : roles()[col.key] === 'label' ? 'LABEL' : '—' }}
                      </span>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of rows; track $index) {
                  <tr>
                    <td [class.is-feature]="roles()['size'] === 'feature'" [class.is-label]="roles()['size'] === 'label'">{{ row.size }}</td>
                    <td [class.is-feature]="roles()['bedrooms'] === 'feature'" [class.is-label]="roles()['bedrooms'] === 'label'">{{ row.bedrooms }}</td>
                    <td [class.is-feature]="roles()['age'] === 'feature'" [class.is-label]="roles()['age'] === 'label'">{{ row.age }}</td>
                    <td [class.is-feature]="roles()['location'] === 'feature'" [class.is-label]="roles()['location'] === 'label'">{{ row.location }}</td>
                    <td [class.is-feature]="roles()['price'] === 'feature'" [class.is-label]="roles()['price'] === 'label'">{{ row.price }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flow-row mono">
            <div class="flow-node flow-node-wide">FEATURES: {{ featureList() || '(none marked)' }}</div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node">MODEL</div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node flow-node-wide">TARGET: {{ labelName() || '(none marked)' }}</div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="applyPreset('price')">Predict Price</button>
            <button type="button" class="lab-btn" (click)="applyPreset('age')">Predict Age</button>
          </div>

          @if (presetMessage()) {
            <p class="lab-note">{{ presetMessage() }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .table-scroll { overflow-x: auto; }
    .house-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .house-table th, .house-table td {
      padding: 10px 14px;
      border: 1px solid var(--border);
      text-align: left;
      white-space: nowrap;
    }
    .house-table th {
      cursor: pointer;
      user-select: none;
      color: var(--text-muted);
      background: var(--surface);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .house-table th:hover { color: var(--text); }
    .house-table th.is-feature, .house-table td.is-feature {
      background: color-mix(in srgb, var(--accent-2) 10%, var(--surface));
    }
    .house-table th.is-feature { color: var(--accent-2); }
    .house-table th.is-label, .house-table td.is-label {
      background: color-mix(in srgb, var(--accent) 12%, var(--surface));
    }
    .house-table th.is-label { color: var(--accent-strong); }
    .role-tag { display: block; margin-top: 4px; font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .house-table th.is-feature .role-tag { color: var(--accent-2); }
    .house-table th.is-label .role-tag { color: var(--accent-strong); }

    .flow-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 26px; }
    .flow-node {
      padding: 10px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      color: var(--text);
    }
    .flow-node-wide { max-width: 320px; white-space: normal; }
  `,
})
export class FeaturesLabels {
  columns = COLUMNS;
  rows = ROWS;

  roles = signal<Record<ColumnKey, Role>>({
    size: 'feature',
    bedrooms: 'feature',
    age: 'feature',
    location: 'feature',
    price: 'label',
  });

  presetMessage = signal<string>('');

  featureList = computed(() =>
    this.columns
      .filter((c) => this.roles()[c.key] === 'feature')
      .map((c) => c.label)
      .join(', ')
  );

  labelName = computed(() => {
    const labelCol = this.columns.find((c) => this.roles()[c.key] === 'label');
    return labelCol ? labelCol.label : '';
  });

  cycleRole(key: ColumnKey): void {
    const current = this.roles();
    this.roles.set({ ...current, [key]: nextRole(current[key]) });
    this.presetMessage.set('');
  }

  applyPreset(target: 'price' | 'age'): void {
    const next: Record<ColumnKey, Role> = {
      size: 'feature',
      bedrooms: 'feature',
      age: 'feature',
      location: 'feature',
      price: 'feature',
    };
    next[target] = 'label';
    this.roles.set(next);
    this.presetMessage.set('The problem just changed — the model would now need completely different training.');
  }
}
