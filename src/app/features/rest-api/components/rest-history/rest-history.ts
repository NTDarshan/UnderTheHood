import { Component, computed, signal } from '@angular/core';

interface TimelineNode {
  id: string;
  label: string;
  detail: string;
}

const TIMELINE: TimelineNode[] = [
  { id: 'web', label: 'World Wide Web', detail: 'The web arrives as a way to link documents over HTTP.' },
  { id: 'tbl', label: 'Tim Berners-Lee', detail: 'Designs the web\'s foundations: HTTP, URLs, and HTML/hypermedia.' },
  { id: 'foundations', label: 'HTTP + URLs + Hypermedia', detail: 'These three pieces become the raw material every later API style builds on.' },
  { id: 'fielding', label: 'Roy Fielding', detail: 'Co-author of the HTTP spec, describes REST in his 2000 doctoral dissertation.' },
  { id: 'rest', label: 'REST', detail: 'A set of architectural constraints for building networked systems — not a protocol or a format.' },
  { id: 'resource-web', label: 'Resource-oriented web architecture', detail: 'REST\'s ideas get applied specifically to designing web APIs around resources and URLs.' },
  { id: 'modern', label: 'Modern REST APIs', detail: 'Today\'s "REST APIs" are the practical, HTTP + JSON-flavored descendants of that architecture.' },
];

@Component({
  selector: 'app-rest-history',
  standalone: true,
  template: `
    <section class="lab-section" id="history">
      <div class="container">
        <p class="lab-index">REST API / 03 — WHAT IS REST?</p>
        <h2 class="lab-title">A short lineage, then the actual definition.</h2>

        <div class="lab-panel">
          <div class="timeline mono">
            @for (n of timeline; track n.id; let i = $index) {
              <button type="button" class="tl-node" [class.is-active]="selected() === n.id" (click)="selected.set(n.id)">
                {{ n.label }}
              </button>
              @if (i < timeline.length - 1) {
                <span class="tl-arrow">→</span>
              }
            }
          </div>

          @if (currentNode(); as n) {
            <p class="tl-detail">{{ n.detail }}</p>
          }
        </div>

        <div class="lab-panel">
          <h3 class="rest-heading">REST = Representational State Transfer</h3>
          <div class="rest-flow mono">
            <div class="flow-node">
              <p class="flow-label">RESOURCE</p>
              <p class="flow-value">Book #42</p>
            </div>
            <span class="lab-flow-arrow">→</span>
            <div class="flow-node">
              <p class="flow-label">REPRESENTATION</p>
              <p class="flow-value">{{ '{ "id": 42, "title": "Clean Architecture" }' }}</p>
            </div>
            <span class="lab-flow-arrow">→</span>
            <div class="flow-node">
              <p class="flow-label">TRANSFER</p>
              <p class="flow-value">Client ← HTTP → Server</p>
            </div>
          </div>

          <p class="lab-note">
            The <strong>resource</strong> — "Book #42" — exists conceptually on the server. The client never
            receives the resource itself; it receives a <strong>representation</strong> of its current state.
            JSON is one possible representation. HTML and XML also work — REST does not mean JSON.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .timeline { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .tl-node { padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-faint); font-size: 0.75rem; transition: color 0.15s ease, border-color 0.15s ease; }
    .tl-node:hover { color: var(--accent-strong); border-color: var(--accent); }
    .tl-node.is-active { color: var(--accent-2); border-color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 10%, var(--surface-elevated)); }
    .tl-arrow { color: var(--text-faint); font-size: 0.75rem; }
    .tl-detail { margin-top: 20px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

    .rest-heading { font-size: 1.0625rem; color: var(--text); }
    .rest-flow { margin-top: 22px; display: flex; align-items: stretch; gap: 14px; flex-wrap: wrap; }
    .flow-node { flex: 1; min-width: 160px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .flow-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); }
    .flow-value { margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); word-break: break-word; }
  `,
})
export class RestHistory {
  protected readonly timeline = TIMELINE;
  protected readonly selected = signal<string>('rest');
  protected readonly currentNode = computed(() => this.timeline.find((n) => n.id === this.selected()) ?? null);
}
