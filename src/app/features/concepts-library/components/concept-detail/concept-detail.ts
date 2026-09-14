import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

import { ConceptCategoryMeta, EngineeringConcept } from '../../../../data/concepts.data';
import { CONCEPT_CONTENT } from '../../content/concept-content';
import { CONCEPT_VISUALS } from '../../content/concept-visuals';
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
  imports: [NgComponentOutlet],
  template: `
    <div class="el-overlay" (click)="close.emit()">
      <div
        class="el-drawer"
        [class.is-rich]="content()"
        role="dialog"
        [attr.aria-label]="concept().name"
        (click)="$event.stopPropagation()"
      >
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

        @if (content(); as c) {
          <p class="el-drawer-hook">{{ c.hook }}</p>

          <section class="el-rich-section">
            <p class="el-rich-label mono">1 — WHAT IS IT?</p>
            <p class="el-rich-text">{{ c.whatIsIt }}</p>
          </section>

          <section class="el-rich-section">
            <p class="el-rich-label mono">2 — WHY WAS IT INTRODUCED?</p>
            <p class="el-rich-text">{{ c.whyIntroduced }}</p>
          </section>

          <section class="el-rich-section">
            <p class="el-rich-label mono">3 — HOW DOES IT WORK?</p>
            <ol class="el-how-sequence">
              @for (step of c.howItWorks; track step.label; let last = $last) {
                <li>
                  <div class="el-how-row">
                    <span class="el-how-label mono">{{ step.label }}</span>
                  </div>
                  <p class="el-how-detail">{{ step.detail }}</p>
                  @if (!last) {
                    <span class="el-how-arrow mono">↓</span>
                  }
                </li>
              }
            </ol>
          </section>

          <section class="el-rich-section">
            <p class="el-rich-label mono">4 — VISUALIZE IT</p>
            @if (visual(); as vis) {
              <div class="el-visual-host">
                <ng-container [ngComponentOutlet]="vis" />
              </div>
            }
          </section>

          <section class="el-rich-section">
            <p class="el-rich-label mono">5 — WHERE IS IT USED?</p>
            <div class="el-tags">
              @for (place of c.whereUsed; track place) {
                <span class="el-tag mono">{{ place }}</span>
              }
            </div>
          </section>

          <section class="el-rich-section el-callout el-callout-mistake">
            <p class="el-rich-label mono">COMMON MISTAKE</p>
            <p class="el-rich-text">{{ c.commonMistake }}</p>
          </section>

          <section class="el-rich-section el-callout el-callout-model">
            <p class="el-rich-label mono">MENTAL MODEL</p>
            <p class="el-rich-text">{{ c.mentalModel }}</p>
          </section>

          <section class="el-rich-section">
            <p class="el-rich-label mono">6 — WHAT SHOULD I REMEMBER?</p>
            <ul class="el-remember">
              @for (point of c.remember; track point) {
                <li>{{ point }}</li>
              }
            </ul>
          </section>

          @if (c.connected.length) {
            <section class="el-rich-section">
              <p class="el-rich-label mono">YOU SHOULD ALSO UNDERSTAND…</p>
              <div class="el-connected">
                @for (link of c.connected; track link.id) {
                  <button type="button" class="el-connected-chip mono" (click)="selectConcept.emit(link.id)">
                    → {{ link.label }}
                  </button>
                }
              </div>
            </section>
          }

          <p class="el-done mono">DONE ✓</p>
        } @else {
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
        }
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

    .el-drawer.is-rich {
      width: min(600px, 100%);
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

    .el-drawer-hook {
      margin-top: 18px;
      font-size: 1.0625rem;
      line-height: 1.55;
      color: var(--text);
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    .el-rich-section {
      margin-top: 24px;
    }

    .el-rich-label {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--el-accent);
      margin-bottom: 8px;
    }

    .el-rich-text {
      font-size: 0.9375rem;
      line-height: 1.65;
      color: var(--text-muted);
    }

    .el-how-sequence {
      display: flex;
      flex-direction: column;
    }

    .el-how-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .el-how-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text);
      background: var(--bg);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 4px 10px;
    }

    .el-how-detail {
      margin-top: 6px;
      margin-left: 2px;
      font-size: 0.8125rem;
      line-height: 1.55;
      color: var(--text-faint);
    }

    .el-how-arrow {
      display: block;
      margin: 6px 0 6px 10px;
      color: var(--border-strong);
      font-size: 0.75rem;
    }

    .el-visual-host {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg);
      padding: 16px;
    }

    .el-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .el-tag {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .el-callout {
      padding: 14px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg);
    }

    .el-callout-mistake .el-rich-label {
      color: var(--danger);
    }

    .el-callout-model .el-rich-label {
      color: var(--el-violet);
    }

    .el-remember {
      display: flex;
      flex-direction: column;
      gap: 8px;
      list-style: none;
    }

    .el-remember li {
      position: relative;
      padding-left: 18px;
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--text);
    }

    .el-remember li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--el-success);
    }

    .el-connected {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .el-connected-chip {
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: transparent;
      color: var(--el-cyan);
      font-size: 0.75rem;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .el-connected-chip:hover {
      border-color: var(--el-cyan);
      background: color-mix(in srgb, var(--el-cyan) 10%, transparent);
    }

    .el-done {
      margin-top: 28px;
      text-align: center;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      color: var(--el-success);
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
  @Output() selectConcept = new EventEmitter<string>();

  protected readonly content = computed(() => CONCEPT_CONTENT[this.concept().id]);
  protected readonly visual = computed(() => CONCEPT_VISUALS[this.concept().id]);

  protected readonly categoryLabel = computed(() => this.categoryMeta()?.label ?? this.concept().category);

  protected readonly difficultyLabel = computed(() => {
    const level = this.concept().difficulty;
    return level.charAt(0).toUpperCase() + level.slice(1);
  });

  protected isComplete(): boolean {
    return this.progress.isCompleted(this.concept().id);
  }
}
