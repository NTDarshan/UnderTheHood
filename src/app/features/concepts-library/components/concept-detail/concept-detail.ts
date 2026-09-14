import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';

import { ConceptCategoryMeta, EngineeringConcept } from '../../../../data/concepts.data';
import { ConceptsProgressService } from '../../services/concepts-progress.service';

const TEMPLATE_STEPS = [
  { label: 'What is it?', hint: 'A beginner-friendly explanation of the concept.' },
  { label: 'Why was it introduced?', hint: 'The original problem it was built to solve.' },
  { label: 'How does it work?', hint: 'A simple step-by-step sequence.' },
  { label: 'Visualize it', hint: 'A diagram or small interactive demo, sized to the concept.' },
  { label: 'Where is it used?', hint: 'Real systems and situations you’ll actually see it in.' },
  { label: 'What should I remember?', hint: 'Three points worth keeping.' },
];

@Component({
  selector: 'app-concept-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="el-overlay" (click)="close.emit()">
      <div class="el-drawer" role="dialog" [attr.aria-label]="concept().name" (click)="$event.stopPropagation()">
        <header class="el-drawer-head">
          <div>
            <span class="el-drawer-category mono">{{ categoryLabel() }}</span>
            <h2 class="el-drawer-title">{{ concept().name }}</h2>
          </div>
          <button type="button" class="el-close" (click)="close.emit()" aria-label="Close">✕</button>
        </header>

        <div class="el-drawer-meta mono">
          <span class="el-badge" [attr.data-level]="concept().difficulty">{{ difficultyLabel() }}</span>
          <span>{{ concept().minutes }} min</span>
          <button type="button" class="el-drawer-toggle" [attr.aria-pressed]="isComplete()" (click)="progress.toggleCompleted(concept().id)">
            @if (isComplete()) {
              <span class="el-check-mark">✓</span> Understood
            } @else {
              <span class="el-check-ring"></span> Mark as understood
            }
          </button>
        </div>

        <p class="el-drawer-blurb">{{ concept().blurb }}</p>

        <div class="el-template">
          @for (step of steps; track step.label) {
            <div class="el-step">
              <span class="el-step-label mono">{{ step.label }}</span>
              <span class="el-step-hint">{{ step.hint }}</span>
              <span class="el-step-flag mono">Coming soon</span>
            </div>
          }
        </div>

        <p class="el-drawer-note">
          The full walkthrough for <strong>{{ concept().name }}</strong> — explanation, visual, and connected
          concepts — hasn't been written yet. The library is being filled in one concept at a time. You can still
          mark it understood above if you already know it.
        </p>
      </div>
    </div>
  `,
  styles: `
    .el-overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: flex;
      justify-content: flex-end;
      background: color-mix(in srgb, black 60%, transparent);
      backdrop-filter: blur(2px);
    }

    .el-drawer {
      width: min(480px, 100%);
      height: 100%;
      overflow-y: auto;
      background: var(--surface);
      border-left: 1px solid var(--border-strong);
      padding: 28px 24px 40px;
      animation: el-slide-in 0.2s ease;
    }

    @keyframes el-slide-in {
      from { transform: translateX(24px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .el-drawer { animation: none; }
    }

    .el-drawer-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .el-drawer-category {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--el-accent);
    }

    .el-drawer-title {
      margin-top: 6px;
      font-size: 1.5rem;
    }

    .el-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
    }

    .el-close:hover {
      color: var(--text);
      border-color: var(--el-accent);
    }

    .el-drawer-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      font-size: 0.75rem;
      color: var(--text-faint);
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

    .el-drawer-toggle {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: transparent;
      color: var(--text-muted);
    }

    .el-drawer-toggle[aria-pressed='true'] {
      color: var(--el-success);
      border-color: color-mix(in srgb, var(--el-success) 40%, var(--border-strong));
    }

    .el-check-ring {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      display: inline-block;
    }

    .el-check-mark {
      color: var(--el-success);
      font-weight: 700;
    }

    .el-drawer-blurb {
      margin-top: 18px;
      font-size: 1.0625rem;
      line-height: 1.55;
      color: var(--text);
    }

    .el-template {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 1px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .el-step {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 16px;
      background: var(--bg);
      opacity: 0.65;
    }

    .el-step-label {
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .el-step-hint {
      font-size: 0.8125rem;
      color: var(--text-faint);
    }

    .el-step-flag {
      align-self: flex-start;
      margin-top: 4px;
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--el-cyan);
      opacity: 0.85;
    }

    .el-drawer-note {
      margin-top: 20px;
      font-size: 0.8125rem;
      line-height: 1.6;
      color: var(--text-faint);
    }

    .el-drawer-note strong {
      color: var(--text-muted);
    }
  `,
})
export class ConceptDetail {
  protected readonly progress = inject(ConceptsProgressService);
  protected readonly steps = TEMPLATE_STEPS;

  readonly concept = input.required<EngineeringConcept>();
  readonly categoryMeta = input.required<ConceptCategoryMeta | undefined>();

  @Output() close = new EventEmitter<void>();

  protected readonly categoryLabel = computed(() => this.categoryMeta()?.label ?? this.concept().category);

  protected readonly difficultyLabel = computed(() => {
    const level = this.concept().difficulty;
    return level.charAt(0).toUpperCase() + level.slice(1);
  });

  protected isComplete(): boolean {
    return this.progress.isCompleted(this.concept().id);
  }
}
