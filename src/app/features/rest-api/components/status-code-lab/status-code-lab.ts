import { Component, computed, signal } from '@angular/core';
import { STATUS_CODES, StatusCodeInfo } from '../../engine/rest-simulator';

const CATEGORY_LABEL: Record<StatusCodeInfo['category'], string> = {
  success: '2xx — Success',
  'client-error': '4xx — Client Error',
  'server-error': '5xx — Server Error',
};

@Component({
  selector: 'app-status-code-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="status-codes">
      <div class="container">
        <p class="lab-index">REST API / 15 — STATUS CODE LABORATORY</p>
        <h2 class="lab-title">Every status code is a promise about what happened.</h2>
        <p class="lab-lede">Click any code to see exactly when to use it.</p>

        <div class="lab-panel">
          @for (cat of categories; track cat) {
            <p class="lab-node category-label" [class.tok-status-ok]="cat === 'success'" [class.tok-status-err]="cat !== 'success'">{{ categoryLabel(cat) }}</p>
            <div class="code-grid">
              @for (c of byCategory(cat); track c.code) {
                <button type="button" class="code-card" [class.is-active]="selected() === c.code" (click)="selected.set(c.code)">
                  <span class="code-number" [class.tok-status-ok]="c.category === 'success'" [class.tok-status-err]="c.category !== 'success'">{{ c.code }}</span>
                  <span class="code-label mono">{{ c.label }}</span>
                </button>
              }
            </div>
          }

          @if (selectedInfo(); as info) {
            <div class="detail-card">
              <p class="lab-node">{{ info.code }} {{ info.label }}</p>
              <p class="detail-meaning">{{ info.meaning }}</p>
              <p class="detail-when"><strong>When to use:</strong> {{ info.whenToUse }}</p>
              <p class="lab-code">{{ info.example }}</p>
            </div>
          }
        </div>

        <div class="lab-panel">
          <p class="lab-note lab-note-warn spotlight-note">
            <strong>The single most important status-code distinction in this whole lab:</strong>
            a missing individual resource is <strong>404</strong>. A collection with zero matches is still <strong>200</strong>.
          </p>
          <div class="compare-grid">
            <div class="compare-card">
              <p class="lab-node">SINGLE RESOURCE, MISSING</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books/999999</span> <span class="tok-dim">→</span> <span class="tok-status-err">404 Not Found</span></p>
              <p class="lab-note">This specific book does not exist. There is nothing to return.</p>
            </div>
            <div class="compare-card">
              <p class="lab-node">COLLECTION, ZERO MATCHES</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books?status=archived</span> <span class="tok-dim">→</span> <span class="tok-status-ok">200 OK</span></p>
              <p class="lab-code">{{ '{ "data": [] }' }}</p>
              <p class="lab-note">The query succeeded. It just found nothing that matched — an empty array is a valid, successful result, not an error.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .category-label { margin-top: 24px; }
    .category-label:first-child { margin-top: 0; }
    .code-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 12px; }
    .code-card { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); align-items: flex-start; }
    .code-card:hover { border-color: var(--accent-dim); }
    .code-card.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
    .code-number { font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; }
    .code-label { font-size: 0.75rem; color: var(--text-muted); }

    .detail-card { margin-top: 28px; padding: 18px 20px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .detail-meaning { margin-top: 10px; font-size: 0.9375rem; color: var(--text); }
    .detail-when { margin-top: 10px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

    .spotlight-note { max-width: none; font-size: 0.9375rem; }
    .compare-grid { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .compare-card { padding: 18px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    @media (max-width: 640px) {
      .compare-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class StatusCodeLab {
  protected readonly categories: StatusCodeInfo['category'][] = ['success', 'client-error', 'server-error'];
  protected readonly selected = signal<number>(200);

  protected readonly selectedInfo = computed(() => STATUS_CODES.find((c) => c.code === this.selected()) ?? null);

  protected byCategory(cat: StatusCodeInfo['category']): StatusCodeInfo[] {
    return STATUS_CODES.filter((c) => c.category === cat);
  }

  protected categoryLabel(cat: StatusCodeInfo['category']): string {
    return CATEGORY_LABEL[cat];
  }
}
