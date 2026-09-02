import { Component, computed, signal } from '@angular/core';

type Zone = 'public' | 'perimeter' | 'trusted' | 'data' | 'support';

interface Node {
  id: string;
  label: string;
  sub?: string;
  zone: Zone;
  x: number;
  y: number;
  w: number;
  h: number;
  responsibilities: string;
}

const SPINE: Node[] = [
  { id: 'internet', label: 'INTERNET', sub: 'clients & attackers', zone: 'public', x: 40, y: 20, w: 150, h: 46,
    responsibilities: 'Untrusted by definition — every request originating here, legitimate or malicious, is treated identically until it proves otherwise.' },
  { id: 'edge', label: 'EDGE / WAF', sub: 'filter known-bad', zone: 'perimeter', x: 40, y: 96, w: 150, h: 46,
    responsibilities: 'Filters known-bad traffic patterns (malformed requests, known exploit signatures, DDoS floods) before they ever reach application infrastructure.' },
  { id: 'ratelimit', label: 'RATE LIMITING', sub: 'cap volume', zone: 'perimeter', x: 40, y: 172, w: 150, h: 46,
    responsibilities: 'Caps request volume per client/IP/account so brute-force, credential stuffing, and scraping cannot run at unlimited speed.' },
  { id: 'lb', label: 'LOAD BALANCER', sub: 'distribute & terminate TLS', zone: 'perimeter', x: 40, y: 248, w: 150, h: 46,
    responsibilities: 'Distributes traffic across instances and typically terminates TLS — no single backend instance is directly exposed to the internet.' },
  { id: 'api', label: 'API', sub: 'entry to app logic', zone: 'trusted', x: 40, y: 324, w: 150, h: 46,
    responsibilities: 'The single entry point into application logic — every request is routed through here, never directly into a service or database.' },
  { id: 'authn', label: 'AUTHENTICATION', sub: 'who is this?', zone: 'trusted', x: 40, y: 400, w: 150, h: 46,
    responsibilities: 'Verifies the caller’s identity via session, token, or credential before anything identity-dependent happens.' },
  { id: 'authz', label: 'AUTHORIZATION', sub: 'allowed to do this?', zone: 'trusted', x: 40, y: 476, w: 150, h: 46,
    responsibilities: 'Checks the verified identity against what it is actually permitted to do — including object-level checks, not just role checks.' },
  { id: 'validation', label: 'VALIDATION', sub: 'trust boundary', zone: 'trusted', x: 40, y: 552, w: 150, h: 46,
    responsibilities: 'Enforces that all input matches expected shape, type, and range before it is used anywhere else in the system.' },
  { id: 'logic', label: 'BUSINESS LOGIC', sub: 'the actual work', zone: 'trusted', x: 40, y: 628, w: 150, h: 46,
    responsibilities: 'Executes the requested operation, enforcing business invariants (balances, ownership, state transitions) server-side.' },
  { id: 'cache', label: 'CACHE', sub: 'fast path', zone: 'trusted', x: 40, y: 704, w: 150, h: 46,
    responsibilities: 'Serves frequent reads without hitting the database directly — must respect the same authorization rules as the source of truth, never bypass them.' },
  { id: 'database', label: 'DATABASE', sub: 'system of record', zone: 'data', x: 40, y: 780, w: 150, h: 46,
    responsibilities: 'Enforces least-privilege application credentials scoped to only what that service needs, and is never directly reachable from the public internet.' },
];

const SUPPORT: Node[] = [
  { id: 'secrets', label: 'SECRET STORE', sub: 'keys & credentials', zone: 'support', x: 320, y: 172, w: 150, h: 46,
    responsibilities: 'Holds credentials, API keys, and encryption keys outside application source code and config files, injected at runtime rather than hardcoded.' },
  { id: 'logging', label: 'LOGGING', sub: 'security events', zone: 'support', x: 320, y: 248, w: 150, h: 46,
    responsibilities: 'Captures security-relevant events (auth failures, authorization denials, sensitive access) durably, independent of the request path that generated them.' },
  { id: 'tracing', label: 'TRACING', sub: 'follow a request', zone: 'support', x: 320, y: 324, w: 150, h: 46,
    responsibilities: 'Follows a single request across every service it touches, which is what turns a security log entry into a reconstructable timeline.' },
  { id: 'monitoring', label: 'MONITORING', sub: 'alert on anomalies', zone: 'support', x: 320, y: 400, w: 150, h: 46,
    responsibilities: 'Watches metrics and logs for anomalies (spike in 401s, unusual query volume) and alerts before a slow-burn attack becomes a breach.' },
  { id: 'queue', label: 'QUEUE', sub: 'async work', zone: 'support', x: 320, y: 476, w: 150, h: 46,
    responsibilities: 'Decouples slow or bursty work from the request path — still needs its own authorization checks on job payloads, since a queue is not a trust boundary.' },
  { id: 'objectstore', label: 'OBJECT STORAGE', sub: 'uploaded files', zone: 'support', x: 320, y: 552, w: 150, h: 46,
    responsibilities: 'Stores uploaded files outside any executable path, with access scoped per-object rather than a shared open bucket.' },
];

const ALL_NODES: Node[] = [...SPINE, ...SUPPORT];

const SPINE_EDGES: [string, string][] = [
  ['internet', 'edge'],
  ['edge', 'ratelimit'],
  ['ratelimit', 'lb'],
  ['lb', 'api'],
  ['api', 'authn'],
  ['authn', 'authz'],
  ['authz', 'validation'],
  ['validation', 'logic'],
  ['logic', 'cache'],
  ['cache', 'database'],
];

const SUPPORT_EDGES: [string, string][] = [
  ['api', 'secrets'],
  ['authn', 'secrets'],
  ['logic', 'queue'],
  ['logic', 'objectstore'],
  ['authz', 'logging'],
  ['logic', 'logging'],
  ['api', 'tracing'],
  ['logging', 'monitoring'],
  ['tracing', 'monitoring'],
];

const ZONE_LABELS: Record<Zone, string> = {
  public: 'PUBLIC ZONE',
  perimeter: 'PERIMETER',
  trusted: 'TRUSTED INTERNAL ZONE',
  data: 'DATA ZONE',
  support: 'SUPPORTING SYSTEMS',
};

@Component({
  selector: 'app-complete-security-architecture',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-architecture">
      <div class="container">
        <p class="lab-index">33 — COMPLETE SECURITY ARCHITECTURE</p>
        <h2 class="lab-title">Every checkpoint, one system, drawn as boundaries.</h2>
        <p class="lab-lede">
          This is the capstone view — the full spine from an anonymous internet request down to the database, the
          supporting systems that make it operable and auditable, and the trust boundaries between them. Click any
          node for its specific security responsibility.
        </p>

        <div class="lab-panel">
          <div class="canvas-wrap">
            <svg class="canvas" viewBox="0 0 620 860" preserveAspectRatio="xMidYMid meet" role="img"
                 aria-label="Complete backend security architecture diagram">
              <!-- zone boundaries -->
              <rect class="zone-box zone-public" x="16" y="8" width="198" height="62" rx="10" />
              <text class="zone-label" x="115" y="0" dy="-2">{{ zoneLabels.public }}</text>

              <rect class="zone-box zone-perimeter" x="16" y="84" width="198" height="222" rx="10" />
              <text class="zone-label" x="115" y="84" dy="-4">{{ zoneLabels.perimeter }}</text>

              <rect class="zone-box zone-trusted" x="16" y="312" width="198" height="450" rx="10" />
              <text class="zone-label" x="115" y="312" dy="-4">{{ zoneLabels.trusted }}</text>

              <rect class="zone-box zone-data" x="16" y="768" width="198" height="70" rx="10" />
              <text class="zone-label" x="115" y="768" dy="-4">{{ zoneLabels.data }}</text>

              <rect class="zone-box zone-support" x="296" y="160" width="198" height="450" rx="10" />
              <text class="zone-label" x="395" y="160" dy="-4">{{ zoneLabels.support }}</text>

              <!-- spine edges -->
              @for (e of spineEdges; track e[0] + e[1]) {
                <line class="edge edge-spine" [attr.x1]="edgeCoord(e[0]).x" [attr.y1]="edgeCoord(e[0]).bottom"
                      [attr.x2]="edgeCoord(e[1]).x" [attr.y2]="edgeCoord(e[1]).top" />
              }
              <!-- support edges -->
              @for (e of supportEdges; track e[0] + e[1]) {
                <line class="edge edge-support" [attr.x1]="supportEdgeFrom(e[0]).x" [attr.y1]="supportEdgeFrom(e[0]).y"
                      [attr.x2]="supportEdgeTo(e[1]).x" [attr.y2]="supportEdgeTo(e[1]).y" />
              }

              <!-- nodes -->
              @for (n of allNodes; track n.id) {
                <g class="node" [class]="'zone-' + n.zone" [class.is-selected]="selectedId() === n.id"
                   [attr.transform]="'translate(' + n.x + ',' + n.y + ')'"
                   tabindex="0" role="button" [attr.aria-pressed]="selectedId() === n.id"
                   [attr.aria-label]="n.label + ' node'"
                   (click)="select(n.id)" (keydown.enter)="select(n.id)" (keydown.space)="select(n.id)">
                  <rect [attr.width]="n.w" [attr.height]="n.h" rx="8" />
                  <text class="node-label" [attr.x]="n.w / 2" [attr.y]="n.h / 2 - 3">{{ n.label }}</text>
                  @if (n.sub) {
                    <text class="node-sub" [attr.x]="n.w / 2" [attr.y]="n.h / 2 + 13">{{ n.sub }}</text>
                  }
                </g>
              }
            </svg>
          </div>

          @if (selected(); as s) {
            <div class="detail" aria-live="polite">
              <div class="detail-head">
                <span class="pill" [class]="'pill-zone-' + s.zone">{{ zoneLabels[s.zone] }}</span>
                <h3 class="detail-title">{{ s.label }}</h3>
              </div>
              <p class="detail-body">{{ s.responsibilities }}</p>
            </div>
          } @else {
            <p class="detail-placeholder mono">Select a node above to see its security responsibility.</p>
          }
        </div>

        <p class="lab-note">
          Notice the shape: the <strong>public zone</strong> has no direct line to anything past the perimeter, the
          <strong>trusted internal zone</strong> is where identity and permission are actually enforced, and the
          <strong>data zone</strong> is reachable only through that chain — never directly. Supporting systems
          (secrets, logging, tracing, monitoring, queue, object storage) aren't decoration; each one closes a gap
          that would otherwise exist somewhere in the spine.
        </p>
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

    .canvas-wrap { overflow-x: auto; }
    .canvas {
      width: 100%;
      min-width: 480px;
      max-width: 620px;
      height: auto;
      display: block;
      margin-inline: auto;
    }

    .zone-box {
      fill: none;
      stroke-width: 1.5;
      stroke-dasharray: 5 4;
    }
    .zone-public { stroke: var(--text-faint); }
    .zone-perimeter { stroke: var(--suspicious); }
    .zone-trusted { stroke: var(--trust); }
    .zone-data { stroke: var(--c-db); }
    .zone-support { stroke: var(--c-server); }

    .zone-label {
      font-family: var(--font-mono);
      font-size: 8.5px;
      letter-spacing: 0.08em;
      text-anchor: middle;
      fill: var(--text-faint);
    }

    .edge { stroke: var(--border-strong); stroke-width: 1.5; }
    .edge-support { stroke-dasharray: 4 3; opacity: 0.7; }

    .node rect {
      fill: var(--surface-elevated);
      stroke-width: 1.5;
      cursor: pointer;
      transition: filter 0.15s ease, transform 0.15s ease;
    }
    .node:hover rect, .node:focus-visible rect {
      filter: brightness(1.25);
    }
    .node:focus-visible rect {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .node.is-selected rect {
      stroke-width: 2.5;
      filter: drop-shadow(0 0 6px currentColor);
    }

    .node-label {
      fill: var(--text);
      font-family: var(--font-mono);
      font-size: 9.5px;
      font-weight: 700;
      text-anchor: middle;
      letter-spacing: 0.02em;
      pointer-events: none;
    }
    .node-sub {
      fill: var(--text-faint);
      font-size: 7.5px;
      text-anchor: middle;
      pointer-events: none;
    }

    .zone-public rect, .zone-public.is-selected rect { stroke: var(--text-faint); color: var(--text-faint); }
    .zone-perimeter rect { stroke: var(--suspicious); color: var(--suspicious); }
    .zone-trusted rect { stroke: var(--trust); color: var(--trust); }
    .zone-data rect { stroke: var(--c-db); color: var(--c-db); }
    .zone-support rect { stroke: var(--c-server); color: var(--c-server); }

    .detail {
      margin-top: 24px;
      padding: 20px 22px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .detail-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .detail-title { font-size: 1.0625rem; color: var(--text); }
    .detail-body { margin-top: 12px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

    .detail-placeholder {
      margin-top: 24px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .pill-zone-public { color: var(--text-faint); border-color: var(--border-strong); }
    .pill-zone-perimeter { color: var(--suspicious); border-color: var(--accent-dim); }
    .pill-zone-trusted { color: var(--trust); border-color: color-mix(in srgb, var(--trust) 40%, var(--border-strong)); }
    .pill-zone-data { color: var(--c-db); border-color: color-mix(in srgb, var(--c-db) 40%, var(--border-strong)); }
    .pill-zone-support { color: var(--c-server); border-color: color-mix(in srgb, var(--c-server) 40%, var(--border-strong)); }
  `,
})
export class CompleteSecurityArchitecture {
  protected readonly allNodes = ALL_NODES;
  protected readonly spineEdges = SPINE_EDGES;
  protected readonly supportEdges = SUPPORT_EDGES;
  protected readonly zoneLabels = ZONE_LABELS;

  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed(() => this.allNodes.find((n) => n.id === this.selectedId()) ?? null);

  private nodeById(id: string): Node {
    return this.allNodes.find((n) => n.id === id)!;
  }

  edgeCoord(id: string): { x: number; top: number; bottom: number } {
    const n = this.nodeById(id);
    return { x: n.x + n.w / 2, top: n.y, bottom: n.y + n.h };
  }

  supportEdgeFrom(id: string): { x: number; y: number } {
    const n = this.nodeById(id);
    return { x: n.x + n.w, y: n.y + n.h / 2 };
  }

  supportEdgeTo(id: string): { x: number; y: number } {
    const n = this.nodeById(id);
    return { x: n.x, y: n.y + n.h / 2 };
  }

  select(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }
}
