import { Component, signal } from '@angular/core';

type OpId = 'create' | 'read' | 'update' | 'delete';

interface Operation {
  id: OpId;
  label: string;
  verb: string;
  x: number;
  y: number;
  pipeline: string[];
  status: string;
}

const OPERATIONS: Operation[] = [
  {
    id: 'create',
    label: 'CREATE',
    verb: 'POST',
    x: 50,
    y: 13,
    pipeline: ['POST', 'validation', 'service', 'repository', 'database'],
    status: '201',
  },
  {
    id: 'read',
    label: 'READ',
    verb: 'GET',
    x: 87,
    y: 50,
    pipeline: ['GET', 'query', 'database', 'response'],
    status: '200',
  },
  {
    id: 'update',
    label: 'UPDATE',
    verb: 'PUT/PATCH',
    x: 50,
    y: 87,
    pipeline: ['PUT/PATCH', 'validation', 'business rules', 'database'],
    status: '200/204',
  },
  {
    id: 'delete',
    label: 'DELETE',
    verb: 'DELETE',
    x: 13,
    y: 50,
    pipeline: ['DELETE', 'authorization', 'database'],
    status: '204',
  },
];

const TAKEAWAYS: string[] = [
  'CRUD is the mental model.',
  'HTTP is how systems communicate.',
  'REST helps structure the API.',
  'Services contain business logic.',
  'Repositories handle persistence.',
  'Databases store the state.',
];

@Component({
  selector: 'app-crud-final-mental-model',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-final-mental-model">
      <div class="container">
        <p class="lab-index mono">16 — THE MENTAL MODEL</p>
        <h2 class="lab-title">Everything from this chapter, around one Book</h2>
        <p class="lab-lede">
          Every operation you've seen — Create, Read, Update, Delete — is the same shape: an HTTP verb, a pipeline of
          layers, and a status code that reports what happened. Click an operation to trace its pipeline.
        </p>

        <div class="lab-panel">
          <div class="radial-wrap">
            <svg class="connector-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              @for (op of operations; track op.id) {
                <line
                  class="connector"
                  [class]="'connector-' + op.id"
                  [class.is-active]="selected() === op.id"
                  x1="50" y1="50"
                  [attr.x2]="op.x" [attr.y2]="op.y"
                />
              }
            </svg>

            <div class="hub mono" [attr.aria-label]="'Book resource'">BOOK</div>

            @for (op of operations; track op.id) {
              <button
                type="button"
                class="op-node mono"
                [class]="'op-' + op.id"
                [class.is-active]="selected() === op.id"
                [style.left.%]="op.x"
                [style.top.%]="op.y"
                [attr.aria-pressed]="selected() === op.id"
                (click)="select(op.id)"
              >
                {{ op.label }}
              </button>
            }
          </div>

          <div class="pipeline-grid">
            @for (op of operations; track op.id) {
              <div class="pipeline-card" [class]="'op-' + op.id" [class.is-active]="selected() === op.id" (click)="select(op.id)">
                <p class="pipeline-title mono">{{ op.label }}</p>
                <div class="pipeline-chain mono">
                  @for (step of op.pipeline; track step; let last = $last) {
                    <span class="chain-step">{{ step }}</span>
                    @if (!last) {
                      <span class="chain-arrow" aria-hidden="true">&rarr;</span>
                    }
                  }
                  <span class="chain-arrow" aria-hidden="true">&rarr;</span>
                  <span class="chain-status">{{ op.status }}</span>
                </div>
              </div>
            }
          </div>

          <div class="takeaways">
            <p class="takeaways-label mono">THE LAYERED TAKEAWAY</p>
            <ul class="takeaway-list">
              @for (line of takeaways; track line) {
                <li class="takeaway-item">{{ line }}</li>
              }
            </ul>
          </div>
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

    .radial-wrap {
      position: relative;
      width: 100%;
      max-width: 520px;
      aspect-ratio: 1 / 1;
      margin: 0 auto;
    }

    .connector-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .connector { stroke: var(--border-strong); stroke-width: 0.6; transition: stroke 0.2s ease; }
    .connector.is-active { stroke-width: 1; }
    .connector-create.is-active { stroke: var(--cr-accent); }
    .connector-read.is-active { stroke: var(--cr-cyan); }
    .connector-update.is-active { stroke: var(--cr-violet); }
    .connector-delete.is-active { stroke: var(--cr-danger); }

    .hub {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 88px;
      height: 88px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      color: var(--text);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      box-shadow: 0 0 0 6px var(--surface-raised);
      z-index: 2;
    }

    .op-node {
      all: unset;
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 72px;
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      color: var(--text-muted);
      transition: all 0.2s ease;
      z-index: 3;
    }
    .op-node:hover { border-color: var(--text-faint); }
    .op-node.is-active { color: var(--bg); }

    .op-create.is-active { background: var(--cr-accent); border-color: var(--cr-accent); box-shadow: 0 0 18px var(--glow-accent); }
    .op-read.is-active { background: var(--cr-cyan); border-color: var(--cr-cyan); box-shadow: 0 0 18px var(--glow-accent-2); }
    .op-update.is-active { background: var(--cr-violet); border-color: var(--cr-violet); box-shadow: 0 0 18px rgba(167, 139, 250, 0.35); }
    .op-delete.is-active { background: var(--cr-danger); border-color: var(--cr-danger); box-shadow: 0 0 18px rgba(255, 93, 93, 0.35); }

    .pipeline-grid {
      margin-top: 36px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    @media (min-width: 720px) {
      .pipeline-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .pipeline-card {
      cursor: pointer;
      padding: 16px 18px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-left: 3px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .pipeline-card.op-create { border-left-color: color-mix(in srgb, var(--cr-accent) 45%, var(--border-strong)); }
    .pipeline-card.op-read { border-left-color: color-mix(in srgb, var(--cr-cyan) 45%, var(--border-strong)); }
    .pipeline-card.op-update { border-left-color: color-mix(in srgb, var(--cr-violet) 45%, var(--border-strong)); }
    .pipeline-card.op-delete { border-left-color: color-mix(in srgb, var(--cr-danger) 45%, var(--border-strong)); }

    .pipeline-card.op-create.is-active { border-color: var(--cr-accent); background: color-mix(in srgb, var(--cr-accent) 8%, var(--surface)); }
    .pipeline-card.op-read.is-active { border-color: var(--cr-cyan); background: color-mix(in srgb, var(--cr-cyan) 8%, var(--surface)); }
    .pipeline-card.op-update.is-active { border-color: var(--cr-violet); background: color-mix(in srgb, var(--cr-violet) 8%, var(--surface)); }
    .pipeline-card.op-delete.is-active { border-color: var(--cr-danger); background: color-mix(in srgb, var(--cr-danger) 8%, var(--surface)); }

    .pipeline-title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text); margin-bottom: 10px; }
    .pipeline-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.75rem; }
    .chain-step { color: var(--text-muted); }
    .chain-arrow { color: var(--text-faint); }
    .chain-status { color: var(--text); font-weight: 700; }

    .takeaways {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }
    .takeaways-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 14px; }
    .takeaway-list { display: flex; flex-direction: column; gap: 10px; }
    .takeaway-item {
      font-size: 0.9375rem;
      color: var(--text);
      line-height: 1.5;
      padding-left: 18px;
      position: relative;
    }
    .takeaway-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 8px;
      height: 1px;
      background: var(--cr-accent);
    }

    @media (prefers-reduced-motion: reduce) {
      .connector, .op-node, .pipeline-card { transition: none; }
    }
  `,
})
export class CrudFinalMentalModel {
  protected readonly operations = OPERATIONS;
  protected readonly takeaways = TAKEAWAYS;
  protected readonly selected = signal<OpId>('create');

  protected select(id: OpId): void {
    this.selected.set(id);
  }
}
