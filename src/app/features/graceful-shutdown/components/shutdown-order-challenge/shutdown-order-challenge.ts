import { Component, computed, signal } from '@angular/core';

interface Stage {
  id: string;
  label: string;
  whyWrongEarly: string;
}

const CORRECT_ORDER: Stage[] = [
  {
    id: 'stop-traffic',
    label: 'STOP NEW TRAFFIC',
    whyWrongEarly:
      'This has to come first. If it happens late, new requests keep arriving after other stages have already started tearing things down.',
  },
  {
    id: 'stop-background',
    label: 'STOP NEW BACKGROUND WORK',
    whyWrongEarly:
      'New background jobs can keep getting scheduled onto workers that are already shutting down, which is how work gets lost or duplicated.',
  },
  {
    id: 'drain-requests',
    label: 'DRAIN ACTIVE REQUESTS',
    whyWrongEarly:
      'Doing this too late — after resources are closed — means in-flight requests fail mid-way instead of finishing cleanly.',
  },
  {
    id: 'handle-workers',
    label: 'HANDLE WORKERS / CONSUMERS',
    whyWrongEarly:
      'Workers and queue consumers need to stop pulling new messages before the app tries to finish or requeue what they already have.',
  },
  {
    id: 'finish-safe-work',
    label: 'FINISH / CANCEL / REQUEUE SAFE WORK',
    whyWrongEarly:
      'This depends on requests and workers already being drained — do it too early and there is nothing stable yet to finish, cancel, or requeue.',
  },
  {
    id: 'flush-telemetry',
    label: 'FLUSH IMPORTANT TELEMETRY',
    whyWrongEarly:
      'Telemetry should reflect the whole shutdown, so it needs to flush after the real work is done — otherwise you lose visibility into what happened during drain.',
  },
  {
    id: 'close-resources',
    label: 'CLOSE RESOURCES',
    whyWrongEarly:
      'Closing database connections, sockets, and file handles before requests are drained kills in-flight work outright instead of letting it finish.',
  },
  {
    id: 'exit',
    label: 'EXIT',
    whyWrongEarly:
      'Exiting before telemetry is flushed and resources are closed loses your last chance to see what happened and can leave resources in a bad state.',
  },
];

function shuffledStages(): Stage[] {
  const arr = [...CORRECT_ORDER];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Guard against an accidental correct shuffle so the challenge always starts unsolved.
  const isCorrect = arr.every((s, i) => s.id === CORRECT_ORDER[i].id);
  if (isCorrect) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

@Component({
  selector: 'app-shutdown-order-challenge',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-order-challenge">
      <div class="container">
        <p class="lab-index">22 — SHUTDOWN ORDER CHALLENGE</p>
        <h2 class="lab-title">Put the shutdown sequence back in order.</h2>
        <p class="lab-lede">
          These eight stages are shuffled. Use the arrows to reorder them into the sequence a graceful shutdown
          should actually follow, then check your answer — each stage that's out of place explains exactly what
          breaks.
        </p>

        <div class="gs-scene order-scene lab-panel">
          <ol class="stage-list">
            @for (s of stages(); track s.id; let i = $index) {
              <li class="stage-item" [class]="feedbackClass(s.id)">
                <span class="stage-pos mono">{{ i + 1 }}</span>
                <span class="stage-label">{{ s.label }}</span>
                @if (checked()) {
                  <span class="stage-mark" aria-hidden="true">{{ isCorrectPosition(s.id, i) ? '✓' : '✕' }}</span>
                }
                <span class="stage-controls">
                  <button
                    type="button"
                    class="lab-btn move-btn"
                    (click)="move(i, -1)"
                    [disabled]="i === 0"
                    [attr.aria-label]="'Move ' + s.label + ' up'"
                  >▲</button>
                  <button
                    type="button"
                    class="lab-btn move-btn"
                    (click)="move(i, 1)"
                    [disabled]="i === stages().length - 1"
                    [attr.aria-label]="'Move ' + s.label + ' down'"
                  >▼</button>
                </span>
              </li>
            }
          </ol>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="check()">Check order</button>
            <button type="button" class="lab-btn" (click)="shuffle()">Shuffle again</button>
          </div>

          @if (checked()) {
            <div class="result-band" [class.result-good]="allCorrect()">
              @if (allCorrect()) {
                <p class="result-title mono">✓ CORRECT — this is the sequence a graceful shutdown follows.</p>
              } @else {
                <p class="result-title mono">{{ correctCount() }} / {{ stages().length }} in the right position</p>
                <ul class="explain-list">
                  @for (item of wrongExplanations(); track item.id) {
                    <li><strong>{{ item.label }}</strong> — {{ item.whyWrongEarly }}</li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <p class="lab-note">
          The pattern underneath the exact wording: stop accepting <em>new</em> work (traffic, jobs) before doing
          anything to <em>existing</em> work, finish or safely hand off existing work before touching shared
          resources, and only exit once everything — including your own visibility into the shutdown — is flushed.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .order-scene { display: flex; flex-direction: column; gap: 20px; }

    .stage-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .stage-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .stage-pos {
      font-size: 0.75rem;
      color: var(--text-faint);
      min-width: 18px;
    }

    .stage-label {
      flex: 1;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text);
      letter-spacing: 0.02em;
    }

    .stage-mark { font-size: 0.9rem; font-weight: 700; }

    .stage-item.is-correct { border-color: var(--running); }
    .stage-item.is-correct .stage-mark { color: var(--running); }

    .stage-item.is-wrong { border-color: var(--cancelled); }
    .stage-item.is-wrong .stage-mark { color: var(--cancelled); }

    .stage-controls { display: flex; gap: 4px; }
    .move-btn {
      padding: 4px 9px;
      font-size: 0.7rem;
      line-height: 1;
    }

    .result-band {
      padding: 14px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--cancelled);
      background: color-mix(in srgb, var(--cancelled) 8%, var(--surface));
    }
    .result-band.result-good {
      border-color: var(--running);
      background: color-mix(in srgb, var(--running) 10%, var(--surface));
    }

    .result-title { font-size: 0.8125rem; margin: 0 0 4px; color: var(--text); }
    .result-good .result-title { color: var(--running); }

    .explain-list {
      margin: 10px 0 0;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .explain-list li { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class ShutdownOrderChallenge {
  protected readonly stages = signal<Stage[]>(shuffledStages());
  protected readonly checked = signal(false);

  protected readonly correctCount = computed(
    () => this.stages().filter((s, i) => s.id === CORRECT_ORDER[i].id).length
  );

  protected readonly allCorrect = computed(() => this.correctCount() === CORRECT_ORDER.length);

  protected readonly wrongExplanations = computed(() =>
    this.stages().filter((s, i) => s.id !== CORRECT_ORDER[i].id)
  );

  protected isCorrectPosition(id: string, index: number): boolean {
    return CORRECT_ORDER[index]?.id === id;
  }

  protected feedbackClass(id: string): string {
    if (!this.checked()) return '';
    const index = this.stages().findIndex((s) => s.id === id);
    return this.isCorrectPosition(id, index) ? 'is-correct' : 'is-wrong';
  }

  protected move(index: number, dir: -1 | 1): void {
    const list = [...this.stages()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.stages.set(list);
    this.checked.set(false);
  }

  protected check(): void {
    this.checked.set(true);
  }

  protected shuffle(): void {
    this.stages.set(shuffledStages());
    this.checked.set(false);
  }
}
