import { Component, computed, signal } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Role = 'client' | 'server';

interface RoleInfo {
  id: Role;
  label: string;
  tagline: string;
  responsibilities: string[];
}

const ROLES: RoleInfo[] = [
  {
    id: 'client',
    label: 'Client',
    tagline: 'Initiates. Never listens for unsolicited requests.',
    responsibilities: [
      'Decides when to start a conversation — the server never calls a client out of the blue over plain HTTP.',
      'Owns presentation: how data is laid out, animated, and reacted to.',
      "Can be almost anything: a browser, a mobile app, another server acting as a client, curl, a smart fridge.",
      "Doesn't need to know how the server is implemented — only the shape of the requests/responses it exchanges with it.",
    ],
  },
  {
    id: 'server',
    label: 'Server',
    tagline: 'Listens. Holds the data and the authority to change it.',
    responsibilities: [
      'Waits on a port for requests — passive until a client speaks first.',
      'Owns the source of truth: the database, business rules, and access control.',
      'Can be one process or a fleet of machines behind a load balancer — clients never need to know which.',
      "Decides what's actually allowed to happen, regardless of what a client asks for.",
    ],
  },
];

const CLIENT_COUNT = 3;
const STARTING_BALANCE = 100;

interface ClientNode {
  id: number;
  label: string;
  localBalance: number;
  flashing: boolean;
}

@Component({
  selector: 'app-client-server-model',
  standalone: true,
  imports: [RevealDirective, ExplainSimply],
  template: `
    <section class="lab-section" id="client-server-model">
      <div class="container">
        <p class="lab-index">HTTP / 02 — CLIENT, SERVER &amp; WHY THE SPLIT EXISTS</p>
        <h2 class="lab-title">Two unequal roles, talking over a wire.</h2>
        <p class="lab-lede">
          Before there's HTTP, there's a relationship between two things: one that asks, and one that
          answers. That's the client&#8211;server model — and it's a design decision, not a law of nature.
        </p>

        <div class="def-stack">
          <div class="def-block">
            <span class="def-term mono">WHAT IS A CLIENT?</span>
            <p>
              A <strong>client</strong> is any program that starts a conversation to get something done —
              a browser loading a page, a mobile app fetching your feed, a script pulling data. A client
              doesn't hold the real data and doesn't decide what's allowed; it asks, then waits.
            </p>
          </div>
          <div class="def-block">
            <span class="def-term mono">WHAT IS A SERVER?</span>
            <p>
              A <strong>server</strong> is a program that sits waiting, listening for those requests, and
              answers them. It holds the actual data (or the door to it) and the authority to decide what
              happens to it. A server never speaks first — it only responds.
            </p>
          </div>
          <div class="def-block">
            <span class="def-term mono">WHAT IS THE CLIENT&#8211;SERVER MODEL?</span>
            <p>
              The <strong>client&#8211;server model</strong> is just this relationship, formalized: one role
              that asks (the client) and one role that answers (the server), talking over a network instead
              of sharing memory on the same machine. HTTP is one concrete language they use to have that
              conversation.
            </p>
          </div>
        </div>

        <app-explain-simply>
          A <strong>client</strong> is whoever wants something — your browser, your phone's app, a script.
          A <strong>server</strong> is whoever has it and hands it over — a machine sitting somewhere, always
          switched on, waiting to be asked. The client speaks first. The server never interrupts.
        </app-explain-simply>

        <h3 class="cs-heading">Pick a role to see what it's actually responsible for</h3>
        <div class="role-grid" appReveal>
          @for (role of roles; track role.id) {
            <button
              type="button"
              class="role-card"
              [class.is-selected]="selectedRole() === role.id"
              [class.is-dimmed]="selectedRole() !== null && selectedRole() !== role.id"
              (click)="selectRole(role.id)"
            >
              <span class="role-name mono">{{ role.label.toUpperCase() }}</span>
              <span class="role-tagline">{{ role.tagline }}</span>
            </button>
          }
        </div>

        @if (activeRole(); as r) {
          <ul class="role-responsibilities">
            @for (item of r.responsibilities; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        } @else {
          <p class="cs-hint">Click a role above to see its responsibilities.</p>
        }

        <h3 class="cs-heading">Why does this split exist at all?</h3>
        <p class="lab-note">
          Nothing stops a program from being both — reading its own files, running its own logic, drawing
          its own screen, all in one process. That's how most desktop software worked for decades. The
          client&#8211;server split exists because of what happens the moment more than one person needs
          the <em>same</em> data at the <em>same</em> time.
        </p>

        <div class="sim-toggle-row" role="group" aria-label="Simulation mode">
          <button
            type="button"
            class="mode-toggle"
            [class.is-on]="mode() === 'client-server'"
            (click)="setMode('client-server')"
          >
            With a server (shared source of truth)
          </button>
          <button
            type="button"
            class="mode-toggle"
            [class.is-on]="mode() === 'isolated'"
            (click)="setMode('isolated')"
          >
            No server (each client keeps its own copy)
          </button>
        </div>

        <p class="cs-scenario-note">
          Three clients share one bank account. Deposit $50 from Client A and watch what the others see.
        </p>

        <div class="cs-diagram">
          <div class="cs-clients">
            @for (client of clients(); track client.id) {
              <div class="cs-client-node" [class.is-flash]="client.flashing">
                <span class="cs-client-label mono">{{ client.label }}</span>
                <span class="cs-client-balance mono">{{ '$' + displayBalance(client) }}</span>
                <button type="button" class="btn btn-ghost cs-deposit-btn" (click)="deposit(client.id)">
                  Deposit $50
                </button>
              </div>
            }
          </div>

          @if (mode() === 'client-server') {
            <div class="cs-link-wrap" aria-hidden="true">
              @for (client of clients(); track client.id) {
                <span class="cs-link" [class.is-active]="lastActor() === client.id"></span>
              }
            </div>
            <div class="cs-server-node">
              <span class="cs-server-label mono">SERVER</span>
              <span class="cs-server-sub mono">single source of truth</span>
              <span class="cs-server-balance mono">{{ '$' + serverBalance() }}</span>
            </div>
          }
        </div>

        @if (mode() === 'client-server') {
          <p class="cs-verdict">
            Every client reads the same server balance, so all three always agree — deposit from any one
            of them and the other two immediately see the new total.
          </p>
        } @else {
          <p class="cs-verdict cs-verdict-warn">
            Without a server, each client only knows about its own copy. Deposit from Client A and the
            other two are now silently wrong — there's no shared truth to check against, and no way for
            them to find out short of manually comparing notes.
          </p>
        }

        <button type="button" class="btn btn-ghost cs-reset-btn" (click)="reset()">Reset balances</button>

        <div class="cs-reasons">
          <div class="cs-reason">
            <span class="cs-reason-title mono">Single source of truth</span>
            <p>One place owns the real data, so every client sees the same state instead of drifting apart.</p>
          </div>
          <div class="cs-reason">
            <span class="cs-reason-title mono">Independent evolution</span>
            <p>The team building the app UI can ship changes without touching the database logic, and vice versa.</p>
          </div>
          <div class="cs-reason">
            <span class="cs-reason-title mono">Centralized control</span>
            <p>Validation, permissions, and business rules live in one place the client can't bypass by editing local code.</p>
          </div>
          <div class="cs-reason">
            <span class="cs-reason-title mono">Thin, disposable clients</span>
            <p>A phone or browser tab can be closed, lost, or replaced — the data it was looking at doesn't disappear with it.</p>
          </div>
        </div>

        <app-explain-simply>
          Imagine three people trying to share one shopping list, but each of them just keeps their own
          paper copy at home. The moment one person crosses something off, the other two don't know — their
          papers are now wrong. A server is like putting that list on a shared fridge door instead: everyone
          reads from and writes to the exact same piece of paper, so there's only ever one version of the
          truth.
        </app-explain-simply>
      </div>
    </section>
  `,
  styles: `
    .cs-heading {
      margin-top: 44px;
      font-size: 1.125rem;
      color: var(--text);
    }

    .def-stack {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .def-block {
      padding: 16px 18px;
      background: var(--surface-raised);
    }

    .def-term {
      display: block;
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      color: var(--accent);
      margin-bottom: 6px;
    }

    .def-block p {
      max-width: 640px;
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .role-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      max-width: 640px;
    }

    @media (min-width: 560px) {
      .role-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .role-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 18px;
      text-align: left;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, background 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
    }

    .role-card:hover {
      border-color: var(--accent-dim);
    }

    .role-card.is-selected {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 10%, var(--surface-raised));
      transform: translateY(-1px);
    }

    .role-card.is-dimmed {
      opacity: 0.45;
    }

    .role-name {
      font-size: 0.8125rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }

    .role-card.is-selected .role-name {
      color: var(--accent);
    }

    .role-tagline {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .role-responsibilities {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 620px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
      list-style: disc;
      padding-left: 20px;
    }

    .cs-hint {
      margin-top: 16px;
      font-size: 0.875rem;
      color: var(--text-faint);
    }

    .sim-toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .mode-toggle {
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      font-size: 0.8125rem;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    }

    .mode-toggle.is-on {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--surface-elevated);
      transform: scale(1.03);
    }

    .cs-scenario-note {
      margin-top: 14px;
      font-size: 0.8125rem;
      color: var(--text-faint);
    }

    .cs-diagram {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px 20px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .cs-clients {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    @media (min-width: 640px) {
      .cs-clients {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .cs-client-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .cs-client-node.is-flash {
      border-color: var(--accent);
      box-shadow: 0 0 18px var(--glow-accent);
      animation: cs-flash 0.5s ease;
    }

    @keyframes cs-flash {
      0% { transform: scale(1); }
      40% { transform: scale(1.04); }
      100% { transform: scale(1); }
    }

    .cs-client-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
    }

    .cs-client-balance {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--accent-2);
    }

    .cs-deposit-btn {
      margin-top: 4px;
      font-size: 0.75rem;
      padding: 5px 12px;
    }

    .cs-link-wrap {
      display: flex;
      justify-content: center;
      gap: 40px;
    }

    @media (min-width: 640px) {
      .cs-link-wrap {
        gap: 0;
        justify-content: space-evenly;
      }
    }

    .cs-link {
      width: 1px;
      height: 20px;
      background: var(--border-strong);
    }

    .cs-link.is-active {
      background: var(--accent);
      box-shadow: 0 0 8px var(--glow-accent);
    }

    .cs-server-node {
      align-self: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 16px 32px;
      border: 1px solid var(--accent-dim);
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--accent) 8%, var(--surface-elevated));
    }

    .cs-server-label {
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--accent);
    }

    .cs-server-sub {
      font-size: 0.625rem;
      color: var(--text-faint);
    }

    .cs-server-balance {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent);
    }

    .cs-verdict {
      margin-top: 16px;
      max-width: 640px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .cs-verdict-warn {
      color: var(--danger);
    }

    .cs-reset-btn {
      margin-top: 14px;
      font-size: 0.8125rem;
    }

    .cs-reasons {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 2px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    @media (min-width: 640px) {
      .cs-reasons {
        grid-template-columns: 1fr 1fr;
      }
    }

    .cs-reason {
      padding: 16px 18px;
      background: var(--surface-raised);
    }

    .cs-reason-title {
      display: block;
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      color: var(--accent-2);
      margin-bottom: 6px;
    }

    .cs-reason p {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
  `,
})
export class ClientServerModel {
  protected readonly roles = ROLES;
  protected readonly selectedRole = signal<Role | null>(null);
  protected readonly activeRole = computed(() => this.roles.find((r) => r.id === this.selectedRole()) ?? null);

  protected readonly mode = signal<'client-server' | 'isolated'>('client-server');
  protected readonly serverBalance = signal(STARTING_BALANCE);
  protected readonly lastActor = signal<number | null>(null);
  protected readonly clients = signal<ClientNode[]>(this.freshClients());

  private freshClients(): ClientNode[] {
    return Array.from({ length: CLIENT_COUNT }, (_, i) => ({
      id: i,
      label: `CLIENT ${String.fromCharCode(65 + i)}`,
      localBalance: STARTING_BALANCE,
      flashing: false,
    }));
  }

  selectRole(id: Role): void {
    this.selectedRole.set(this.selectedRole() === id ? null : id);
  }

  setMode(mode: 'client-server' | 'isolated'): void {
    this.mode.set(mode);
    this.reset();
  }

  displayBalance(client: ClientNode): number {
    return this.mode() === 'client-server' ? this.serverBalance() : client.localBalance;
  }

  deposit(clientId: number): void {
    this.lastActor.set(clientId);

    if (this.mode() === 'client-server') {
      this.serverBalance.update((v) => v + 50);
    } else {
      this.clients.update((list) =>
        list.map((c) => (c.id === clientId ? { ...c, localBalance: c.localBalance + 50 } : c)),
      );
    }

    this.clients.update((list) => list.map((c) => ({ ...c, flashing: c.id === clientId })));
    setTimeout(() => {
      this.clients.update((list) => list.map((c) => ({ ...c, flashing: false })));
    }, 500);
  }

  reset(): void {
    this.serverBalance.set(STARTING_BALANCE);
    this.lastActor.set(null);
    this.clients.set(this.freshClients());
  }
}
