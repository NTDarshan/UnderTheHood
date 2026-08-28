import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

const TAKEAWAYS = [
  'Applications have their own in-memory representations.',
  'Objects need a transferable representation when crossing boundaries.',
  'Serialization converts application data into that representation.',
  'Deserialization reconstructs usable application-level data.',
  'JSON is a common text-based representation for HTTP APIs.',
  'Binary formats can be useful when efficiency and compactness matter.',
  'Valid serialized data is not automatically valid application data.',
  'Serialization is one part of a larger request/response pipeline.',
];

@Component({
  selector: 'app-serialization-summary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 23 — FINAL MENTAL MODEL</p>
        <h2 class="lab-title">A common language between applications.</h2>

        <div class="model-columns">
          <div class="model-col mono">
            <p class="model-heading">REQUEST</p>
            <div class="model-node">APPLICATION A</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Native Object</div>
            <div class="model-arrow">↓</div>
            <div class="model-node accent">SERIALIZATION</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">JSON / Binary</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">HTTP Request</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Network</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">HTTP Server</div>
            <div class="model-arrow">↓</div>
            <div class="model-node accent">DESERIALIZATION</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Native Data</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Validation</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Business Logic</div>
          </div>

          <div class="model-col mono">
            <p class="model-heading">RESPONSE</p>
            <div class="model-node">SERVER</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Native Object</div>
            <div class="model-arrow">↓</div>
            <div class="model-node accent">SERIALIZATION</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">JSON</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">Response</div>
            <div class="model-arrow">↓</div>
            <div class="model-node">CLIENT</div>
            <div class="model-arrow">↓</div>
            <div class="model-node accent">DESERIALIZATION</div>
          </div>
        </div>

        <p class="final-line">Serialization creates a common language between applications.</p>

        <div class="takeaways">
          @for (t of takeaways; track t; let i = $index) {
            <div class="takeaway-item">
              <span class="takeaway-index mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <p class="takeaway-text">{{ t }}</p>
            </div>
          }
        </div>

        <div class="chapter-footer">
          <div class="chapter-progress">
            <p class="chapter-label mono">Serialization · Chapter 7</p>
            <div class="progress-track" aria-hidden="true"><div class="progress-fill"></div></div>
          </div>
          <div class="chapter-nav">
            <a class="lab-btn" routerLink="/explore/routing">← Previous: Routing</a>
            <a class="lab-btn" routerLink="/explore/auth">Next: Authentication →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section next-concept">
      <div class="container next-concept-inner">
        <a class="prev-link mono" routerLink="/explore/routing">← Previous concept</a>
        <a class="btn btn-ghost" routerLink="/" fragment="roadmap">Roadmap</a>
        <a class="next-link mono" routerLink="/explore/auth">Next concept →</a>
      </div>
    </section>
  `,
  styles: `
    .model-columns {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }

    @media (min-width: 800px) {
      .model-columns {
        grid-template-columns: 1fr 1fr;
      }
    }

    .model-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
    }

    .model-heading {
      font-size: 0.6875rem;
      color: var(--text-faint);
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .model-node {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .model-node.accent {
      border-color: var(--accent-dim);
      color: var(--accent);
      box-shadow: 0 0 16px var(--glow-accent);
    }

    .model-arrow {
      color: var(--border-strong);
    }

    .final-line {
      margin-top: 48px;
      text-align: center;
      font-size: 1.25rem;
      color: var(--text);
      max-width: 560px;
      margin-inline: auto;
      line-height: 1.6;
    }

    .takeaways {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
      max-width: 640px;
      margin-inline: auto;
    }

    @media (min-width: 700px) {
      .takeaways {
        grid-template-columns: 1fr 1fr;
      }
    }

    .takeaway-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .takeaway-index {
      color: var(--accent-2);
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .takeaway-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
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
      width: 70%;
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
export class SerializationSummary {
  protected readonly takeaways = TAKEAWAYS;
}
