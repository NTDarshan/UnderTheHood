import { Component, computed, signal } from '@angular/core';

type PartId = 'method' | 'url' | 'req-headers' | 'query' | 'body' | 'status' | 'res-headers' | 'res-body';

interface Part {
  id: PartId;
  side: 'request' | 'response';
  label: string;
  value: string;
  explanation: string;
}

const PARTS: Part[] = [
  { id: 'method', side: 'request', label: 'Method', value: 'POST', explanation: 'Tells the server what kind of operation this is — here, "create something in this collection."' },
  { id: 'url', side: 'request', label: 'URL', value: '/api/v1/orders', explanation: 'Identifies the resource collection the client is operating on: orders, versioned under v1.' },
  { id: 'req-headers', side: 'request', label: 'Headers', value: 'Authorization: Bearer •••\nContent-Type: application/json', explanation: 'Authorization carries proof of identity (from the Auth chapter); Content-Type tells the server how to deserialize the body.' },
  { id: 'query', side: 'request', label: 'Query', value: '(none for this request)', explanation: 'Query parameters usually shape a GET on a collection — filtering, sorting, pagination — not typically used on a create.' },
  { id: 'body', side: 'request', label: 'Body', value: '{ "productId": 101, "quantity": 2 }', explanation: 'The payload describing the resource to create. This is what Routing hands to the controller, and what the Validation chapter checks before it reaches the service.' },
  { id: 'status', side: 'response', label: 'Status', value: '201 Created', explanation: '201 signals a new resource now exists — distinct from the 200 you would get back from a GET.' },
  { id: 'res-headers', side: 'response', label: 'Headers', value: 'Location: /api/v1/orders/501\nContent-Type: application/json', explanation: 'Location points at the newly created resource; Content-Type says what format the response body is actually in.' },
  { id: 'res-body', side: 'response', label: 'Body', value: '{ "id": 501, "productId": 101, "quantity": 2, "status": "pending" }', explanation: 'The representation of the resource as it now exists — this is what gets deserialized back into an object on the client.' },
];

@Component({
  selector: 'app-request-vs-response',
  standalone: true,
  template: `
    <section class="lab-section" id="request-response">
      <div class="container">
        <p class="lab-index">REST API / 28 — REQUEST VS RESPONSE</p>
        <h2 class="lab-title">One request, one response — every prior chapter meets here.</h2>
        <p class="lab-lede">Click any piece of the request or the response to see what it's doing. Together they're the same conversation you've been building toward since HTTP basics.</p>

        <div class="lab-panel">
          <div class="split-grid">
            <div class="split-col">
              <p class="lab-node">REQUEST — POST /api/v1/orders</p>
              @for (p of requestParts; track p.id) {
                <button type="button" class="part-row" [class.is-active]="selected() === p.id" (click)="selected.set(p.id)">
                  <span class="part-label mono">{{ p.label }}</span>
                  <span class="part-value mono">{{ p.value }}</span>
                </button>
              }
            </div>
            <div class="split-col">
              <p class="lab-node">RESPONSE — 201 CREATED</p>
              @for (p of responseParts; track p.id) {
                <button type="button" class="part-row" [class.is-active]="selected() === p.id" (click)="selected.set(p.id)">
                  <span class="part-label mono">{{ p.label }}</span>
                  <span class="part-value mono">{{ p.value }}</span>
                </button>
              }
            </div>
          </div>

          <p class="lab-note" style="margin-top: 20px;">{{ current().explanation }}</p>

          <p class="lab-note" style="margin-top: 20px;"><strong>This one request/response pair is where the whole journey converges</strong> — HTTP defines its shape, Routing decides which handler sees it, Serialization turns the body into an object and back, Auth verifies who is asking, Validation checks what they sent, and the Backend Layers pass it from controller to service to repository and back.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .split-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 16px; }
    @media (min-width: 800px) { .split-grid { grid-template-columns: 1fr 1fr; } }
    .split-col { display: flex; flex-direction: column; gap: 6px; }
    .part-row { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; text-align: left; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); }
    .part-row.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
    .part-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; text-transform: uppercase; }
    .part-value { font-size: 0.8125rem; color: var(--text-muted); white-space: pre-wrap; }
  `,
})
export class RequestVsResponse {
  protected readonly parts = PARTS;
  protected readonly requestParts = PARTS.filter((p) => p.side === 'request');
  protected readonly responseParts = PARTS.filter((p) => p.side === 'response');
  protected readonly selected = signal<PartId>('method');

  protected readonly current = computed(() => this.parts.find((p) => p.id === this.selected())!);
}
