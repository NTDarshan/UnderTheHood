import { Component, computed, signal } from '@angular/core';

interface TimelineStop {
  id: string;
  label: string;
  owner: string;
  does: string;
  doesNot: string;
}

const STOPS: TimelineStop[] = [
  { id: 'arrival', label: 'Request arrives', owner: 'Network / server', does: 'Accepts the TCP connection and parses the raw HTTP request.', doesNot: 'Know anything about routes, users, or business rules yet.' },
  { id: 'middleware', label: 'Middleware', owner: 'Cross-cutting pipeline', does: 'Logs, checks CORS, authenticates, rate-limits.', doesNot: 'Decide business outcomes for a specific endpoint.' },
  { id: 'routing', label: 'Routing', owner: 'Router', does: 'Matches method + path to a handler.', doesNot: 'Execute that handler’s logic.' },
  { id: 'controller', label: 'Controller', owner: 'HTTP boundary', does: 'Binds input, calls the service, shapes the HTTP response.', doesNot: 'Contain business rules or SQL.' },
  { id: 'service', label: 'Service', owner: 'Application/business layer', does: 'Executes the use case: rules, calculations, orchestration.', doesNot: 'Know about HTTP status codes.' },
  { id: 'repository', label: 'Repository', owner: 'Data access layer', does: 'Reads/writes persistence, maps results.', doesNot: 'Decide business policy.' },
  { id: 'database', label: 'Database', owner: 'Storage engine', does: 'Executes the query, enforces constraints.', doesNot: 'Know why the query was issued.' },
  { id: 'response', label: 'Response', owner: 'Controller / middleware', does: 'Formats and returns the result to the client.', doesNot: 'Re-run business logic.' },
  { id: 'client-timeline', label: 'Client', owner: 'Caller', does: 'Receives the response and continues.', doesNot: 'See anything about internal layers.' },
];

@Component({
  selector: 'app-lifecycle-timeline',
  standalone: true,
  template: `
    <section class="lab-section" id="timeline">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 03 — REQUEST LIFECYCLE TIMELINE</p>
        <h2 class="lab-title">Every stop on the journey owns exactly one job.</h2>

        <div class="timeline mono">
          @for (s of stops; track s.id; let last = $last) {
            <button type="button" class="stop" [class.is-selected]="selectedId() === s.id" (click)="selectedId.set(s.id)">
              <span class="stop-dot"></span>
              <span class="stop-label">{{ s.label }}</span>
            </button>
            @if (!last) {
              <span class="stop-arrow">↓</span>
            }
          }
        </div>

        <div class="lab-panel">
          <p class="detail-row"><strong>Who owns this step?</strong> {{ selected().owner }}</p>
          <p class="detail-row"><strong>What does it do?</strong> {{ selected().does }}</p>
          <p class="detail-row is-danger"><strong>What should it NOT do?</strong> {{ selected().doesNot }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .timeline { margin-top: 32px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; max-width: 340px; }
    @media (min-width: 900px) { .timeline { flex-direction: row; align-items: center; max-width: none; flex-wrap: wrap; } }
    .stop { display: flex; align-items: center; gap: 8px; background: transparent; border: none; padding: 6px 8px; border-radius: var(--radius-sm); color: var(--text-faint); font-size: 0.75rem; }
    .stop:hover { color: var(--text); }
    .stop-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); flex-shrink: 0; }
    .stop.is-selected { color: var(--accent-strong); }
    .stop.is-selected .stop-dot { background: var(--accent); box-shadow: 0 0 8px var(--glow-accent); }
    .stop-arrow { color: var(--border-strong); font-size: 0.6875rem; }
    @media (min-width: 900px) { .stop-arrow { transform: rotate(-90deg); } }

    .detail-row { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin-top: 10px; }
    .detail-row:first-child { margin-top: 0; }
    .detail-row strong { color: var(--text); }
    .detail-row.is-danger strong { color: var(--danger); }
  `,
})
export class LifecycleTimeline {
  protected readonly stops = STOPS;
  protected readonly selectedId = signal('controller');
  protected readonly selected = computed(() => this.stops.find((s) => s.id === this.selectedId())!);
}
