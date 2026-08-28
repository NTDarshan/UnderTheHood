import { Component, computed, signal } from '@angular/core';

interface Source {
  id: string;
  name: string;
  example: string;
  note: string;
}

const SOURCES: Source[] = [
  { id: 'route', name: 'Route Parameters', example: '/users/123', note: 'Extracted from the URL path itself, usually parsed into typed values like an integer ID.' },
  { id: 'query', name: 'Query Parameters', example: '?page=2&sort=name', note: 'Always arrive as text — the framework or app code must parse them into the expected type.' },
  { id: 'headers', name: 'Headers', example: 'X-Correlation-ID, Accept', note: 'Metadata about the request — often used for tracing, content negotiation, or auth.' },
  { id: 'body', name: 'Body', example: '{ "name": "John" }', note: 'Deserialized from the request payload — this is where serialization and validation meet most directly.' },
  { id: 'cookies', name: 'Cookies', example: 'session_id=abc', note: 'Small values the browser sends automatically — often session or preference data.' },
];

@Component({
  selector: 'app-request-binding-sources',
  standalone: true,
  template: `
    <section class="lab-section" id="model-binding">
      <div class="container">
        <p class="lab-index">VALIDATION / 20 — MODEL / INPUT BINDING</p>
        <h2 class="lab-title">Binding happens between serialization and validation.</h2>

        <div class="flow-chain mono">
          <span>HTTP Request</span><span class="arrow">↓</span>
          <span>JSON / Query / Route / Form Data</span><span class="arrow">↓</span>
          <span>Input Binding / Parsing</span><span class="arrow">↓</span>
          <span>Application Model</span><span class="arrow">↓</span>
          <span>Validation</span>
        </div>

        <p class="lab-note">
          Binding answers "how do I map incoming request data into the application's expected
          structure?" Validation separately answers "is that mapped data acceptable?"
        </p>
      </div>
    </section>

    <section class="lab-section" id="request-sources">
      <div class="container">
        <p class="lab-index">VALIDATION / 21 — REQUEST SOURCES</p>
        <h2 class="lab-title">Not all input arrives the same way.</h2>

        <div class="source-chips">
          @for (s of sources; track s.id) {
            <button type="button" class="source-chip" [class.is-active]="selected() === s.id" (click)="selected.set(s.id)">{{ s.name }}</button>
          }
        </div>

        <div class="lab-panel source-detail">
          <pre class="lab-code mono">{{ active().example }}</pre>
          <p class="source-note">{{ active().note }}</p>
        </div>

        <p class="lab-note">Each source can have different parsing, transformation, and validation requirements.</p>
      </div>
    </section>
  `,
  styles: `
    .flow-chain { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .source-chips { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
    .source-chip { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); font-size: 0.8125rem; }
    .source-chip.is-active { border-color: var(--accent); color: var(--accent-strong); }

    .source-detail { margin-top: 20px; }
    .source-note { margin-top: 14px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class RequestBindingSources {
  protected readonly sources = SOURCES;
  protected readonly selected = signal('query');
  protected readonly active = computed(() => this.sources.find((s) => s.id === this.selected())!);
}
