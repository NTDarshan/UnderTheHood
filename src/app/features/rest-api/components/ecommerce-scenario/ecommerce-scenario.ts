import { Component, computed, signal } from '@angular/core';

type ResourceId = 'users' | 'products' | 'carts' | 'orders' | 'payments' | 'reviews';

interface Endpoint {
  method: string;
  path: string;
}

interface Resource {
  id: ResourceId;
  label: string;
  endpoints: Endpoint[];
  connection: string;
}

const RESOURCES: Resource[] = [
  {
    id: 'products',
    label: 'Products',
    endpoints: [
      { method: 'GET', path: '/api/v1/products' },
      { method: 'GET', path: '/api/v1/products/42' },
    ],
    connection: 'The list endpoint is exactly the pagination + filtering + sorting problem from earlier in this chapter — with real traffic, an unpaged product catalog would return every SKU at once.',
  },
  {
    id: 'users',
    label: 'Users',
    endpoints: [
      { method: 'GET', path: '/api/v1/products/42/reviews' },
    ],
    connection: 'A user resource sits behind authentication almost everywhere — the server must know who is asking before returning anything user-specific.',
  },
  {
    id: 'carts',
    label: 'Carts',
    endpoints: [
      { method: 'DELETE', path: '/api/v1/carts/42' },
    ],
    connection: 'DELETE here is idempotent by intended effect: calling it twice still leaves the cart gone, even though the second call returns 404 instead of 204.',
  },
  {
    id: 'orders',
    label: 'Orders',
    endpoints: [
      { method: 'POST', path: '/api/v1/orders' },
      { method: 'GET', path: '/api/v1/orders/1001' },
      { method: 'PATCH', path: '/api/v1/orders/1001' },
    ],
    connection: 'Creating and updating orders is where authentication and authorization matter most — this is money and personal data, not a public catalog read.',
  },
  {
    id: 'payments',
    label: 'Payments',
    endpoints: [
      { method: 'POST', path: '/api/v1/orders' },
    ],
    connection: 'Payment-adjacent writes need strict validation at the boundary — a malformed or malicious payload here has real financial consequences.',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    endpoints: [
      { method: 'GET', path: '/api/v1/products/42/reviews' },
    ],
    connection: 'This is a nested resource — reviews only make sense scoped under a specific product, which is why the parent ID appears in the path.',
  },
];

@Component({
  selector: 'app-ecommerce-scenario',
  standalone: true,
  template: `
    <section class="lab-section" id="ecommerce">
      <div class="container">
        <p class="lab-index">REST API / 44 — REAL-WORLD E-COMMERCE API</p>
        <h2 class="lab-title">Six resources. One consistent API.</h2>
        <p class="lab-lede">Click a resource to see how everything from earlier chapters shows up in a single real system.</p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (r of resources; track r.id) {
              <button type="button" class="lab-btn" [class.is-active]="selected() === r.id" (click)="selected.set(r.id)">{{ r.label }}</button>
            }
          </div>

          <div class="endpoint-list">
            @for (e of current().endpoints; track e.method + e.path) {
              <p class="lab-code"><span class="tok-method">{{ e.method }}</span> <span class="tok-key">{{ e.path }}</span></p>
            }
          </div>

          <p class="lab-note">{{ current().connection }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .endpoint-list { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
    .endpoint-list .lab-code { margin: 0; }
  `,
})
export class EcommerceScenario {
  protected readonly resources = RESOURCES;
  protected readonly selected = signal<ResourceId>('products');
  protected readonly current = computed(() => this.resources.find((r) => r.id === this.selected())!);
}
