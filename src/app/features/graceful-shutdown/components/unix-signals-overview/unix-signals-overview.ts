import { Component, computed, signal } from '@angular/core';

type SignalId = 'sigterm' | 'sigint' | 'sigkill';
type PillKind = 'yes' | 'no' | 'conditional';

interface SignalInfo {
  id: SignalId;
  label: string;
  number: string;
  meaning: string;
  handle: { verdict: PillKind; text: string };
  cleanup: { verdict: PillKind; text: string };
  continueWork: { verdict: PillKind; text: string };
  delay: { verdict: PillKind; text: string };
}

const SIGNALS: SignalInfo[] = [
  {
    id: 'sigterm',
    label: 'SIGTERM',
    number: '15',
    meaning: '"Please terminate." A polite, catchable request to shut down — the default signal sent by `kill`, process managers, and orchestrators like Kubernetes and systemd.',
    handle: { verdict: 'yes', text: 'Yes — the application can register a handler and run its own code in response.' },
    cleanup: { verdict: 'yes', text: 'Yes — a registered handler can close connections, drain requests, and flush state before exiting.' },
    continueWork: { verdict: 'conditional', text: 'In-flight work can continue briefly during a drain window, but new work is expected to stop.' },
    delay: { verdict: 'conditional', text: 'Delayable within limits — most orchestrators enforce a grace period (e.g. Kubernetes\' terminationGracePeriodSeconds), after which a SIGKILL follows regardless.' },
  },
  {
    id: 'sigint',
    label: 'SIGINT',
    number: '2',
    meaning: '"Interrupt requested." Sent when a user presses Ctrl+C in an interactive terminal — semantically similar to SIGTERM but triggered by a human at a keyboard, not a process manager.',
    handle: { verdict: 'yes', text: 'Yes — fully catchable, just like SIGTERM.' },
    cleanup: { verdict: 'yes', text: 'Yes — a handler can run the same graceful shutdown logic used for SIGTERM.' },
    continueWork: { verdict: 'conditional', text: 'In-flight work can be allowed to finish, though local dev processes are often killed impatiently with a second Ctrl+C.' },
    delay: { verdict: 'conditional', text: 'Delayable, but there is no orchestrator enforcing a grace period in a terminal — a second SIGINT or a manual SIGKILL from the user can arrive at any time.' },
  },
  {
    id: 'sigkill',
    label: 'SIGKILL',
    number: '9',
    meaning: '"Terminate immediately." An unconditional kill delivered by the kernel directly — the process is never given a chance to run any code at all.',
    handle: { verdict: 'no', text: 'No — SIGKILL cannot be caught, blocked, or ignored by any process, by design.' },
    cleanup: { verdict: 'no', text: 'No — no handler ever runs, so no connections are closed and no state is flushed.' },
    continueWork: { verdict: 'no', text: 'No — every thread of execution stops at once; there is no "in-flight work" concept for the process anymore.' },
    delay: { verdict: 'no', text: 'No — the kernel terminates the process immediately; there is nothing the application can do to postpone it.' },
  },
];

@Component({
  selector: 'app-unix-signals-overview',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-signals-overview">
      <div class="container">
        <p class="lab-index">05 — UNIX SIGNALS</p>
        <h2 class="lab-title">Three signals, three very different endings</h2>
        <p class="lab-lede">
          Shutdown starts with a signal from the operating system to the process. Click each signal to see whether
          the application actually gets a say in what happens next.
        </p>

        <div class="lab-panel gs-scene signals-scene">
          <div class="signal-diagram">
            <div class="os-box mono">OPERATING SYSTEM</div>
            <div class="signal-row" role="list" aria-label="Signals">
              @for (s of signals; track s.id) {
                <div class="signal-col">
                  <span class="lab-flow-arrow" aria-hidden="true">↓</span>
                  <button
                    type="button"
                    role="listitem"
                    class="lab-node signal-node"
                    [class]="'sig-' + s.id"
                    [class.is-active]="selectedId() === s.id"
                    [attr.aria-pressed]="selectedId() === s.id"
                    (click)="select(s.id)"
                  >
                    {{ s.label }}
                    <span class="signal-num mono">({{ s.number }})</span>
                  </button>
                  <span class="lab-flow-arrow" aria-hidden="true">↓</span>
                </div>
              }
            </div>
            <div class="process-box mono">PROCESS</div>
          </div>

          @if (selected(); as s) {
            <div class="detail" aria-live="polite">
              <p class="detail-meaning">{{ s.meaning }}</p>
              <div class="question-grid">
                <div class="question">
                  <p class="question-text mono">Can the application handle it?</p>
                  <span class="pill" [class]="pillClass(s.handle.verdict)">{{ verdictLabel(s.handle.verdict) }}</span>
                  <p class="question-detail">{{ s.handle.text }}</p>
                </div>
                <div class="question">
                  <p class="question-text mono">Can cleanup run?</p>
                  <span class="pill" [class]="pillClass(s.cleanup.verdict)">{{ verdictLabel(s.cleanup.verdict) }}</span>
                  <p class="question-detail">{{ s.cleanup.text }}</p>
                </div>
                <div class="question">
                  <p class="question-text mono">Can active work continue?</p>
                  <span class="pill" [class]="pillClass(s.continueWork.verdict)">{{ verdictLabel(s.continueWork.verdict) }}</span>
                  <p class="question-detail">{{ s.continueWork.text }}</p>
                </div>
                <div class="question">
                  <p class="question-text mono">Can termination be delayed?</p>
                  <span class="pill" [class]="pillClass(s.delay.verdict)">{{ verdictLabel(s.delay.verdict) }}</span>
                  <p class="question-detail">{{ s.delay.text }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          SIGKILL is the kernel's answer to a process that will not stop — it exists precisely because it cannot be
          intercepted. Graceful shutdown logic can only ever apply to SIGTERM and SIGINT.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .signal-diagram {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .os-box, .process-box {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      padding: 10px 20px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      background: var(--surface);
    }

    .signal-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 18px;
      margin: 4px 0;
    }

    .signal-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .signal-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 130px;
      text-align: center;
      padding: 12px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    }
    .signal-node:hover { transform: translateY(-1px); }
    .signal-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .sig-sigterm { color: var(--signal); }
    .sig-sigint { color: var(--resource); }
    .sig-sigkill { color: var(--stopped); }

    .signal-node.is-active {
      background: color-mix(in srgb, currentColor 14%, var(--surface-raised));
      box-shadow: 0 0 0 2px currentColor;
    }

    .signal-num { font-size: 0.6875rem; color: var(--text-faint); }

    @media (prefers-reduced-motion: reduce) {
      .signal-node { transition: none; }
      .signal-node:hover { transform: none; }
    }

    .detail {
      margin-top: 24px;
      padding: 20px 22px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }

    .detail-meaning {
      margin: 0 0 18px;
      font-size: 0.9375rem;
      color: var(--text);
      line-height: 1.6;
    }

    .question-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }
    @media (min-width: 720px) {
      .question-grid { grid-template-columns: 1fr 1fr; }
    }

    .question {
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
    }

    .question-text {
      margin: 0 0 8px;
      font-size: 0.75rem;
      color: var(--text-faint);
      letter-spacing: 0.02em;
    }

    .question-detail {
      margin: 8px 0 0;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
  `,
})
export class UnixSignalsOverview {
  protected readonly signals = SIGNALS;
  protected readonly selectedId = signal<SignalId>('sigterm');

  protected readonly selected = computed<SignalInfo | undefined>(() =>
    SIGNALS.find((s) => s.id === this.selectedId()),
  );

  protected select(id: SignalId): void {
    this.selectedId.set(id);
  }

  protected pillClass(v: PillKind): string {
    return v === 'yes' ? 'pill-yes' : v === 'no' ? 'pill-no' : 'pill-conditional';
  }

  protected verdictLabel(v: PillKind): string {
    return v === 'yes' ? 'YES' : v === 'no' ? 'NO' : 'CONDITIONAL';
  }
}
