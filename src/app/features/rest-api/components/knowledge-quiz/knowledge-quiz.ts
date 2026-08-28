import { Component, computed, signal } from '@angular/core';

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { q: 'REST is best described as which of these?', options: ['An architectural style built from constraints, not a specific format like JSON', 'A synonym for "an API that returns JSON"'], correctIndex: 0, explanation: 'JSON is just a common representation format — REST is the set of constraints (statelessness, resources, uniform interface) that shape the design.' },
  { q: 'What is the relationship between a resource and its representation?', options: ['A resource is the underlying concept; a representation is one serialized form of it at a point in time', 'They are the same thing, just different words'], correctIndex: 0, explanation: 'The same "book #42" resource could be represented as a JSON body, an XML document, or a summary — the resource itself does not change.' },
  { q: 'Why are collection URLs conventionally plural (e.g. /books)?', options: ['It is a strong convention that keeps naming predictable, though not a formal REST rule', 'REST formally requires plural nouns or the request is invalid'], correctIndex: 0, explanation: 'What actually matters is consistency across the API — plural is simply the common convention, not an enforced law.' },
  { q: 'Why should a URL avoid embedding a verb, like /getBooks?', options: ['The HTTP method already communicates the operation — the URL should just name the resource', 'Verbs are technically forbidden characters in a URL'], correctIndex: 0, explanation: 'GET /books already says "retrieve books" — repeating that as a verb in the path duplicates information the method already carries.' },
  { q: 'What is the core purpose of the GET method?', options: ['Retrieve a representation of a resource without changing server state', 'Create a new resource in a collection'], correctIndex: 0, explanation: 'GET is a read operation — it should be safe, meaning it causes no observable side effects.' },
  { q: 'What is the core purpose of the POST method?', options: ['Create a resource in a collection, or trigger processing that doesn\'t map to a single resource', 'Always and only replace an existing resource'], correctIndex: 0, explanation: 'POST is the most flexible method — commonly resource creation, but also custom actions like "cancel order".' },
  { q: 'What is the core purpose of PUT?', options: ['Replace the target resource entirely with the supplied representation', 'Apply a small partial change to one field'], correctIndex: 0, explanation: 'A PUT is meant to represent "this is the full new state" — fields left out are conventionally understood as removed.' },
  { q: 'What is the core purpose of PATCH?', options: ['Apply a partial modification to a resource', 'Delete a resource permanently'], correctIndex: 0, explanation: 'PATCH sends only the fields that should change, leaving the rest of the resource untouched.' },
  { q: 'What is the core purpose of DELETE?', options: ['Remove the target resource', 'Retrieve metadata about a resource without a body'], correctIndex: 0, explanation: 'DELETE expresses the intent "this resource should no longer exist."' },
  { q: 'What does it mean for an HTTP method to be "safe"?', options: ['Calling it produces no observable side effects on server state', 'It always requires authentication'], correctIndex: 0, explanation: 'Safety is about side effects, not security — GET and HEAD are safe because reading doesn\'t change anything.' },
  { q: 'Is POST idempotent?', options: ['Generally no — repeating it typically creates another new resource each time', 'Yes, always, by definition'], correctIndex: 0, explanation: 'Each POST /orders call usually creates order #N+1, so repeating the same request keeps changing the result.' },
  { q: 'Is PUT idempotent?', options: ['Yes — replacing a resource with the same representation repeatedly leaves it in the same final state', 'No — every PUT call always creates a brand-new resource'], correctIndex: 0, explanation: 'Sending the same full replacement twice results in the same end state both times.' },
  { q: 'Is PATCH inherently idempotent?', options: ['Not inherently — it depends on whether the operation sets an absolute value or applies a relative change', 'Yes, PATCH is always idempotent by definition'], correctIndex: 0, explanation: '{ price: 550 } is idempotent; { increment: 50 } is not — the method name alone doesn\'t decide this.' },
  { q: 'Is DELETE idempotent even though a second call may return 404 instead of 204?', options: ['Yes — idempotency is about the intended end state ("resource is gone"), not identical response bodies', 'No — different responses on repeat calls automatically disqualify it'], correctIndex: 0, explanation: 'The server state converges to the same outcome both times, even though the HTTP response differs.' },
  { q: 'What does 200 OK typically mean?', options: ['The request succeeded and the response carries a representation or result', 'A new resource was just created'], correctIndex: 0, explanation: '201 is reserved specifically for successful creation — 200 is the general "it worked" response.' },
  { q: 'What does 201 Created signal, and which method typically returns it?', options: ['A new resource was created — typically returned by a successful POST', 'The server accepted the request but hasn\'t started processing it'], correctIndex: 0, explanation: '202 Accepted is for async/deferred processing — 201 means the resource already exists now.' },
  { q: 'What does 204 No Content mean?', options: ['The request succeeded and there is intentionally no response body', 'The requested resource could not be found'], correctIndex: 0, explanation: 'A successful DELETE commonly returns 204 — there\'s nothing left to describe.' },
  { q: 'What is 202 Accepted used for?', options: ['A long-running or async operation that has been accepted but not yet completed', 'Confirming a resource was permanently deleted'], correctIndex: 0, explanation: 'The response is not the final result — the client typically polls or listens for completion elsewhere.' },
  { q: 'What is the difference between 400 and 422?', options: ['400 is a malformed/unparseable request; 422 is well-formed but semantically invalid, depending on API convention', '400 and 422 are strictly interchangeable in every API'], correctIndex: 0, explanation: 'A 400 might mean "not valid JSON"; a 422 might mean "valid JSON, but quantity can\'t be negative."' },
  { q: 'What is the difference between 401 and 403?', options: ['401 means identity couldn\'t be established; 403 means identity is known but not permitted to do this', '401 and 403 both always mean "you are not logged in"'], correctIndex: 0, explanation: '401 is "who are you?"; 403 is "we know who you are, and the answer is still no."' },
  { q: 'Should an empty collection return 404?', options: ['No — 200 with an empty array is correct; the collection endpoint itself still exists', 'Yes — an empty result should always be treated as "not found"'], correctIndex: 0, explanation: '404 should be reserved for a specific individual resource that doesn\'t exist, not "zero results right now."' },
  { q: 'What is 429 Too Many Requests for?', options: ['Rate limiting — the client has exceeded an allowed request volume', 'A server-side crash unrelated to the client'], correctIndex: 0, explanation: 'It tells the client to slow down, distinct from a 5xx server failure.' },
  { q: 'What does 409 Conflict typically signal?', options: ['The request conflicts with the current state of the resource, e.g. a duplicate unique field', 'The client sent an unparseable request body'], correctIndex: 0, explanation: 'A 409 says the request is understood and would normally be valid, but the resource\'s current state disallows it right now.' },
  { q: 'What does 500 Internal Server Error mean, and when should it not be used?', options: ['An unexpected server-side failure — it should never be used for predictable validation errors', 'It is the correct response for any request with a missing required field'], correctIndex: 0, explanation: 'A missing field is a client-side problem (400/422); a 500 means something broke on the server\'s own side.' },
  { q: 'Why does pagination matter for list endpoints?', options: ['It protects the API from returning unbounded, uncontrolled result sets', 'It is purely a cosmetic UI feature with no backend implication'], correctIndex: 0, explanation: 'Without a limit, a growing table could eventually return millions of rows in one response.' },
  { q: 'What is a key tradeoff of cursor-based pagination versus offset-based pagination?', options: ['Cursor pagination stays stable under concurrent inserts/deletes; offset pagination can skip or repeat rows as data shifts', 'Cursor pagination cannot be used with sorting at all'], correctIndex: 0, explanation: 'Offset-based paging recalculates position by count, which drifts if rows are added or removed between pages.' },
  { q: 'Why must query-based filtering be validated, not passed straight through?', options: ['An unchecked filter field could hit an unindexed column or leak data the client shouldn\'t query by', 'Filtering never needs validation once pagination exists'], correctIndex: 0, explanation: 'Filters, like sort fields, are still client input reaching a query — they need the same scrutiny.' },
  { q: 'Why does a sortBy query parameter need a server-side allowlist?', options: ['Passing a client-supplied field name directly into a query risks unindexed sorts and injection-style abuse', 'Sorting never touches the database, so it needs no validation'], correctIndex: 0, explanation: 'The allowlist keeps the server, not the client, in control of what is actually queryable.' },
  { q: 'Why should query parameter naming stay consistent across an API (e.g. always sortBy, never sort_by in one place and sortField elsewhere)?', options: ['Inconsistent naming forces every client integration to memorize per-endpoint exceptions', 'Parameter names have no effect on how clients build requests'], correctIndex: 0, explanation: 'Consistency is what lets a client generalize "how this API works" instead of special-casing every endpoint.' },
  { q: 'What is a "custom action" endpoint, like POST /orders/42/cancel?', options: ['A pragmatic escape hatch for an operation that doesn\'t map cleanly onto standard CRUD verbs', 'Always a design mistake — a symptom the URL should be renamed'], correctIndex: 0, explanation: 'Not every verb in a URL is wrong — some operations genuinely aren\'t "replace" or "delete," and a small action endpoint communicates intent clearly.' },
  { q: 'What makes URL-based API versioning (/api/v1/books) appealing despite its downsides?', options: ['It is visible and easy to route, even though the URL is technically no longer a pure resource identifier', 'It requires no changes to routing infrastructure ever'], correctIndex: 0, explanation: 'The tradeoff is real: visibility and easy routing versus the version leaking into what should just identify a resource.' },
  { q: 'Why is adding a required field to a request payload considered a breaking change?', options: ['Existing clients that don\'t send the new field will now fail requests that used to succeed', 'Required fields never affect already-deployed clients'], correctIndex: 0, explanation: 'Anything that makes a previously valid request now invalid breaks whoever is still sending the old shape.' },
  { q: 'Why is adding a new optional field to a response generally safe?', options: ['Existing clients that don\'t know about the field simply ignore it', 'Optional fields always require every client to be updated first'], correctIndex: 0, explanation: 'Old clients keep working exactly as before — they just don\'t read the new field.' },
  { q: 'Why is renaming a response field a breaking change?', options: ['It is functionally equivalent to removing the old field and adding a new one, so old clients lose the data under the old name', 'Renaming a field never affects clients since JSON keys are case-insensitive'], correctIndex: 0, explanation: 'Any client reading the old key name now gets nothing back for it.' },
  { q: 'Why should structured, consistent error responses matter across an API?', options: ['A predictable shape lets clients handle errors programmatically instead of parsing ad hoc strings', 'Error response shape has no bearing on how clients are built'], correctIndex: 0, explanation: 'A consistent { error, message, fields } shape is something client code can actually branch on reliably.' },
  { q: 'Why shouldn\'t a nested resource path go many levels deep (e.g. /a/1/b/2/c/3/d/4)?', options: ['Deep nesting makes URLs brittle and harder to reason about than flattening with a query or a shallower structure', 'Nesting is only allowed one level deep by the HTTP specification'], correctIndex: 0, explanation: 'Nesting should express a genuine "belongs to" relationship — beyond a level or two it usually signals the model needs rethinking.' },
  { q: 'How does REST API design connect to authentication and authorization from earlier in this course?', options: ['The resource/method contract still runs through the same middleware pipeline — auth decides who may reach a given endpoint at all', 'API design and authentication are entirely separate concerns that never interact'], correctIndex: 0, explanation: 'A well-designed endpoint still needs identity and permission checks before it does anything — design doesn\'t replace security.' },
  { q: 'How does REST API design connect to validation from earlier in this course?', options: ['Query parameters and request bodies are still client input and must be validated at the boundary like any other input', 'Once a field appears in a well-designed URL or body it no longer needs validation'], correctIndex: 0, explanation: 'A clean design doesn\'t make client input trustworthy — the same validation discipline still applies.' },
];

@Component({
  selector: 'app-knowledge-quiz',
  standalone: true,
  template: `
    <section class="lab-section" id="quiz">
      <div class="container">
        <p class="lab-index">REST API / 50 — KNOWLEDGE CHECK</p>
        <h2 class="lab-title">Thirty questions. Every answer explains itself.</h2>

        @if (!finished()) {
          <div class="lab-panel quiz-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="quiz-question">{{ current().q }}</p>
            <div class="option-list">
              @for (opt of current().options; track opt; let oi = $index) {
                <button
                  type="button"
                  class="option-btn"
                  [class.is-correct]="picked() !== null && oi === current().correctIndex"
                  [class.is-wrong]="picked() === oi && oi !== current().correctIndex"
                  [disabled]="picked() !== null"
                  (click)="choose(oi)"
                >
                  {{ opt }}
                </button>
              }
            </div>
            @if (picked() !== null) {
              <p class="explanation">{{ current().explanation }}</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="next()">{{ index() < questions.length - 1 ? 'Next →' : 'See score' }}</button>
              </div>
            }
          </div>
        } @else {
          <div class="lab-panel quiz-panel">
            <p class="quiz-score mono">{{ score() }} / {{ questions.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Retake the quiz</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .quiz-panel { margin-top: 24px; }
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 12px; }
    .quiz-question { font-size: 1.0625rem; color: var(--text); font-weight: 600; }
    .option-list { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class KnowledgeQuiz {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.questions[this.index()]);

  choose(oi: number): void {
    this.picked.set(oi);
    if (oi === this.current().correctIndex) this.score.update((s) => s + 1);
  }

  next(): void {
    if (this.index() < this.questions.length - 1) {
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
