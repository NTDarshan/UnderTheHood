import { Component, OnDestroy, computed, signal } from '@angular/core';

interface ChainNode {
  key: string;
  label: string;
  detail: string;
}

const CHAIN: ChainNode[] = [
  { key: 'http', label: 'HTTP REQUEST', detail: 'incoming request accepted' },
  { key: 'context', label: 'REQUEST CONTEXT', detail: 'carries the cancellation signal through every layer' },
  { key: 'db', label: 'DATABASE', detail: 'query in flight, watching the context' },
  { key: 'api', label: 'EXTERNAL API', detail: 'outbound HTTP call, watching the context' },
  { key: 'downstream', label: 'DOWNSTREAM OPERATION', detail: 'deepest unit of work, watching the context' },
];

const STEP_DELAY_MS = 550;

@Component({
  selector: 'app-request-context-cancellation',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene rcc-scene" id="gs-request-context">
      <div class="container">
        <p class="lab-index">14 — REQUEST-SCOPED CANCELLATION</p>
        <h2 class="lab-title">One cancellation, propagated through every layer</h2>
        <p class="lab-lede">
          A request context is carried through every layer a request touches. Cancel it once, and every layer
          holding a reference to it can notice and stop — instead of each layer needing its own separate signal.
        </p>

        <div class="lab-panel">
          <p class="lab-node">CALL CHAIN</p>

          <div class="chain" role="list" aria-label="Request call chain">
            @for (node of chain; track node.key; let i = $index) {
              @if (i > 0) {
                <div class="chain-link" [attr.data-active]="linkActive(i)" aria-hidden="true">
                  <span class="chain-link-line"></span>
                </div>
              }
              <div class="chain-node" role="listitem" [attr.data-status]="statusFor(i)">
                <span class="chain-node-label">{{ node.label }}</span>
                <span class="chain-node-detail mono">{{ statusDetail(i) }}</span>
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              (click)="cancelRequest()"
              [disabled]="isCancelling() || allCancelled()"
            >
              Cancel request (shutdown)
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="isCancelling()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          This is why request-scoped cancellation matters during shutdown: without it, abandoning the HTTP request
          only stops the response from being sent — the database query, the external API call, and the downstream
          operation it kicked off keep running with nothing left waiting on them. Propagating cancellation down the
          context lets every layer stop cleanly instead of leaving orphaned work behind.
        </p>
      </div>
    </section>
  `,
  styles: `
    .rcc-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .chain {
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    .chain-node {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      transition: border-color 0.25s ease, background 0.25s ease;
    }
    .chain-node[data-status='waiting'] { border-color: var(--signal); }
    .chain-node[data-status='cancelled'] {
      border-color: var(--cancelled);
      background: color-mix(in srgb, var(--cancelled) 12%, var(--surface-elevated));
    }

    .chain-node-label {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      color: var(--text);
    }
    .chain-node-detail { font-size: 0.75rem; color: var(--text-faint); text-align: right; }
    .chain-node[data-status='waiting'] .chain-node-detail { color: var(--signal); }
    .chain-node[data-status='cancelled'] .chain-node-detail { color: var(--cancelled); }

    .chain-link {
      display: flex;
      justify-content: center;
      padding: 4px 0;
    }
    .chain-link-line {
      width: 2px;
      height: 20px;
      background: var(--border);
      transition: background 0.25s ease;
    }
    .chain-link[data-active='true'] .chain-link-line {
      background: var(--cancelled);
      box-shadow: 0 0 8px color-mix(in srgb, var(--cancelled) 60%, transparent);
    }
    @media (prefers-reduced-motion: reduce) {
      .chain-link-line { transition: none; }
    }

    @media (max-width: 480px) {
      .chain-node { flex-direction: column; align-items: flex-start; gap: 4px; }
      .chain-node-detail { text-align: left; }
    }
  `,
})
export class RequestContextCancellation implements OnDestroy {
  protected readonly chain = CHAIN;
  protected readonly cancelledUpTo = signal(-1);
  protected readonly isCancelling = signal(false);
  protected readonly allCancelled = computed(() => this.cancelledUpTo() >= this.chain.length - 1);

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected cancelRequest(): void {
    if (this.isCancelling() || this.allCancelled()) return;
    this.isCancelling.set(true);
    this.clearTimers();

    this.chain.forEach((_, i) => {
      const t = setTimeout(() => {
        this.cancelledUpTo.set(i);
        if (i === this.chain.length - 1) {
          this.isCancelling.set(false);
        }
      }, STEP_DELAY_MS * (i + 1));
      this.timers.push(t);
    });
  }

  protected reset(): void {
    this.clearTimers();
    this.cancelledUpTo.set(-1);
    this.isCancelling.set(false);
  }

  protected statusFor(index: number): 'idle' | 'waiting' | 'cancelled' {
    const cancelled = this.cancelledUpTo();
    if (index <= cancelled) return 'cancelled';
    if (this.isCancelling() && index === cancelled + 1) return 'waiting';
    return 'idle';
  }

  protected statusDetail(index: number): string {
    const status = this.statusFor(index);
    if (status === 'cancelled') return 'cancelled — stopped cleanly';
    if (status === 'waiting') return 'signal arriving…';
    return this.chain[index].detail;
  }

  protected linkActive(index: number): boolean {
    return index <= this.cancelledUpTo();
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }
}
