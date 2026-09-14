import { Component, OnDestroy, computed, signal } from '@angular/core';

type LogKind = 'info' | 'ok' | 'warn';
interface LogEntry { text: string; kind: LogKind; }

const STARTING_PRICE = 40;

@Component({
  selector: 'app-crud-concurrency',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-concurrency">
      <div class="container">
        <p class="lab-index mono">13 — CONCURRENT UPDATES</p>
        <h2 class="lab-title">Two people editing the same book at once</h2>
        <p class="lab-lede">
          Book #42 is open in two tabs at the same time. Walk both edits through in order and watch what the
          second write does to the first.
        </p>

        <div class="lab-panel">
          <div class="actors-row">
            <div class="actor-card" [class.is-flashing]="lastWriter() === 'A'">
              <p class="lab-node">User A</p>
              <p class="actor-book mono">Book #42</p>
              <p class="actor-price mono">Price: <strong>{{ priceSeenByA() === null ? '—' : '$' + priceSeenByA() }}</strong></p>
              <button
                type="button"
                class="lab-btn"
                [disabled]="!canOpenA() || done()"
                (click)="openA()"
              >
                Open Book #42
              </button>
              <button
                type="button"
                class="lab-btn lab-btn-primary"
                [disabled]="!canEditA() || done()"
                (click)="editA()"
              >
                Change price to $45
              </button>
            </div>

            <div class="actor-card" [class.is-flashing]="lastWriter() === 'B'">
              <p class="lab-node">User B</p>
              <p class="actor-book mono">Book #42</p>
              <p class="actor-price mono">Price: <strong>{{ priceSeenByB() === null ? '—' : '$' + priceSeenByB() }}</strong></p>
              <button
                type="button"
                class="lab-btn"
                [disabled]="!canOpenB() || done()"
                (click)="openB()"
              >
                Open Book #42
              </button>
              <button
                type="button"
                class="lab-btn lab-btn-primary"
                [disabled]="!canEditB() || done()"
                (click)="editB()"
              >
                Change price to $50
              </button>
            </div>
          </div>

          <div class="server-row">
            <p class="lab-node">Database — books.price</p>
            <p class="server-price mono">
              \${{ serverPrice() }}
              @if (serverVersion() !== null) {
                <span class="ver-tag mono">version {{ serverVersion() }}</span>
              }
            </p>
          </div>

          <div class="toggle-row">
            <button
              type="button"
              class="lab-btn"
              [attr.aria-pressed]="optimisticOn()"
              [disabled]="stepIndex() > 0"
              (click)="optimisticOn.set(!optimisticOn())"
            >
              Optimistic concurrency: {{ optimisticOn() ? 'ON' : 'OFF' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset scenario</button>
          </div>

          <div class="log-panel mono" aria-live="polite">
            @for (l of log(); track $index) {
              <div class="log-line" [attr.data-kind]="l.kind">{{ l.text }}</div>
            }
          </div>

          @if (done()) {
            <div class="result-panel" [class.is-wrong]="!optimisticOn()">
              @if (!optimisticOn()) {
                <span class="pill pill-no">LOST UPDATE</span>
                <p class="lab-note lab-note-warn">
                  User A’s change to $45 was overwritten without warning — the server had no way to know a newer
                  read had already happened. The database now shows $50 as if $45 never existed.
                </p>
              } @else {
                <span class="pill pill-conditional">409 CONFLICT — STALE VERSION</span>
                <p class="lab-note">
                  User B’s write carried version 1, but the row was already at version 2 after User A’s write.
                  The server rejects it instead of silently overwriting — User B has to reload and reapply.
                </p>
              }
            </div>
          }
        </div>

        <p class="lab-note">
          <strong>Optimistic concurrency</strong> means the server doesn’t lock the row while someone edits it —
          it just tags each row with a <span class="mono">version</span> (or a RowVersion / ETag). Every update has
          to say which version it read. If that version is no longer current, the write is rejected with a
          <span class="mono">409 Conflict</span> instead of blindly overwriting whatever is there. No locking, no
          silent data loss — just an honest "someone got there first."
        </p>
      </div>
    </section>
  `,
  styles: `
    .cr-scene {
      --cr-accent: var(--accent);
      --cr-cyan: var(--accent-2);
      --cr-violet: #a78bfa;
      --cr-success: #4ade80;
      --cr-warning: #fbbf24;
      --cr-danger: var(--danger);
    }

    .actors-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 700px) {
      .actors-row { grid-template-columns: 1fr 1fr; }
    }

    .actor-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 18px;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .actor-card.is-flashing {
      border-color: var(--cr-accent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--cr-accent) 40%, transparent);
    }

    .actor-book { color: var(--text-faint); font-size: 0.75rem; }
    .actor-price { font-size: 0.9375rem; color: var(--text); }
    .actor-price strong { color: var(--cr-cyan); }

    .server-row {
      margin-top: 22px;
      padding: 14px 18px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .server-price {
      margin-top: 6px;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .ver-tag {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--cr-violet);
      border: 1px solid color-mix(in srgb, var(--cr-violet) 40%, var(--border-strong));
      border-radius: 999px;
      padding: 2px 8px;
    }

    .toggle-row {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .log-panel {
      margin-top: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      min-height: 100px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .log-line { font-size: 0.75rem; color: var(--text-muted); }
    .log-line[data-kind='ok'] { color: var(--cr-success); }
    .log-line[data-kind='warn'] { color: var(--cr-warning); }

    .result-panel {
      margin-top: 20px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .result-panel.is-wrong { border-color: color-mix(in srgb, var(--cr-danger) 40%, var(--border)); }

    @media (prefers-reduced-motion: reduce) {
      .actor-card { transition: none; }
    }
  `,
})
export class CrudConcurrency implements OnDestroy {
  protected readonly optimisticOn = signal(false);

  protected readonly priceSeenByA = signal<number | null>(null);
  protected readonly priceSeenByB = signal<number | null>(null);
  protected readonly versionSeenByA = signal<number | null>(null);
  protected readonly versionSeenByB = signal<number | null>(null);

  protected readonly serverPrice = signal(STARTING_PRICE);
  protected readonly serverVersion = signal<number | null>(null);

  protected readonly log = signal<LogEntry[]>([]);
  protected readonly stepIndex = signal(0);
  protected readonly lastWriter = signal<'A' | 'B' | null>(null);
  protected readonly done = signal(false);

  protected readonly canOpenA = computed(() => this.stepIndex() === 0);
  protected readonly canOpenB = computed(() => this.stepIndex() === 1);
  protected readonly canEditA = computed(() => this.stepIndex() === 2);
  protected readonly canEditB = computed(() => this.stepIndex() === 3);

  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.flashTimer !== null) clearTimeout(this.flashTimer);
  }

  protected openA(): void {
    this.priceSeenByA.set(this.serverPrice());
    this.versionSeenByA.set(this.serverVersion() ?? 1);
    this.push(`User A: GET /api/books/42 → price $${this.serverPrice()}`, 'info');
    this.stepIndex.set(1);
  }

  protected openB(): void {
    this.priceSeenByB.set(this.serverPrice());
    this.versionSeenByB.set(this.serverVersion() ?? 1);
    this.push(`User B: GET /api/books/42 → price $${this.serverPrice()}`, 'info');
    this.stepIndex.set(2);
  }

  protected editA(): void {
    this.priceSeenByA.set(45);
    this.serverPrice.set(45);
    if (this.optimisticOn()) {
      this.serverVersion.set(2);
    }
    this.flash('A');
    this.push('User A: PATCH /api/books/42 { price: 45 } → 200 OK, saved.', 'ok');
    this.stepIndex.set(3);
  }

  protected editB(): void {
    this.priceSeenByB.set(50);
    if (this.optimisticOn()) {
      const staleVersion = this.versionSeenByB();
      const currentVersion = this.serverVersion();
      if (staleVersion !== currentVersion) {
        this.push(
          `User B: PATCH /api/books/42 { price: 50, version: ${staleVersion} } → 409 Conflict — current version is ${currentVersion}.`,
          'warn',
        );
      } else {
        this.serverPrice.set(50);
        this.serverVersion.set((currentVersion ?? 1) + 1);
        this.push('User B: PATCH /api/books/42 → 200 OK, saved.', 'ok');
      }
    } else {
      this.serverPrice.set(50);
      this.push('User B: PATCH /api/books/42 { price: 50 } → 200 OK, saved. (User A’s $45 is gone.)', 'warn');
    }
    this.flash('B');
    this.stepIndex.set(4);
    this.done.set(true);
  }

  protected reset(): void {
    this.priceSeenByA.set(null);
    this.priceSeenByB.set(null);
    this.versionSeenByA.set(null);
    this.versionSeenByB.set(null);
    this.serverPrice.set(STARTING_PRICE);
    this.serverVersion.set(this.optimisticOn() ? 1 : null);
    this.log.set([]);
    this.stepIndex.set(0);
    this.lastWriter.set(null);
    this.done.set(false);
  }

  private flash(who: 'A' | 'B'): void {
    this.lastWriter.set(who);
    if (this.flashTimer !== null) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.lastWriter.set(null), 700);
  }

  private push(text: string, kind: LogKind): void {
    this.log.update((l) => [...l, { text, kind }]);
  }
}
