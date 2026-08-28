import { Component, OnDestroy, computed, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answerPoints: string[];
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is REST?',
    answerPoints: [
      'An architectural style for designing networked APIs, not a protocol or format',
      'Built on constraints: statelessness, resource orientation, uniform interface, client-server separation',
      'HTTP + JSON is a common implementation, but REST itself is broader than any one stack',
    ],
  },
  {
    question: "What is a resource, and what's the difference between a resource and its representation?",
    answerPoints: [
      'A resource is a concept the API exposes — e.g. "book #42"',
      'A representation is one serialized form of that resource at a point in time — e.g. the JSON body returned by GET',
      'The same resource can have multiple representations (JSON, XML, a paginated summary vs. full detail)',
      'The URL identifies the resource; the response body is just one representation of it',
    ],
  },
  {
    question: "What does statelessness mean, and what's the common misconception?",
    answerPoints: [
      'Each request carries everything needed to understand it — no reliance on server-side session memory between requests',
      'The server does not remember "where the client was" from a prior request',
      'Misconception: statelessness does not mean the API can\'t have state at all — the underlying data (e.g. a database) still holds state',
      'What is stateless is the interaction — not the system\'s data',
    ],
  },
  {
    question: 'What is the difference between PUT and PATCH?',
    answerPoints: [
      'PUT replaces the entire target resource with the supplied representation',
      'PATCH applies a partial modification — only the fields provided change',
      'PUT sending a partial payload risks wiping out any fields not included',
      'Both act on an identified resource (e.g. /books/42), unlike POST',
    ],
  },
  {
    question: 'Why is POST generally non-idempotent?',
    answerPoints: [
      'POST typically creates a new resource in a collection',
      'Calling it again with the same payload creates another new resource, not the same one',
      'Repeating the request changes the collection further each time — that is the definition of non-idempotent',
    ],
  },
  {
    question: 'Is PATCH idempotent?',
    answerPoints: [
      'Not inherently — it depends on the specific operation being expressed',
      'A PATCH that sets an absolute value (e.g. { price: 550 }) is idempotent — repeating it changes nothing further',
      'A PATCH that applies a relative change (e.g. { increment: 50 }) is not idempotent — repeating it keeps changing the result',
      'The method name alone does not guarantee the property — the semantics of the specific request do',
    ],
  },
  {
    question: 'Is DELETE idempotent if a second call returns 404?',
    answerPoints: [
      'Yes — idempotency concerns the intended effect on server state, not whether every response looks identical',
      'The intended effect is "this resource no longer exists"',
      'After the first DELETE, that effect already holds — the second call finds it already true',
      'A 204 the first time and a 404 the second time are different responses, but the same end state',
    ],
  },
  {
    question: 'Should an empty collection return 404?',
    answerPoints: [
      'No — a collection endpoint that legitimately has zero items is still a valid collection',
      'The correct response is 200 with an empty array/list, not 404',
      '404 should be reserved for a specific, individually-addressed resource that does not exist',
      'Returning 404 for "no results yet" makes it indistinguishable from a broken endpoint',
    ],
  },
  {
    question: "What's the difference between 401 and 403?",
    answerPoints: [
      '401 Unauthorized: the client\'s identity could not be established at all (missing/invalid credentials)',
      '403 Forbidden: identity is known, but this identity is not permitted to perform the action',
      'Ask: "do we know who this is?" (401) vs. "do we know who this is, and they still can\'t do this?" (403)',
    ],
  },
  {
    question: 'How would you design pagination, filtering, and sorting for a list endpoint, and why does the sort field need an allowlist?',
    answerPoints: [
      'Pagination: page/limit or cursor-based params, with a sane max limit enforced server-side',
      'Filtering: query parameters map to indexed, well-understood fields (e.g. ?status=published)',
      'Sorting: a sortBy parameter, validated against a fixed list of allowed fields',
      'Without an allowlist, a client-supplied field name could reach the query layer directly — an injection and information-disclosure risk, and a way to sort by unindexed fields and tank performance',
      'The allowlist keeps the contract predictable and keeps the server, not the client, in control of what is actually queryable',
    ],
  },
];

@Component({
  selector: 'app-interview-mode',
  standalone: true,
  template: `
    <section class="lab-section" id="interview-mode">
      <div class="container">
        <p class="lab-index">REST API / 49 — INTERVIEW MODE</p>
        <h2 class="lab-title">Could you explain this out loud, under pressure?</h2>

        <div class="lab-panel">
          <p class="interviewer mono">INTERVIEWER</p>
          <p class="q-text">{{ current().question }}</p>

          @if (!revealed()) {
            <div class="timer-row">
              <p class="timer mono">{{ seconds() }}s</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="reveal()">Reveal Ideal Answer</button>
              </div>
            </div>
          } @else {
            <div class="answer-box">
              <p class="answer-title mono">IDEAL ANSWER STRUCTURE</p>
              <ol class="answer-list">
                @for (p of current().answerPoints; track p) {
                  <li>{{ p }}</li>
                }
              </ol>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="index() === 0" (click)="prev()">← Previous</button>
            <button type="button" class="lab-btn" [disabled]="index() === questions.length - 1" (click)="next()">Next Question →</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .interviewer { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .q-text { margin-top: 8px; font-size: 1.125rem; color: var(--text); font-weight: 600; }

    .timer-row { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
    .timer { font-size: 1.5rem; color: var(--accent-strong); }

    .answer-box { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .answer-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .answer-list { display: flex; flex-direction: column; gap: 6px; counter-reset: pt; list-style: decimal; padding-left: 20px; }
    .answer-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class InterviewMode implements OnDestroy {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly revealed = signal(false);
  protected readonly seconds = signal(60);
  protected readonly current = computed(() => this.questions[this.index()]);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.seconds.set(60);
    this.timer = setInterval(() => {
      this.seconds.update((s) => {
        if (s <= 1) {
          this.reveal();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  reveal(): void {
    this.revealed.set(true);
    if (this.timer) clearInterval(this.timer);
  }

  next(): void {
    this.index.update((i) => Math.min(i + 1, this.questions.length - 1));
    this.revealed.set(false);
    this.startTimer();
  }

  prev(): void {
    this.index.update((i) => Math.max(i - 1, 0));
    this.revealed.set(false);
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
