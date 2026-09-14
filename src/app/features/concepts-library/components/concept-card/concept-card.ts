import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';

import { ConceptCategoryMeta, EngineeringConcept } from '../../../../data/concepts.data';
import { ConceptsProgressService } from '../../services/concepts-progress.service';

@Component({
  selector: 'app-concept-card',
  standalone: true,
  imports: [],
  template: `
    <article
      class="el-card"
      [class.is-complete]="isComplete()"
      [class.is-viewed]="isViewed() && !isComplete()"
      (click)="open.emit()"
    >
      <header class="el-card-head">
        <span class="el-card-category mono">{{ categoryLabel() }}</span>
        <button
          type="button"
          class="el-check"
          [attr.aria-pressed]="isComplete()"
          [attr.aria-label]="isComplete() ? 'Mark ' + concept().name + ' as not explored' : 'Mark ' + concept().name + ' as understood'"
          (click)="onToggle($event)"
        >
          @if (isComplete()) {
            <span class="el-check-mark">✓</span>
          } @else {
            <span class="el-check-ring"></span>
          }
        </button>
      </header>

      <h3 class="el-card-name">{{ concept().name }}</h3>
      <p class="el-card-blurb">{{ concept().blurb }}</p>

      <footer class="el-card-meta mono">
        <span class="el-badge" [attr.data-level]="concept().difficulty">{{ difficultyLabel() }}</span>
        <span class="el-time">{{ concept().minutes }} min</span>
        <span class="el-status">{{ statusLabel() }}</span>
      </footer>
    </article>
  `,
  styles: `
    .el-card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      cursor: pointer;
      transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
    }

    .el-card:hover {
      border-color: var(--border-strong);
      background: var(--surface-elevated);
    }

    .el-card:active {
      transform: scale(0.99);
    }

    .el-card.is-viewed {
      border-color: color-mix(in srgb, var(--el-cyan) 35%, var(--border));
    }

    .el-card.is-complete {
      border-color: color-mix(in srgb, var(--el-success) 40%, var(--border));
      background: color-mix(in srgb, var(--el-success) 5%, var(--surface));
    }

    .el-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .el-card-category {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--el-accent);
    }

    .el-check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: transparent;
      flex-shrink: 0;
    }

    .el-check-ring {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1.5px solid var(--border-strong);
      transition: border-color 0.15s ease;
    }

    .el-check:hover .el-check-ring {
      border-color: var(--el-accent);
    }

    .el-check-mark {
      color: var(--el-success);
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .el-card-name {
      font-size: 1.0625rem;
      line-height: 1.25;
    }

    .el-card-blurb {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .el-card-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.6875rem;
      color: var(--text-faint);
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }

    .el-badge {
      padding: 2px 7px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .el-badge[data-level='intermediate'] {
      color: var(--el-cyan);
      border-color: color-mix(in srgb, var(--el-cyan) 40%, var(--border-strong));
    }

    .el-badge[data-level='advanced'] {
      color: var(--el-violet);
      border-color: color-mix(in srgb, var(--el-violet) 40%, var(--border-strong));
    }

    .el-status {
      margin-left: auto;
    }

    .is-complete .el-status {
      color: var(--el-success);
    }
  `,
})
export class ConceptCard {
  private readonly progress = inject(ConceptsProgressService);

  readonly concept = input.required<EngineeringConcept>();
  readonly categoryMeta = input.required<ConceptCategoryMeta | undefined>();

  @Output() open = new EventEmitter<void>();

  protected readonly categoryLabel = computed(() => this.categoryMeta()?.label ?? this.concept().category);

  protected readonly difficultyLabel = computed(() => {
    const level = this.concept().difficulty;
    return level.charAt(0).toUpperCase() + level.slice(1);
  });

  protected isComplete(): boolean {
    return this.progress.isCompleted(this.concept().id);
  }

  protected isViewed(): boolean {
    return this.progress.isViewed(this.concept().id);
  }

  protected statusLabel(): string {
    if (this.isComplete()) return 'Understood';
    if (this.isViewed()) return 'In progress';
    return 'Not explored';
  }

  protected onToggle(event: Event): void {
    event.stopPropagation();
    this.progress.toggleCompleted(this.concept().id);
  }
}
