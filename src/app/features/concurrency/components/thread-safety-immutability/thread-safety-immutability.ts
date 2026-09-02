import { Component, computed, signal } from '@angular/core';

type Mode = 'unsafe' | 'locked' | 'immutable' | 'message';

interface StrategyInfo {
  id: Mode;
  label: string;
  tagline: string;
  body: string;
}

interface RunResult {
  finalValue: number;
  expected: number;
  correct: boolean;
  throughput: number; // relative score, 0-100
  contention: string;
}

const WORK_SIZE = 500; // two simulated threads x 250 increments each
const THROUGHPUT: Record<Mode, number> = {
  unsafe: 96,
  locked: 38,
  immutable: 84,
  message: 68,
};

const STRATEGIES: StrategyInfo[] = [
  {
    id: 'unsafe',
    label: 'Unsafe',
    tagline: 'Plain shared mutable counter, no coordination',
    body:
      'Two threads read the current value, add one, and write it back — with no coordination. When their ' +
      'read-modify-write steps interleave, one thread\'s write overwrites the other\'s, and an increment is ' +
      'silently lost. Fast, because there is no synchronization overhead. Wrong, because updates go missing.',
  },
  {
    id: 'locked',
    label: 'Synchronized / locked',
    tagline: 'A lock serializes every access',
    body:
      'Every increment must acquire a lock before touching the counter and release it after. Only one thread can ' +
      'be inside the critical section at a time, so no update is ever lost. Correctness is guaranteed — but every ' +
      'other thread queues up and waits, so throughput visibly drops as contention on the lock rises.',
  },
  {
    id: 'immutable',
    label: 'Immutable',
    tagline: 'Every increment produces a new value',
    body:
      'Instead of mutating shared state, each increment publishes a brand-new immutable snapshot (old value + 1). ' +
      'Existing readers keep safely reading whatever snapshot they already have — nothing they hold can ever be ' +
      'changed underneath them, so reads never need a lock. Writers still need to coordinate who publishes next, ' +
      'but there is no in-place mutation to corrupt.',
  },
  {
    id: 'message',
    label: 'Message-passing',
    tagline: 'Increments are messages sent to a single owner',
    body:
      'No thread touches the counter directly. Instead, "increment" requests are sent as messages to a single ' +
      'owner task, which applies them one at a time from its mailbox. There is no shared mutable memory to ' +
      'protect at all — correctness comes from the fact that only one owner ever performs the mutation.',
  },
];

@Component({
  selector: 'app-thread-safety-immutability',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="thread-safety-immutability">
      <div class="container">
        <p class="lab-index">31-32 — THREAD SAFETY STRATEGIES</p>
        <h2 class="lab-title">Thread safety strategies</h2>
        <p class="lab-lede">
          The same shared counter, the same workload — two simulated threads each firing 250 increments — run
          under four different strategies. Locking isn't the only way to be correct; reducing shared mutable state
          works too, and it changes the tradeoffs.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Thread safety strategy picker">
            @for (s of strategies; track s.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="mode() === s.id"
                [attr.aria-pressed]="mode() === s.id"
                (click)="selectMode(s.id)"
              >
                {{ s.label }}
              </button>
            }
          </div>

          <div class="strategy-detail">
            <p class="strategy-tagline">{{ activeStrategy().tagline }}</p>
            <p class="strategy-body">{{ activeStrategy().body }}</p>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runWorkload()">
              Run workload (2 threads × 250 increments)
            </button>
          </div>

          <div class="result-panel" aria-live="polite">
            @if (currentResult(); as r) {
              <div class="result-grid">
                <div class="result-cell">
                  <p class="lab-node">Final value</p>
                  <p class="result-value mono">{{ r.finalValue }} <span class="expected">/ {{ r.expected }} expected</span></p>
                  <span class="pill" [class.pill-yes]="r.correct" [class.pill-no]="!r.correct">
                    {{ r.correct ? 'correct' : 'lost updates' }}
                  </span>
                </div>
                <div class="result-cell">
                  <p class="lab-node">Throughput</p>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="r.throughput"></div>
                  </div>
                  <p class="result-sub mono">{{ r.throughput }} / 100</p>
                </div>
                <div class="result-cell">
                  <p class="lab-node">Contention</p>
                  <p class="result-sub">{{ r.contention }}</p>
                </div>
              </div>
            } @else {
              <p class="result-empty">Press "Run workload" to simulate this strategy.</p>
            }
          </div>
        </div>

        <p class="lab-note">
          Thread safety can be reached through very different strategies with very different tradeoffs. Locking
          guarantees correctness but serializes everything, so throughput suffers under contention. Removing shared
          mutable state — through immutability or message-passing — can make a whole class of races structurally
          impossible, often without paying the full cost of a lock.
        </p>
      </div>
    </section>
  `,
  styles: `
    .strategy-detail {
      margin-top: 18px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .strategy-tagline { margin: 0 0 8px; color: var(--text); font-weight: 600; font-size: 0.9375rem; }
    .strategy-body { margin: 0; color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; }

    .result-panel { margin-top: 20px; }
    .result-empty { color: var(--text-faint); font-style: italic; font-size: 0.875rem; }

    .result-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 720px) {
      .result-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .result-cell {
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .result-value { margin: 6px 0 8px; font-size: 1.25rem; color: var(--text); }
    .expected { font-size: 0.75rem; color: var(--text-faint); }
    .result-sub { margin: 6px 0 0; font-size: 0.8125rem; color: var(--text-muted); }

    .bar-track {
      margin-top: 6px;
      width: 100%;
      height: 12px;
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .bar-fill { height: 100%; background: var(--c-task); border-radius: var(--radius-sm); transition: width 0.4s ease; }
  `,
})
export class ThreadSafetyImmutability {
  protected readonly strategies = STRATEGIES;
  protected readonly mode = signal<Mode>('unsafe');

  private readonly results = signal<Partial<Record<Mode, RunResult>>>({});

  protected readonly activeStrategy = computed(
    () => STRATEGIES.find((s) => s.id === this.mode())!,
  );

  protected readonly currentResult = computed(() => this.results()[this.mode()] ?? null);

  protected selectMode(id: Mode): void {
    this.mode.set(id);
  }

  protected runWorkload(): void {
    const mode = this.mode();
    const result = this.simulate(mode);
    this.results.update((r) => ({ ...r, [mode]: result }));
  }

  private simulate(mode: Mode): RunResult {
    const expected = WORK_SIZE;
    const throughput = THROUGHPUT[mode];

    switch (mode) {
      case 'unsafe': {
        // Lost-update race: a random fraction of increments get clobbered by a concurrent write.
        const lostFraction = 0.08 + Math.random() * 0.12;
        const finalValue = Math.round(expected * (1 - lostFraction));
        return {
          finalValue,
          expected,
          correct: finalValue === expected,
          throughput,
          contention: 'none — but updates silently overwrite each other',
        };
      }
      case 'locked':
        return {
          finalValue: expected,
          expected,
          correct: true,
          throughput,
          contention: 'high — every increment queues for the lock',
        };
      case 'immutable':
        return {
          finalValue: expected,
          expected,
          correct: true,
          throughput,
          contention: 'none on reads — readers use old snapshots freely',
        };
      case 'message':
        return {
          finalValue: expected,
          expected,
          correct: true,
          throughput,
          contention: 'none on shared memory — bounded by mailbox processing',
        };
    }
  }
}
