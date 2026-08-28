import { Component, OnDestroy, computed, signal } from '@angular/core';

interface CrudEndpoint {
  id: string;
  method: string;
  path: string;
  purpose: string;
  request: string;
  response: string;
  status: string;
  idempotency: string;
  typicalError: string;
}

const ENDPOINTS: CrudEndpoint[] = [
  {
    id: 'list',
    method: 'GET',
    path: '/api/v1/books',
    purpose: 'Retrieve a page of the books collection.',
    request: '(no body — page/limit as query params)',
    response: '{ "data": [ …20 books… ], "page": 1, "total": 137 }',
    status: '200 OK',
    idempotency: 'Idempotent — repeating it returns the same page (assuming no writes happened between calls).',
    typicalError: '400 Bad Request — an invalid page or limit value.',
  },
  {
    id: 'get',
    method: 'GET',
    path: '/api/v1/books/{id}',
    purpose: 'Retrieve a single book by id.',
    request: '(no body)',
    response: '{ "id": 42, "title": "Clean Architecture", "price": 450 }',
    status: '200 OK',
    idempotency: 'Idempotent — reading never changes state.',
    typicalError: '404 Not Found — no book with that id exists.',
  },
  {
    id: 'create',
    method: 'POST',
    path: '/api/v1/books',
    purpose: 'Create a new book in the collection.',
    request: '{ "title": "Refactoring", "price": 500 }',
    response: '{ "id": 9, "title": "Refactoring", "price": 500 }',
    status: '201 Created',
    idempotency: 'Not idempotent — calling it twice creates two books.',
    typicalError: '400/422 — missing or invalid fields; 409 if a unique field (e.g. ISBN) collides.',
  },
  {
    id: 'put',
    method: 'PUT',
    path: '/api/v1/books/{id}',
    purpose: 'Replace the entire book with the supplied representation.',
    request: '{ "title": "Refactoring, 2nd Ed.", "price": 550 }',
    response: '{ "id": 9, "title": "Refactoring, 2nd Ed.", "price": 550 }',
    status: '200 OK',
    idempotency: 'Idempotent — sending the same full representation again leaves the same end state.',
    typicalError: '400 Bad Request — a full replacement missing required fields.',
  },
  {
    id: 'patch',
    method: 'PATCH',
    path: '/api/v1/books/{id}',
    purpose: 'Apply a partial update to a book.',
    request: '{ "price": 480 }',
    response: '{ "id": 9, "title": "Refactoring, 2nd Ed.", "price": 480 }',
    status: '200 OK',
    idempotency: 'Depends on the operation — setting an absolute value is idempotent, incrementing a value is not.',
    typicalError: '404 Not Found — the book being patched does not exist.',
  },
  {
    id: 'delete',
    method: 'DELETE',
    path: '/api/v1/books/{id}',
    purpose: 'Remove a book from the collection.',
    request: '(no body)',
    response: '(no body)',
    status: '204 No Content',
    idempotency: 'Idempotent — the end state ("gone") holds after the first call, even though a repeat returns 404 instead of 204.',
    typicalError: '404 Not Found — already deleted, or never existed.',
  },
];

interface FlowStep {
  label: string;
  status: string;
}

const FLOW_STEPS: FlowStep[] = [
  { label: 'CREATE', status: '201' },
  { label: 'READ COLLECTION', status: '200' },
  { label: 'READ SINGLE', status: '200' },
  { label: 'UPDATE FULL (PUT)', status: '200' },
  { label: 'UPDATE PARTIAL (PATCH)', status: '200' },
  { label: 'DELETE', status: '204' },
];

const LAYER_CHAIN = ['HTTP', 'Routing', 'Middleware', 'Controller', 'Service', 'Repository', 'Database'];

@Component({
  selector: 'app-crud-designer',
  standalone: true,
  template: `
    <section class="lab-section" id="crud-designer">
      <div class="container">
        <p class="lab-index">REST API / 31 — DESIGN A COMPLETE CRUD API</p>
        <h2 class="lab-title">Six endpoints. One resource. The whole lifecycle of a book.</h2>

        <div class="lab-panel">
          <div class="endpoint-list">
            @for (e of endpoints; track e.id) {
              <button type="button" class="endpoint-row" [class.is-active]="selected().id === e.id" (click)="selected.set(e)">
                <span class="tok-method mono">{{ e.method }}</span>
                <span class="mono">{{ e.path }}</span>
              </button>
            }
          </div>

          <div class="detail-grid">
            <p class="lab-node">PURPOSE</p>
            <p class="lab-note">{{ selected().purpose }}</p>

            <p class="lab-node">EXAMPLE REQUEST</p>
            <p class="lab-code">{{ selected().request }}</p>

            <p class="lab-node">EXAMPLE RESPONSE</p>
            <p class="lab-code">{{ selected().response }}</p>

            <p class="lab-node">STATUS CODE</p>
            <p class="lab-code">{{ selected().status }}</p>

            <p class="lab-node">IDEMPOTENCY</p>
            <p class="lab-note">{{ selected().idempotency }}</p>

            <p class="lab-node">TYPICAL ERROR</p>
            <p class="lab-note">{{ selected().typicalError }}</p>
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">COMPLETE CRUD FLOW</p>
          <p class="lab-note">Play through every operation in sequence — and see each one travel through the same layers from the Backend Layers chapter.</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="playing()" (click)="play()">Play</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="flow-list mono">
            @for (s of flowSteps; track s.label; let i = $index) {
              <div class="flow-row" [class.is-done]="step() > i" [class.is-active]="step() === i">
                <span class="flow-marker">{{ step() > i ? '✓' : step() === i ? '→' : '○' }}</span>
                <span class="flow-label">{{ s.label }} → {{ s.status }}</span>
                @if (step() === i) {
                  <span class="flow-chain">
                    @for (l of layerChain; track l; let li = $index) {
                      <span class="layer-node">{{ l }}</span>@if (li < layerChain.length - 1) {<span class="lab-flow-arrow"> → </span>}
                    }
                  </span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .endpoint-list { display: flex; flex-direction: column; gap: 6px; }
    .endpoint-row { display: flex; gap: 12px; align-items: center; text-align: left; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); font-size: 0.8125rem; color: var(--text-muted); }
    .endpoint-row.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); color: var(--text); }

    .detail-grid { margin-top: 24px; display: flex; flex-direction: column; gap: 6px; }
    .detail-grid .lab-node { margin-top: 14px; }
    .detail-grid .lab-node:first-child { margin-top: 0; }

    .flow-list { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .flow-row { font-size: 0.8125rem; color: var(--text-faint); display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .flow-row.is-done { color: var(--accent-2); }
    .flow-row.is-active { color: var(--accent-strong); font-weight: 600; }
    .flow-marker { width: 16px; display: inline-block; }
    .flow-chain { display: inline-flex; flex-wrap: wrap; gap: 2px; font-weight: 400; }
    .layer-node { color: var(--text-muted); font-size: 0.75rem; }
  `,
})
export class CrudDesigner implements OnDestroy {
  protected readonly endpoints = ENDPOINTS;
  protected readonly flowSteps = FLOW_STEPS;
  protected readonly layerChain = LAYER_CHAIN;

  protected readonly selected = signal<CrudEndpoint>(ENDPOINTS[0]);
  protected readonly step = signal(-1);
  protected readonly playing = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];

  play(): void {
    this.reset();
    this.playing.set(true);
    this.flowSteps.forEach((_, i) => {
      this.timers.push(
        setTimeout(() => {
          this.step.set(i);
          if (i === this.flowSteps.length - 1) this.playing.set(false);
        }, (i + 1) * 500),
      );
    });
  }

  reset(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.step.set(-1);
    this.playing.set(false);
  }

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
  }
}
