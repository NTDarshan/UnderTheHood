import { Component, computed, signal } from '@angular/core';

interface NodeDetail {
  id: string;
  label: string;
  responsibility: string;
  why: string;
  stores: string;
  doesNot: string;
  failureMode: string;
  scaling: string;
}

const NODES: NodeDetail[] = [
  {
    id: 'clients', label: 'Clients',
    responsibility: 'Open and maintain a WebSocket connection; render incoming events; send user actions.',
    why: 'Someone has to actually use the real-time channel — browsers, mobile apps.',
    stores: 'Its own connection state, local UI state, a reconnect strategy.',
    doesNot: 'Doesn\'t know which backend server it\'s connected to, or what other clients are doing.',
    failureMode: 'Loses connection silently on network changes if it isn\'t also using ping/pong or a heartbeat.',
    scaling: 'Scales trivially — the concern is always the server side, not the client count itself.',
  },
  {
    id: 'lb', label: 'Load Balancer',
    responsibility: 'Distributes incoming connections across WebSocket servers; must understand HTTP Upgrade.',
    why: 'No single server should have to hold every connection in the system.',
    stores: 'Routing rules, health checks, optionally sticky-session mappings.',
    doesNot: 'Doesn\'t know about application state — it only decides which backend gets the next connection.',
    failureMode: 'If it doesn\'t forward Upgrade correctly, handshakes fail outright.',
    scaling: 'Usually scales horizontally itself, or is a managed cloud service.',
  },
  {
    id: 'servers', label: 'WebSocket Servers',
    responsibility: 'Hold open connections, authenticate clients, read/write frames, publish and subscribe to events.',
    why: 'Something has to actually terminate each persistent connection and keep it alive.',
    stores: 'In-memory connection objects, per-connection subscriptions, socket buffers.',
    doesNot: 'Doesn\'t (by itself) know about connections held by other server instances.',
    failureMode: 'A crash or restart drops every connection this instance was holding.',
    scaling: 'Scales horizontally — but only reaches every client if paired with pub/sub.',
  },
  {
    id: 'pubsub', label: 'Pub/Sub',
    responsibility: 'Lets any server publish an event that every other subscribed server receives.',
    why: 'Solves the exact multi-server problem explored above — one server reaching a client connected elsewhere.',
    stores: 'Nothing durable, usually — it\'s a distribution layer, not a database.',
    doesNot: 'Doesn\'t guarantee a subscriber was actually connected/listening when the event fired (unless paired with a durable queue).',
    failureMode: 'If it goes down, servers stop hearing about each other\'s events — real-time updates silently stop crossing servers.',
    scaling: 'Usually the component most engineering effort goes into scaling reliably (e.g. Redis Cluster, Kafka, NATS).',
  },
  {
    id: 'app', label: 'Application Services',
    responsibility: 'Business logic — decides what an event means, applies authorization, triggers side effects.',
    why: 'The WebSocket layer shouldn\'t contain business rules; it should just move bytes and events.',
    stores: 'Domain logic, not connection state.',
    doesNot: 'Doesn\'t know or care which WebSocket server a client is attached to.',
    failureMode: 'A bug here can publish bad events to every connected client at once — fan-out amplifies mistakes too.',
    scaling: 'Scales like any other backend service — independent of connection count.',
  },
  {
    id: 'db', label: 'Database',
    responsibility: 'Durable source of truth — the data underlying whatever gets pushed over WebSocket.',
    why: 'Real-time events are usually a live view of state that also needs to persist.',
    stores: 'Persistent application data.',
    doesNot: 'Doesn\'t push anything itself — it\'s read/written by application services.',
    failureMode: 'If it\'s slow, events can back up behind slow queries even though the WebSocket layer is fine.',
    scaling: 'Scales independently — same considerations as any other backend datastore.',
  },
];

@Component({
  selector: 'app-complete-system-architecture',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="complete-system">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 020 — THE WHOLE SYSTEM</p>
        <h2 class="lab-title">Every piece a real-time system actually needs.</h2>
        <p class="lab-lede">Click any component for its responsibility, failure mode, and scaling story.</p>

        <div class="arch-diagram">
          <div class="arch-row arch-row-clients">
            @for (n of ['Client A', 'Client B', 'Client C']; track n) {
              <button type="button" class="arch-node" [class.is-selected]="selected().id === 'clients'" (click)="select('clients')">{{ n }}</button>
            }
          </div>
          <span class="arch-down">↓</span>
          <button type="button" class="arch-node arch-node-wide" [class.is-selected]="selected().id === 'lb'" (click)="select('lb')">LOAD BALANCER</button>
          <span class="arch-down">↓</span>
          <div class="arch-row">
            @for (n of ['Server A', 'Server B', 'Server C']; track n) {
              <button type="button" class="arch-node" [class.is-selected]="selected().id === 'servers'" (click)="select('servers')">{{ n }}</button>
            }
          </div>
          <span class="arch-down">↓</span>
          <button type="button" class="arch-node arch-node-wide" [class.is-selected]="selected().id === 'pubsub'" (click)="select('pubsub')">PUB/SUB</button>
          <span class="arch-down">↓</span>
          <button type="button" class="arch-node arch-node-wide" [class.is-selected]="selected().id === 'app'" (click)="select('app')">APPLICATION SERVICES</button>
          <span class="arch-down">↓</span>
          <button type="button" class="arch-node arch-node-wide" [class.is-selected]="selected().id === 'db'" (click)="select('db')">DATABASE</button>
        </div>

        <div class="lab-panel detail-panel">
          <p class="detail-title mono">{{ selected().label.toUpperCase() }}</p>
          <dl class="detail-grid">
            <dt>Responsibility</dt><dd>{{ selected().responsibility }}</dd>
            <dt>Why it exists</dt><dd>{{ selected().why }}</dd>
            <dt>What it stores</dt><dd>{{ selected().stores }}</dd>
            <dt>What it does NOT do</dt><dd>{{ selected().doesNot }}</dd>
            <dt>Common failure mode</dt><dd class="dd-danger">{{ selected().failureMode }}</dd>
            <dt>Scaling consideration</dt><dd>{{ selected().scaling }}</dd>
          </dl>
        </div>
      </div>
    </section>
  `,
  styles: `
    .arch-diagram { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .arch-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .arch-down { color: var(--text-faint); font-size: 0.875rem; }
    .arch-node { padding: 10px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease; }
    .arch-node:hover { border-color: var(--accent-2); }
    .arch-node.is-selected { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 16px var(--glow-accent); }
    .arch-node-wide { min-width: 220px; }

    .detail-panel { margin-top: 24px; }
    .detail-title { color: var(--accent); font-size: 0.9375rem; margin-bottom: 16px; }
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 4px 16px; }
    @media (min-width: 640px) { .detail-grid { grid-template-columns: 200px 1fr; } }
    .detail-grid dt { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent-2); padding-top: 10px; }
    .detail-grid dd { margin: 0; padding-top: 10px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; border-top: 1px solid var(--border); }
    @media (min-width: 640px) { .detail-grid dt { border-top: 1px solid var(--border); } }
    .dd-danger { color: var(--text); }
  `,
})
export class CompleteSystemArchitecture {
  private readonly nodes = NODES;
  protected readonly selected = signal<NodeDetail>(NODES[0]);

  select(id: string): void {
    const node = this.nodes.find((n) => n.id === id);
    if (node) this.selected.set(node);
  }
}
