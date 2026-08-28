import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface MethodInfo {
  method: string;
  intent: string;
  example: string;
}

const METHODS: MethodInfo[] = [
  { method: 'GET', intent: 'Retrieve', example: 'GET /users/123' },
  { method: 'POST', intent: 'Create', example: 'POST /users' },
  { method: 'PUT', intent: 'Replace / update', example: 'PUT /users/123' },
  { method: 'PATCH', intent: 'Partial update', example: 'PATCH /users/123' },
  { method: 'DELETE', intent: 'Delete', example: 'DELETE /users/123' },
  { method: 'OPTIONS', intent: 'Discover supported communication options', example: 'OPTIONS /users/123' },
];

@Component({
  selector: 'app-method-route-matrix',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="http-methods">
      <div class="container">
        <p class="lab-index">ROUTING / 02 — HTTP METHODS VS ROUTING</p>
        <h2 class="lab-title">The method says WHAT. The route says WHERE.</h2>
        <p class="lab-lede">
          These are two independent questions the router has to answer together. Routing alone never
          decides the full business meaning of a request — the method matters just as much as the path.
        </p>

        <app-explain-simply>
          "/users/123" on its own is just an address — like "42 Main Street." It doesn't say whether you're
          visiting, delivering a package, or knocking it down. The HTTP method is the reason you're there.
        </app-explain-simply>

        <div class="split-row">
          <button type="button" class="split-btn" [class.is-active]="focus() === 'what'" (click)="focus.set('what')">
            <span class="split-tag mono">GET</span>
            <span class="split-word">WHAT</span>
          </button>
          <span class="split-plus" aria-hidden="true">+</span>
          <button type="button" class="split-btn" [class.is-active]="focus() === 'where'" (click)="focus.set('where')">
            <span class="split-tag mono">/users/123</span>
            <span class="split-word">WHERE</span>
          </button>
        </div>

        <div class="table-wrap">
          <table class="method-table mono">
            <thead>
              <tr>
                <th>METHOD</th>
                <th>INTENT</th>
                <th>EXAMPLE</th>
              </tr>
            </thead>
            <tbody>
              @for (m of methods; track m.method) {
                <tr>
                  <td class="method-cell">{{ m.method }}</td>
                  <td class="intent-cell">{{ m.intent }}</td>
                  <td class="example-cell">{{ m.example }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <p class="lab-note">
          Notice the same route, <span class="mono">/users/123</span>, appears with four different methods above
          — the route identifies the resource; the method decides what happens to it.
        </p>
      </div>
    </section>
  `,
  styles: `
    .split-row {
      margin-top: 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .split-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 22px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .split-btn.is-active {
      border-color: var(--accent);
      box-shadow: 0 0 18px var(--glow-accent);
    }

    .split-tag {
      color: var(--accent-2);
      font-size: 0.9375rem;
    }

    .split-word {
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--text);
    }

    .split-plus {
      color: var(--text-faint);
      font-size: 1.25rem;
    }

    .table-wrap {
      margin-top: 32px;
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .method-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      min-width: 480px;
    }

    .method-table th {
      text-align: left;
      padding: 10px 14px;
      background: var(--surface-elevated);
      color: var(--text-faint);
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--border);
    }

    .method-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
    }

    .method-cell {
      color: var(--accent);
      font-weight: 700;
    }

    .intent-cell {
      color: var(--text-muted);
    }

    .example-cell {
      color: var(--accent-2);
    }
  `,
})
export class MethodRouteMatrix {
  protected readonly methods = METHODS;
  protected readonly focus = signal<'what' | 'where'>('what');
}
