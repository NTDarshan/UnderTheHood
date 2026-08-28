import { Component } from '@angular/core';

interface Principle {
  text: string;
}

const PRINCIPLES: Principle[] = [
  { text: 'URLs identify resources.' },
  { text: 'HTTP methods communicate operation semantics.' },
  { text: 'Use HTTP semantics instead of inventing your own.' },
  { text: 'Consistency beats cleverness.' },
  { text: 'Empty collections are still valid collections.' },
  { text: 'Idempotency is about intended server-state effect, not identical response bodies.' },
  { text: 'Pagination protects APIs from uncontrolled collection size.' },
  { text: 'Filtering and sorting belong naturally in collection queries.' },
  { text: 'Validate query parameters.' },
  { text: 'Design for evolution.' },
  { text: 'Error responses should be predictable.' },
  { text: 'Never trust clients to follow frontend rules.' },
  { text: 'Resource-oriented design should be balanced with practical usability.' },
  { text: 'There is rarely one universal API design answer.' },
];

@Component({
  selector: 'app-api-design-principles',
  standalone: true,
  template: `
    <section class="lab-section" id="principles">
      <div class="container">
        <p class="lab-index">REST API / 46 — API DESIGN PRINCIPLES</p>
        <h2 class="lab-title">Fourteen principles. The whole chapter, distilled.</h2>

        <div class="principle-wall">
          @for (p of principles; track p.text; let i = $index) {
            <div class="principle-card">
              <span class="principle-num mono">{{ i + 1 }}</span>
              <p class="principle-text">{{ p.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .principle-wall { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .principle-wall { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .principle-wall { grid-template-columns: 1fr 1fr 1fr; } }

    .principle-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .principle-num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--accent-2-dim); color: var(--accent-2); font-size: 0.75rem; }
    .principle-text { font-size: 0.9375rem; color: var(--text); line-height: 1.55; }
  `,
})
export class ApiDesignPrinciples {
  protected readonly principles = PRINCIPLES;
}
