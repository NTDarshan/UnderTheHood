import { Component, computed, signal } from '@angular/core';

interface Cell {
  id: string;
  layer: string;
  question: string;
  answer: string;
  explanation: string;
}

const CELLS: Cell[] = [
  { id: 'controller-http', layer: 'Controller', question: 'Knows HTTP?', answer: '✓', explanation: 'The controller is the HTTP boundary — it directly reads requests and writes responses.' },
  { id: 'controller-business', layer: 'Controller', question: 'Knows business?', answer: 'Limited', explanation: 'It may make HTTP-level decisions (which status code) but should not encode business rules.' },
  { id: 'controller-db', layer: 'Controller', question: 'Knows DB?', answer: '✕', explanation: 'Never — a controller should have no idea a database exists.' },
  { id: 'controller-http-out', layer: 'Controller', question: 'Returns HTTP?', answer: '✓', explanation: 'Yes — converting the service result into an HTTP response is its job.' },
  { id: 'controller-sql', layer: 'Controller', question: 'SQL/query?', answer: '✕', explanation: 'Never.' },
  { id: 'controller-usecase', layer: 'Controller', question: 'Coordinates use case?', answer: '✕', explanation: 'No — it delegates the use case to the service.' },
  { id: 'service-http', layer: 'Service', question: 'Knows HTTP?', answer: '✕', explanation: 'A service should be callable from a queue worker, a CLI, or a test — not just HTTP.' },
  { id: 'service-business', layer: 'Service', question: 'Knows business?', answer: '✓', explanation: 'This is its entire purpose.' },
  { id: 'service-db', layer: 'Service', question: 'Knows DB?', answer: 'Through abstractions', explanation: 'It calls a repository interface — it should not know it is Postgres, Mongo, or anything specific.' },
  { id: 'service-http-out', layer: 'Service', question: 'Returns HTTP?', answer: '✕', explanation: 'It returns a domain result or throws a domain error — never an HTTP status.' },
  { id: 'service-sql', layer: 'Service', question: 'SQL/query?', answer: '✕', explanation: 'That belongs to the repository.' },
  { id: 'service-usecase', layer: 'Service', question: 'Coordinates use case?', answer: '✓', explanation: 'Orchestrating repositories and other services for one use case is exactly its job.' },
  { id: 'repo-http', layer: 'Repository', question: 'Knows HTTP?', answer: '✕', explanation: 'A repository has never heard of a request or response.' },
  { id: 'repo-business', layer: 'Repository', question: 'Knows business?', answer: '✕', explanation: 'No business policy belongs here — only persistence mechanics.' },
  { id: 'repo-db', layer: 'Repository', question: 'Knows DB?', answer: '✓', explanation: 'This is its whole reason to exist.' },
  { id: 'repo-http-out', layer: 'Repository', question: 'Returns HTTP?', answer: '✕', explanation: 'Never.' },
  { id: 'repo-sql', layer: 'Repository', question: 'SQL/query?', answer: '✓', explanation: 'Building and executing queries is the repository\'s job.' },
  { id: 'repo-usecase', layer: 'Repository', question: 'Coordinates use case?', answer: '✕', explanation: 'It performs one data operation — orchestration is the service\'s job.' },
];

@Component({
  selector: 'app-layer-comparison',
  standalone: true,
  template: `
    <section class="lab-section" id="layer-comparison">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 11 — CONTROLLER vs SERVICE vs REPOSITORY</p>
        <h2 class="lab-title">Same question, three different answers.</h2>
        <p class="lab-lede">Click any cell to see why.</p>

        <div class="lab-panel">
          <div class="table-wrap">
            <table class="comparison-table mono">
              <thead>
                <tr>
                  <th></th>
                  <th>Controller</th>
                  <th>Service</th>
                  <th>Repository</th>
                </tr>
              </thead>
              <tbody>
                @for (q of questions; track q) {
                  <tr>
                    <td class="row-label">{{ q }}</td>
                    @for (layer of layers; track layer) {
                      <td>
                        <button type="button" class="cell-btn" [class.is-selected]="selectedId() === idFor(layer, q)" (click)="select(layer, q)">
                          {{ answerFor(layer, q) }}
                        </button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (selected(); as s) {
            <p class="lab-note"><strong>{{ s.layer }} — {{ s.question }}</strong> {{ s.explanation }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .table-wrap { overflow-x: auto; }
    .comparison-table { width: 100%; border-collapse: collapse; min-width: 480px; }
    .comparison-table th { font-size: 0.75rem; color: var(--accent-2); text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-strong); }
    .row-label { font-size: 0.75rem; color: var(--text-faint); padding: 8px 12px; white-space: nowrap; }
    .comparison-table td { padding: 4px 8px; }
    .cell-btn { width: 100%; font-size: 0.75rem; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); }
    .cell-btn:hover { border-color: var(--accent-dim); color: var(--text); }
    .cell-btn.is-selected { border-color: var(--accent); color: var(--accent-strong); box-shadow: 0 0 10px var(--glow-accent); }
  `,
})
export class LayerComparison {
  protected readonly cells = CELLS;
  protected readonly layers = ['Controller', 'Service', 'Repository'];
  protected readonly questions = ['Knows HTTP?', 'Knows business?', 'Knows DB?', 'Returns HTTP?', 'SQL/query?', 'Coordinates use case?'];
  protected readonly selectedId = signal(this.cells[0].id);
  protected readonly selected = computed(() => this.cells.find((c) => c.id === this.selectedId()));

  idFor(layer: string, question: string): string {
    return this.cells.find((c) => c.layer === layer && c.question === question)?.id ?? '';
  }

  answerFor(layer: string, question: string): string {
    return this.cells.find((c) => c.layer === layer && c.question === question)?.answer ?? '';
  }

  select(layer: string, question: string): void {
    this.selectedId.set(this.idFor(layer, question));
  }
}
