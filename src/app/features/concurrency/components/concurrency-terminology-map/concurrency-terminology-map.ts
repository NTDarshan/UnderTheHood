import { Component, computed, signal } from '@angular/core';

interface Term {
  name: string;
  definition: string;
  related: string[];
}

const TERMS: Term[] = [
  { name: 'Process', definition: 'An independent, isolated unit of execution with its own memory space.', related: ['Thread', 'Context Switch'] },
  { name: 'Thread', definition: 'A unit of execution within a process, sharing memory with other threads in it.', related: ['Process', 'Thread Pool', 'Context Switch', 'Race Condition'] },
  { name: 'Concurrency', definition: 'Multiple tasks making independent progress, not necessarily at the same instant.', related: ['Parallelism', 'Event Loop', 'Thread'] },
  { name: 'Parallelism', definition: 'Multiple tasks literally executing at the same instant, on separate cores or machines.', related: ["Amdahl's Law", 'Concurrency', 'Thread'] },
  { name: 'Event Loop', definition: 'A single-threaded scheduler that dispatches callbacks as async operations complete.', related: ['Async/Await', 'Concurrency', 'Callback'] },
  { name: 'Async/Await', definition: 'Syntax for writing non-blocking code that reads like sequential, blocking code.', related: ['Event Loop', 'Cancellation', 'Callback'] },
  { name: 'Callback', definition: 'A function passed to be invoked later, when an asynchronous operation completes.', related: ['Event Loop', 'Async/Await'] },
  { name: 'Race Condition', definition: 'A bug where correctness depends on the timing or interleaving of concurrent operations.', related: ['Lock', 'Atomicity', 'Critical Section', 'Thread'] },
  { name: 'Critical Section', definition: 'The part of code that accesses shared state and must not run concurrently on two threads.', related: ['Lock', 'Mutex', 'Race Condition'] },
  { name: 'Lock', definition: 'A mechanism that grants exclusive access to a resource, blocking other holders-to-be until released.', related: ['Mutex', 'Critical Section', 'Deadlock'] },
  { name: 'Mutex', definition: 'A lock that allows exactly one owner at a time — mutual exclusion.', related: ['Lock', 'Semaphore', 'Deadlock'] },
  { name: 'Semaphore', definition: 'A counter-based lock that allows up to N concurrent holders instead of just one.', related: ['Mutex', 'Thread Pool', 'Backpressure'] },
  { name: 'Deadlock', definition: 'Two or more threads each hold a lock the other needs, and neither can proceed.', related: ['Lock', 'Mutex', 'Circular Wait'] },
  { name: 'Circular Wait', definition: 'The condition where each thread in a cycle waits on a resource held by the next — the core cause of deadlock.', related: ['Deadlock', 'Lock'] },
  { name: 'Livelock', definition: 'Threads keep changing state in response to each other but none makes real progress — busy, not stuck, but going nowhere.', related: ['Deadlock', 'Starvation'] },
  { name: 'Starvation', definition: 'A thread is perpetually denied the resources or scheduling turns it needs to proceed.', related: ['Livelock', 'Thread Pool', 'Circular Wait'] },
  { name: 'Atomicity', definition: 'An operation that completes as one indivisible step — no other thread can observe it half-done.', related: ['Race Condition', 'Lock', 'Message Passing'] },
  { name: 'Context Switch', definition: 'The OS saving one thread\'s state and loading another\'s onto a core — not free, and a source of overhead when overdone.', related: ['Thread', 'Process', 'Thread Pool'] },
  { name: 'Thread Pool', definition: 'A fixed set of reusable worker threads that execute submitted tasks, avoiding per-task thread creation.', related: ['Thread', 'Context Switch', 'Starvation', 'Backpressure'] },
  { name: 'Backpressure', definition: 'Signaling a producer to slow down because the consumer cannot keep up, instead of queueing without bound.', related: ['Thread Pool', 'Semaphore', 'Cancellation'] },
  { name: 'Cancellation', definition: 'Cooperatively telling an in-progress task to stop and release its resources before it finishes naturally.', related: ['Async/Await', 'Backpressure'] },
  { name: 'Message Passing', definition: 'Threads communicate by sending data over channels instead of sharing mutable memory directly.', related: ['Atomicity', 'Race Condition'] },
  { name: "Amdahl's Law", definition: 'The speedup from parallelizing a task is capped by the fraction of it that must stay sequential.', related: ['Parallelism', 'Concurrency'] },
];

@Component({
  selector: 'app-concurrency-terminology-map',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-terminology-map">
      <div class="container">
        <p class="lab-index">ROADMAP CONNECTIONS</p>
        <h2 class="lab-title">How this connects to everything else</h2>
        <p class="lab-lede">
          Every term in this chapter means something because of the terms around it. Click one to see its
          definition and which other terms it relates to &mdash; those light up in the grid below.
        </p>

        <div class="lab-panel">
          <div class="term-grid">
            @for (t of terms; track t.name) {
              <button
                type="button"
                class="lab-btn term-chip"
                [class.is-active]="selected().name === t.name"
                [class.is-related]="isRelated(t.name)"
                [attr.aria-pressed]="selected().name === t.name"
                (click)="select(t)"
              >
                {{ t.name }}
              </button>
            }
          </div>

          <div class="detail-panel" aria-live="polite">
            <p class="detail-name">{{ selected().name }}</p>
            <p class="detail-text">{{ selected().definition }}</p>

            <div class="related-block">
              <p class="detail-label mono">RELATES TO</p>
              <div class="related-row">
                @for (r of selected().related; track r) {
                  <button type="button" class="lab-btn related-chip" (click)="selectByName(r)">{{ r }}</button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .term-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .term-chip { font-size: 0.8125rem; }
    .term-chip.is-related:not(.is-active) {
      border-color: var(--accent-2);
      color: var(--accent-2);
      box-shadow: 0 0 0 1px var(--accent-2) inset;
    }

    .detail-panel { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .detail-name { font-size: 1.25rem; font-weight: 700; color: var(--accent-strong); margin: 0; }
    .detail-text { margin-top: 10px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .related-block { margin-top: 18px; }
    .detail-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 8px; }
    .related-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .related-chip { font-size: 0.75rem; padding: 6px 12px; color: var(--text-muted); }
    .related-chip:hover { color: var(--text); }
  `,
})
export class ConcurrencyTerminologyMap {
  protected readonly terms = TERMS;
  protected readonly selected = signal<Term>(TERMS[0]);

  protected readonly relatedSet = computed(() => new Set(this.selected().related));

  protected isRelated(name: string): boolean {
    return this.relatedSet().has(name);
  }

  protected select(t: Term): void {
    this.selected.set(t);
  }

  protected selectByName(name: string): void {
    const t = this.terms.find((term) => term.name === name);
    if (t) this.selected.set(t);
  }
}
