import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-nested-routing',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="nested-routes">
      <div class="container">
        <p class="lab-index">ROUTING / 08 — NESTED &amp; HIERARCHICAL ROUTES</p>
        <h2 class="lab-title">Some resources only make sense inside another resource.</h2>
        <p class="lab-lede">
          An order doesn't exist independently of a user — it belongs to one. Nested routes let the URL
          itself express that ownership.
        </p>

        <app-explain-simply>
          It's like a filing cabinet: you don't ask for "folder 100" — you ask for "the folder in Alex's
          drawer labeled 100." The path <span class="mono">/users/42/orders/100</span> is exactly that
          address, spelled out.
        </app-explain-simply>

        <div class="tree-panel">
          <div class="tree-node root">User</div>
          <div class="tree-branch">
            <div class="tree-node">Orders</div>
            <div class="tree-branch">
              <div class="tree-node leaf">Order</div>
            </div>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" (click)="segment.set(0)" [class.is-active]="segment() === 0">/users/42</button>
          <button type="button" class="lab-btn" (click)="segment.set(1)" [class.is-active]="segment() === 1">/users/42/orders</button>
          <button type="button" class="lab-btn" (click)="segment.set(2)" [class.is-active]="segment() === 2">/users/42/orders/100</button>
        </div>

        <div class="decompose-panel">
          <p class="decompose-url mono">{{ currentUrl() }}</p>
          <ul class="kv-list mono">
            @for (kv of currentParams(); track kv.name) {
              <li><span class="kv-key">{{ kv.name }}</span> = {{ kv.value }}</li>
            }
            @if (!currentParams().length) {
              <li class="kv-empty">no dynamic segments at this depth</li>
            }
          </ul>
        </div>

        <p class="lab-note sub-heading">ROUTE GROUPS &amp; PREFIXES</p>
        <p class="lab-lede small-lede">
          A shared prefix like <span class="mono">/api</span> groups related endpoints conceptually — it
          doesn't change how any single route matches, but it keeps a large route table organized.
        </p>
        <div class="prefix-tree">
          <div class="tree-node root">/api</div>
          <div class="prefix-children">
            <div class="tree-node">users</div>
            <div class="tree-node">products</div>
            <div class="tree-node">orders</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .tree-panel {
      margin-top: 28px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .tree-node {
      display: inline-block;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      color: var(--text);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .tree-node.root {
      border-color: var(--accent-dim);
      color: var(--accent);
    }

    .tree-node.leaf {
      border-color: var(--accent-2-dim);
      color: var(--accent-2);
    }

    .tree-branch {
      margin-left: 32px;
      margin-top: 12px;
      padding-left: 20px;
      border-left: 1px dashed var(--border-strong);
    }

    .lab-btn-row {
      margin-top: 24px;
    }

    .decompose-panel {
      margin-top: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
    }

    .decompose-url {
      color: var(--accent);
      font-size: 0.9375rem;
    }

    .kv-list {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.875rem;
    }

    .kv-key {
      color: var(--accent-2);
    }

    .kv-empty {
      color: var(--text-faint);
      font-size: 0.8125rem;
    }

    .sub-heading {
      margin-top: 40px;
      color: var(--accent-2);
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
    }

    .small-lede {
      margin-top: 8px;
      font-size: 0.9375rem;
      max-width: 620px;
    }

    .prefix-tree {
      margin-top: 20px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .prefix-children {
      margin-top: 16px;
      margin-left: 32px;
      padding-left: 20px;
      border-left: 1px dashed var(--border-strong);
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  `,
})
export class NestedRouting {
  protected readonly segment = signal(2);

  private readonly steps = [
    { url: '/users/42', params: [{ name: 'userId', value: '42' }] },
    { url: '/users/42/orders', params: [{ name: 'userId', value: '42' }] },
    { url: '/users/42/orders/100', params: [{ name: 'userId', value: '42' }, { name: 'orderId', value: '100' }] },
  ];

  protected readonly currentUrl = computed(() => this.steps[this.segment()].url);
  protected readonly currentParams = computed(() => this.steps[this.segment()].params);
}
