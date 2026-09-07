import { Component, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  simple: string;
  technical: string;
  implication: string;
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is a webhook, in one sentence?',
    simple: 'A way for another server to tell yours "something happened" by sending it an HTTP request, instead of your server having to ask.',
    technical: 'An HTTP callback: the provider makes an outbound POST request to a URL you registered, carrying an event payload, whenever a subscribed event occurs.',
    implication: 'This means your endpoint must be publicly reachable and ready to accept unauthenticated inbound traffic at any time — security has to happen inside the handler, not via network isolation.',
  },
  {
    question: 'Webhook vs polling — what\'s the actual difference?',
    simple: 'Polling is you repeatedly asking "anything new?" A webhook is them telling you the moment something happens.',
    technical: 'Polling is client-initiated, request/response, on a fixed interval; webhooks are provider-initiated, pushed near event time. Polling wastes requests when nothing changed; webhooks avoid that but add delivery/security complexity.',
    implication: 'Polling is still correct for reconciliation, current-state queries, or providers with no webhook support — the choice is about the use case, not which is "better."',
  },
  {
    question: 'Who initiates the HTTP connection?',
    simple: 'The provider — their server calls your server.',
    technical: 'The provider\'s dispatcher opens the outbound connection to your registered endpoint URL; your server is purely a receiver in this exchange.',
    implication: 'Your endpoint needs to be reachable and stable — DNS, TLS, and uptime for that route matter as much as any other public API surface.',
  },
  {
    question: 'Why POST and not GET?',
    simple: 'Because a webhook delivers a payload describing an event, not a query for data.',
    technical: 'POST carries a body by convention and isn\'t expected to be idempotent or cacheable at the HTTP semantics level, matching a one-time notification with side effects on the receiving end.',
    implication: 'Don\'t rely on HTTP-level idempotency guarantees just because you used POST — your own idempotency key/store is what actually protects you.',
  },
  {
    question: 'Why do duplicate deliveries happen?',
    simple: 'If the provider never sees your success response — even if you actually succeeded — it assumes failure and sends it again.',
    technical: 'A dropped response, a timeout, or a retried delivery all look identical from the provider\'s side: "no confirmed success." At-least-once delivery semantics are common specifically because avoiding duplicates entirely would mean risking silently losing events instead.',
    implication: 'You cannot design around duplicates never happening — you design around handling them safely when they do.',
  },
  {
    question: 'Does at-least-once mean exactly-once is impossible?',
    simple: 'Webhooks generally don\'t promise exactly-once — you should expect and tolerate duplicates.',
    technical: 'Exact delivery semantics are provider-specific, and even a provider aiming for exactly-once is bound by network reality — a response can always be lost after the work succeeded. Treat duplicates as a normal case to handle, not an edge case.',
    implication: 'Any code path that isn\'t safe to run twice needs an idempotency guard before it goes anywhere near a webhook handler.',
  },
  {
    question: 'Why does idempotency matter here specifically?',
    simple: 'Because retries are a normal, expected part of how webhooks work — not a rare failure case.',
    technical: 'An idempotency key (commonly the event id) lets a handler recognize "I already did this" and return the same safe result instead of repeating a side effect like charging a card or creating a duplicate record.',
    implication: 'Idempotency has to be enforced at the point of the side effect (e.g. a unique constraint on event id), not just as an in-memory check that resets on deploy or restart.',
  },
  {
    question: 'Does a 500 always trigger a retry?',
    simple: 'Often, but not always — it depends on the specific provider\'s policy.',
    technical: '5xx and timeouts commonly trigger a retry because they suggest a transient, server-side problem — but no HTTP status guarantees retry behavior; it\'s a provider policy decision, and providers vary in which codes they retry and how many times.',
    implication: 'Never assume a specific retry count or window "because it\'s a 5xx" — check the actual provider\'s documented retry policy before relying on it.',
  },
  {
    question: 'Why do timeouts exist, and what do they actually prove?',
    simple: 'A timeout means the provider stopped waiting — not that your server did nothing.',
    technical: 'The provider enforces a bounded wait for a response. If your handler is still processing when that window closes, the provider marks the attempt failed even though your server may complete (or already have completed) the work moments later.',
    implication: 'This is exactly why fast-ack matters — persist/verify quickly, respond, then finish the real work asynchronously so a slow step never becomes a false "failure."',
  },
  {
    question: 'Why respond fast instead of finishing all processing first?',
    simple: 'Because the provider is watching a clock, and slow synchronous work risks a timeout that triggers an unnecessary retry.',
    technical: 'The recommended pattern is verify → persist or enqueue → fast 2xx ack → asynchronous processing. Not all work has to finish before responding — only enough to guarantee nothing is lost if the process crashes right after.',
    implication: 'A webhook handler that calls three downstream APIs synchronously before responding is a timeout (and duplicate-retry) waiting to happen under any load or latency spike.',
  },
  {
    question: 'What does HMAC actually prove?',
    simple: 'That whoever sent this request knows the same secret you and the provider share, and the content hasn\'t been altered.',
    technical: 'HMAC combines a shared secret with the message via a keyed hash; recomputing it on the raw body and comparing to the header proves possession of the secret plus content integrity.',
    implication: 'HMAC does not prove absolute identity beyond "holds this secret" — if the secret leaks, anyone who has it can forge valid signatures, which is why rotation matters.',
  },
  {
    question: 'Why verify against the raw body instead of the parsed object?',
    simple: 'Because the signature was computed over the exact bytes sent — not over "the same data serialized slightly differently."',
    technical: 'Parsing then re-serializing (different whitespace, key order, or number formatting) produces different bytes, which produces a different HMAC — the verification would fail even for a genuine, unaltered payload.',
    implication: 'Verify signatures against the untouched request body before any JSON.parse(), unless a specific provider\'s docs explicitly describe a different canonicalization step.',
  },
  {
    question: 'What is a replay attack in this context?',
    simple: 'Resending a previously captured, genuinely valid signed request at a later time.',
    technical: 'Because the signature check only verifies the bytes match what was signed, a byte-for-byte resend of a real request passes signature verification every time — the signature can\'t distinguish "now" from "an hour ago."',
    implication: 'Signature verification alone is not replay protection — you need a separate freshness/dedupe layer on top of it.',
  },
  {
    question: 'Why check timestamps and event IDs?',
    simple: 'Timestamps catch requests that are simply too old to be legitimate; event IDs catch anything already processed, old or not.',
    technical: 'A bounded freshness window rejects requests signed too long ago; tracking already-seen event ids/nonces rejects exact repeats regardless of timing.',
    implication: 'Together these two checks are what actually close the replay window that HMAC alone leaves open.',
  },
  {
    question: 'Why exponential backoff instead of retrying immediately?',
    simple: 'Retrying instantly just hits the same probably-still-broken endpoint again, right away.',
    technical: 'Each retry waits longer than the last (1s, 2s, 4s, 8s…), giving a struggling receiver time to recover instead of being hit at the same rate that may have caused the failure.',
    implication: 'A retry policy also needs a bound — total time budget or max attempts — otherwise a permanently broken endpoint retries forever for no benefit.',
  },
  {
    question: 'Why add jitter on top of backoff?',
    simple: 'So that many failed receivers don\'t all retry at the exact same instant.',
    technical: 'Deterministic backoff means every failed delivery computes the same delay and retries in lockstep — a thundering herd. Randomizing the delay slightly spreads retries out over time.',
    implication: 'Without jitter, a brief outage that fails many deliveries at once can cause a synchronized retry spike that re-triggers the very overload that caused the outage.',
  },
  {
    question: 'What problem does the outbox pattern solve?',
    simple: 'It stops "the database says one thing, but the webhook was never actually sent" from happening.',
    technical: 'Writing the business row and an outbox event row in the same DB transaction guarantees both succeed or both roll back — a separate dispatcher then reads the outbox and sends, decoupled from the original request.',
    implication: 'Without an outbox, a crash between "commit the DB write" and "call the webhook sender" silently drops the notification with no trace it should have existed.',
  },
  {
    question: 'Why keep delivery records instead of just sending and forgetting?',
    simple: 'Because "did this actually get delivered?" needs to be answerable after the fact, not just assumed.',
    technical: 'A delivery record per attempt (status, response code, latency, next retry time) is what makes retries, dead-lettering, debugging, and observability possible at all.',
    implication: 'Without delivery records, a customer reporting "we never got that webhook" is undiagnosable — you have no attempt history to check against.',
  },
  {
    question: 'How do webhooks and an event log/API relate to each other?',
    simple: 'A webhook says "something happened, right now." An event log or API answers "what happened, in total, and can I get it again?"',
    technical: 'Webhooks are a best-effort, near-real-time notification layer; a durable log or query API is the reconciliation layer for anything a webhook might have missed, delayed, or duplicated.',
    implication: 'Treating webhooks as your only source of truth means any missed delivery is a permanently missed event — pairing them with a durable log/API is what makes the system recoverable.',
  },
  {
    question: 'When are webhooks the wrong tool?',
    simple: 'When you need the current state on demand, a full history, or the provider simply doesn\'t support push notifications.',
    technical: 'Current-state queries belong on a direct API call; historical reconciliation belongs on a durable log; a provider without webhook support leaves polling as the only option — webhooks solve for "notify me when," not "tell me what is true right now."',
    implication: 'A system that leans on webhooks for state it could just query directly inherits all of webhooks\' failure modes (duplicates, missed deliveries, ordering) for no benefit.',
  },
  {
    question: 'Why can\'t you assume events arrive in the order they were sent?',
    simple: 'Independent retries and network paths mean a later event can arrive before an earlier one.',
    technical: 'Each delivery is its own HTTP request with its own latency and retry history — there\'s no shared ordering guarantee across them unless the architecture explicitly adds one (sequence numbers, per-entity ordering, version checks).',
    implication: 'A handler that assumes "later event = newer state" without a sequence or version check can overwrite newer data with an older, late-arriving update.',
  },
];

@Component({
  selector: 'app-webhooks-interview-mode',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-interview-mode">
      <div class="container">
        <p class="lab-index mono">32 — INTERVIEW MODE</p>
        <h2 class="lab-title">Interview mode</h2>
        <p class="lab-lede">Click a question to expand it. Each answer has a plain explanation, a technical explanation, and why it matters in production.</p>

        <div class="lab-panel">
          <div class="accordion" aria-live="polite">
            @for (q of questions; track q.question; let i = $index) {
              <div class="accordion-item" [class.is-open]="openIndex() === i">
                <button type="button" class="accordion-header" [attr.aria-pressed]="openIndex() === i" [attr.aria-expanded]="openIndex() === i" (click)="toggle(i)">
                  <span class="q-num mono">{{ i + 1 }}</span>
                  <span class="q-text">{{ q.question }}</span>
                  <span class="chevron mono" aria-hidden="true">{{ openIndex() === i ? '▾' : '▸' }}</span>
                </button>
                @if (openIndex() === i) {
                  <div class="accordion-body">
                    <p class="body-label mono">SIMPLE EXPLANATION</p>
                    <p class="body-text">{{ q.simple }}</p>
                    <p class="body-label mono body-label-info">TECHNICAL EXPLANATION</p>
                    <p class="body-text">{{ q.technical }}</p>
                    <p class="body-label mono body-label-warn">PRODUCTION IMPLICATION</p>
                    <p class="body-text">{{ q.implication }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .accordion { display: flex; flex-direction: column; gap: 8px; }
    .accordion-item { border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); overflow: hidden; }
    .accordion-item.is-open { border-color: var(--pending); background: var(--surface-raised); }
    .accordion-header { all: unset; cursor: pointer; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
    .accordion-header:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .q-num { flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border-strong); color: var(--text-faint); font-size: 0.6875rem; }
    .q-text { flex: 1; font-size: 0.9375rem; color: var(--text); font-weight: 600; }
    .chevron { color: var(--text-faint); font-size: 0.75rem; }
    .accordion-body { padding: 0 16px 18px 16px; }
    .body-label { font-size: 0.6875rem; color: var(--pending); letter-spacing: 0.05em; margin: 14px 0 6px; }
    .body-label:first-of-type { margin-top: 0; }
    .body-label-info { color: var(--info); }
    .body-label-warn { color: var(--retry); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; margin: 0; }
  `,
})
export class WebhooksInterviewMode {
  protected readonly questions = QUESTIONS;
  protected readonly openIndex = signal<number | null>(0);

  protected toggle(i: number): void {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }
}
