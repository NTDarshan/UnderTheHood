import { Component, OnDestroy, computed, signal } from '@angular/core';

type SideKey = 'hard' | 'graceful';
type ItemKind = 'request' | 'db' | 'job' | 'external';
type ItemState = 'active' | 'ok' | 'failed' | 'cancelled' | 'abandoned';

interface SimItem {
  id: string;
  kind: ItemKind;
  label: string;
  state: ItemState;
  finishAt: number;
}

interface SideMetrics {
  successful: number;
  failed: number;
  cancelled: number;
  abandonedJobs: number;
  resourcesClosed: boolean;
  durationMs: number;
}

const REQUEST_COUNT = 10;
const DB_COUNT = 3;
const JOB_COUNT = 2;
const EXTERNAL_COUNT = 1;

function buildItems(): SimItem[] {
  const items: SimItem[] = [];
  for (let i = 0; i < REQUEST_COUNT; i++) {
    items.push({ id: `req-${i}`, kind: 'request', label: `Request #${1820 + i}`, state: 'active', finishAt: 400 + Math.random() * 2600 });
  }
  for (let i = 0; i < DB_COUNT; i++) {
    items.push({ id: `db-${i}`, kind: 'db', label: `DB op #${i + 1}`, state: 'active', finishAt: 300 + Math.random() * 1200 });
  }
  for (let i = 0; i < JOB_COUNT; i++) {
    items.push({ id: `job-${i}`, kind: 'job', label: `Background job #${i + 1}`, state: 'active', finishAt: 800 + Math.random() * 2800 });
  }
  for (let i = 0; i < EXTERNAL_COUNT; i++) {
    items.push({ id: `ext-${i}`, kind: 'external', label: `External API call`, state: 'active', finishAt: 500 + Math.random() * 2000 });
  }
  return items;
}

interface SideState {
  key: SideKey;
  label: string;
  items: ReturnType<typeof signal<SimItem[]>>;
  phase: ReturnType<typeof signal<'idle' | 'running' | 'done'>>;
  startedAt: number;
  finishedAt: number;
  timers: ReturnType<typeof setTimeout>[];
}

@Component({
  selector: 'app-hard-vs-graceful-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene hvg-scene" id="gs-hard-vs-graceful">
      <div class="container">
        <p class="lab-index">28 — HARD STOP VS. GRACEFUL STOP</p>
        <h2 class="lab-title">The exact same load, two different endings.</h2>
        <p class="lab-lede">
          Both environments below start identically: 10 active requests, 3 DB operations, 2 background jobs, and 1
          external API call in flight. Hit stop on each side and watch what survives.
        </p>

        <div class="hvg-grid">
          @for (side of sides; track side.key) {
            <div class="lab-panel hvg-panel" [attr.data-side]="side.key">
              <div class="hvg-panel-head">
                <h3 class="hvg-panel-title" [class.hvg-title-hard]="side.key === 'hard'" [class.hvg-title-graceful]="side.key === 'graceful'">
                  {{ side.label }}
                </h3>
                <span class="pill" [class.pill-no]="phaseOf(side.key) === 'idle'" [class.pill-conditional]="phaseOf(side.key) === 'running'" [class.pill-yes]="phaseOf(side.key) === 'done'">
                  {{ phaseOf(side.key) === 'idle' ? 'RUNNING' : phaseOf(side.key) === 'running' ? (side.key === 'hard' ? 'TERMINATING' : 'DRAINING') : 'STOPPED' }}
                </span>
              </div>

              <div class="hvg-counts" role="list" aria-label="Live workload">
                <div class="hvg-count" role="listitem">
                  <span class="hvg-count-value mono">{{ countActive(side.key, 'request') }}</span>
                  <span class="hvg-count-label mono">requests</span>
                </div>
                <div class="hvg-count" role="listitem">
                  <span class="hvg-count-value mono">{{ countActive(side.key, 'db') }}</span>
                  <span class="hvg-count-label mono">db ops</span>
                </div>
                <div class="hvg-count" role="listitem">
                  <span class="hvg-count-value mono">{{ countActive(side.key, 'job') }}</span>
                  <span class="hvg-count-label mono">jobs</span>
                </div>
                <div class="hvg-count" role="listitem">
                  <span class="hvg-count-value mono">{{ countActive(side.key, 'external') }}</span>
                  <span class="hvg-count-label mono">external</span>
                </div>
              </div>

              <div class="hvg-items" role="list" aria-label="Work items">
                @for (item of side.items(); track item.id) {
                  <div class="hvg-item" [attr.data-state]="item.state" role="listitem">
                    <span class="hvg-item-dot" [attr.data-kind]="item.kind" aria-hidden="true"></span>
                    <span class="hvg-item-label mono">{{ item.label }}</span>
                    <span class="hvg-item-mark mono">{{ markFor(item.state) }}</span>
                  </div>
                }
              </div>

              <div class="lab-btn-row">
                <button
                  type="button"
                  class="lab-btn"
                  [class.lab-btn-danger]="side.key === 'hard'"
                  [class.lab-btn-primary]="side.key === 'graceful'"
                  [disabled]="phaseOf(side.key) !== 'idle'"
                  (click)="stop(side.key)"
                >
                  {{ side.key === 'hard' ? 'HARD STOP' : 'GRACEFUL STOP' }}
                </button>
              </div>
            </div>
          }
        </div>

        <div class="lab-panel hvg-compare-panel">
          <div class="hvg-compare-head">
            <h3 class="panel-heading">Comparison</h3>
            <button type="button" class="lab-btn" (click)="resetAll()">Reset both</button>
          </div>

          <div class="hvg-table-wrap">
            <table class="hvg-table">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col" class="hvg-th-hard">Hard stop</th>
                  <th scope="col" class="hvg-th-graceful">Graceful stop</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Successful requests</th>
                  <td class="mono">{{ metricsFor('hard') ? metricsFor('hard')!.successful : '—' }}</td>
                  <td class="mono">{{ metricsFor('graceful') ? metricsFor('graceful')!.successful : '—' }}</td>
                </tr>
                <tr>
                  <th scope="row">Failed requests</th>
                  <td class="mono hvg-bad-cell">{{ metricsFor('hard') ? metricsFor('hard')!.failed : '—' }}</td>
                  <td class="mono">{{ metricsFor('graceful') ? metricsFor('graceful')!.failed : '—' }}</td>
                </tr>
                <tr>
                  <th scope="row">Cancelled requests</th>
                  <td class="mono">{{ metricsFor('hard') ? metricsFor('hard')!.cancelled : '—' }}</td>
                  <td class="mono">{{ metricsFor('graceful') ? metricsFor('graceful')!.cancelled : '—' }}</td>
                </tr>
                <tr>
                  <th scope="row">Abandoned jobs</th>
                  <td class="mono hvg-bad-cell">{{ metricsFor('hard') ? metricsFor('hard')!.abandonedJobs : '—' }}</td>
                  <td class="mono">{{ metricsFor('graceful') ? metricsFor('graceful')!.abandonedJobs : '—' }}</td>
                </tr>
                <tr>
                  <th scope="row">Resource cleanup</th>
                  <td>
                    @if (metricsFor('hard'); as m) {
                      <span class="pill" [class.pill-yes]="m.resourcesClosed" [class.pill-no]="!m.resourcesClosed">{{ m.resourcesClosed ? 'DONE' : 'NOT DONE' }}</span>
                    } @else { <span class="mono">—</span> }
                  </td>
                  <td>
                    @if (metricsFor('graceful'); as m) {
                      <span class="pill" [class.pill-yes]="m.resourcesClosed" [class.pill-no]="!m.resourcesClosed">{{ m.resourcesClosed ? 'DONE' : 'NOT DONE' }}</span>
                    } @else { <span class="mono">—</span> }
                  </td>
                </tr>
                <tr>
                  <th scope="row">Shutdown duration</th>
                  <td class="mono">{{ metricsFor('hard') ? (metricsFor('hard')!.durationMs / 1000).toFixed(1) + 's' : '—' }}</td>
                  <td class="mono">{{ metricsFor('graceful') ? (metricsFor('graceful')!.durationMs / 1000).toFixed(1) + 's' : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          @if (bothDone()) {
            <p class="lab-note">
              Same starting load, same server code path for accepting work — the only difference is whether shutdown
              waits for in-flight work to finish before tearing resources down. That single decision is the gap
              between the two rows above.
            </p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .hvg-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .hvg-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 900px) { .hvg-grid { grid-template-columns: 1fr 1fr; } }

    .hvg-panel { margin-top: 0; }
    .hvg-panel[data-side='hard'] { border-color: color-mix(in srgb, var(--stopped) 35%, var(--border)); }
    .hvg-panel[data-side='graceful'] { border-color: color-mix(in srgb, var(--running) 35%, var(--border)); }

    .hvg-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .hvg-panel-title { margin: 0; font-size: 1.0625rem; font-family: var(--font-mono); letter-spacing: 0.02em; }
    .hvg-title-hard { color: var(--stopped); }
    .hvg-title-graceful { color: var(--running); }

    .hvg-counts { margin-top: 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .hvg-count { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .hvg-count-value { font-size: 1.25rem; color: var(--text); font-weight: 700; }
    .hvg-count-label { font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.04em; }

    .hvg-items { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .hvg-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: border-color 0.25s ease, background 0.25s ease, opacity 0.25s ease;
    }
    .hvg-item-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--idle); }
    .hvg-item-dot[data-kind='request'] { background: var(--running); }
    .hvg-item-dot[data-kind='db'] { background: var(--resource); }
    .hvg-item-dot[data-kind='job'] { background: var(--queue); }
    .hvg-item-dot[data-kind='external'] { background: var(--signal); }
    .hvg-item-label { font-size: 0.75rem; color: var(--text-muted); flex: 1; }
    .hvg-item-mark { font-size: 0.8125rem; font-weight: 700; min-width: 18px; text-align: right; }

    .hvg-item[data-state='active'] { }
    .hvg-item[data-state='ok'] { border-color: var(--running); background: color-mix(in srgb, var(--running) 8%, var(--surface-elevated)); }
    .hvg-item[data-state='ok'] .hvg-item-mark { color: var(--running); }
    .hvg-item[data-state='failed'] { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 10%, var(--surface-elevated)); }
    .hvg-item[data-state='failed'] .hvg-item-mark { color: var(--stopped); }
    .hvg-item[data-state='cancelled'] { border-color: var(--cancelled); }
    .hvg-item[data-state='cancelled'] .hvg-item-mark { color: var(--cancelled); }
    .hvg-item[data-state='abandoned'] { border-color: var(--stopped); opacity: 0.7; }
    .hvg-item[data-state='abandoned'] .hvg-item-mark { color: var(--stopped); }

    .hvg-compare-panel { border-color: var(--border-strong); }
    .hvg-compare-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .panel-heading { margin: 0; font-size: 1.125rem; color: var(--text); }

    .hvg-table-wrap { margin-top: 18px; overflow-x: auto; }
    .hvg-table { width: 100%; min-width: 480px; border-collapse: collapse; font-size: 0.8125rem; }
    .hvg-table th, .hvg-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
    .hvg-table thead th { color: var(--text-faint); font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }
    .hvg-table tbody th { color: var(--text-muted); font-weight: 500; }
    .hvg-table td { color: var(--text); }
    .hvg-th-hard { color: var(--stopped); }
    .hvg-th-graceful { color: var(--running); }
    .hvg-bad-cell { color: var(--stopped); font-weight: 700; }

    @media (prefers-reduced-motion: reduce) {
      .hvg-item { transition: none; }
    }
  `,
})
export class HardVsGracefulLab implements OnDestroy {
  protected readonly sides: SideState[] = [
    { key: 'hard', label: 'HARD STOP', items: signal(buildItems()), phase: signal('idle'), startedAt: 0, finishedAt: 0, timers: [] },
    { key: 'graceful', label: 'GRACEFUL STOP', items: signal(buildItems()), phase: signal('idle'), startedAt: 0, finishedAt: 0, timers: [] },
  ];

  protected readonly bothDone = computed(() => this.sides.every((s) => s.phase() === 'done'));

  ngOnDestroy(): void {
    for (const side of this.sides) this.clearSideTimers(side);
  }

  protected phaseOf(key: SideKey): 'idle' | 'running' | 'done' {
    return this.sides.find((s) => s.key === key)!.phase();
  }

  protected countActive(key: SideKey, kind: ItemKind): number {
    const side = this.sides.find((s) => s.key === key)!;
    return side.items().filter((i) => i.kind === kind && i.state === 'active').length;
  }

  protected markFor(state: ItemState): string {
    switch (state) {
      case 'ok':
        return '✓';
      case 'failed':
        return '✕';
      case 'cancelled':
        return '●';
      case 'abandoned':
        return '⚠';
      default:
        return '○';
    }
  }

  protected metricsFor(key: SideKey): SideMetrics | null {
    const side = this.sides.find((s) => s.key === key)!;
    if (side.phase() === 'idle') return null;
    const items = side.items();
    const requests = items.filter((i) => i.kind === 'request');
    const jobs = items.filter((i) => i.kind === 'job');
    const successful = requests.filter((i) => i.state === 'ok').length;
    const failed = items.filter((i) => i.state === 'failed').length;
    const cancelled = items.filter((i) => i.state === 'cancelled').length;
    const abandonedJobs = jobs.filter((i) => i.state === 'abandoned').length;
    const resourcesClosed = key === 'graceful' ? side.phase() === 'done' : false;
    const durationMs = side.phase() === 'done' ? side.finishedAt - side.startedAt : 0;
    return { successful, failed, cancelled, abandonedJobs, resourcesClosed, durationMs };
  }

  protected stop(key: SideKey): void {
    const side = this.sides.find((s) => s.key === key)!;
    if (side.phase() !== 'idle') return;
    side.phase.set('running');
    side.startedAt = Date.now();

    if (key === 'hard') {
      this.runHardStop(side);
    } else {
      this.runGracefulStop(side);
    }
  }

  private runHardStop(side: SideState): void {
    // Instant abrupt termination: everything fails/abandons at once.
    const t = setTimeout(() => {
      side.items.update((list) =>
        list.map((item) => {
          if (item.kind === 'job') return { ...item, state: 'abandoned' as ItemState };
          return { ...item, state: 'failed' as ItemState };
        }),
      );
      side.finishedAt = Date.now();
      side.phase.set('done');
    }, 150);
    side.timers.push(t);
  }

  private runGracefulStop(side: SideState): void {
    // Staged draining: each item finishes on its own natural completion time, capped by a deadline.
    const deadline = 6000;
    const items = side.items();
    for (const item of items) {
      const finishAt = Math.min(item.finishAt, deadline - 200);
      const t = setTimeout(() => {
        side.items.update((list) =>
          list.map((i) => (i.id === item.id ? { ...i, state: 'ok' as ItemState } : i)),
        );
      }, finishAt);
      side.timers.push(t);
    }

    const closeAt = Math.max(...items.map((i) => Math.min(i.finishAt, deadline - 200))) + 400;
    const t2 = setTimeout(() => {
      side.finishedAt = Date.now();
      side.phase.set('done');
    }, closeAt);
    side.timers.push(t2);
  }

  private clearSideTimers(side: SideState): void {
    for (const t of side.timers) clearTimeout(t);
    side.timers = [];
  }

  protected resetAll(): void {
    for (const side of this.sides) {
      this.clearSideTimers(side);
      side.items.set(buildItems());
      side.phase.set('idle');
      side.startedAt = 0;
      side.finishedAt = 0;
    }
  }
}
