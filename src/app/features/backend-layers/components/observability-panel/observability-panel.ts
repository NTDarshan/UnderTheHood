import { Component, computed, signal } from '@angular/core';

interface Timing {
  id: string;
  label: string;
  ms: number;
}

const NORMAL: Timing[] = [
  { id: 'middleware', label: 'Middleware', ms: 2 },
  { id: 'controller', label: 'Controller', ms: 1 },
  { id: 'service', label: 'Service', ms: 5 },
  { id: 'repository', label: 'Repository', ms: 18 },
  { id: 'database', label: 'Database', ms: 15 },
  { id: 'response', label: 'Response', ms: 2 },
];

const WITH_EXTERNAL_API: Timing[] = [
  { id: 'middleware', label: 'Middleware', ms: 2 },
  { id: 'controller', label: 'Controller', ms: 1 },
  { id: 'service', label: 'Service', ms: 5 },
  { id: 'external', label: 'External API', ms: 850 },
  { id: 'repository', label: 'Repository', ms: 18 },
  { id: 'database', label: 'Database', ms: 15 },
  { id: 'response', label: 'Response', ms: 2 },
];

@Component({
  selector: 'app-observability-panel',
  standalone: true,
  template: `
    <section class="lab-section" id="observability">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 26 — OBSERVABILITY &amp; PERFORMANCE</p>
        <h2 class="lab-title">req_123 · trace_abc</h2>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!withExternal()" (click)="withExternal.set(false)">Normal Request</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="withExternal()" (click)="withExternal.set(true)">With External API Call</button>
          </div>

          <div class="timeline mono">
            @for (t of timings(); track t.id) {
              <button type="button" class="timing-row" [class.is-selected]="selectedId() === t.id" [class.is-slowest]="t.id === slowest().id" (click)="selectedId.set(t.id)">
                <span class="timing-label">{{ t.label }}</span>
                <span class="timing-bar" [style.width.%]="barWidth(t.ms)"></span>
                <span class="timing-ms">{{ t.ms }}ms</span>
              </button>
            }
          </div>

          <p class="total mono">Total: {{ total() }}ms</p>

          @if (selectedId() === slowest().id) {
            <p class="lab-note lab-note-warn"><strong>Slowest stage: {{ slowest().label }} ({{ slowest().ms }}ms).</strong>
              {{ withExternal() ? 'The layered architecture (controller/service/repository) is not the bottleneck here — a slow external API call is.' : 'The repository/database round trip dominates — still nowhere near a performance problem at this scale.' }}
            </p>
          }
          <p class="lab-note">Layering itself is not the performance problem. The engineering question is always: where is the actual expensive work — network, database, external APIs, serialization, CPU, or lock contention?</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .timeline { margin-top: 24px; display: flex; flex-direction: column; gap: 6px; }
    .timing-row { display: grid; grid-template-columns: 110px 1fr 50px; align-items: center; gap: 10px; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; }
    .timing-row.is-selected { border-color: var(--accent-dim); }
    .timing-row.is-slowest .timing-bar { background: var(--danger); }
    .timing-label { font-size: 0.75rem; color: var(--text-muted); text-align: left; }
    .timing-bar { height: 8px; background: var(--accent-2-dim); border-radius: 4px; min-width: 4px; }
    .timing-ms { font-size: 0.75rem; color: var(--text-faint); text-align: right; }

    .total { margin-top: 14px; font-size: 0.875rem; color: var(--accent-strong); font-weight: 700; }
  `,
})
export class ObservabilityPanel {
  protected readonly withExternal = signal(false);
  protected readonly selectedId = signal('repository');
  protected readonly timings = computed(() => (this.withExternal() ? WITH_EXTERNAL_API : NORMAL));
  protected readonly total = computed(() => this.timings().reduce((sum, t) => sum + t.ms, 0));
  protected readonly slowest = computed(() => this.timings().reduce((max, t) => (t.ms > max.ms ? t : max)));

  barWidth(ms: number): number {
    return Math.min(100, (ms / this.slowest().ms) * 100);
  }
}
