import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Mode = 'rules' | 'examples';
type Label = 'spam' | 'not-spam';
type Example = { id: number; text: string; label: Label };

const BASE_RULES: string[] = [
  `if contains "free"`,
  `if contains "winner"`,
  `if contains "click"`,
  `if contains "money"`,
];

const EDGE_CASES: string[] = [
  `if contains "FREE" but sender is a known contact → don't flag`,
  `if message contains a link-shortener domain`,
  `if entire message is written in ALL CAPS`,
  `if sent at 3am from a new sender`,
  `if contains "money" but is a payroll email from HR`,
  `if contains an image with no text (can't check for "free")`,
];

let nextExampleId = 0;

@Component({
  selector: 'app-why-ml',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="why-ml">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 002 — WHY NOT JUST WRITE RULES?</p>
        <h2 class="lab-title">Build a spam filter by hand and watch the rule list eat itself.</h2>
        <p class="lab-lede">
          Start simple. Keep adding the edge cases real spam actually throws at you. See how long "just write
          rules" stays manageable.
        </p>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="mode() === 'examples'" (click)="toggleMode()">
            {{ mode() === 'rules' ? 'Try examples instead' : 'Back to rule list' }}
          </button>
        </div>

        @if (mode() === 'rules') {
          <div class="lab-panel">
            <p class="rules-heading mono">SPAM_FILTER.RULES — {{ allRules().length }} RULE{{ allRules().length === 1 ? '' : 'S' }}</p>
            <div class="rules-stack" [class.is-crowded]="allRules().length > 6">
              @for (rule of allRules(); track rule; let i = $index) {
                <p
                  class="lab-code rule-line"
                  [style.transform]="allRules().length > 6 ? rotationFor(i) : null"
                  [style.zIndex]="i"
                >
                  <span class="tok-method">if</span> <span class="tok-key">{{ ruleBody(rule) }}</span>
                </p>
              }
            </div>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="addEdgeCase()" [disabled]="revealedCount() >= edgeCases.length">
                {{ revealedCount() >= edgeCases.length ? 'No more edge cases left to add' : 'Add another edge case' }}
              </button>
            </div>

            @if (allRules().length > 6) {
              <p class="lab-note-warn lab-note">
                This is only {{ allRules().length }} rules and it's already unreadable — every new exception
                risks contradicting an old one. Real spam filtering would need thousands of rules like this,
                updated constantly as spammers change tactics.
              </p>
            }
          </div>
        } @else {
          <div class="lab-panel">
            <p class="rules-heading mono">LABELED EXAMPLES</p>
            <div class="examples-list">
              @for (ex of examples(); track ex.id) {
                <div class="example-row">
                  <span class="example-text mono">{{ ex.text }}</span>
                  <button
                    type="button"
                    class="pill"
                    [class.pill-no]="ex.label === 'spam'"
                    [class.pill-yes]="ex.label === 'not-spam'"
                    (click)="toggleLabel(ex.id)"
                  >
                    {{ ex.label === 'spam' ? 'SPAM' : 'NOT SPAM' }}
                  </button>
                </div>
              }
            </div>

            <div class="add-example-row">
              <div class="lab-field">
                <label for="new-example">Add a message</label>
                <input
                  id="new-example"
                  type="text"
                  placeholder="e.g. Congrats, you're our lucky winner!"
                  [ngModel]="newExampleText()"
                  (ngModelChange)="newExampleText.set($event)"
                  (keydown.enter)="addExample()"
                />
              </div>
              <button
                type="button"
                class="pill"
                [class.pill-no]="newExampleLabel() === 'spam'"
                [class.pill-yes]="newExampleLabel() === 'not-spam'"
                (click)="toggleNewLabel()"
              >
                {{ newExampleLabel() === 'spam' ? 'SPAM' : 'NOT SPAM' }}
              </button>
              <button type="button" class="lab-btn lab-btn-primary" (click)="addExample()" [disabled]="!newExampleText().trim()">
                Add example
              </button>
            </div>

            <div class="flow-diagram examples-flow">
              <div class="flow-node flow-node-role">EXAMPLES</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node flow-node-highlight">LEARNING ALGORITHM</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node flow-node-result">MODEL</div>
            </div>
            <p class="counter mono">{{ examples().length }} example{{ examples().length === 1 ? '' : 's' }} learned from</p>
          </div>
        }

        <p class="lab-note">
          Machine learning becomes useful exactly when writing every rule by hand becomes impractical — instead
          of specifying rules, we give examples and let an algorithm find the pattern.
        </p>
      </div>
    </section>
  `,
  styles: `
    .rules-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 16px; }

    .rules-stack { display: flex; flex-direction: column; gap: 8px; }
    .rules-stack.is-crowded { gap: 4px; }
    .rule-line { transition: transform 0.3s ease; }

    .examples-list { display: flex; flex-direction: column; gap: 10px; }
    .example-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface); border-radius: var(--radius-sm); border-left: 2px solid var(--border-strong); }
    .example-text { flex: 1; min-width: 200px; color: var(--text-muted); font-size: 0.8125rem; }
    .pill { cursor: pointer; }

    .add-example-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; margin-top: 20px; }
    .add-example-row .lab-field { flex: 1; min-width: 220px; }

    .flow-diagram { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 28px; }
    .flow-node { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-align: center; color: var(--text-muted); background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 12px 16px; }
    .flow-node-role { color: var(--text); }
    .flow-node-highlight { color: var(--accent); border-color: var(--accent-dim); box-shadow: 0 0 16px var(--glow-accent); }
    .flow-node-result { color: var(--accent-2); border-color: var(--accent-2-dim); }

    .counter { margin-top: 12px; font-size: 0.8125rem; color: var(--accent-2); }
  `,
})
export class WhyMl {
  protected readonly mode = signal<Mode>('rules');
  protected readonly edgeCases = EDGE_CASES;
  protected readonly revealedCount = signal<number>(0);

  protected readonly allRules = computed(() => [...BASE_RULES, ...this.edgeCases.slice(0, this.revealedCount())]);

  protected readonly examples = signal<Example[]>([
    { id: nextExampleId++, text: 'You won a free iPhone, click now!!!', label: 'spam' },
    { id: nextExampleId++, text: 'Hey, are we still on for lunch tomorrow?', label: 'not-spam' },
    { id: nextExampleId++, text: 'FREE MONEY — you are a winner, act now', label: 'spam' },
  ]);

  protected readonly newExampleText = signal<string>('');
  protected readonly newExampleLabel = signal<Label>('spam');

  toggleMode(): void {
    this.mode.set(this.mode() === 'rules' ? 'examples' : 'rules');
  }

  addEdgeCase(): void {
    this.revealedCount.update((c) => Math.min(c + 1, this.edgeCases.length));
  }

  ruleBody(rule: string): string {
    return rule.replace(/^if\s+/, '');
  }

  rotationFor(index: number): string {
    const deg = (index % 2 === 0 ? 1 : -1) * (0.6 + (index % 4) * 0.35);
    return `rotate(${deg}deg)`;
  }

  toggleLabel(id: number): void {
    this.examples.update((list) =>
      list.map((ex) => (ex.id === id ? { ...ex, label: ex.label === 'spam' ? 'not-spam' : 'spam' } : ex)),
    );
  }

  toggleNewLabel(): void {
    this.newExampleLabel.set(this.newExampleLabel() === 'spam' ? 'not-spam' : 'spam');
  }

  addExample(): void {
    const text = this.newExampleText().trim();
    if (!text) return;
    this.examples.update((list) => [...list, { id: nextExampleId++, text, label: this.newExampleLabel() }]);
    this.newExampleText.set('');
  }
}
