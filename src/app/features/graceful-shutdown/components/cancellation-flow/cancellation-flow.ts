import { Component, computed, signal } from '@angular/core';

interface FlowStep {
  key: 'request' | 'operation' | 'signal' | 'stop';
  label: string;
  detail: string;
}

const STEPS: FlowStep[] = [
  {
    key: 'request',
    label: 'REQUEST',
    detail: 'A client request arrives and kicks off work on the server.',
  },
  {
    key: 'operation',
    label: 'LONG-RUNNING OPERATION',
    detail: 'The operation starts executing — a loop, a query, a stream — and keeps going.',
  },
  {
    key: 'signal',
    label: 'CANCELLATION SIGNAL',
    detail: 'Shutdown begins. A cancellation signal is raised, but the operation does not stop yet.',
  },
  {
    key: 'stop',
    label: 'SAFE STOP',
    detail:
      'The operation reaches a checkpoint, notices the signal, and unwinds itself: closes handles, releases locks, returns.',
  },
];

@Component({
  selector: 'app-cancellation-flow',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene cf-scene" id="gs-cancellation">
      <div class="container">
        <p class="lab-index">13 — COOPERATIVE CANCELLATION</p>
        <h2 class="lab-title">Cancellation is a conversation, not a kill switch</h2>
        <p class="lab-lede">
          Signaling cancellation and stopping work are two different moments. Between them, the running operation
          has to notice the signal and choose to unwind — nothing reaches in and yanks it out from the outside.
        </p>

        <div class="lab-panel">
          <p class="lab-node">FLOW &mdash; step through it</p>

          <div class="flow-row" role="list" aria-label="Cancellation flow steps">
            @for (step of steps; track step.key; let i = $index) {
              @if (i > 0) {
                <span class="lab-flow-arrow" aria-hidden="true">&rarr;</span>
              }
              <div
                class="flow-node"
                role="listitem"
                [attr.data-status]="statusFor(i)"
                [attr.aria-current]="i === currentIndex() ? 'step' : null"
              >
                <span class="flow-node-index mono">{{ i + 1 }}</span>
                <span class="flow-node-label">{{ step.label }}</span>
              </div>
            }
          </div>

          <div class="lab-code" aria-live="polite">{{ steps[currentIndex()].detail }}</div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="advance()" [disabled]="isFinished()">
              {{ currentIndex() === 0 ? 'Send request' : 'Step forward' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="currentIndex() === 0">Reset</button>
          </div>

          @if (currentIndex() >= 2 && currentIndex() < 3) {
            <p class="waiting-note mono" aria-live="polite">
              signal delivered — operation is still mid-flight, waiting for its next checkpoint&hellip;
            </p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Cooperative, not preemptive: in most languages and runtimes relevant here, arbitrary running code
          <strong>cannot</strong> be forcibly and instantly interrupted from the outside. The operation itself must
          check for — or otherwise respond to — the cancellation signal at safe points (between loop iterations,
          before a network call, at an await). If it never checks, the signal alone changes nothing until something
          more drastic, like killing the process, is used instead.
        </p>
      </div>
    </section>
  `,
  styles: `
    .cf-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .flow-row {
      margin-top: 18px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .flow-node {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      transition: border-color 0.25s ease, background 0.25s ease, transform 0.2s ease;
    }
    .flow-node[data-status='pending'] { color: var(--text-faint); }
    .flow-node[data-status='active'] {
      border-color: var(--signal);
      background: color-mix(in srgb, var(--signal) 14%, var(--surface-elevated));
      transform: translateY(-2px);
    }
    .flow-node[data-status='done'] {
      border-color: var(--running);
      color: var(--text);
    }
    @media (prefers-reduced-motion: reduce) {
      .flow-node { transition: none; transform: none; }
    }

    .flow-node-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      font-size: 0.6875rem;
      flex-shrink: 0;
    }
    .flow-node[data-status='active'] .flow-node-index { border-color: var(--signal); color: var(--signal); }
    .flow-node[data-status='done'] .flow-node-index { border-color: var(--running); color: var(--running); }

    .flow-node-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .waiting-note { margin-top: 14px; font-size: 0.8125rem; color: var(--signal); }
  `,
})
export class CancellationFlow {
  protected readonly steps = STEPS;
  protected readonly currentIndex = signal(0);
  protected readonly isFinished = computed(() => this.currentIndex() >= this.steps.length - 1);

  protected advance(): void {
    if (this.isFinished()) return;
    this.currentIndex.update((i) => Math.min(this.steps.length - 1, i + 1));
  }

  protected reset(): void {
    this.currentIndex.set(0);
  }

  protected statusFor(index: number): 'pending' | 'active' | 'done' {
    const current = this.currentIndex();
    if (index < current) return 'done';
    if (index === current) return 'active';
    return 'pending';
  }
}
