import { Component, computed, signal } from '@angular/core';

type Tab = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const TABS: Tab[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface BookRecord {
  id: number;
  title: string;
  author: string;
  price?: number;
}

@Component({
  selector: 'app-method-deep-dive',
  standalone: true,
  template: `
    <section class="lab-section" id="method-deep-dive">
      <div class="container">
        <p class="lab-index">REST API / 11 — GET, POST, PUT, PATCH, DELETE</p>
        <h2 class="lab-title">Five methods, five different stories — click through each one.</h2>

        <div class="lab-btn-row">
          @for (t of tabs; track t) {
            <button type="button" class="lab-btn" [class.is-active]="tab() === t" (click)="tab.set(t)">{{ t }}</button>
          }
        </div>

        <div class="lab-panel">
          @switch (tab()) {
            @case ('GET') {
              <p class="lab-node">GET — RETRIEVE A REPRESENTATION</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books/42</span> <span class="tok-dim">→</span> <span class="tok-status-ok">200 OK</span></p>
              <p class="lab-note">"Safe" means GET is <strong>intended</strong> not to modify server state — it does not mean nothing on the server can ever change as a side effect (like a hit counter or a log entry). It means GET should never be the method you reach for when the goal <strong>is</strong> to change state.</p>
            }
            @case ('POST') {
              <p class="lab-node">POST — CREATE OR TRIGGER PROCESSING</p>
              <p class="lab-code"><span class="tok-method">POST</span> <span class="tok-key">/books</span> <span class="tok-dim">{{ '{ "title": "Clean Architecture" }' }}</span> <span class="tok-dim">→</span> <span class="tok-status-ok">201 Created</span></p>
              <p class="lab-note">POST covers three jobs: creating a resource inside a collection, triggering processing (e.g. generating a report), or performing an action that doesn't map cleanly onto PUT/PATCH/DELETE.</p>

              <div class="demo-box">
                <p class="lab-node">DEMO — POST IS GENERALLY NOT IDEMPOTENT</p>
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn lab-btn-primary" (click)="createOrder()">POST /orders</button>
                  <button type="button" class="lab-btn" (click)="resetOrders()">↻ Reset</button>
                </div>
                <div class="order-list mono">
                  @if (orders().length === 0) {
                    <p class="tok-dim">No orders created yet.</p>
                  }
                  @for (o of orders(); track o) {
                    <p><span class="tok-status-ok">201</span> Order #{{ o }} created</p>
                  }
                </div>
                <p class="lab-note">Every click sends the identical request body, yet each one creates a brand-new order. Repeating POST multiplies resources — that's what "non-idempotent" looks like in practice.</p>
              </div>
            }
            @case ('PUT') {
              <p class="lab-node">PUT — FULL REPLACEMENT</p>
              <p class="lab-code"><span class="tok-method">PUT</span> <span class="tok-key">/books/42</span> <span class="tok-dim">{{ '{ "title": "New Title", "author": "Jane" }' }}</span></p>

              <div class="demo-box">
                <div class="before-after">
                  <div>
                    <p class="lab-node">BEFORE</p>
                    <p class="lab-code">{{ '{ id: 42, title: "Old Title", author: "John" }' }}</p>
                  </div>
                  <span class="lab-flow-arrow">⇒</span>
                  <div>
                    <p class="lab-node">AFTER PUT #{{ putCount() }}</p>
                    <p class="lab-code">{{ formatBook(putState()) }}</p>
                  </div>
                </div>
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn lab-btn-primary" (click)="sendPut()">Send PUT</button>
                  <button type="button" class="lab-btn" (click)="resetPut()">↻ Reset</button>
                </div>
                <p class="lab-note">Notice <strong>author</strong> stays "Jane" and there is no lingering trace of "John" — a PUT body is a full replacement, so any field left out of the body is simply gone. Click "Send PUT" repeatedly: the end state never moves past the first call. That's idempotency.</p>
              </div>
            }
            @case ('PATCH') {
              <p class="lab-node">PATCH — PARTIAL UPDATE</p>
              <p class="lab-code"><span class="tok-method">PATCH</span> <span class="tok-key">/books/42</span> <span class="tok-dim">{{ '{ "price": 550 }' }}</span></p>
              <p class="lab-note">PATCH is <strong>not inherently idempotent</strong> — whether a given PATCH is idempotent depends entirely on what the operation does.</p>

              <div class="demo-box">
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn" [class.is-active]="patchMode() === 'set'" (click)="setPatchMode('set')">Mode: set price = 550</button>
                  <button type="button" class="lab-btn" [class.is-active]="patchMode() === 'increment'" (click)="setPatchMode('increment')">Mode: increment price by 10</button>
                </div>
                <p class="patch-price mono">price = {{ patchPrice() }} <span class="tok-dim">(after {{ patchCount() }} call{{ patchCount() === 1 ? '' : 's' }})</span></p>
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn lab-btn-primary" (click)="sendPatch()">Send PATCH</button>
                  <button type="button" class="lab-btn" (click)="resetPatch()">↻ Reset</button>
                </div>
                @if (patchMode() === 'set') {
                  <p class="lab-note">Sending "set price = 550" repeatedly always lands on 550 — this individual PATCH operation is idempotent because it assigns an absolute value.</p>
                } @else {
                  <p class="lab-note lab-note-warn">Sending "increment by 10" repeatedly keeps climbing — 500, then 510, then 520… This individual PATCH operation is <strong>non-idempotent</strong> because it applies a relative change. Same method, opposite behavior — that's the nuance: PATCH's idempotency depends on the operation, not the method name.</p>
                }
              </div>
            }
            @case ('DELETE') {
              <p class="lab-node">DELETE — REMOVE THE RESOURCE</p>
              <p class="lab-code"><span class="tok-method">DELETE</span> <span class="tok-key">/books/42</span></p>

              <div class="demo-box">
                <p class="delete-state mono">Resource state: <strong [class.tok-status-ok]="bookExists()" [class.tok-status-err]="!bookExists()">{{ bookExists() ? 'exists' : 'gone' }}</strong></p>
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn lab-btn-danger" (click)="sendDelete()">Send DELETE</button>
                  <button type="button" class="lab-btn" (click)="resetDelete()">↻ Reset</button>
                </div>
                @if (deleteCalls().length > 0) {
                  <div class="order-list mono">
                    @for (c of deleteCalls(); track $index; let i = $index) {
                      <p>Call {{ i + 1 }}: <span [class.tok-status-ok]="c === 204" [class.tok-status-err]="c === 404">{{ c }}</span> {{ c === 204 ? 'No Content' : 'Not Found' }}</p>
                    }
                  </div>
                }
                <p class="lab-note">The first call returns 204, the second returns 404 — different response codes, but the same end state both times: "this resource does not exist." DELETE is still idempotent, because idempotency is about the <strong>intended end state</strong>, not identical response bodies.</p>
              </div>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .demo-box { margin-top: 24px; padding-top: 20px; border-top: 1px dashed var(--border); }
    .order-list { margin-top: 14px; display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem; }
    .before-after { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .before-after > div { flex: 1; min-width: 220px; }
    .patch-price { margin-top: 14px; font-size: 1rem; color: var(--text); }
    .delete-state { font-size: 0.9375rem; }
  `,
})
export class MethodDeepDive {
  protected readonly tabs = TABS;
  protected readonly tab = signal<Tab>('GET');

  protected readonly orders = signal<number[]>([]);
  createOrder(): void {
    const next = this.orders().length === 0 ? 101 : this.orders()[this.orders().length - 1] + 1;
    this.orders.update((o) => [...o, next]);
  }
  resetOrders(): void {
    this.orders.set([]);
  }

  protected readonly putCount = signal(0);
  protected readonly putState = computed<BookRecord>(() =>
    this.putCount() === 0
      ? { id: 42, title: 'Old Title', author: 'John' }
      : { id: 42, title: 'New Title', author: 'Jane' },
  );
  sendPut(): void {
    this.putCount.update((c) => c + 1);
  }
  resetPut(): void {
    this.putCount.set(0);
  }
  protected formatBook(b: BookRecord): string {
    return `{ id: ${b.id}, title: "${b.title}", author: "${b.author}" }`;
  }

  protected readonly patchMode = signal<'set' | 'increment'>('set');
  protected readonly patchPrice = signal(500);
  protected readonly patchCount = signal(0);
  setPatchMode(mode: 'set' | 'increment'): void {
    this.patchMode.set(mode);
    this.resetPatch();
  }
  sendPatch(): void {
    this.patchPrice.update((p) => (this.patchMode() === 'set' ? 550 : p + 10));
    this.patchCount.update((c) => c + 1);
  }
  resetPatch(): void {
    this.patchPrice.set(500);
    this.patchCount.set(0);
  }

  protected readonly bookExists = signal(true);
  protected readonly deleteCalls = signal<number[]>([]);
  sendDelete(): void {
    const status = this.bookExists() ? 204 : 404;
    this.bookExists.set(false);
    this.deleteCalls.update((c) => [...c, status]);
  }
  resetDelete(): void {
    this.bookExists.set(true);
    this.deleteCalls.set([]);
  }
}
