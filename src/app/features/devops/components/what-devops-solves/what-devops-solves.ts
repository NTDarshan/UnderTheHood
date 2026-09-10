import { Component, signal } from '@angular/core';

const QUESTIONS: string[] = [
  'How does it get tested?',
  'How does it reach the cloud?',
  'How do we reproduce the environment?',
  'How do we deploy without downtime?',
  'How do we know production is healthy?',
  'How do we recover when something breaks?',
];

interface FlowStep {
  label: string;
  sub: string;
}

const WITHOUT_FLOW: FlowStep[] = [
  { label: 'Code', sub: 'written on a laptop' },
  { label: 'Manual steps', sub: 'SSH in, copy files, restart' },
  { label: 'Server', sub: 'configured by memory' },
  { label: 'Hope', sub: 'it works the same as last time' },
];

const WITH_FLOW: FlowStep[] = [
  { label: 'Code', sub: 'written on a laptop' },
  { label: 'Automated pipeline', sub: 'build, test, package' },
  { label: 'Repeatable environment', sub: 'same image everywhere' },
  { label: 'Controlled deployment', sub: 'rollout with a rollback plan' },
  { label: 'Observability', sub: 'you know it is healthy' },
];

@Component({
  selector: 'app-what-devops-solves',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-what-devops-solves">
      <div class="container">
        <p class="lab-index mono">01 — THE PROBLEM BEFORE THE TOOLS</p>
        <h2 class="lab-title">"I wrote the feature." is not the same as "it's running for users."</h2>
        <p class="lab-lede">
          Before naming a single tool, it helps to feel the gap a backend engineer stares at right after the last
          line of application code is written.
        </p>

        <div class="lab-panel">
          <div class="dev-line">
            <span class="pill pill-conditional mono">DEVELOPER</span>
            <p class="dev-quote mono">"I wrote the feature."</p>
          </div>

          @if (!revealed()) {
            <button type="button" class="lab-btn lab-btn-primary reveal-btn" (click)="reveal()">
              What happens next?
            </button>
          } @else {
            <ul class="question-stack">
              @for (q of questions; track q; let i = $index) {
                <li class="question-item" [style.animation-delay.ms]="i * 110">
                  <span class="q-index mono">{{ i + 1 }}</span>
                  <span class="q-text">{{ q }}</span>
                </li>
              }
            </ul>
            <p class="lab-note">
              None of these are answered by writing better application code. They are answered by
              <strong>DevOps</strong> — the practices, automation, and infrastructure that carry code the rest of the
              way to a healthy, observable production system.
            </p>
          }
        </div>

        <div class="lab-panel compare-panel">
          <h3 class="panel-heading">Same feature, two different journeys</h3>
          <div class="compare-toggle">
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="mode() === 'without'"
              (click)="mode.set('without')"
            >
              WITHOUT DEVOPS
            </button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'with'" (click)="mode.set('with')">
              WITH DEVOPS
            </button>
          </div>

          <div class="compare-flow" [class.is-broken]="mode() === 'without'">
            @for (step of currentFlow(); track step.label; let i = $index) {
              <div class="flow-step">
                <div class="flow-node">
                  <span class="flow-label mono">{{ step.label }}</span>
                  <span class="flow-sub mono">{{ step.sub }}</span>
                </div>
                @if (i < currentFlow().length - 1) {
                  <span class="flow-arrow" aria-hidden="true">&rarr;</span>
                }
              </div>
            }
          </div>

          <p class="outcome-line mono" [class.is-bad]="mode() === 'without'">
            {{ mode() === 'without' ? 'OUTCOME: unpredictable, undocumented, person-dependent' : 'OUTCOME: repeatable, automated, recoverable' }}
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #fbbf24;
    }

    .panel-heading { margin: 0 0 20px; font-size: 1.0625rem; color: var(--text); }

    .dev-line { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .dev-quote { font-size: 1.125rem; color: var(--text); }

    .reveal-btn { margin-top: 24px; }

    .question-stack {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      list-style: none;
      padding: 0;
    }
    .question-item {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding: 12px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 2px solid var(--do-warning);
      border-radius: var(--radius-sm);
      animation: question-in 0.4s ease backwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .question-item { animation: none; }
    }
    @keyframes question-in {
      from { opacity: 0; transform: translateX(-8px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .q-index { color: var(--do-warning); font-size: 0.75rem; }
    .q-text { color: var(--text-muted); font-size: 0.9375rem; }

    .compare-panel { margin-top: 24px; }
    .compare-toggle { display: flex; gap: 10px; }

    .compare-flow {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .flow-step { display: flex; align-items: center; gap: 8px; }
    .flow-node {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 16px;
      min-width: 130px;
      background: var(--surface);
      border: 1px solid var(--do-success);
      border-radius: var(--radius-sm);
      transition: border-color 0.3s ease;
    }
    .compare-flow.is-broken .flow-node { border-color: var(--do-danger); }
    .flow-label { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .flow-sub { font-size: 0.6875rem; color: var(--text-faint); }
    .flow-arrow { color: var(--do-success); font-size: 1rem; }
    .compare-flow.is-broken .flow-arrow { color: var(--do-danger); }

    .outcome-line {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--do-success);
      letter-spacing: 0.04em;
    }
    .outcome-line.is-bad { color: var(--do-danger); }
  `,
})
export class WhatDevopsSolves {
  protected readonly questions = QUESTIONS;
  protected readonly revealed = signal(false);
  protected readonly mode = signal<'without' | 'with'>('without');

  protected readonly currentFlow = () => (this.mode() === 'without' ? WITHOUT_FLOW : WITH_FLOW);

  protected reveal(): void {
    this.revealed.set(true);
  }
}
