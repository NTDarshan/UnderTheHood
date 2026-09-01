import { Component, computed, signal } from '@angular/core';

interface Zone {
  id: number;
  name: string;
}

const ZONES: Zone[] = [
  { id: 1, name: 'Bangalore' },
  { id: 2, name: 'London' },
  { id: 3, name: 'New York' },
];

@Component({
  selector: 'app-cdn-edge',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="cdn-edge">
      <div class="container">
        <p class="lab-index">20 — CDN &amp; EDGE COMPUTING</p>
        <h2 class="lab-title">Move the content closer to the user, instead of moving the user's request across the planet.</h2>
        <p class="lab-lede">
          A CDN caches copies of content at points around the world, so requests don't all have to travel back to
          one origin server.
        </p>

        <div class="lab-panel">
          <p class="part-heading mono">PART A — CDN CACHING</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!cdnOn()" (click)="cdnOn.set(false)">CDN: OFF</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="cdnOn()" (click)="cdnOn.set(true)">CDN: ON</button>
          </div>

          <div class="map-stage">
            @for (z of zones; track z.id) {
              <div class="zone-col">
                <p class="lab-node zone-label">{{ z.name }}</p>
                <div class="path-track">
                  @if (cdnOn()) {
                    <div class="edge-node" [class.is-hit]="edgeHit(z.id)">
                      <span class="mono edge-text">EDGE</span>
                    </div>
                  }
                  <div class="request-line" [class.long-path]="!cdnOn()">
                    <span class="req-dot" [class.animate-dot]="pulseTick() > 0" [style.animation-delay.ms]="z.id * 120"></span>
                  </div>
                  @if (!cdnOn() || !edgeHit(z.id)) {
                    <span class="lab-flow-arrow origin-arrow">→ origin</span>
                  }
                </div>
                <p class="mono result-line">
                  @if (cdnOn()) {
                    @if (edgeHit(z.id)) {
                      <span class="ok-text">CACHE HIT AT EDGE</span> — fast, short path
                    } @else {
                      <span class="warn-text">ORIGIN REQUEST</span> — edge miss, travels further
                    }
                  } @else {
                    full round trip to origin
                  }
                </p>
              </div>
            }
            <div class="origin-box">
              <p class="lab-node">ORIGIN (US)</p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="replay()">Replay requests</button>
          </div>

          <p class="lab-note">
            With the CDN on, most requests stop at a nearby edge node that already has a cached copy — much less
            network distance, and far less load reaching the origin. Occasionally the edge doesn't have it cached
            yet, so the request still continues to the origin. CDNs help most with
            <strong>cacheable, largely static content</strong> — they don't eliminate the need to scale the
            origin for everything else.
          </p>
        </div>

        <div class="lab-panel">
          <p class="part-heading mono">PART B — EDGE COMPUTE</p>
          <p class="part-sub">Not just caching files — running small logic at the edge, before deciding whether to go further.</p>

          <div class="edge-compute-flow mono">
            <span class="lab-node">USER</span>
            <span class="lab-flow-arrow">→</span>
            <span class="lab-node edge-compute-node">EDGE (lightweight logic)</span>
            <span class="lab-flow-arrow">→ origin, only if needed</span>
          </div>

          <div class="edge-examples">
            <div class="example-card">
              <p class="pill pill-yes">CHECK AUTH TOKEN FORMAT</p>
              <p class="example-detail">Reject malformed requests immediately — no round trip to origin.</p>
            </div>
            <div class="example-card">
              <p class="pill pill-yes">REDIRECT BASED ON REGION</p>
              <p class="example-detail">Send the user to the right locale/version before origin is ever involved.</p>
            </div>
          </div>

          <p class="lab-note lab-note-warn">
            Not all backend logic belongs at the edge. Heavy business logic and anything needing full database
            access still needs to run closer to the data — edge compute is for cheap, fast decisions, not your
            whole application.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .part-heading { color: var(--accent-2); font-size: 0.75rem; letter-spacing: 0.1em; }
    .part-sub { margin-top: 6px; color: var(--text-muted); font-size: 0.9375rem; }

    .map-stage {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      align-items: end;
    }
    @media (max-width: 700px) {
      .map-stage { grid-template-columns: 1fr; }
    }

    .zone-col { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
    .zone-label { color: var(--c-client); }

    .path-track { position: relative; margin-top: 12px; min-height: 46px; display: flex; align-items: center; gap: 8px; }

    .edge-node {
      flex-shrink: 0;
      width: 46px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--c-cache);
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      transition: box-shadow 0.3s ease, background 0.3s ease;
    }
    .edge-node.is-hit { box-shadow: 0 0 14px color-mix(in srgb, var(--c-cache) 45%, transparent); background: color-mix(in srgb, var(--c-cache) 18%, var(--surface-elevated)); }
    .edge-text { font-size: 0.5625rem; font-weight: 700; color: var(--c-cache); }

    .request-line { position: relative; flex: 1 1 auto; height: 2px; background: var(--border-strong); min-width: 30px; }
    .request-line.long-path { min-width: 60px; }

    .req-dot {
      position: absolute;
      top: -3px; left: 0;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--warn);
      box-shadow: 0 0 6px var(--glow-accent);
      opacity: 0;
    }
    .req-dot.animate-dot { animation: travel 1.1s ease forwards; }
    @keyframes travel {
      0% { left: 0; opacity: 1; }
      90% { opacity: 1; }
      100% { left: calc(100% - 8px); opacity: 0.2; }
    }

    .origin-arrow { flex-shrink: 0; font-size: 0.6875rem; }

    .result-line { margin-top: 10px; font-size: 0.75rem; color: var(--text-muted); }
    .ok-text { color: var(--ok); font-weight: 600; }
    .warn-text { color: var(--warn); font-weight: 600; }

    .origin-box {
      grid-column: 1 / -1;
      margin-top: 4px;
      text-align: center;
      padding: 12px;
      border: 1px solid var(--c-db);
      border-radius: var(--radius-md);
      background: var(--surface);
    }

    .edge-compute-flow { margin-top: 22px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.8125rem; }
    .edge-compute-node { color: var(--c-cache); }

    .edge-examples { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 640px) { .edge-examples { grid-template-columns: 1fr 1fr; } }
    .example-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
    .example-detail { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class CdnEdge {
  protected readonly zones = ZONES;
  protected readonly cdnOn = signal(false);
  protected readonly pulseTick = signal(0);

  // deterministic-ish "miss" zone that rotates on replay to illustrate the rarer origin request
  private missZoneId = signal(0);

  protected readonly edgeHit = (zoneId: number): boolean => zoneId !== this.missZoneId();

  replay(): void {
    this.pulseTick.update((t) => t + 1);
    this.missZoneId.update((id) => (id === 0 ? 2 : 0));
  }
}
