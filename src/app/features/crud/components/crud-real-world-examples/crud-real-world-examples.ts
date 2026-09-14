import { Component } from '@angular/core';

interface CrudChip {
  op: 'C' | 'R' | 'U' | 'D';
  label: string;
  muted?: boolean;
}

interface RealWorldExample {
  id: string;
  resource: string;
  icon: string;
  verdict: string;
  verdictTone: 'full' | 'gated' | 'restricted';
  chips: CrudChip[];
  note: string;
}

const EXAMPLES: RealWorldExample[] = [
  {
    id: 'post',
    resource: 'Instagram post',
    icon: '◨',
    verdict: 'All four operations, freely',
    verdictTone: 'full',
    chips: [
      { op: 'C', label: 'Create' },
      { op: 'R', label: 'Read' },
      { op: 'U', label: 'Update' },
      { op: 'D', label: 'Delete' },
    ],
    note: 'You post it, anyone reads it, you edit the caption, you delete it. The owner has full control over the resource\'s entire lifecycle.',
  },
  {
    id: 'product',
    resource: 'E-commerce product',
    icon: '▣',
    verdict: 'All four, but admin-gated',
    verdictTone: 'gated',
    chips: [
      { op: 'C', label: 'Create' },
      { op: 'R', label: 'Read' },
      { op: 'U', label: 'Update' },
      { op: 'D', label: 'Delete' },
    ],
    note: 'A shopper only ever reads. Create, Update, and Delete exist — but they\'re locked behind an admin role, not exposed to every caller.',
  },
  {
    id: 'transaction',
    resource: 'Bank transaction',
    icon: '⬢',
    verdict: 'Mostly Create / Read only',
    verdictTone: 'restricted',
    chips: [
      { op: 'C', label: 'Create' },
      { op: 'R', label: 'Read' },
      { op: 'U', label: 'Update', muted: true },
      { op: 'D', label: 'Delete', muted: true },
    ],
    note: 'A transaction is recorded once and read many times. There is usually no arbitrary Update or Delete — reversing money moves through a new, auditable transaction instead of editing history.',
  },
];

@Component({
  selector: 'app-crud-real-world-examples',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-real-world">
      <div class="container">
        <p class="lab-index mono">15 — CRUD IN THE WILD</p>
        <h2 class="lab-title">Not every resource wants all four operations</h2>
        <p class="lab-lede">
          The four operations are a mental model, not a mandate. Real systems pick and choose which ones a resource
          actually exposes — and to whom.
        </p>

        <div class="lab-panel">
          <div class="example-grid">
            @for (ex of examples; track ex.id) {
              <div class="example-card" [class]="'tone-' + ex.verdictTone">
                <div class="example-head">
                  <span class="example-icon" aria-hidden="true">{{ ex.icon }}</span>
                  <span class="example-resource">{{ ex.resource }}</span>
                </div>

                <div class="chip-row">
                  @for (c of ex.chips; track c.op) {
                    <span class="op-chip mono" [class.op-chip-muted]="c.muted" [attr.title]="c.label">
                      {{ c.op }}
                    </span>
                  }
                </div>

                <p class="example-verdict">{{ ex.verdict }}</p>
                <p class="example-note">{{ ex.note }}</p>
              </div>
            }
          </div>

          <div class="thesis">
            <p class="thesis-line">
              CRUD does not mean every resource should expose all four operations.
              <span class="thesis-highlight">Business rules decide what operations are actually allowed.</span>
            </p>
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

    .example-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 860px) { .example-grid { grid-template-columns: repeat(3, 1fr); } }

    .example-card {
      display: flex;
      flex-direction: column;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 20px;
      border-top: 3px solid var(--border-strong);
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .example-card.tone-full { border-top-color: var(--cr-success); }
    .example-card.tone-gated { border-top-color: var(--cr-cyan); }
    .example-card.tone-restricted { border-top-color: var(--cr-warning); }

    .example-head { display: flex; align-items: center; gap: 10px; }
    .example-icon { font-size: 1.125rem; color: var(--text-faint); }
    .example-resource { font-size: 0.9375rem; font-weight: 600; color: var(--text); }

    .chip-row { display: flex; gap: 8px; margin-top: 16px; }
    .op-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border-strong);
      color: var(--text);
      font-size: 0.8125rem;
      font-weight: 700;
      background: var(--surface-elevated);
    }
    .op-chip-muted {
      color: var(--text-faint);
      border-style: dashed;
      background: transparent;
      opacity: 0.55;
      text-decoration: line-through;
    }

    .example-verdict { margin-top: 14px; font-size: 0.8125rem; font-weight: 600; color: var(--text); }
    .tone-full .example-verdict { color: var(--cr-success); }
    .tone-gated .example-verdict { color: var(--cr-cyan); }
    .tone-restricted .example-verdict { color: var(--cr-warning); }

    .example-note { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .thesis {
      margin-top: 28px;
      padding: 22px 24px;
      background: color-mix(in srgb, var(--cr-accent) 8%, var(--surface));
      border: 1px solid color-mix(in srgb, var(--cr-accent) 35%, var(--border-strong));
      border-radius: var(--radius-md);
    }
    .thesis-line {
      margin: 0;
      font-size: 1.0625rem;
      line-height: 1.6;
      color: var(--text-muted);
      max-width: 760px;
    }
    .thesis-highlight { display: block; margin-top: 6px; color: var(--text); font-weight: 700; }
  `,
})
export class CrudRealWorldExamples {
  protected readonly examples = EXAMPLES;
}
