import { Component, signal } from '@angular/core';

type JobChoice = 'finish' | 'cancel' | 'requeue' | 'abandon';

interface ChoiceOption {
  key: JobChoice;
  label: string;
  summary: string;
  consequence: string;
  tone: 'ok' | 'warn' | 'risk';
}

const OPTIONS: ChoiceOption[] = [
  {
    key: 'finish',
    label: 'FINISH',
    summary: 'Let the in-flight job run to completion before exiting.',
    consequence:
      'Fine for short, bounded jobs — the worker finishes cleanly and nothing is lost. Risky for unbounded or ' +
      'long jobs: shutdown stalls waiting on work that might take minutes, and orchestrators tend to SIGKILL a ' +
      'process that overstays its grace period anyway.',
    tone: 'ok',
  },
  {
    key: 'cancel',
    label: 'CANCEL',
    summary: 'Signal the job to stop immediately, mid-work.',
    consequence:
      'Fast, predictable shutdown. But unless the job was explicitly designed to checkpoint or roll back partial ' +
      'progress, whatever it already did is lost or left half-applied.',
    tone: 'warn',
  },
  {
    key: 'requeue',
    label: 'REQUEUE',
    summary: 'Put the job back on the queue for another worker to pick up later.',
    consequence:
      'Safe when the job is durable and idempotent — re-running it causes no harm. Requires a durable queue that ' +
      'survives the shutdown, and a job that tolerates being started twice (partial side effects can otherwise ' +
      'double-apply).',
    tone: 'ok',
  },
  {
    key: 'abandon',
    label: 'ABANDON',
    summary: 'Drop the job where it stands and exit without any cleanup.',
    consequence:
      'The fastest option and the riskiest. Only acceptable for non-critical, cheaply retryable work — anything ' +
      'with side effects (charges, emails, writes) can end up duplicated, lost, or inconsistent.',
    tone: 'risk',
  },
];

@Component({
  selector: 'app-background-jobs-shutdown',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene bjs-scene" id="gs-background-jobs">
      <div class="container">
        <p class="lab-index">15 — BACKGROUND JOBS</p>
        <h2 class="lab-title">Shutdown doesn't only hit the API</h2>
        <p class="lab-lede">
          A backend is rarely just request/response. Background workers keep processing after the API layer has
          stopped accepting traffic — and shutdown has to decide what happens to whatever they're doing right now.
        </p>

        <div class="lab-panel">
          <div class="topology">
            <div class="topo-box" [attr.data-shutdown]="shutdownStarted()">
              <p class="topo-title mono">API SERVER</p>
              <p class="topo-sub">accepts requests</p>
            </div>
            <span class="lab-flow-arrow topo-arrow" aria-hidden="true">&harr;</span>
            <div class="topo-box worker-box" [attr.data-shutdown]="shutdownStarted()">
              <p class="topo-title mono">BACKGROUND WORKER</p>
              <ul class="worker-list">
                <li>Email processor</li>
                <li>Queue consumer</li>
                <li>Scheduled job</li>
              </ul>
            </div>
          </div>

          @if (!shutdownStarted()) {
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-danger" (click)="triggerShutdown()">
                Trigger shutdown
              </button>
            </div>
          } @else {
            <p class="question mono">A worker is mid-job. What should happen?</p>
            <div class="choice-grid" role="group" aria-label="Shutdown choice for the in-flight job">
              @for (opt of options; track opt.key) {
                <button
                  type="button"
                  class="choice-card"
                  [class.is-selected]="selected() === opt.key"
                  [attr.aria-pressed]="selected() === opt.key"
                  (click)="select(opt.key)"
                >
                  <span class="choice-label mono">{{ opt.label }}</span>
                  <span class="choice-summary">{{ opt.summary }}</span>
                </button>
              }
            </div>

            @if (currentOption(); as opt) {
              <div class="consequence-panel" [attr.data-tone]="opt.tone" aria-live="polite">
                <p class="consequence-title mono">{{ opt.label }} &mdash; what actually happens</p>
                <p class="consequence-body">{{ opt.consequence }}</p>
              </div>
            }
          }
        </div>

        @if (shutdownStarted()) {
          <p class="lab-note">
            There's no single universally correct choice here — it depends on the job's <strong>durability</strong>
            (can it survive being interrupted?), its <strong>idempotency</strong> (is it safe to run twice?), its
            <strong>transactional behavior</strong> (does partial work leave the system consistent?), and the
            business requirement behind it (is losing this job acceptable?).
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .bjs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .topology {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .topo-box {
      flex: 1 1 220px;
      padding: 18px;
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      transition: border-color 0.25s ease, opacity 0.25s ease;
    }
    .topo-box[data-shutdown='true'] { border-color: var(--stopped); opacity: 0.75; }
    .topo-title { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.05em; color: var(--text); margin-bottom: 6px; }
    .topo-sub { font-size: 0.75rem; color: var(--text-faint); }
    .topo-arrow { font-size: 1.1rem; color: var(--text-faint); }

    .worker-list {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .worker-list li {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      padding-left: 14px;
      position: relative;
    }
    .worker-list li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: var(--queue);
    }

    .question { margin-top: 22px; font-size: 0.9375rem; color: var(--text); }

    .choice-grid {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .choice-card {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      color: var(--text);
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .choice-card:hover { border-color: var(--accent); }
    .choice-card.is-selected {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, var(--surface));
    }
    .choice-label { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.05em; }
    .choice-summary { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }

    .consequence-panel {
      margin-top: 18px;
      padding: 16px 18px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 3px solid var(--idle);
      animation: consequenceIn 0.3s ease both;
    }
    @media (prefers-reduced-motion: reduce) {
      .consequence-panel { animation: none; }
    }
    @keyframes consequenceIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .consequence-panel[data-tone='ok'] { border-left-color: var(--running); }
    .consequence-panel[data-tone='warn'] { border-left-color: var(--draining); }
    .consequence-panel[data-tone='risk'] { border-left-color: var(--stopped); }

    .consequence-title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text); margin-bottom: 8px; }
    .consequence-body { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class BackgroundJobsShutdown {
  protected readonly options = OPTIONS;
  protected readonly shutdownStarted = signal(false);
  protected readonly selected = signal<JobChoice | null>(null);

  protected triggerShutdown(): void {
    this.shutdownStarted.set(true);
  }

  protected select(choice: JobChoice): void {
    this.selected.set(choice);
  }

  protected currentOption(): ChoiceOption | null {
    const choice = this.selected();
    if (!choice) return null;
    return this.options.find((o) => o.key === choice) ?? null;
  }
}
