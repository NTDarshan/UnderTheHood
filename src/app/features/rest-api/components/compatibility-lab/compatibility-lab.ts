import { Component, computed, signal } from '@angular/core';
import { CONTRACT_CHANGES, ContractChange } from '../../engine/rest-simulator';

interface Example {
  before: string;
  after: string;
}

const EXAMPLES: Record<string, Example> = {
  'add-optional': { before: '{ "name": "John" }', after: '{ "name": "John", "nickname": "Johnny" }' },
  'add-required': { before: 'POST /books { "title": "Dune" }', after: 'POST /books requires { "title": "Dune", "isbn": "..." } — old clients omit isbn and now fail' },
  'remove-field': { before: '{ "name": "John", "age": 34 }', after: '{ "name": "John" } — clients reading .age now get undefined' },
  'rename-field': { before: '{ "name": "John" }', after: '{ "fullName": "John" } — clients reading .name now get undefined' },
  'change-type': { before: '{ "price": "450" }', after: '{ "price": 450 } — a client expecting a string sees a number instead' },
  'widen-enum': { before: 'status: "published" | "draft"', after: 'status: "published" | "draft" | "archived" — a switch without a default silently mishandles "archived"' },
  'add-endpoint': { before: '(no /books/:id/reviews endpoint exists)', after: 'GET /books/:id/reviews — new, nothing existing depended on it' },
};

@Component({
  selector: 'app-compatibility-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="compatibility">
      <div class="container">
        <p class="lab-index">REST API / 26 — BACKWARD COMPATIBILITY</p>
        <h2 class="lab-title">Some changes are free. Some quietly break every client that trusted you.</h2>
        <p class="lab-lede">Pick a kind of contract change below. The classification isn't a guess — it comes from how existing clients would actually behave when it ships.</p>

        <div class="lab-panel">
          <p class="lab-node">TRY IT — PICK A CHANGE</p>
          <div class="change-list">
            @for (c of changes; track c.id) {
              <button type="button" class="change-card" [class.is-active]="selected().id === c.id" (click)="selected.set(c)">
                <span class="change-label">{{ c.label }}</span>
                <span class="pill" [class.pill-yes]="c.safety === 'safe'" [class.pill-conditional]="c.safety === 'warning'" [class.pill-no]="c.safety === 'breaking'">
                  {{ c.safety === 'safe' ? 'Safe' : c.safety === 'warning' ? 'Warning' : 'Breaking' }}
                </span>
              </button>
            }
          </div>

          <p class="lab-note" style="margin-top: 20px;">{{ selected().explanation }}</p>

          <p class="lab-node" style="margin-top: 20px;">BEFORE</p>
          <p class="lab-code">{{ example().before }}</p>
          <p class="lab-node" style="margin-top: 14px;">AFTER</p>
          <p class="lab-code">{{ example().after }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .change-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .change-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
    .change-card.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
    .change-label { font-size: 0.875rem; }
  `,
})
export class CompatibilityLab {
  protected readonly changes = CONTRACT_CHANGES;
  protected readonly selected = signal<ContractChange>(CONTRACT_CHANGES[0]);

  protected readonly example = computed(() => EXAMPLES[this.selected().id] ?? EXAMPLES['add-optional']);
}
