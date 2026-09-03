import { Component, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answer: string;
  visual: string;
  misconception: string;
  implication: string;
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is graceful shutdown?',
    answer:
      'The practice of controlling everything that happens between a process receiving a stop signal and the process actually exiting — stopping new work, letting safe work finish, and closing resources cleanly, all inside a bounded time budget.',
    visual: 'SIGNAL → UNREADY → STOP TRAFFIC → DRAIN → CLEANUP → EXIT',
    misconception: '"Graceful shutdown just means catching SIGTERM." Catching the signal is step one of many — the actual work is everything that happens after catching it.',
    implication: 'A service that "handles SIGTERM" but does nothing else on receiving it is not gracefully shutting down — it is just delaying an ungraceful one by a few milliseconds.',
  },
  {
    question: 'SIGTERM vs SIGKILL?',
    answer:
      'SIGTERM is a polite request to terminate that a process can intercept and react to — it is the hook graceful shutdown logic runs on. SIGKILL is an unconditional termination the OS enforces immediately; the process cannot catch it, delay it, or run any cleanup in response.',
    visual: 'SIGTERM → app code runs → exits itself   |   SIGKILL → OS kills instantly, no app code runs',
    misconception: 'Assuming SIGTERM itself performs a graceful shutdown. SIGTERM is only the notification; if the process has no handler for it, the default action is to terminate immediately, same as a kill.',
    implication: 'Orchestrators (Kubernetes, systemd, most PaaS platforms) send SIGTERM first and SIGKILL only after a grace period — a process that ignores SIGTERM or takes too long simply gets killed anyway.',
  },
  {
    question: 'What is connection draining?',
    answer:
      'Letting connections and requests that were already accepted continue running to completion, while refusing to accept any new ones — the load-bearing mechanism that makes a shutdown "graceful" instead of an abrupt cutoff.',
    visual: 'BEFORE: [req1][req2][req3] all active  →  DRAINING: no new reqs in, req1/req2/req3 finish, then close',
    misconception: 'Thinking draining means slowing everything down. Draining does not throttle in-flight work — it lets existing work run at full speed while simply closing the door to new arrivals.',
    implication: 'Without draining, a load balancer or process that just closes its listening socket immediately severs requests that were seconds from a normal, successful completion.',
  },
  {
    question: 'Readiness vs liveness?',
    answer:
      'Liveness answers "is this process still functioning, or should it be restarted?" Readiness answers "should this instance currently receive traffic?" A process can be alive but not ready — which is exactly the state it should be in while draining during shutdown.',
    visual: 'LIVE + READY = normal   |   LIVE + NOT READY = draining/starting   |   NOT LIVE = restart me',
    misconception: 'Treating liveness and readiness as the same probe. Failing liveness triggers a restart; failing readiness just removes the instance from the traffic pool — using the wrong one for shutdown causes either a premature kill or continued traffic.',
    implication: 'The very first action of a graceful shutdown should be flipping readiness off — before draining even starts — so traffic routing catches up while the drain is still in progress.',
  },
  {
    question: 'Why stop traffic before process termination?',
    answer:
      'Because closing the process while it is still receiving new requests guarantees some of those requests fail outright — stopping the inflow first means every remaining request the process handles is one it can actually finish.',
    visual: 'STOP TRAFFIC first → (safe to) DRAIN → (safe to) TERMINATE',
    misconception: 'Assuming the order does not matter as long as shutdown eventually happens. Doing it in the wrong order — terminating while still routable — is precisely what causes user-visible errors during otherwise routine deploys.',
    implication: 'This ordering is why deregistration/readiness changes need a moment to propagate before draining begins — a load balancer that has not yet noticed still sends traffic into a closing door.',
  },
  {
    question: 'How should active requests be handled?',
    answer:
      'Allowed to run to completion within a bounded grace period — the server keeps serving them normally while accepting nothing new, and only forcibly ends anything that has not finished once the deadline is reached.',
    visual: 'req (in-flight) --keeps running--> completes normally, inside deadline',
    misconception: '"Active requests should be cancelled immediately so shutdown is fast." Fast is not the goal — correctness is; cancelling healthy in-flight work turns a clean deploy into user-visible errors for no reason.',
    implication: 'This is why the shutdown deadline has to be sized realistically against your actual p99 request duration, not an arbitrary short number chosen to make deploys feel snappy.',
  },
  {
    question: 'What happens to background jobs?',
    answer:
      'Job consumers stop pulling new work immediately; a job already in progress either finishes, checkpoints its progress, or is safely released back to a durable queue for another worker to pick up — it is never simply abandoned mid-state.',
    visual: 'STOP PULLING → in-progress job: finish OR checkpoint OR requeue (never silently dropped)',
    misconception: 'Assuming background jobs matter less than requests because "no user is waiting." A dropped job can mean a lost email, an unbilled charge, or a corrupted multi-step process — the lack of an open HTTP connection does not lower the stakes.',
    implication: 'This is exactly why job state needs to live in a durable queue/store outside the worker process — an in-memory queue means anything not yet finished disappears the instant the process exits.',
  },
  {
    question: 'Why is cancellation important?',
    answer:
      'Cancellation is the mechanism that lets work still running past the point it is needed stop early and release its resources — without it, unwanted work keeps consuming CPU, memory, connections, and time even after nobody cares about its result.',
    visual: 'signal.cancelled? → check at each step → true: stop early and clean up',
    misconception: 'Believing cancellation preempts a task instantly, like a kill signal. Cancellation in almost every runtime is cooperative — the running code has to periodically check the token and choose to stop; code that never checks just keeps running.',
    implication: 'A shutdown deadline is only as effective as the cancellation checks inside the code it is trying to bound — an operation with no cancellation-aware checkpoints can hold the whole shutdown hostage until it finishes on its own.',
  },
  {
    question: 'Why do shutdowns need deadlines?',
    answer:
      'A deadline turns "wait for everything to finish" into "wait for everything to finish, or up to N seconds, whichever comes first" — it is what prevents one slow or stuck piece of work from making shutdown, and therefore deployment, take forever.',
    visual: 'grace period: [0s ---------- drain/cleanup ---------- Ns] → force-stop past Ns',
    misconception: 'Assuming a generous or unbounded grace period is always safer. An unbounded wait just relocates the failure — instead of a fast, visible cutoff you get a deployment that silently hangs, which is worse to diagnose.',
    implication: 'Orchestrators enforce this for you either way — Kubernetes sends SIGKILL once terminationGracePeriodSeconds elapses — so an app-level deadline just gets you a clean, intentional stop instead of an externally imposed, abrupt one.',
  },
  {
    question: 'How does Kubernetes participate?',
    answer:
      'On pod termination, Kubernetes removes the pod from Service endpoints (so new traffic stops) and sends SIGTERM to the container, then waits up to terminationGracePeriodSeconds before sending SIGKILL if the process has not exited on its own.',
    visual: 'delete pod → endpoints updated + SIGTERM sent → grace period → (exited? done) : SIGKILL',
    misconception: '"Kubernetes handles graceful shutdown for me automatically." Kubernetes only handles the traffic-routing and signal/timeout mechanics — the application itself still has to catch SIGTERM and actually drain, cancel, and clean up.',
    implication: 'Endpoint removal and SIGTERM delivery happen concurrently, not endpoint-removal-then-wait-then-signal — this is why many production setups add a short preStop sleep/hook, giving traffic routing time to catch up before the app starts refusing connections.',
  },
  {
    question: 'How does graceful shutdown support zero-downtime deployment?',
    answer:
      'A rolling deployment brings a new instance up and passes its readiness checks before routing any traffic to it, while the old instance drains and exits in parallel — overlap those two timelines correctly and there is no window where capacity or availability actually drops.',
    visual: 'OLD: [[serving]] → DRAIN → EXIT     NEW: START → READY → [[serving]]   (overlapping in time)',
    misconception: 'Thinking zero-downtime is purely about starting new instances fast. Startup speed is only half of it — if the old instance is killed before it finishes draining, deployment is not zero-downtime no matter how fast the new one came up.',
    implication: 'This is why deployment strategies (rolling update, blue/green) and graceful shutdown are two halves of the same guarantee — one without the other still produces dropped requests during every release.',
  },
  {
    question: 'Why does idempotency matter?',
    answer:
      'Shutdown windows are exactly when retries are most likely — a client or orchestrator that does not get a clean response may retry an operation that actually did complete. Idempotency guarantees that running the same operation twice produces the same end state as running it once.',
    visual: 'charge($10) twice on retry → without idempotency: charged $20  |  with idempotency key: charged $10',
    misconception: 'Assuming idempotency is only relevant to payment APIs. Any operation that can be retried after an ambiguous outcome — job requeues, message redelivery, at-least-once queues — needs the same guarantee, not just billing.',
    implication: 'Idempotency is what makes "safe retry" and "safe requeue" actually safe during shutdown — without it, the very mechanisms meant to prevent lost work instead risk duplicated work.',
  },
];

@Component({
  selector: 'app-shutdown-interview-mode',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene sim-scene" id="gs-interview-mode">
      <div class="container">
        <p class="lab-index mono">34 — INTERVIEW MODE</p>
        <h2 class="lab-title">Interview mode</h2>
        <p class="lab-lede">
          Click a question to expand it. Each answer comes with a small visual, the misconception people usually
          state instead, and why the distinction actually shows up in production.
        </p>

        <div class="lab-panel">
          <div class="accordion" aria-live="polite">
            @for (q of questions; track q.question; let i = $index) {
              <div class="accordion-item" [class.is-open]="openIndex() === i">
                <button
                  type="button"
                  class="accordion-header"
                  [attr.aria-pressed]="openIndex() === i"
                  [attr.aria-expanded]="openIndex() === i"
                  (click)="toggle(i)"
                >
                  <span class="q-num mono">{{ i + 1 }}</span>
                  <span class="q-text">{{ q.question }}</span>
                  <span class="chevron mono" aria-hidden="true">{{ openIndex() === i ? '▾' : '▸' }}</span>
                </button>

                @if (openIndex() === i) {
                  <div class="accordion-body">
                    <p class="body-label mono">ANSWER</p>
                    <p class="body-text">{{ q.answer }}</p>

                    <p class="body-label mono body-label-visual">VISUAL</p>
                    <p class="body-visual mono">{{ q.visual }}</p>

                    <p class="body-label mono body-label-warn">COMMON MISCONCEPTION</p>
                    <p class="body-text">{{ q.misconception }}</p>

                    <p class="body-label mono body-label-accent2">PRODUCTION IMPLICATION</p>
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

    .accordion { display: flex; flex-direction: column; gap: 8px; }
    .accordion-item { border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); overflow: hidden; }
    .accordion-item.is-open { border-color: var(--accent); background: var(--surface-raised); }

    .accordion-header {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
    }
    .accordion-header:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

    .q-num { flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border-strong); color: var(--text-faint); font-size: 0.6875rem; }
    .q-text { flex: 1; font-size: 0.9375rem; color: var(--text); font-weight: 600; }
    .chevron { color: var(--text-faint); font-size: 0.75rem; }

    .accordion-body { padding: 0 16px 18px 16px; }
    .body-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.05em; margin: 14px 0 6px; }
    .body-label:first-of-type { margin-top: 0; }
    .body-label-visual { color: var(--resource); }
    .body-label-warn { color: var(--accent); }
    .body-label-accent2 { color: var(--accent-2); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; margin: 0; }

    .body-visual {
      font-size: 0.75rem;
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 10px 12px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      overflow-x: auto;
      white-space: pre;
    }
  `,
})
export class ShutdownInterviewMode {
  protected readonly questions = QUESTIONS;
  protected readonly openIndex = signal<number | null>(0);

  protected toggle(i: number): void {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }
}
