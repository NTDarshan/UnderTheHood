import { Component, computed, signal } from '@angular/core';
import { HttpMethod, METHOD_INFO } from '../../engine/rest-simulator';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

@Component({
  selector: 'app-api-design-studio',
  standalone: true,
  template: `
    <section class="lab-section" id="api-design-studio">
      <div class="container">
        <p class="lab-index">REST API / 29 — THE API DESIGN STUDIO</p>
        <h2 class="lab-title">Build an endpoint from scratch. Watch the request and response take shape.</h2>
        <p class="lab-lede">Every field below feeds directly into the generated URL and the generated request/response pair — this is a request builder, not a slideshow.</p>

        <div class="lab-panel">
          <div class="studio-grid">
            <div class="lab-field">
              <label for="resource-input">resource</label>
              <input id="resource-input" type="text" [value]="resource()" (input)="onResource($event)" />
            </div>
            <div class="lab-field">
              <label for="method-select">method</label>
              <select id="method-select" [value]="method()" (change)="onMethod($event)">
                @for (m of methods; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
            <div class="lab-field">
              <label for="id-input">resource id (optional)</label>
              <input id="id-input" type="text" [value]="resourceId()" (input)="onResourceId($event)" placeholder="e.g. 42" />
            </div>
            <div class="lab-field">
              <label for="nested-input">nested resource (optional)</label>
              <input id="nested-input" type="text" [value]="nested()" (input)="onNested($event)" placeholder="e.g. reviews" />
            </div>
          </div>

          @if (isCollectionGet()) {
            <p class="lab-node" style="margin-top: 20px;">COLLECTION QUERY OPTIONS</p>
            <div class="toggle-row">
              <label class="toggle mono"><input type="checkbox" [checked]="pagination()" (change)="pagination.set(!pagination())" /> pagination</label>
              <label class="toggle mono"><input type="checkbox" [checked]="sorting()" (change)="sorting.set(!sorting())" /> sorting</label>
              <label class="toggle mono"><input type="checkbox" [checked]="filtering()" (change)="filtering.set(!filtering())" /> filtering</label>
            </div>
          }

          <p class="lab-node" style="margin-top: 24px;">GENERATED ENDPOINT</p>
          <p class="lab-code"><span class="tok-method">{{ method() }}</span> <span class="tok-key">{{ generatedUrl() }}</span></p>

          <p class="lab-node" style="margin-top: 20px;">GENERATED REQUEST</p>
          <p class="lab-code">{{ requestPreview() }}</p>

          <p class="lab-node" style="margin-top: 20px;">GENERATED RESPONSE</p>
          <p class="lab-code"><span [class]="statusCode() < 400 ? 'tok-status-ok' : 'tok-status-err'">{{ statusCode() }} {{ statusLabel() }}</span>
{{ responsePreview() }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .studio-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 4px; }
    @media (min-width: 640px) { .studio-grid { grid-template-columns: 1fr 1fr; } }
    .toggle-row { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 12px; }
    .toggle { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class ApiDesignStudio {
  protected readonly methods = METHODS;

  protected readonly resource = signal('books');
  protected readonly resourceId = signal('');
  protected readonly method = signal<HttpMethod>('GET');
  protected readonly nested = signal('');

  protected readonly pagination = signal(true);
  protected readonly sorting = signal(false);
  protected readonly filtering = signal(false);

  protected readonly isCollectionGet = computed(() => this.method() === 'GET' && this.resourceId().trim() === '');

  protected readonly queryParams = computed(() => {
    if (!this.isCollectionGet()) return '';
    const parts: string[] = [];
    if (this.pagination()) parts.push('page=2', 'limit=20');
    if (this.sorting()) parts.push('sortBy=createdAt');
    if (this.filtering()) parts.push('status=published');
    return parts.length ? `?${parts.join('&')}` : '';
  });

  protected readonly generatedUrl = computed(() => {
    const resource = this.resource().trim() || 'resource';
    const id = this.resourceId().trim();
    const nested = this.nested().trim();
    let path = `/api/v1/${resource}`;
    if (id) path += `/${id}`;
    if (nested) path += `/${nested}`;
    return path + this.queryParams();
  });

  protected readonly statusCode = computed(() => METHOD_INFO[this.method()].typicalStatus);
  protected readonly statusLabel = computed(() => (this.statusCode() === 200 ? 'OK' : this.statusCode() === 201 ? 'Created' : this.statusCode() === 204 ? 'No Content' : ''));

  protected readonly sampleBody = computed(() => {
    const resource = this.resource().trim() || 'resource';
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    return `{ "${singular}Name": "New ${singular}", "price": 499 }`;
  });

  protected readonly requestPreview = computed(() => {
    const info = METHOD_INFO[this.method()];
    if (!info.hasRequestBody) return '(no request body — this method does not carry one)';
    return this.sampleBody();
  });

  protected readonly responsePreview = computed(() => {
    const resource = this.resource().trim() || 'resource';
    const id = this.resourceId().trim() || '501';
    if (this.method() === 'DELETE') return '(no response body)';
    if (this.isCollectionGet()) {
      return `{ "data": [ …${resource} items… ], "page": 2, "limit": 20 }`;
    }
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    return `{ "id": ${id}, "${singular}Name": "New ${singular}", "price": 499 }`;
  });

  onResource(ev: Event): void {
    this.resource.set((ev.target as HTMLInputElement).value);
  }

  onResourceId(ev: Event): void {
    this.resourceId.set((ev.target as HTMLInputElement).value);
  }

  onNested(ev: Event): void {
    this.nested.set((ev.target as HTMLInputElement).value);
  }

  onMethod(ev: Event): void {
    this.method.set((ev.target as HTMLSelectElement).value as HttpMethod);
  }
}
