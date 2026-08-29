import { Component, computed, signal } from '@angular/core';
import { httpStatusClasses } from '../../../../data/http/http-status-codes.data';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-status-code-explorer',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="status-codes">
      <div class="container">
        <p class="lab-index">HTTP / 10 — STATUS CODES</p>
        <h2 class="lab-title">"What happened?" — status codes answer in five classes.</h2>
        <p class="lab-lede">You don't need to memorize the full list. Pick a class, then a representative code.</p>

        <app-explain-simply>
          Status codes are like traffic lights for a short answer. 2xx is a green light — "all good." 3xx is a
          detour sign — "look over there instead." 4xx means you asked for something wrong — "that request
          doesn't make sense." 5xx means the kitchen itself broke — "not your fault, we messed up."
        </app-explain-simply>

        <div class="class-grid">
          @for (c of classes; track c.range) {
            <button
              type="button"
              class="class-card"
              [class]="'class-' + c.range"
              [class.is-selected]="selectedClass() === c.range"
              (click)="selectClass(c.range)"
            >
              <span class="class-dot" aria-hidden="true"></span>
              <span class="class-range mono">{{ c.range }}</span>
              <span class="class-name">{{ c.name }}</span>
            </button>
          }
        </div>

        @if (activeClass(); as ac) {
          <div class="lab-panel">
            <p class="class-meaning">{{ ac.meaning }}</p>
            <div class="code-chip-row">
              @for (code of ac.codes; track code.code) {
                <button type="button" class="code-chip mono" [class.is-selected]="selectedCode()?.code === code.code" (click)="selectedCodeValue.set(code.code)">
                  {{ code.code }}
                </button>
              }
            </div>
            @if (selectedCode(); as sc) {
              <div class="code-detail">
                <p class="code-detail-title mono">{{ sc.code }} {{ sc.label }}</p>
                <p>{{ sc.description }}</p>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .class-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    @media (min-width: 720px) {
      .class-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }

    .class-card {
      --class-color: var(--text-faint);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px 14px 18px 16px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-left: 3px solid var(--class-color);
      border-radius: var(--radius-md);
      text-align: left;
      transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    }

    .class-card:hover {
      transform: translateY(-2px);
    }

    .class-card.is-selected {
      border-color: var(--class-color);
      box-shadow: 0 0 18px -4px var(--class-color);
    }

    .class-dot {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--class-color);
    }

    .class-card.is-selected .class-dot {
      box-shadow: 0 0 8px var(--class-color);
    }

    .class-range {
      font-size: 0.6875rem;
      color: var(--class-color);
      letter-spacing: 0.06em;
    }

    .class-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--text);
    }

    .class-1xx { --class-color: #8fa3c9; }
    .class-2xx { --class-color: var(--accent-2); }
    .class-3xx { --class-color: var(--accent); }
    .class-4xx { --class-color: #ff7a5c; }
    .class-5xx { --class-color: var(--danger); }

    .class-meaning {
      color: var(--text-muted);
      font-size: 0.9375rem;
      max-width: 600px;
    }

    .code-chip-row {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .code-chip {
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      color: var(--text-muted);
      font-size: 0.8125rem;
    }

    .code-chip:hover {
      border-color: var(--accent);
    }

    .code-chip.is-selected {
      border-color: var(--accent);
      color: var(--accent-strong);
      background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated));
    }

    .code-detail {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    .code-detail-title {
      font-size: 1rem;
      color: var(--text);
      margin-bottom: 8px;
    }

    .code-detail p:last-child {
      color: var(--text-muted);
      max-width: 560px;
      line-height: 1.6;
    }
  `,
})
export class StatusCodeExplorer {
  protected readonly classes = httpStatusClasses;
  protected readonly selectedClass = signal('2xx');
  protected readonly selectedCodeValue = signal(200);

  protected readonly activeClass = computed(() => this.classes.find((c) => c.range === this.selectedClass()));
  protected readonly selectedCode = computed(() =>
    this.activeClass()?.codes.find((c) => c.code === this.selectedCodeValue()),
  );

  selectClass(range: string): void {
    this.selectedClass.set(range);
    const first = this.classes.find((c) => c.range === range)?.codes[0];
    if (first) this.selectedCodeValue.set(first.code);
  }
}
