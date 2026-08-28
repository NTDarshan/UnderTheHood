import { Component, computed, signal } from '@angular/core';
import { CONTRACT_CHANGES, ChangeSafety } from '../../engine/rest-simulator';

const VERDICTS: { safety: ChangeSafety; label: string }[] = [
  { safety: 'safe', label: 'Usually safe' },
  { safety: 'warning', label: 'Potentially breaking' },
  { safety: 'breaking', label: 'Breaking' },
];

@Component({
  selector: 'app-api-evolution-game',
  standalone: true,
  template: `
    <section class="lab-section" id="api-evolution-game">
      <div class="container">
        <p class="lab-index">REST API / 41 — API CONTRACT EVOLUTION GAME</p>
        <h2 class="lab-title">V1 is live. Classify each proposed change before it ships.</h2>

        @if (!finished()) {
          <div class="lab-panel">
            <p class="quiz-progress mono">Change {{ index() + 1 }} / {{ changes.length }}</p>
            <p class="lab-code v1-code"><span class="tok-key">{{ '{' }} "firstName": "John" {{ '}' }}</span> <span class="tok-dim">— current V1 response</span></p>
            <p class="quiz-question">Proposed change: {{ current().label }}</p>

            <div class="option-list">
              @for (v of verdicts; track v.safety; let oi = $index) {
                <button
                  type="button"
                  class="option-btn"
                  [class.is-correct]="picked() !== null && v.safety === current().safety"
                  [class.is-wrong]="picked() === oi && v.safety !== current().safety"
                  [disabled]="picked() !== null"
                  (click)="choose(oi, v.safety)"
                >
                  {{ v.label }}
                </button>
              }
            </div>

            @if (picked() !== null) {
              <p class="explanation">{{ current().explanation }}</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="next()">{{ index() < changes.length - 1 ? 'Next →' : 'See score' }}</button>
              </div>
            }
          </div>
        } @else {
          <div class="lab-panel">
            <p class="quiz-score mono">{{ score() }} / {{ changes.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Play again</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 12px; }
    .v1-code { margin-bottom: 16px; }
    .quiz-question { font-size: 1.0625rem; color: var(--text); font-weight: 600; }
    .option-list { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; max-width: 400px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class ApiEvolutionGame {
  protected readonly changes = CONTRACT_CHANGES;
  protected readonly verdicts = VERDICTS;
  protected readonly index = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.changes[this.index()]);

  choose(oi: number, safety: ChangeSafety): void {
    this.picked.set(oi);
    if (safety === this.current().safety) this.score.update((s) => s + 1);
  }

  next(): void {
    if (this.index() < this.changes.length - 1) {
      this.index.update((i) => i + 1);
      this.picked.set(null);
    } else {
      this.finished.set(true);
    }
  }

  restart(): void {
    this.index.set(0);
    this.picked.set(null);
    this.score.set(0);
    this.finished.set(false);
  }
}
