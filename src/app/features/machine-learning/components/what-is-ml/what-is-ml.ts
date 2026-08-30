import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Paradigm = 'traditional' | 'machine-learning';

@Component({
  selector: 'app-what-is-ml',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="what-is-ml">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 001 — WHAT IS THIS, REALLY?</p>
        <h2 class="lab-title">A human does this every day without calling it "machine learning."</h2>
        <p class="lab-lede">
          Before any algorithm is involved, look at how a person already estimates something from experience.
        </p>

        <app-explain-simply>
          You've walked past enough houses to guess a rough price just from size, bedrooms and neighborhood —
          nobody handed you a formula, you just absorbed the pattern from examples you've seen.
        </app-explain-simply>

        <div class="lab-panel">
          <p class="flow-caption mono">A HUMAN ESTIMATING A HOUSE PRICE</p>
          <div class="flow-diagram human-flow">
            <div class="flow-inputs">
              <div class="flow-node">House size</div>
              <div class="flow-node">Bedrooms</div>
              <div class="flow-node">Location</div>
            </div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node flow-node-highlight">HUMAN</div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node flow-node-result">PRICE ESTIMATE</div>
          </div>
        </div>

        <div class="lab-panel">
          <p class="flow-caption mono">A MACHINE LEARNING SYSTEM DOING SOMETHING SIMILAR</p>
          <div class="flow-diagram ml-flow">
            <div class="flow-node">DATA</div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node flow-node-highlight">MACHINE LEARNING ALGORITHM</div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node">MODEL</div>
            <div class="lab-flow-arrow">→</div>
            <div class="flow-node flow-node-result">PREDICTION</div>
          </div>
          <p class="lab-note">
            Notice the extra step: an algorithm doesn't estimate directly — it produces a
            <strong>model</strong>, and the model is what makes the prediction.
          </p>
        </div>

        <h3 class="compare-heading">Now the part that actually matters: what changed?</h3>
        <p class="compare-lede">
          Same inputs, same kind of output. Toggle between the two paradigms and watch which box takes over
          the job of "deciding how to turn inputs into an output."
        </p>

        <div class="lab-btn-row" role="tablist" aria-label="Paradigm">
          <button type="button" class="lab-btn" role="tab" [class.is-active]="paradigm() === 'traditional'" (click)="paradigm.set('traditional')">
            Traditional Programming
          </button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="paradigm() === 'machine-learning'" (click)="paradigm.set('machine-learning')">
            Machine Learning
          </button>
        </div>

        <div class="lab-panel compare-panel">
          @if (paradigm() === 'traditional') {
            <div class="compare-flow">
              <div class="flow-diagram">
                <div class="flow-inputs">
                  <div class="flow-node flow-node-role">RULES</div>
                  <div class="flow-node flow-node-role">DATA</div>
                </div>
                <div class="lab-flow-arrow">→</div>
                <div class="flow-node flow-node-highlight">PROGRAM</div>
                <div class="lab-flow-arrow">→</div>
                <div class="flow-node flow-node-result">OUTPUT</div>
              </div>
              <p class="lab-note">
                You write the rules by hand. The program is just those rules, executed against whatever data
                comes in. If the rules are wrong or incomplete, the output is wrong — there's no adapting.
              </p>
            </div>
          } @else {
            <div class="compare-flow">
              <div class="flow-diagram">
                <div class="flow-inputs">
                  <div class="flow-node flow-node-role">DATA</div>
                  <div class="flow-node flow-node-role">ANSWERS</div>
                </div>
                <div class="lab-flow-arrow">→</div>
                <div class="flow-node flow-node-highlight">LEARNING ALGORITHM</div>
                <div class="lab-flow-arrow">→</div>
                <div class="flow-node flow-node-result">MODEL</div>
              </div>
              <div class="flow-diagram second-flow">
                <div class="flow-inputs">
                  <div class="flow-node flow-node-role">MODEL</div>
                  <div class="flow-node flow-node-role">NEW DATA</div>
                </div>
                <div class="lab-flow-arrow">→</div>
                <div class="flow-node flow-node-result">PREDICTION</div>
              </div>
              <p class="lab-note">
                Instead of rules, you supply <strong>data plus known answers</strong>. The learning algorithm's
                job is to figure out the pattern connecting them and package it as a model. From then on, the
                model — not a human-written rule set — turns new data into a prediction.
              </p>
            </div>
          }
        </div>

        <p class="lab-note">
          Same box, different occupant: in traditional programming, <strong>you</strong> supply the logic. In
          machine learning, the logic is <strong>discovered</strong> from examples — the algorithm's whole job
          is to find it.
        </p>
      </div>
    </section>
  `,
  styles: `
    .flow-caption { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 16px; }

    .flow-diagram { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
    .flow-inputs { display: flex; flex-direction: column; gap: 8px; }

    .flow-node {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-align: center;
      color: var(--text-muted);
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 12px 16px;
    }

    .flow-node-highlight { color: var(--accent); border-color: var(--accent-dim); box-shadow: 0 0 16px var(--glow-accent); }
    .flow-node-result { color: var(--accent-2); border-color: var(--accent-2-dim); }
    .flow-node-role { color: var(--text); }

    .compare-heading { margin-top: 48px; font-size: 1.375rem; color: var(--text); max-width: 700px; }
    .compare-lede { margin-top: 10px; max-width: 620px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }

    .compare-panel { margin-top: 24px; }
    .compare-flow { display: flex; flex-direction: column; gap: 20px; }
    .second-flow { padding-top: 16px; border-top: 1px dashed var(--border); }

    @media (min-width: 640px) {
      .flow-diagram.ml-flow, .flow-diagram.human-flow { flex-wrap: nowrap; }
    }
  `,
})
export class WhatIsMl {
  protected readonly paradigm = signal<Paradigm>('traditional');
}
