import { Component } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

@Component({
  selector: 'app-data-type-dilemma',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="lab-section" id="why-serialization">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 01 — WHY DO WE NEED IT?</p>
        <h2 class="lab-title">Two applications can't just hand each other an object.</h2>
        <p class="lab-lede">
          It sounds obvious once stated, but it's the reason this entire chapter exists: a running
          program's <app-term def="How a value actually sits in RAM while a program is running — pointers, offsets, and layout decided by that program's runtime.">memory representation</app-term>
          is local to that program. Nothing outside it can simply reach in and read it.
        </p>

        <app-explain-simply>
          Imagine trying to hand someone your thoughts directly, mid-conversation. You can't — you convert
          them into words first. The listener then reconstructs meaning from those words in their own head.
          Applications do the same thing with data.
        </app-explain-simply>
      </div>
    </section>

    <section class="lab-section" id="data-dilemma">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 02 — THE DATA TYPE DILEMMA</p>
        <h2 class="lab-title">The client and server may not agree on anything.</h2>
        <p class="lab-lede">
          They might run different languages, different type systems, different operating systems, even
          different hardware architectures. All that's guaranteed to be shared is whatever they explicitly
          agree to send over the wire.
        </p>

        <div class="dilemma-grid">
          <div class="dilemma-card">
            <p class="dilemma-label mono">CLIENT APPLICATION</p>
            <p class="dilemma-detail">Dynamically typed environment, e.g. a JavaScript-like runtime</p>
            <pre class="dilemma-code mono">User
  name  = "Alice"
  age   = 30
  active = true</pre>
          </div>

          <div class="dilemma-vs mono">≠</div>

          <div class="dilemma-card">
            <p class="dilemma-label mono">SERVER APPLICATION</p>
            <p class="dilemma-detail">Strongly typed environment, e.g. a compiled backend runtime</p>
            <pre class="dilemma-code mono">class User {{ '{' }}
  string name;
  int age;
  bool active;
{{ '}' }}</pre>
          </div>
        </div>

        <p class="lab-note">
          <strong>Memory representation is local to a program.</strong> Neither side can read the other's raw
          object — so instead, both sides agree on a shared, transferable representation: a
          <em>common representation</em> that any language can produce and any language can parse.
        </p>
      </div>
    </section>
  `,
  styles: `
    .dilemma-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      align-items: center;
    }

    @media (max-width: 700px) {
      .dilemma-grid {
        grid-template-columns: 1fr;
      }

      .dilemma-vs {
        justify-self: center;
        transform: rotate(90deg);
      }
    }

    .dilemma-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
    }

    .dilemma-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 8px;
    }

    .dilemma-detail {
      font-size: 0.8125rem;
      color: var(--text-faint);
      margin-bottom: 14px;
    }

    .dilemma-code {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .dilemma-vs {
      font-size: 1.5rem;
      color: var(--danger);
      text-align: center;
    }
  `,
})
export class DataTypeDilemma {}
