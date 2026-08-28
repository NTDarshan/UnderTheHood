import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-routing-summary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">ROUTING / 18 — FINAL MENTAL MODEL</p>
        <h2 class="lab-title">The bridge between a request and the code that handles it.</h2>

        <div class="model-diagram mono">
          <div class="model-node root">REQUEST</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">HTTP METHOD<br /><span class="model-sub">"WHAT?"</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node">ROUTE<br /><span class="model-sub">"WHERE?"</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node">MATCHING</div>
          <div class="model-branches">
            <div class="model-node small">PATH PARAMS</div>
            <div class="model-node small">QUERY PARAMS</div>
            <div class="model-node small">CONSTRAINTS</div>
          </div>
          <div class="model-arrow">↓</div>
          <div class="model-node">ROUTE ORDER</div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent">SELECT HANDLER</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">RESPONSE</div>
        </div>

        <p class="final-line">
          Routing is the bridge between an incoming request and the code responsible for handling it.
        </p>

        <div class="chapter-footer">
          <div class="chapter-progress">
            <p class="chapter-label mono">Routing · Chapter 6</p>
            <div class="progress-track" aria-hidden="true">
              <div class="progress-fill"></div>
            </div>
          </div>
          <div class="chapter-nav">
            <a class="lab-btn" routerLink="/explore/http">← Previous: HTTP</a>
            <a class="lab-btn" routerLink="/" fragment="roadmap">Next: Serialization →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section next-concept">
      <div class="container next-concept-inner">
        <a class="prev-link mono" routerLink="/explore/http">← Previous concept</a>
        <a class="btn btn-ghost" routerLink="/" fragment="roadmap">Roadmap</a>
        <span class="next-link mono is-disabled" aria-disabled="true">Next concept →</span>
      </div>
    </section>
  `,
  styles: `
    .model-diagram {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
    }

    .model-node {
      padding: 12px 22px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .model-node.root {
      border-color: var(--accent-2-dim);
      color: var(--accent-2);
    }

    .model-node.accent {
      border-color: var(--accent-dim);
      color: var(--accent);
      box-shadow: 0 0 18px var(--glow-accent);
    }

    .model-node.small {
      font-size: 0.6875rem;
      padding: 8px 14px;
    }

    .model-sub {
      font-size: 0.625rem;
      color: var(--text-faint);
      font-weight: 400;
    }

    .model-arrow {
      color: var(--border-strong);
    }

    .model-branches {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .final-line {
      margin-top: 40px;
      text-align: center;
      font-size: 1.25rem;
      color: var(--text);
      max-width: 560px;
      margin-inline: auto;
      line-height: 1.6;
    }

    .chapter-footer {
      margin-top: 48px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .chapter-label {
      font-size: 0.75rem;
      color: var(--text-faint);
      margin-bottom: 8px;
    }

    .progress-track {
      width: 200px;
      height: 6px;
      border-radius: 999px;
      background: var(--surface-elevated);
      overflow: hidden;
    }

    .progress-fill {
      width: 55%;
      height: 100%;
      background: linear-gradient(90deg, var(--accent-2), var(--accent));
    }

    .chapter-nav {
      display: flex;
      gap: 10px;
    }

    .next-concept-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .prev-link,
    .next-link {
      color: var(--text-faint);
      font-size: 0.8125rem;
    }

    .next-link.is-disabled {
      opacity: 0.4;
    }
  `,
})
export class RoutingSummary {}
