import { Component, OnDestroy, signal } from '@angular/core';

type Tab = 'supervised' | 'unsupervised' | 'reinforcement';
type UnsupervisedChip = 'clustering' | 'dimensionality' | 'anomaly';

type Cell = { r: number; c: number };

const GRID_SIZE = 5;
const START: Cell = { r: 4, c: 0 };
const TARGET: Cell = { r: 0, c: 4 };

const UNSUP_DOTS: { x: number; y: number }[] = [
  { x: 60, y: 60 }, { x: 82, y: 48 }, { x: 44, y: 78 }, { x: 70, y: 90 }, { x: 96, y: 70 },
  { x: 50, y: 40 }, { x: 30, y: 60 },
  { x: 260, y: 150 }, { x: 236, y: 168 }, { x: 280, y: 178 }, { x: 250, y: 120 }, { x: 300, y: 140 },
  { x: 220, y: 140 }, { x: 272, y: 200 },
];

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

@Component({
  selector: 'app-ml-types-map',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="ml-types">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 003 — THREE WAYS TO LEARN</p>
        <h2 class="lab-title">Not all machine learning has a teacher.</h2>
        <p class="lab-lede">
          "Machine learning" isn't one thing — it's three fundamentally different setups, depending on what
          kind of feedback the algorithm gets, if any.
        </p>

        <div class="lab-btn-row" role="tablist" aria-label="Learning type">
          <button type="button" class="lab-btn" role="tab" [class.is-active]="tab() === 'supervised'" (click)="tab.set('supervised')">Supervised</button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="tab() === 'unsupervised'" (click)="tab.set('unsupervised')">Unsupervised</button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="tab() === 'reinforcement'" (click)="tab.set('reinforcement')">Reinforcement</button>
        </div>

        @if (tab() === 'supervised') {
          <div class="lab-panel">
            <p class="lab-note">You already have examples where the right answer is known — the algorithm learns to reproduce that mapping.</p>

            <div class="flow-row mono">
              <div class="flow-node">DATA + LABELS</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">LEARNING</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">MODEL</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">PREDICTION</div>
            </div>

            <div class="lab-code">
              House → <span class="tok-status-ok">₹80L</span>{{ '\\n' }}House → <span class="tok-status-ok">₹65L</span>{{ '\\n' }}House → <span class="tok-status-ok">₹1.2Cr</span>
            </div>

            <button type="button" class="lab-btn" (click)="revealed.set(!revealed())">
              {{ revealed() ? 'Hide answer' : 'What is the model learning?' }}
            </button>
            @if (revealed()) {
              <p class="lab-note">The pattern between features and known targets — given a house's features, what price (the label) tends to go with them.</p>
            }

            <div class="sub-card-row">
              <div class="sub-card">
                <p class="sub-card-title mono">REGRESSION</p>
                <p class="sub-card-text">Predict a number, e.g. price.</p>
              </div>
              <div class="sub-card">
                <p class="sub-card-title mono">CLASSIFICATION</p>
                <p class="sub-card-text">Predict a category, e.g. spam or not spam.</p>
              </div>
            </div>
          </div>
        }

        @if (tab() === 'unsupervised') {
          <div class="lab-panel">
            <p class="lab-note">There are no labels here at all — nobody tells the algorithm which points "belong together" or what's normal. It searches for structure in data that has no labels.</p>

            <svg class="unsup-scatter" viewBox="0 0 320 220" role="img" aria-label="Unlabeled scatter of data points with no drawn boundary">
              @for (d of dots; track $index) {
                <circle [attr.cx]="d.x" [attr.cy]="d.y" r="5" class="unsup-dot"></circle>
              }
            </svg>
            <p class="unsup-caption">No boundary is drawn — we're only showing you the raw, unlabeled points. Any grouping you might already be seeing in your head is exactly the kind of structure these techniques try to find automatically.</p>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn" [class.is-active]="chip() === 'clustering'" (click)="toggleChip('clustering')">Clustering</button>
              <button type="button" class="lab-btn" [class.is-active]="chip() === 'dimensionality'" (click)="toggleChip('dimensionality')">Dimensionality reduction</button>
              <button type="button" class="lab-btn" [class.is-active]="chip() === 'anomaly'" (click)="toggleChip('anomaly')">Anomaly detection</button>
            </div>
            @if (chip() === 'clustering') {
              <p class="lab-note">Clustering: group points that are similar to each other, without ever being told what the groups should be called.</p>
            }
            @if (chip() === 'dimensionality') {
              <p class="lab-note">Dimensionality reduction: compress many features down to a few, while keeping as much of the original structure as possible.</p>
            }
            @if (chip() === 'anomaly') {
              <p class="lab-note">Anomaly detection: flag points that don't fit the pattern the rest of the data follows.</p>
            }
          </div>
        }

        @if (tab() === 'reinforcement') {
          <div class="lab-panel">
            <p class="lab-note">Here there's no dataset of correct answers at all — an agent takes actions in an environment and only learns from the reward that comes back.</p>

            <div class="flow-row mono flow-row-cycle">
              <div class="flow-node">AGENT</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">ACTION</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">ENVIRONMENT</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">REWARD</div>
              <div class="lab-flow-arrow">→</div>
              <div class="flow-node">LEARNING</div>
            </div>

            <p class="lab-note">This is intuition only, not a real RL algorithm — just Manhattan distance and a random valid move.</p>

            <div class="rl-grid" [style.grid-template-columns]="'repeat(' + gridSize + ', 1fr)'">
              @for (row of gridRows; track row) {
                @for (col of gridCols; track col) {
                  <div class="rl-cell"
                       [class.is-agent]="agent().r === row && agent().c === col"
                       [class.is-target]="target.r === row && target.c === col">
                    @if (agent().r === row && agent().c === col) {
                      <span class="rl-marker">●</span>
                    } @else if (target.r === row && target.c === col) {
                      <span class="rl-marker rl-marker-target">🎯</span>
                    }
                  </div>
                }
              }
            </div>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="takeStep()">Take a step</button>
              <button type="button" class="lab-btn" (click)="resetGame()">Reset</button>
            </div>

            <p class="rl-total mono">Total reward: <span [class.rl-total-good]="totalReward() > 0" [class.rl-total-bad]="totalReward() < 0">{{ totalReward() }}</span></p>

            @if (winMessage()) {
              <p class="lab-note rl-win">{{ winMessage() }}</p>
            }

            @if (log().length) {
              <div class="lab-code rl-log">
                @for (entry of log(); track $index) { <div>{{ entry }}</div> }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .flow-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 24px; }
    .flow-node {
      padding: 10px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--text);
    }
    .flow-row-cycle .flow-node:first-child { border-color: var(--accent-dim); color: var(--accent-strong); }

    .lab-code { margin-top: 20px; }

    .sub-card-row { display: grid; gap: 14px; grid-template-columns: 1fr; margin-top: 22px; }
    @media (min-width: 560px) { .sub-card-row { grid-template-columns: 1fr 1fr; } }
    .sub-card { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px 18px; background: var(--surface); }
    .sub-card-title { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 8px; }
    .sub-card-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .unsup-scatter { width: 100%; max-width: 340px; height: auto; margin-top: 22px; display: block; }
    .unsup-dot { fill: var(--accent-2); opacity: 0.9; }
    .unsup-caption { margin-top: 12px; max-width: 560px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .rl-grid {
      display: grid;
      gap: 4px;
      max-width: 280px;
      margin-top: 22px;
      aspect-ratio: 1;
    }
    .rl-cell {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
    }
    .rl-cell.is-target { border-color: var(--accent-2-dim); }
    .rl-marker { font-size: 1.1rem; color: var(--accent-strong); text-shadow: 0 0 8px var(--glow-accent); }
    .rl-marker-target { font-size: 1rem; text-shadow: none; }
    .rl-total { margin-top: 18px; font-size: 0.9375rem; color: var(--text); }
    .rl-total-good { color: var(--accent-2); }
    .rl-total-bad { color: var(--danger); }
    .rl-win { color: var(--accent-strong); }
    .rl-log { margin-top: 14px; max-height: 140px; overflow-y: auto; }
  `,
})
export class MlTypesMap implements OnDestroy {
  tab = signal<Tab>('supervised');
  revealed = signal(false);
  chip = signal<UnsupervisedChip | null>(null);
  dots = UNSUP_DOTS;

  gridSize = GRID_SIZE;
  gridRows = Array.from({ length: GRID_SIZE }, (_, i) => i);
  gridCols = Array.from({ length: GRID_SIZE }, (_, i) => i);
  target = TARGET;

  agent = signal<Cell>({ ...START });
  totalReward = signal<number>(0);
  log = signal<string[]>([]);
  winMessage = signal<string>('');
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
    }
  }

  toggleChip(c: UnsupervisedChip): void {
    this.chip.set(this.chip() === c ? null : c);
  }

  takeStep(): void {
    const current = this.agent();
    if (manhattan(current, this.target) === 0) {
      this.resetGame();
      return;
    }

    const candidates: Cell[] = [
      { r: current.r - 1, c: current.c },
      { r: current.r + 1, c: current.c },
      { r: current.r, c: current.c - 1 },
      { r: current.r, c: current.c + 1 },
    ].filter((cell) => cell.r >= 0 && cell.r < GRID_SIZE && cell.c >= 0 && cell.c < GRID_SIZE);

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    const beforeDist = manhattan(current, this.target);
    const afterDist = manhattan(next, this.target);
    const reward = afterDist < beforeDist ? 1 : afterDist > beforeDist ? -1 : 0;

    this.agent.set(next);
    this.totalReward.set(this.totalReward() + reward);

    const entry = `step ${this.log().length + 1}: (${current.r},${current.c}) → (${next.r},${next.c}) · reward ${reward > 0 ? '+1' : reward}`;
    this.log.set([...this.log(), entry].slice(-5));

    if (afterDist === 0) {
      this.totalReward.set(this.totalReward() + 10);
      this.winMessage.set('Reached the target! +10 bonus. Resetting the agent for another run.');
      this.resetTimer = setTimeout(() => {
        this.agent.set({ ...START });
        this.winMessage.set('');
        this.resetTimer = null;
      }, 1400);
    }
  }

  resetGame(): void {
    this.agent.set({ ...START });
    this.totalReward.set(0);
    this.log.set([]);
    this.winMessage.set('');
  }
}
