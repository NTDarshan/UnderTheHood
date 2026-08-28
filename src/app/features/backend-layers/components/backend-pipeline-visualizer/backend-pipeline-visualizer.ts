import { Component, computed, signal } from '@angular/core';

interface LayerDetail {
  id: string;
  label: string;
  responsibility: string;
  shouldNot: string;
  example: string;
}

const LAYERS: LayerDetail[] = [
  {
    id: 'middleware',
    label: 'Middleware Pipeline',
    responsibility: 'Cross-cutting request pipeline behavior that applies broadly: logging, CORS, authentication, rate limiting, error boundaries.',
    shouldNot: 'Contain use-case-specific business rules like "calculate discount for this order type."',
    example: 'Input: raw HTTP request → Output: request annotated with identity, request ID, and pass/fail gate decisions.',
  },
  {
    id: 'router',
    label: 'Router',
    responsibility: 'Matches an incoming method + path to the handler responsible for it.',
    shouldNot: 'Execute business logic or touch the database directly.',
    example: 'Input: POST /orders → Output: createOrder handler selected.',
  },
  {
    id: 'controller',
    label: 'Controller',
    responsibility: 'The HTTP boundary. Parses/binds the request, calls the service, converts the result into an HTTP response.',
    shouldNot: 'Contain business rules, SQL, or direct database manipulation.',
    example: 'Input: { productId, quantity } JSON body → Output: calls service.createOrder(...), returns 201.',
  },
  {
    id: 'service',
    label: 'Service',
    responsibility: 'Application/business logic. Coordinates the use case without knowing about HTTP.',
    shouldNot: "Depend on the HTTP request/response objects or a specific status code.",
    example: 'Input: createOrder(userId, productId, quantity) → Output: created Order, or a business-rule rejection.',
  },
  {
    id: 'repository',
    label: 'Repository',
    responsibility: 'Data access boundary. Encapsulates how persistence actually happens.',
    shouldNot: 'Decide business policy, know about HTTP, or decide user permissions.',
    example: 'Input: Order entity → Output: row inserted, generated ID returned.',
  },
  {
    id: 'database',
    label: 'Database',
    responsibility: 'Durable storage. Executes the query it was given.',
    shouldNot: 'Be reached directly by a controller, bypassing the repository abstraction.',
    example: 'Input: INSERT INTO orders (...) → Output: 1 row affected.',
  },
];

@Component({
  selector: 'app-backend-pipeline-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="pipeline">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 02 — THE COMPLETE REQUEST LIFECYCLE</p>
        <h2 class="lab-title">Client → Middleware → Router → Controller → Service → Repository → Database → Response.</h2>
        <p class="lab-lede">Click a layer to see its responsibility, what it should not do, and an example input/output.</p>

        <div class="lab-panel">
          <div class="pipeline-diagram mono">
            <div class="pipe-node pipe-endpoint">CLIENT</div>
            <div class="lab-flow-arrow">↓ HTTP Request</div>
            @for (l of layers; track l.id; let last = $last) {
              <button type="button" class="pipe-node" [class.is-selected]="selected().id === l.id" (click)="select(l)">
                {{ l.label.toUpperCase() }}
              </button>
              @if (!last) {
                <div class="lab-flow-arrow">↓</div>
              }
            }
            <div class="lab-flow-arrow">↓</div>
            <div class="pipe-node pipe-endpoint">RESPONSE</div>
          </div>

          <div class="detail-card">
            <p class="detail-title mono">{{ selected().label.toUpperCase() }}</p>
            <p class="detail-row"><strong>Responsibility:</strong> {{ selected().responsibility }}</p>
            <p class="detail-row is-danger"><strong>Should NOT:</strong> {{ selected().shouldNot }}</p>
            <p class="detail-row mono is-example">{{ selected().example }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .pipeline-diagram { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .pipe-node { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.04em; padding: 12px 24px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease; min-width: 240px; text-align: center; }
    button.pipe-node { cursor: pointer; }
    button.pipe-node:hover { border-color: var(--accent-dim); color: var(--text); }
    .pipe-node.is-selected { border-color: var(--accent); color: var(--accent-strong); box-shadow: 0 0 16px var(--glow-accent); }
    .pipe-endpoint { color: var(--text-faint); background: transparent; }

    .detail-card { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
    .detail-title { font-size: 0.75rem; color: var(--accent-2); letter-spacing: 0.08em; margin-bottom: 12px; }
    .detail-row { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin-top: 8px; }
    .detail-row strong { color: var(--text); }
    .detail-row.is-danger strong { color: var(--danger); }
    .detail-row.is-example { font-size: 0.75rem; color: var(--text-faint); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; }
  `,
})
export class BackendPipelineVisualizer {
  protected readonly layers = LAYERS;
  private readonly selectedId = signal('controller');
  protected readonly selected = computed(() => this.layers.find((l) => l.id === this.selectedId())!);

  select(l: LayerDetail): void {
    this.selectedId.set(l.id);
  }
}
