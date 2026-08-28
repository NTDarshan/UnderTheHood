import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-nested-collection-validation',
  standalone: true,
  template: `
    <section class="lab-section" id="nested-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 30 — NESTED OBJECT VALIDATION</p>
        <h2 class="lab-title">Real payloads are graphs, not flat rows.</h2>

        <pre class="lab-code mono">{{ '{' }}
  "customer": {{ '{' }}
    "name": "John",
    "address": {{ '{' }}
      "city": "",
      "postalCode": "ABC"
    {{ '}' }}
  {{ '}' }}
{{ '}' }}</pre>

        <div class="tree mono">
          <p>customer</p>
          <p class="indent1">└── address</p>
          <p class="indent2">├── city</p>
          <p class="indent3 fail">│    └── required</p>
          <p class="indent2">└── postalCode</p>
          <p class="indent3 fail">     └── invalid format</p>
        </div>

        <p class="lab-note">APIs often receive nested object graphs, so validation must sometimes recurse into nested structures rather than only checking top-level fields.</p>
      </div>
    </section>

    <section class="lab-section" id="collection-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 31 — COLLECTION VALIDATION</p>
        <h2 class="lab-title">Errors need an index, not just a field name.</h2>

        <pre class="lab-code mono">{{ '{' }}
  "items": [
    {{ '{' }} "productId": 101, "quantity": 2 {{ '}' }},
    {{ '{' }} "productId": 102, "quantity": 0 {{ '}' }}
  ]
{{ '}' }}</pre>

        <div class="tree mono">
          <p class="ok">items[0] — ✓</p>
          <p class="fail">items[1].quantity — ✕ must be greater than 0</p>
        </div>

        <p class="lab-note">Collections introduce indexed validation errors — the client needs to know exactly which element in the array failed, and why.</p>
      </div>
    </section>

    <section class="lab-section" id="cross-resource-validation">
      <div class="container">
        <p class="lab-index">VALIDATION / 32 — DUPLICATE / CROSS-RESOURCE VALIDATION</p>
        <h2 class="lab-title">Some checks can't be answered from the payload alone.</h2>

        <div class="lab-panel dup-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!taken()" (click)="taken.set(false)">username: alice_new</button>
            <button type="button" class="lab-btn" [class.is-active]="taken()" (click)="taken.set(true)">username: john123</button>
          </div>
          <p class="dup-line mono">Input format: <span class="ok">✓ valid</span></p>
          <p class="dup-line mono">Database lookup: <span [class.ok]="!taken()" [class.fail]="taken()">{{ taken() ? '✕ already exists' : '✓ available' }}</span></p>
        </div>

        <p class="lab-note">
          These checks require a database lookup, external service call, or existing domain state —
          not just the shape of the request. This is one reason validation can exist at multiple
          architectural boundaries, though not every database-backed check belongs blindly in a controller.
        </p>
      </div>
    </section>
  `,
  styles: `
    .tree { margin-top: 20px; display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem; color: var(--text-muted); }
    .indent1 { padding-left: 16px; }
    .indent2 { padding-left: 32px; }
    .indent3 { padding-left: 48px; }
    .ok { color: var(--accent-2); }
    .fail { color: var(--danger); }

    .dup-panel { margin-top: 24px; }
    .dup-line { margin-top: 10px; }
  `,
})
export class NestedCollectionValidation {
  protected readonly taken = signal(false);
}
