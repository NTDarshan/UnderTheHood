import { Component, computed, signal } from '@angular/core';
import { EndpointDesign, HttpMethod, lintEndpoint } from '../../engine/rest-simulator';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

@Component({
  selector: 'app-api-linter',
  standalone: true,
  template: `
    <section class="lab-section" id="api-linter">
      <div class="container">
        <p class="lab-index">REST API / 30 — API DESIGN LINTER</p>
        <h2 class="lab-title">Describe an endpoint. The linter tells you exactly what's wrong with it.</h2>

        <div class="lab-panel">
          <div class="linter-grid">
            <div class="lab-field">
              <label for="lint-method">method</label>
              <select id="lint-method" [value]="method()" (change)="onMethod($event)">
                @for (m of methods; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
            <div class="lab-field">
              <label for="lint-path">path</label>
              <input id="lint-path" type="text" [value]="path()" (input)="onPath($event)" />
            </div>
            <div class="lab-field">
              <label for="lint-status">status code</label>
              <input id="lint-status" type="number" [value]="statusCode()" (input)="onStatus($event)" />
            </div>
          </div>

          <div class="toggle-row">
            <label class="toggle mono"><input type="checkbox" [checked]="hasPagination()" (change)="hasPagination.set(!hasPagination())" /> hasPagination</label>
            <label class="toggle mono"><input type="checkbox" [checked]="hasSorting()" (change)="hasSorting.set(!hasSorting())" /> hasSorting</label>
            <label class="toggle mono"><input type="checkbox" [checked]="sortFieldAllowed()" (change)="sortFieldAllowed.set(!sortFieldAllowed())" /> sortFieldAllowed</label>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="loadGood()">Try a good example</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="loadBad()">Try a bad example</button>
          </div>

          <p class="lab-node" style="margin-top: 24px;">LINT RESULTS</p>
          <div class="finding-list">
            @for (f of findings(); track f.id) {
              <p class="finding-row" [class.is-pass]="f.level === 'pass'" [class.is-warn]="f.level === 'warn'" [class.is-fail]="f.level === 'fail'">
                <span class="finding-marker mono">{{ f.level === 'pass' ? '✓' : f.level === 'warn' ? '⚠' : '✕' }}</span>
                {{ f.message }}
              </p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .linter-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .linter-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .toggle-row { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 20px; }
    .toggle { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }

    .finding-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .finding-row { font-size: 0.8125rem; display: flex; align-items: flex-start; gap: 8px; color: var(--text-muted); }
    .finding-marker { width: 16px; flex-shrink: 0; }
    .finding-row.is-pass { color: var(--accent-2); }
    .finding-row.is-warn { color: var(--accent); }
    .finding-row.is-fail { color: var(--danger); }
  `,
})
export class ApiLinter {
  protected readonly methods = METHODS;

  protected readonly method = signal<HttpMethod>('POST');
  protected readonly path = signal('/api/createBook');
  protected readonly statusCode = signal(200);
  protected readonly hasPagination = signal(false);
  protected readonly hasSorting = signal(false);
  protected readonly sortFieldAllowed = signal(true);

  protected readonly design = computed<EndpointDesign>(() => ({
    method: this.method(),
    path: this.path(),
    hasPagination: this.hasPagination(),
    hasSorting: this.hasSorting(),
    sortFieldAllowed: this.hasSorting() ? this.sortFieldAllowed() : undefined,
    statusCode: this.statusCode(),
  }));

  protected readonly findings = computed(() => lintEndpoint(this.design()));

  onMethod(ev: Event): void {
    this.method.set((ev.target as HTMLSelectElement).value as HttpMethod);
  }

  onPath(ev: Event): void {
    this.path.set((ev.target as HTMLInputElement).value);
  }

  onStatus(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    this.statusCode.set(Number.isFinite(v) ? v : 200);
  }

  loadGood(): void {
    this.method.set('GET');
    this.path.set('/api/v1/books/42');
    this.statusCode.set(200);
    this.hasPagination.set(false);
    this.hasSorting.set(false);
    this.sortFieldAllowed.set(true);
  }

  loadBad(): void {
    this.method.set('POST');
    this.path.set('/api/createBook');
    this.statusCode.set(200);
    this.hasPagination.set(false);
    this.hasSorting.set(false);
    this.sortFieldAllowed.set(true);
  }
}
