import { Component, EventEmitter, Output, computed, input } from '@angular/core';

import { EngineeringConcept } from '../../../../data/concepts.data';
import { CONCEPT_CONTENT } from '../../content/concept-content';

@Component({
  selector: 'app-concept-card',
  standalone: true,
  imports: [],
  template: `
    <article class="el-card" (click)="open.emit()">
      <h3 class="el-card-name">{{ concept().name }}</h3>
      @if (!hasContent()) {
        <span class="el-card-soon mono">Coming soon</span>
      }
    </article>
  `,
  styles: `
    .el-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .el-card:hover {
      border-color: var(--border-strong);
      background: var(--surface-elevated);
    }

    .el-card:active {
      transform: scale(0.99);
    }

    .el-card-name {
      font-size: 0.9375rem;
      line-height: 1.3;
    }

    .el-card-soon {
      flex-shrink: 0;
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-faint);
      border: 1px solid var(--border-strong);
      border-radius: 999px;
      padding: 3px 8px;
    }
  `,
})
export class ConceptCard {
  readonly concept = input.required<EngineeringConcept>();

  @Output() open = new EventEmitter<void>();

  protected readonly hasContent = computed(() => !!CONCEPT_CONTENT[this.concept().id]);
}
