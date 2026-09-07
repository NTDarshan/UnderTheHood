import { Component, signal } from '@angular/core';

type FieldKey = 'method' | 'url' | 'headers' | 'body';

@Component({
  selector: 'app-what-is-a-webhook',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-anatomy-http">
      <div class="container">
        <p class="lab-index mono">03 — WHAT IS A WEBHOOK, EXACTLY</p>
        <h2 class="lab-title">It's an ordinary HTTP request — click each part</h2>
        <p class="lab-lede">
          There is no special "webhook protocol." A webhook delivery is a plain HTTP request that a provider's
          server sends to a URL you registered. Click a piece of it below to see why it looks the way it does.
        </p>

        <div class="lab-panel">
          <div class="req-inspector">
            <pre class="lab-code mono req-block"><span class="tok-line" [class.is-selected]="selected() === 'method'" (click)="select('method')">POST</span> <span class="tok-line" [class.is-selected]="selected() === 'url'" (click)="select('url')">/webhooks/stripe HTTP/1.1</span>
Host: api.yourapp.com
<span class="tok-line" [class.is-selected]="selected() === 'headers'" (click)="select('headers')">Content-Type: application/json
X-Signature: t=1717000000,v1=5a8f...c2e1
X-Event-Id: evt_3f9a2b</span>

<span class="tok-line" [class.is-selected]="selected() === 'body'" (click)="select('body')">{{ '{' }}
  "id": "evt_3f9a2b",
  "type": "order.created",
  "data": {{ '{' }} "orderId": "ord_881", "amount": 4200 {{ '}' }}
{{ '}' }}</span></pre>

            <div class="req-explain">
              @switch (selected()) {
                @case ('method') {
                  <p class="body-label mono">METHOD — POST</p>
                  <p class="body-text">Almost every provider uses POST because a webhook carries a payload describing an event — it isn't a query, it's a notification being delivered.</p>
                }
                @case ('url') {
                  <p class="body-label mono">URL — the address you registered</p>
                  <p class="body-text">You give the provider a URL when you configure the webhook. That URL must be publicly reachable over HTTPS — it's the provider's server initiating the connection to yours, not the other way around.</p>
                }
                @case ('headers') {
                  <p class="body-label mono">HEADERS — signature, event id, content type</p>
                  <p class="body-text">The signature header lets you verify the request really came from the provider. The event id lets you detect duplicates. Content-Type tells you how the body is encoded — usually JSON.</p>
                }
                @case ('body') {
                  <p class="body-label mono">BODY — the event payload</p>
                  <p class="body-text">A JSON document describing what happened: an event id, a type, and the data relevant to that event type. This is what your handler actually acts on.</p>
                }
                @default {
                  <p class="body-text muted-hint">Click METHOD, the URL, HEADERS, or the BODY to see what each part is for.</p>
                }
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .req-inspector { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 800px) { .req-inspector { grid-template-columns: 1.1fr 0.9fr; align-items: start; } }
    .req-block { margin: 0; cursor: default; }
    .tok-line { cursor: pointer; border-radius: 3px; padding: 1px 2px; transition: background 0.15s ease, color 0.15s ease; }
    .tok-line:hover { background: color-mix(in srgb, var(--pending) 14%, transparent); color: var(--accent-strong); }
    .tok-line.is-selected { background: color-mix(in srgb, var(--pending) 22%, transparent); color: var(--accent-strong); }
    .req-explain { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; min-height: 120px; }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 8px; }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
    .muted-hint { color: var(--text-faint); }
  `,
})
export class WhatIsAWebhook {
  protected readonly selected = signal<FieldKey | null>(null);

  protected select(key: FieldKey): void {
    this.selected.set(this.selected() === key ? null : key);
  }
}
