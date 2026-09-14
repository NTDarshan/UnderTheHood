import { Component, OnDestroy, signal } from '@angular/core';

type OpId = 'create' | 'read' | 'update' | 'delete';
type LayerId = 'client' | 'controller' | 'service' | 'repository' | 'database';
type Direction = 'idle' | 'down' | 'up';

interface OpDef {
  id: OpId;
  label: string;
  request: string;
  response: string;
}

const OPS: Record<OpId, OpDef> = {
  create: { id: 'create', label: 'CREATE', request: 'POST /api/books', response: '201 Created' },
  read: { id: 'read', label: 'READ', request: 'GET /api/books/42', response: '200 OK' },
  update: { id: 'update', label: 'UPDATE', request: 'PATCH /api/books/42', response: '200 OK' },
  delete: { id: 'delete', label: 'DELETE', request: 'DELETE /api/books/42', response: '204 No Content' },
};

const LAYER_ORDER: LayerId[] = ['client', 'controller', 'service', 'repository', 'database'];

const LAYER_LABELS: Record<LayerId, string> = {
  client: 'CLIENT',
  controller: 'CONTROLLER',
  service: 'SERVICE',
  repository: 'REPOSITORY',
  database: 'DATABASE',
};

const STEP_MS = 550;

@Component({
  selector: 'app-crud-through-backend',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-through-backend">
      <div class="container">
        <p class="lab-index mono">04 — CRUD THROUGH THE BACKEND</p>
        <h2 class="lab-title">The same four operations travel through the same layers.</h2>
        <p class="lab-lede">
          Pick an operation and follow the request down through the backend, then watch the response travel back up
          to the client.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Choose a CRUD operation">
            @for (op of opList; track op.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="activeOp() === op.id"
                [attr.aria-pressed]="activeOp() === op.id"
                [disabled]="isAnimating()"
                (click)="run(op.id)"
              >
                {{ op.label }}
              </button>
            }
          </div>

          <div class="diagram">
            @for (layerId of layerOrder; track layerId; let last = $last) {
              <div
                class="diagram-node"
                [class.is-active]="currentLayer() === layerId"
                [class.is-passed]="isPassed(layerId)"
              >
                <span class="node-label mono">{{ layerLabels[layerId] }}</span>
                @if (currentLayer() === layerId) {
                  <span class="node-packet mono" [class.is-response]="direction() === 'up'">
                    {{ direction() === 'up' ? responseLabel() : requestLabel() }}
                  </span>
                }
              </div>
              @if (!last) {
                <div class="diagram-arrow mono" [class.is-live]="isEdgeLive(layerId)" aria-hidden="true">
                  {{ direction() === 'up' ? '&uarr;' : '&darr;' }}
                </div>
              }
            }
          </div>

          <div class="log-line mono" aria-live="polite">{{ logLine() }}</div>
        </div>
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

    .diagram { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 0; }

    .diagram-node {
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
    }
    .diagram-node.is-passed { border-color: color-mix(in srgb, var(--cr-cyan) 40%, var(--border-strong)); }
    .diagram-node.is-active {
      border-color: var(--cr-accent);
      background: color-mix(in srgb, var(--cr-accent) 8%, var(--surface));
      box-shadow: 0 0 20px color-mix(in srgb, var(--cr-accent) 30%, transparent);
    }

    .node-label { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.08em; color: var(--text-muted); }
    .diagram-node.is-active .node-label,
    .diagram-node.is-passed .node-label { color: var(--text); }

    .node-packet {
      font-size: 0.6875rem;
      padding: 4px 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--cr-accent) 18%, var(--surface-elevated));
      color: var(--cr-accent);
      border: 1px solid color-mix(in srgb, var(--cr-accent) 40%, transparent);
      animation: packet-pop 0.3s ease;
    }
    .node-packet.is-response {
      background: color-mix(in srgb, var(--cr-success) 18%, var(--surface-elevated));
      color: var(--cr-success);
      border-color: color-mix(in srgb, var(--cr-success) 40%, transparent);
    }
    @keyframes packet-pop {
      from { opacity: 0; transform: translateY(-4px) scale(0.9); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .node-packet { animation: none; }
    }

    .diagram-arrow {
      font-size: 1rem;
      color: var(--text-faint);
      line-height: 1;
      padding: 6px 0;
      transition: color 0.2s ease;
    }
    .diagram-arrow.is-live { color: var(--cr-accent); }

    .log-line {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 0.8125rem;
      color: var(--text-faint);
      min-height: 1.2em;
      text-align: center;
    }
  `,
})
export class CrudThroughBackend implements OnDestroy {
  protected readonly layerOrder = LAYER_ORDER;
  protected readonly layerLabels = LAYER_LABELS;
  protected readonly opList = Object.values(OPS);

  protected readonly activeOp = signal<OpId>('read');
  protected readonly currentLayer = signal<LayerId | null>(null);
  protected readonly direction = signal<Direction>('idle');
  protected readonly isAnimating = signal(false);
  protected readonly logLine = signal('Choose an operation to send it through the backend.');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected requestLabel(): string {
    return OPS[this.activeOp()].request;
  }

  protected responseLabel(): string {
    return OPS[this.activeOp()].response;
  }

  protected isPassed(layerId: LayerId): boolean {
    const current = this.currentLayer();
    if (!current) return false;
    const currentIdx = LAYER_ORDER.indexOf(current);
    const layerIdx = LAYER_ORDER.indexOf(layerId);
    if (this.direction() === 'down') return layerIdx < currentIdx;
    if (this.direction() === 'up') return layerIdx > currentIdx;
    return false;
  }

  protected isEdgeLive(fromLayer: LayerId): boolean {
    // Edge sits directly after `fromLayer` in the DOM; it's "live" while the packet
    // is on either endpoint of that edge, matching the current travel direction.
    const current = this.currentLayer();
    if (!current || this.direction() === 'idle') return false;
    const fromIdx = LAYER_ORDER.indexOf(fromLayer);
    const currentIdx = LAYER_ORDER.indexOf(current);
    return currentIdx === fromIdx || currentIdx === fromIdx + 1;
  }

  protected run(opId: OpId): void {
    if (this.isAnimating()) return;
    this.isAnimating.set(true);
    this.activeOp.set(opId);
    this.direction.set('down');
    const op = OPS[opId];

    LAYER_ORDER.forEach((layerId, i) => {
      this.after(i * STEP_MS, () => {
        this.currentLayer.set(layerId);
        this.logLine.set(
          layerId === 'client'
            ? `${op.request} leaves the client…`
            : `${op.request} reaches the ${LAYER_LABELS[layerId]} layer…`,
        );
      });
    });

    const upStart = LAYER_ORDER.length * STEP_MS;
    this.after(upStart, () => {
      this.direction.set('up');
      this.logLine.set(`Database has done its work. Response travels back up as ${op.response}.`);
    });

    const upLayers = [...LAYER_ORDER].reverse();
    upLayers.forEach((layerId, i) => {
      this.after(upStart + i * STEP_MS, () => {
        this.currentLayer.set(layerId);
        this.logLine.set(
          layerId === 'client'
            ? `${op.response} arrives back at the client.`
            : `${op.response} passes back through the ${LAYER_LABELS[layerId]} layer…`,
        );
      });
    });

    const doneAt = upStart + upLayers.length * STEP_MS + 400;
    this.after(doneAt, () => {
      this.currentLayer.set(null);
      this.direction.set('idle');
      this.isAnimating.set(false);
      this.logLine.set('Done. Pick another operation to send it through the backend again.');
    });
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
