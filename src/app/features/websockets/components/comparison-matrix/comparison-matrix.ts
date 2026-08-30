import { Component, computed, signal } from '@angular/core';

type Tech = 'polling' | 'long-polling' | 'sse' | 'websocket';

const COLUMNS: { id: Tech; label: string }[] = [
  { id: 'polling', label: 'Polling' },
  { id: 'long-polling', label: 'Long Polling' },
  { id: 'sse', label: 'SSE' },
  { id: 'websocket', label: 'WebSocket' },
];

const ROWS: { label: string; values: Record<Tech, string> }[] = [
  { label: 'Communication direction', values: { polling: 'Client → Server', 'long-polling': 'Client → Server', sse: 'Server → Client', websocket: 'Client ⇄ Server' } },
  { label: 'Persistent connection', values: { polling: 'No', 'long-polling': 'Briefly, per request', sse: 'Yes', websocket: 'Yes' } },
  { label: 'Latency', values: { polling: 'Bound by interval', 'long-polling': 'Low', sse: 'Low', websocket: 'Lowest' } },
  { label: 'HTTP semantics', values: { polling: 'Full HTTP each time', 'long-polling': 'Full HTTP each time', sse: 'HTTP streaming', websocket: 'HTTP upgrade, then own protocol' } },
  { label: 'Browser support', values: { polling: 'Universal (fetch)', 'long-polling': 'Universal (fetch)', sse: 'Wide (EventSource)', websocket: 'Wide (WebSocket API)' } },
  { label: 'Complexity', values: { polling: 'Very low', 'long-polling': 'Moderate', sse: 'Low', websocket: 'Moderate–high at scale' } },
  { label: 'Infrastructure requirements', values: { polling: 'None special', 'long-polling': 'Longer request timeouts', sse: 'Streaming-friendly proxy', websocket: 'Upgrade-aware proxy/LB' } },
  { label: 'Typical use cases', values: { polling: 'Low-frequency checks', 'long-polling': 'Legacy real-time', sse: 'Feeds, notifications, progress', websocket: 'Chat, games, collab editing' } },
  { label: 'Scaling characteristics', values: { polling: 'Scales like normal HTTP', 'long-polling': 'Many held connections', sse: 'Many held connections', websocket: 'Many persistent connections + fan-out' } },
  { label: 'Connection overhead', values: { polling: 'New TCP/TLS per poll (unless keep-alive)', 'long-polling': 'New TCP/TLS per cycle (unless keep-alive)', sse: 'One connection, ongoing', websocket: 'One connection, ongoing' } },
  { label: 'Bidirectional?', values: { polling: 'No', 'long-polling': 'No', sse: 'No (client reply needs separate HTTP)', websocket: 'Yes' } },
];

const SUMMARY: Record<Tech, string> = {
  polling: 'The simplest possible option. Choose it when updates are infrequent enough that occasional delay is fine, and you want zero special infrastructure.',
  'long-polling': 'A stopgap for environments that can\'t use SSE or WebSocket. Lower latency than polling, but still pays for a full request cycle per update.',
  sse: 'Great when the server needs to push a stream of updates and the client rarely (or never) needs to talk back over the same channel.',
  websocket: 'The right tool when both sides need to send whenever they want, with the lowest latency — at the cost of managing persistent connections at scale.',
};

@Component({
  selector: 'app-comparison-matrix',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="comparison">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 017 — HEAD TO HEAD</p>
        <h2 class="lab-title">Four techniques, side by side.</h2>
        <p class="lab-lede">Click a column heading to spotlight it.</p>

        <div class="table-scroll">
          <table class="matrix">
            <thead>
              <tr>
                <th class="row-label-col"></th>
                @for (c of columns; track c.id) {
                  <th [class.is-selected]="selected() === c.id" (click)="selected.set(c.id)">
                    <button type="button" class="col-btn">{{ c.label }}</button>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (r of rows; track r.label) {
                <tr>
                  <td class="row-label">{{ r.label }}</td>
                  @for (c of columns; track c.id) {
                    <td [class.is-selected]="selected() === c.id">{{ r.values[c.id] }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="lab-panel summary-panel">
          <p class="summary-heading mono">{{ selectedLabel() }}</p>
          <p class="summary-text">{{ summary()[selected()] }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .table-scroll { margin-top: 28px; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); }
    .matrix { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .matrix th, .matrix td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .row-label-col { width: 180px; }
    .row-label { color: var(--text-faint); font-size: 0.75rem; background: var(--surface-raised); position: sticky; left: 0; }
    .matrix thead th { background: var(--surface-elevated); color: var(--text-muted); cursor: pointer; }
    .col-btn { background: none; border: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
    .matrix th.is-selected, .matrix td.is-selected { background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated)); color: var(--accent-strong); }
    .matrix tbody td { color: var(--text-muted); }
    .matrix tbody tr:last-child td { border-bottom: none; }

    .summary-panel { margin-top: 20px; }
    .summary-heading { color: var(--accent-2); font-size: 0.875rem; margin-bottom: 8px; }
    .summary-text { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; max-width: 660px; }
  `,
})
export class ComparisonMatrix {
  protected readonly columns = COLUMNS;
  protected readonly rows = ROWS;
  protected readonly summary = () => SUMMARY;
  protected readonly selected = signal<Tech>('websocket');
  protected readonly selectedLabel = computed(
    () => COLUMNS.find((c) => c.id === this.selected())?.label ?? '',
  );
}
