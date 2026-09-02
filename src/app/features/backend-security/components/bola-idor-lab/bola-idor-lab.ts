import { Component, computed, signal } from '@angular/core';

type UserId = 'A' | 'B';

interface Order {
  id: string;
  owner: UserId;
  summary: string;
  total: string;
  shippingAddress: string;
  cardLast4: string;
}

interface RequestResult {
  status: 200 | 403 | 404;
  order: Order | null;
  isOwnOrder: boolean;
  authorizationChecked: boolean;
}

const USERS: Record<UserId, { name: string; email: string }> = {
  A: { name: 'User A · Priya Shah', email: 'priya@example.com' },
  B: { name: 'User B · Diego Ruiz', email: 'diego@example.com' },
};

const ORDERS: Record<string, Order> = {
  '123': {
    id: '123',
    owner: 'A',
    summary: '1x Mechanical Keyboard, 1x USB-C Hub',
    total: '$142.50',
    shippingAddress: '48 Birchwood Ln, Austin, TX',
    cardLast4: '4471',
  },
  '456': {
    id: '456',
    owner: 'B',
    summary: '2x Standing Desk Mat',
    total: '$88.00',
    shippingAddress: '910 Cedar Ave, Denver, CO',
    cardLast4: '9902',
  },
};

@Component({
  selector: 'app-bola-idor-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="bola-idor">
      <div class="container">
        <p class="lab-index">16 — BOLA / IDOR</p>
        <h2 class="lab-title">Authenticated is not the same question as authorized.</h2>
        <p class="lab-lede">
          You're logged in as one of two users below. Both are fully authenticated. Edit the order id in the
          request and see what the backend actually checks before handing back data — and what it doesn't.
        </p>

        <div class="lab-panel">
          <!-- Identity cards -->
          <div class="identity-row" role="group" aria-label="Choose which user you are logged in as">
            @for (uid of userIds; track uid) {
              <button
                type="button"
                class="identity-card"
                [class.is-active]="currentUser() === uid"
                [attr.aria-pressed]="currentUser() === uid"
                (click)="switchUser(uid)"
              >
                <span class="identity-name mono">{{ users[uid].name }}</span>
                <span class="identity-email mono">{{ users[uid].email }}</span>
                <span class="pill pill-yes trust-pill">AUTHENTICATED &#10003;</span>
                <span class="identity-owns mono">owns order /orders/{{ ownedOrderId(uid) }}</span>
              </button>
            }
          </div>
          <p class="mono current-as">
            Currently logged in as <strong>{{ users[currentUser()].name }}</strong>
          </p>

          <!-- Request bar -->
          <div class="request-bar">
            <span class="mono req-verb">GET</span>
            <span class="mono req-path">/orders/</span>
            <input
              class="mono req-id-input"
              type="text"
              inputmode="numeric"
              [value]="inputId()"
              (input)="setInputId($event)"
              aria-label="Order id to request"
            />
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendRequest()">Send request</button>
          </div>
          <p class="mono quick-try">
            Try:
            <button type="button" class="lab-btn quick-btn" (click)="tryId(ownedOrderId(currentUser()))">
              my own order ({{ ownedOrderId(currentUser()) }})
            </button>
            <button type="button" class="lab-btn quick-btn" (click)="tryId(otherOrderId(currentUser()))">
              someone else's order ({{ otherOrderId(currentUser()) }})
            </button>
          </p>

          <!-- Fix toggle -->
          <div class="lab-btn-row" role="group" aria-label="Backend authorization mode">
            <button type="button" class="lab-btn" [class.is-active]="!fixedMode()" (click)="fixedMode.set(false)">
              VULNERABLE — no object-level check
            </button>
            <button type="button" class="lab-btn" [class.is-active]="fixedMode()" (click)="fixedMode.set(true)">
              FIX: object-level authorization check
            </button>
          </div>

          <!-- Gate visualization -->
          @if (result(); as r) {
            <div class="gate-flow" [class.is-fixed]="fixedMode()">
              <div class="gate-stage">
                <div class="gate-icon gate-trust">&#10003;</div>
                <p class="gate-label mono">AUTHENTICATED?</p>
                <span class="pill pill-yes">YES</span>
              </div>

              <span class="gate-arrow mono">&rarr;</span>

              @if (!fixedMode()) {
                <div class="gate-stage gate-skipped">
                  <div class="gate-icon gate-attack">&#10005;</div>
                  <p class="gate-label mono">AUTHORIZED?</p>
                  <span class="pill gate-skip-pill">CHECK NEVER RUNS</span>
                </div>
              } @else {
                <div class="gate-stage">
                  <div class="gate-icon" [class.gate-trust]="r.isOwnOrder" [class.gate-attack]="!r.isOwnOrder">
                    {{ r.isOwnOrder ? '✓' : '✗' }}
                  </div>
                  <p class="gate-label mono">DOES THIS ORDER BELONG TO {{ users[currentUser()].name.split(' · ')[0].toUpperCase() }}?</p>
                  <span class="pill" [class.pill-yes]="r.isOwnOrder" [class.pill-no]="!r.isOwnOrder">
                    {{ r.isOwnOrder ? 'YES' : 'NO' }}
                  </span>
                </div>
              }

              <span class="gate-arrow mono">&rarr;</span>

              <div class="gate-stage">
                <div
                  class="gate-icon"
                  [class.gate-trust]="r.status === 200"
                  [class.gate-blocked]="r.status === 403"
                >
                  {{ r.status === 200 ? '✓' : '⛔' }}
                </div>
                <p class="gate-label mono">RESPONSE</p>
                <span class="pill" [class.pill-yes]="r.status === 200" [class.pill-no]="r.status === 403">
                  {{ r.status }} {{ r.status === 200 ? 'OK' : 'FORBIDDEN' }}
                </span>
              </div>
            </div>

            @if (!fixedMode() && !r.isOwnOrder && r.status === 200) {
              <p class="breach-headline">DATA BREACH: {{ users[currentUser()].name.split(' · ')[0] }} just received {{ users[r.order!.owner].name.split(' · ')[0] }}'s private order.</p>
            }

            <!-- Response panel -->
            <div class="response-panel" [class.is-leaked]="!fixedMode() && r.status === 200 && !r.isOwnOrder">
              <p class="lab-node response-title">RESPONSE BODY</p>
              @if (r.status === 403) {
                <div class="lab-code blocked-code">
                  <span class="tok-status-err">403 Forbidden</span><br />
                  {{ '{' }} "error": "You do not have access to this order." {{ '}' }}
                </div>
              } @else if (r.status === 404) {
                <div class="lab-code">
                  <span class="tok-status-err">404 Not Found</span>
                </div>
              } @else if (r.order) {
                <div class="lab-code" [class.leak-code]="!r.isOwnOrder">
                  <span class="tok-status-ok">200 OK</span><br />
                  order_id: <span class="tok-key">{{ r.order.id }}</span><br />
                  owner: <span class="tok-key">{{ users[r.order.owner].name }}</span><br />
                  items: {{ r.order.summary }}<br />
                  total: {{ r.order.total }}<br />
                  shipping_address: {{ r.order.shippingAddress }}<br />
                  card_last4: {{ r.order.cardLast4 }}
                </div>
                @if (!r.isOwnOrder) {
                  <p class="leak-caption">
                    &#9888; This is {{ users[r.order.owner].name.split(' · ')[0] }}'s private data, returned to
                    {{ users[currentUser()].name.split(' · ')[0] }} — a user who is authenticated, but was never checked for
                    ownership of this specific object.
                  </p>
                }
              }
            </div>
          }

          <p class="lab-note lab-note-warn">
            <strong>Changing the object identifier is not proof of authorization.</strong> In the vulnerable mode,
            the backend only ever asked <em>who are you</em> — never <em>should you see this specific object</em>.
            Fixing it means adding a real object-level check: does the requested resource belong to (or otherwise
            grant access to) the requesting user, every single time, not just at login.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .identity-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .identity-card {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      color: var(--text);
      transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
    }
    .identity-card:hover { border-color: var(--c-client); }
    .identity-card.is-active {
      border-color: var(--c-client);
      box-shadow: 0 0 0 1px var(--c-client), 0 0 20px rgba(79, 211, 232, 0.18);
    }
    .identity-name { font-size: 0.9375rem; font-weight: 700; color: var(--c-client); }
    .identity-email { font-size: 0.75rem; color: var(--text-faint); }
    .identity-owns { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .trust-pill { color: var(--trust); border-color: var(--trust); width: fit-content; }

    .current-as { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }
    .current-as strong { color: var(--text); }

    .request-bar {
      margin-top: 22px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 10px 14px;
    }
    .req-verb { color: var(--trust); font-weight: 700; font-size: 0.8125rem; margin-right: 10px; }
    .req-path { color: var(--text-muted); font-size: 0.8125rem; }
    .req-id-input {
      width: 90px;
      background: var(--surface-elevated);
      border: 1px solid var(--accent);
      border-radius: var(--radius-sm);
      color: var(--accent-strong);
      font-family: var(--font-mono);
      font-size: 0.9375rem;
      font-weight: 700;
      padding: 6px 8px;
      margin-right: 14px;
    }
    .req-id-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

    .quick-try { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .quick-btn { padding: 6px 10px; font-size: 0.75rem; }

    .gate-flow {
      margin-top: 30px;
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: space-between;
    }
    .gate-stage {
      flex: 1 1 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 18px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .gate-skipped { border-style: dashed; border-color: var(--attack); background: color-mix(in srgb, var(--attack) 8%, var(--surface)); }
    .gate-arrow { align-self: center; color: var(--text-faint); font-size: 1.25rem; }

    .gate-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 900;
      border: 2px solid var(--border-strong);
      color: var(--text-faint);
      background: var(--surface-elevated);
    }
    .gate-icon.gate-trust { color: var(--trust); border-color: var(--trust); box-shadow: 0 0 16px rgba(74, 222, 128, 0.3); }
    .gate-icon.gate-attack { color: var(--attack); border-color: var(--attack); box-shadow: 0 0 16px rgba(255, 93, 93, 0.35); }
    .gate-icon.gate-blocked { color: var(--blocked); border-color: var(--blocked); box-shadow: 0 0 16px rgba(79, 211, 232, 0.3); }

    .gate-label { font-size: 0.6875rem; color: var(--text-muted); letter-spacing: 0.04em; line-height: 1.4; }
    .gate-skip-pill { color: var(--attack); border-color: var(--attack); text-decoration: line-through; }

    .breach-headline {
      margin-top: 18px;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--compromised) 16%, var(--surface));
      border: 1px solid var(--compromised);
      border-radius: var(--radius-md);
      color: var(--compromised);
      font-weight: 700;
      font-size: 0.9375rem;
      text-align: center;
    }

    .response-panel {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .response-panel.is-leaked {
      border-color: var(--compromised);
      box-shadow: 0 0 0 1px var(--compromised), 0 0 24px rgba(220, 38, 38, 0.2);
    }
    .response-title { margin-bottom: 10px; }
    .blocked-code { border-color: var(--blocked); color: var(--blocked); }
    .leak-code { border-color: var(--compromised); }
    .leak-caption { margin-top: 10px; font-size: 0.8125rem; color: var(--compromised); line-height: 1.5; }
  `,
})
export class BolaIdorLab {
  protected readonly users = USERS;
  protected readonly userIds: UserId[] = ['A', 'B'];

  protected readonly currentUser = signal<UserId>('B');
  protected readonly inputId = signal('123');
  protected readonly submittedId = signal<string | null>(null);
  protected readonly fixedMode = signal(false);

  protected readonly result = computed<RequestResult | null>(() => {
    const id = this.submittedId();
    if (id === null) return null;
    const order = ORDERS[id] ?? null;
    if (!order) {
      return { status: 404, order: null, isOwnOrder: false, authorizationChecked: this.fixedMode() };
    }
    const isOwnOrder = order.owner === this.currentUser();
    if (!this.fixedMode()) {
      // Vulnerable: only authentication is checked, ownership is never verified.
      return { status: 200, order, isOwnOrder, authorizationChecked: false };
    }
    if (isOwnOrder) {
      return { status: 200, order, isOwnOrder: true, authorizationChecked: true };
    }
    return { status: 403, order: null, isOwnOrder: false, authorizationChecked: true };
  });

  ownedOrderId(uid: UserId): string {
    return Object.values(ORDERS).find((o) => o.owner === uid)?.id ?? '';
  }

  otherOrderId(uid: UserId): string {
    return Object.values(ORDERS).find((o) => o.owner !== uid)?.id ?? '';
  }

  switchUser(uid: UserId): void {
    this.currentUser.set(uid);
  }

  setInputId(ev: Event): void {
    this.inputId.set((ev.target as HTMLInputElement).value.trim());
  }

  sendRequest(): void {
    this.submittedId.set(this.inputId());
  }

  tryId(id: string): void {
    this.inputId.set(id);
    this.submittedId.set(id);
  }
}
