import { Component, computed, signal } from '@angular/core';
import { HeaderCategory, headerCategoryInfo, httpHeaders } from '../../../../data/http/http-headers.data';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const CATEGORIES: HeaderCategory[] = ['general', 'request', 'response', 'representation'];

@Component({
  selector: 'app-header-catalog',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="headers">
      <div class="container">
        <p class="lab-index">HTTP / 05 — HEADERS</p>
        <h2 class="lab-title">Headers carry the metadata — everything about the message that isn't the message itself.</h2>
        <p class="lab-lede">
          A method and a target say what's happening. Headers say everything else: who's asking, what
          format they want, how to cache it, how it's encoded. Browse by category, then pick a header.
        </p>

        <app-explain-simply>
          Headers are like the label stuck on a package — sender, contents, handling instructions — kept
          separate from what's actually inside the box. You can read the label without opening the package.
        </app-explain-simply>

        <div class="category-tabs mono" role="tablist">
          @for (cat of categories; track cat) {
            <button type="button" role="tab" class="lab-btn" [class.is-active]="selectedCategory() === cat" (click)="selectCategory(cat)">
              {{ categoryInfo[cat].label }}
            </button>
          }
        </div>

        <div class="lab-panel">
          <p class="category-blurb">{{ categoryInfo[selectedCategory()].blurb }}</p>

          <div class="header-chip-row">
            @for (h of visibleHeaders(); track h.name) {
              <button type="button" class="header-chip mono" [class.is-selected]="selectedHeader()?.name === h.name" (click)="selectedHeaderName.set(h.name)">
                {{ h.name }}
              </button>
            }
          </div>

          @if (selectedHeader(); as h) {
            <div class="header-detail">
              <p class="header-example mono">{{ h.example }}</p>
              <p class="header-description">{{ h.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .category-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 28px;
    }

    .category-blurb {
      color: var(--text-muted);
      font-size: 0.9375rem;
      max-width: 600px;
    }

    .header-chip-row {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .header-chip {
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      color: var(--text-muted);
      font-size: 0.8125rem;
    }

    .header-chip:hover {
      border-color: var(--accent);
    }

    .header-chip.is-selected {
      border-color: var(--accent);
      color: var(--accent-strong);
      background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated));
    }

    .header-detail {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    .header-example {
      color: var(--accent-2);
      font-size: 0.875rem;
      margin-bottom: 10px;
    }

    .header-description {
      color: var(--text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
      max-width: 560px;
    }
  `,
})
export class HeaderCatalog {
  protected readonly categories = CATEGORIES;
  protected readonly categoryInfo = headerCategoryInfo;

  protected readonly selectedCategory = signal<HeaderCategory>('request');
  protected readonly selectedHeaderName = signal('Host');

  protected readonly visibleHeaders = computed(() =>
    httpHeaders.filter((h) => h.category === this.selectedCategory()),
  );

  protected readonly selectedHeader = computed(() =>
    this.visibleHeaders().find((h) => h.name === this.selectedHeaderName()),
  );

  selectCategory(cat: HeaderCategory): void {
    this.selectedCategory.set(cat);
    const first = httpHeaders.find((h) => h.category === cat);
    if (first) this.selectedHeaderName.set(first.name);
  }
}
