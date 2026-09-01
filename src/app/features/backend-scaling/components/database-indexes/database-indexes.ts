import { Component, OnDestroy, computed, signal } from '@angular/core';

interface UserRow {
  row: number;
  email: string;
}

const ROW_COUNT = 26;
const TARGET_ROW = 24;
const TARGET_EMAIL = 'user@example.com';
const SCAN_STEP_MS = 55;

function buildRows(): UserRow[] {
  const rows: UserRow[] = [];
  for (let i = 1; i <= ROW_COUNT; i++) {
    rows.push({
      row: i,
      email: i === TARGET_ROW ? TARGET_EMAIL : `user${i.toString().padStart(3, '0')}@mail.io`,
    });
  }
  return rows;
}

const ROWS = buildRows();

type Phase = 'idle' | 'running' | 'done';

@Component({
  selector: 'app-database-indexes',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="database-indexes">
      <div class="container">
        <p class="lab-index">12 — DATABASE INDEXES</p>
        <h2 class="lab-title">Finding one row in a million shouldn't mean reading a million rows.</h2>
        <p class="lab-lede">
          Searching a <code class="mono">users</code> table for
          <code class="mono">email = '{{ targetEmail }}'</code>. Without an index, the database has no way to
          know where that row lives — it reads the table top to bottom. With an index, it consults a small
          sorted structure and jumps straight there.
        </p>

        <div class="lab-btn-row" role="group" aria-label="Index mode">
          <button
            type="button"
            class="lab-btn lab-btn-danger"
            [class.is-active]="mode() === 'off'"
            [attr.aria-pressed]="mode() === 'off'"
            (click)="setMode('off')"
          >
            Index: OFF
          </button>
          <button
            type="button"
            class="lab-btn lab-btn-primary"
            [class.is-active]="mode() === 'on'"
            [attr.aria-pressed]="mode() === 'on'"
            (click)="setMode('on')"
          >
            Index: ON
          </button>
          <button type="button" class="lab-btn" (click)="replay()">Replay</button>
        </div>

        <div class="lab-panel">
          <div class="query-line mono">
            <span class="tok-method">SELECT</span> * <span class="tok-method">FROM</span> users
            <span class="tok-method">WHERE</span> email = '{{ targetEmail }}';
          </div>

          @if (mode() === 'on') {
            <div class="index-visual mono" [class.is-active]="phase() !== 'idle'">
              <p class="lab-node">INDEX (B-TREE ON email)</p>
              <div class="btree-row">
                @for (n of btreeNodes; track n) {
                  <div class="btree-node" [class.is-hit]="phase() !== 'idle' && n === btreeTargetLabel">{{ n }}</div>
                }
              </div>
              <p class="btree-caption">
                {{ phase() === 'idle' ? 'Ready — press a mode above or replay.' : 'Lookup narrows straight to the matching leaf.' }}
              </p>
            </div>
          }

          <div class="table-scroll">
            <table class="row-table mono">
              <thead>
                <tr><th>row</th><th>email</th></tr>
              </thead>
              <tbody>
                @for (r of rows; track r.row) {
                  <tr
                    [class.is-scanned]="isScanned(r.row)"
                    [class.is-current]="currentRow() === r.row"
                    [class.is-match]="r.row === targetRow && phase() === 'done'"
                  >
                    <td>{{ r.row }}</td>
                    <td>{{ r.email }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="counter-row mono">
            <span class="counter-label">{{ mode() === 'off' ? 'Scanning row:' : 'Index steps:' }}</span>
            <span class="counter-value" [class.is-danger]="mode() === 'off'" [class.is-ok]="mode() === 'on'">
              {{ phase() === 'idle' ? '—' : (mode() === 'off' ? currentRow() ?? scannedCount() : scannedCount()) }}
            </span>
          </div>

          <div class="stat-grid">
            <div class="stat">
              <p class="stat-label mono">READ PERFORMANCE</p>
              <p class="stat-value mono" [class.is-danger]="mode() === 'off'" [class.is-ok]="mode() === 'on'">
                {{ phase() === 'done' ? scannedCount() + ' rows scanned' : '—' }}
              </p>
            </div>
            <div class="stat">
              <p class="stat-label mono">WRITE OVERHEAD</p>
              <p class="stat-value mono" [class.is-warn]="mode() === 'on'">
                {{ mode() === 'on' ? '+15% write time' : 'baseline' }}
              </p>
            </div>
            <div class="stat">
              <p class="stat-label mono">STORAGE</p>
              <p class="stat-value mono" [class.is-warn]="mode() === 'on'">
                {{ mode() === 'on' ? '+18% storage' : 'baseline' }}
              </p>
            </div>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          An index trades additional storage and write cost (every insert/update must also update the index) for
          faster reads — but <strong>only for access patterns the index actually matches</strong>. An index on
          <code class="mono">email</code> does nothing for a query filtering on <code class="mono">created_at</code>.
          Indexes are not a free, universally-beneficial default — they're a targeted trade-off.
        </p>
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
    }

    .query-line { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 16px; font-size: 0.8125rem; color: var(--text-muted); }
    .query-line .tok-method { color: var(--c-db); font-weight: 600; }

    .index-visual { margin-top: 20px; padding: 16px; border: 1px solid var(--c-db); border-radius: var(--radius-md); background: color-mix(in srgb, var(--c-db) 8%, var(--surface)); }
    .btree-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .btree-node { padding: 5px 9px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-faint); background: var(--surface); transition: all 0.2s ease; }
    .btree-node.is-hit { color: var(--bg); background: var(--c-db); border-color: var(--c-db); font-weight: 700; box-shadow: 0 0 10px var(--c-db); }
    .btree-caption { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); }

    .table-scroll { margin-top: 20px; max-height: 320px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md); }
    .row-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .row-table th { position: sticky; top: 0; text-align: left; padding: 8px 12px; color: var(--text-faint); background: var(--surface-elevated); border-bottom: 1px solid var(--border); }
    .row-table td { padding: 6px 12px; color: var(--text-muted); border-bottom: 1px solid var(--border); transition: background 0.15s ease, color 0.15s ease; }
    .row-table tr.is-scanned td { background: color-mix(in srgb, var(--crit) 10%, transparent); color: var(--text); }
    .row-table tr.is-current td { background: color-mix(in srgb, var(--crit) 22%, transparent); color: var(--text); }
    .row-table tr.is-match td { background: color-mix(in srgb, var(--ok) 22%, transparent); color: var(--text); font-weight: 600; }

    .counter-row { display: flex; align-items: center; gap: 10px; margin-top: 18px; font-size: 0.875rem; }
    .counter-label { color: var(--text-muted); }
    .counter-value { font-weight: 700; color: var(--text); }
    .counter-value.is-danger { color: var(--crit); }
    .counter-value.is-ok { color: var(--ok); }

    .stat-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
    .stat-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .stat-value { margin-top: 6px; font-size: 1.0625rem; font-weight: 700; color: var(--text); }
    .stat-value.is-danger { color: var(--crit); }
    .stat-value.is-ok { color: var(--ok); }
    .stat-value.is-warn { color: var(--warn); }
  `,
})
export class DatabaseIndexes implements OnDestroy {
  protected readonly rows = ROWS;
  protected readonly targetRow = TARGET_ROW;
  protected readonly targetEmail = TARGET_EMAIL;
  protected readonly btreeNodes = ['a*', 'j*', 'u*', 'user0**', 'user@ex...'];
  protected readonly btreeTargetLabel = 'user@ex...';

  protected readonly mode = signal<'off' | 'on'>('off');
  protected readonly phase = signal<Phase>('idle');
  protected readonly currentRow = signal<number | null>(null);
  protected readonly scannedRows = signal<Set<number>>(new Set());

  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly scannedCount = computed(() => this.scannedRows().size);

  constructor() {
    this.run();
  }

  protected setMode(m: 'off' | 'on'): void {
    if (this.mode() === m) return;
    this.mode.set(m);
    this.run();
  }

  protected replay(): void {
    this.run();
  }

  protected isScanned(row: number): boolean {
    return this.scannedRows().has(row);
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private schedule(fn: () => void, delay: number): void {
    this.timers.push(setTimeout(fn, delay));
  }

  private run(): void {
    this.clearTimers();
    this.currentRow.set(null);
    this.scannedRows.set(new Set());
    this.phase.set('running');

    if (this.mode() === 'on') {
      // Index lookup: two quick visual steps straight to the target.
      this.schedule(() => {
        this.currentRow.set(TARGET_ROW);
        this.scannedRows.set(new Set([TARGET_ROW]));
      }, 120);
      this.schedule(() => this.phase.set('done'), 260);
      return;
    }

    // Full table scan: sweep from row 1 until the match.
    for (let i = 1; i <= TARGET_ROW; i++) {
      this.schedule(() => {
        this.currentRow.set(i);
        this.scannedRows.update((set) => new Set(set).add(i));
      }, i * SCAN_STEP_MS);
    }
    this.schedule(() => this.phase.set('done'), (TARGET_ROW + 1) * SCAN_STEP_MS);
  }
}
