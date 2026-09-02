import { Component, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answer: string;
  misconception: string;
  implication: string;
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is concurrency?',
    answer: 'Structuring a program so multiple tasks can be in progress during the same time window, making progress by interleaving rather than necessarily running at the literal same instant.',
    misconception: '"Concurrency means things happen at the exact same time." That describes parallelism, not concurrency — concurrency is about dealing with many things at once, not doing many things at once.',
    implication: 'A single-core server can still handle thousands of concurrent connections via interleaving (e.g. an event loop) — concurrency does not require extra hardware.',
  },
  {
    question: 'What is parallelism?',
    answer: 'Actually executing multiple computations at the exact same instant, which requires multiple physical execution units — multiple CPU cores, GPUs, or machines.',
    misconception: 'Assuming any multi-threaded program is automatically parallel. On a single core, threads are still concurrent but not parallel — the OS just switches between them quickly.',
    implication: 'Adding threads without adding cores buys you concurrency (better responsiveness/overlap of waiting) but not true parallel speedup for CPU-bound work.',
  },
  {
    question: 'Concurrency vs parallelism?',
    answer: 'Concurrency is a property of program structure (dealing with multiple tasks); parallelism is a property of execution (running multiple tasks simultaneously on multiple execution units). Concurrency enables parallelism but does not require it.',
    misconception: 'Treating them as synonyms. You can have concurrency without parallelism (single core, interleaved) and, more rarely, parallelism arranged with almost no concurrent structure (e.g. SIMD on one instruction stream).',
    implication: 'Choosing async I/O to "make things faster" only helps if the workload is I/O-bound; a CPU-bound workload needs actual parallel execution (multiple cores/processes) to speed up.',
  },
  {
    question: 'CPU-bound vs I/O-bound?',
    answer: 'A CPU-bound task spends most of its time performing computation and is limited by processor speed. An I/O-bound task spends most of its time waiting on external operations — disk, network, database — and is limited by that external latency, not the CPU.',
    misconception: 'Assuming more threads always help. More threads help I/O-bound work (overlap the waiting) but can hurt CPU-bound work once thread count exceeds core count, due to context-switch overhead.',
    implication: 'Picking the right concurrency model depends on this classification: async/event-driven for I/O-bound, multi-process/multi-core parallelism for CPU-bound.',
  },
  {
    question: 'What is a thread?',
    answer: 'An independent sequence of execution within a process, with its own call stack and instruction pointer, but sharing the process\'s memory (heap, globals, open file handles) with other threads in that process.',
    misconception: 'Confusing a thread with a process. Threads in the same process share memory directly; processes do not, and require explicit IPC to communicate.',
    implication: 'Shared memory between threads is what makes race conditions possible in the first place — it is both the feature and the hazard of threading.',
  },
  {
    question: 'What is a process?',
    answer: 'An independently running instance of a program with its own isolated memory space, file descriptors, and at least one thread of execution, managed and scheduled by the OS.',
    misconception: 'Thinking processes are just "heavier threads." The isolation is the key difference — a crash in one process cannot directly corrupt another process\'s memory, unlike threads in the same process.',
    implication: 'Process isolation is why multi-process architectures (workers, microservices) are more fault-tolerant to memory corruption than multi-threaded ones, at the cost of IPC overhead.',
  },
  {
    question: 'What is context switching?',
    answer: 'The OS scheduler saving the full execution state (registers, stack pointer, program counter) of one thread and restoring another\'s, so a CPU core can switch which thread it is executing.',
    misconception: 'Treating context switches as free. Each switch has real cost — saving/restoring state and often invalidating CPU caches — and this cost scales up with more runnable threads than cores.',
    implication: 'This is why an overloaded thread pool (far more threads than cores, all runnable) can have lower throughput than a smaller pool — the CPU spends more time switching than computing.',
  },
  {
    question: 'What is a thread pool?',
    answer: 'A fixed (or bounded, elastic) set of pre-created worker threads that pull tasks from a shared queue, avoiding the cost of creating and destroying a thread for every unit of work.',
    misconception: 'Assuming a bigger pool is always better. Beyond the number of available cores (for CPU-bound work) or beyond what downstream resources can absorb (for I/O-bound work), a larger pool just adds contention and context-switch overhead.',
    implication: 'Sizing a thread pool is a real production tuning decision — too small underutilizes hardware and queues work; too large causes thrashing and can overwhelm downstream services.',
  },
  {
    question: 'What does async/await actually do?',
    answer: 'It lets a function suspend at an await point without blocking the underlying thread — control returns to the event loop/scheduler, which can run other work, and resumes this function later when the awaited operation completes.',
    misconception: '"await pauses everything." It only suspends the current async function\'s continuation; the thread it was running on is freed to do other work in the meantime.',
    implication: 'A single thread can juggle thousands of awaiting async operations (e.g. open sockets), which is exactly how event-loop-based servers achieve high I/O concurrency with minimal thread overhead.',
  },
  {
    question: 'Does async create a new thread?',
    answer: 'No, not by itself. Async/await is a control-flow mechanism for suspending and resuming work on an event loop or task scheduler; it does not, on its own, allocate a new OS thread.',
    misconception: 'Assuming `async function` = "runs on a background thread." In most runtimes (JS, Python asyncio), async code runs on the same thread as the event loop unless explicitly offloaded (e.g. a thread/worker pool).',
    implication: 'A CPU-heavy computation wrapped in an async function still blocks the event loop\'s single thread — async does not make CPU-bound work parallel; it needs to be explicitly offloaded to a worker.',
  },
  {
    question: 'What is an event loop?',
    answer: 'A single-threaded (or thread-pinned) runtime loop that repeatedly checks a queue of pending callbacks/tasks and executes whichever ones are ready, driving async I/O and timers without dedicating a thread per operation.',
    misconception: 'Believing the event loop itself performs the I/O. The actual I/O is typically delegated to the OS or a background thread pool (e.g. libuv); the event loop just gets notified when it completes and runs the callback.',
    implication: 'A long-running synchronous callback on the event loop blocks every other pending task — this is the classic "don\'t block the event loop" production failure mode.',
  },
  {
    question: 'What is a race condition?',
    answer: 'A bug where the correctness of a program depends on the relative timing or interleaving of concurrent operations accessing shared state, producing different results depending on scheduling.',
    misconception: 'Assuming a race condition always crashes the program. Many race conditions silently produce wrong data (a lost update, a stale read) with no error at all, which makes them hard to detect.',
    implication: 'Race conditions are notoriously hard to reproduce and debug because they may only manifest under specific timing/load conditions — they can pass every test and still fail in production.',
  },
  {
    question: 'What is atomicity?',
    answer: 'A guarantee that an operation completes as a single indivisible step from the perspective of other threads — no other thread can observe it half-done.',
    misconception: 'Assuming a single line of code (like `counter++`) is atomic. That single line is typically read-modify-write at the hardware level — three separate steps that another thread can interleave with.',
    implication: 'This is exactly why `counter++` shared across threads needs an atomic type or a lock — without it, concurrent increments can silently lose updates.',
  },
  {
    question: 'What is a mutex?',
    answer: 'Mutual exclusion lock — a primitive that allows only one thread at a time to hold it, used to protect a critical section of code or shared data from concurrent access.',
    misconception: 'Thinking a mutex prevents all bugs related to shared state. It only enforces exclusive access to the section it guards — it does nothing to protect state accessed outside that section, and misuse (e.g. forgetting to release it) causes deadlock.',
    implication: 'Every critical section needs consistent lock discipline across all code paths that touch the shared state — a single unprotected access path reintroduces the race the mutex was meant to prevent.',
  },
  {
    question: 'What is a semaphore?',
    answer: 'A counter-based synchronization primitive that allows up to N concurrent holders (unlike a mutex, which allows exactly one), used to bound concurrent access to a limited resource.',
    misconception: 'Confusing a semaphore with a mutex. A mutex with a count of 1 looks similar, but semaphores are typically used for limiting concurrency to a pool size, not for protecting a single critical section\'s correctness.',
    implication: 'Semaphores are the standard tool for bounded concurrency in production — e.g. capping simultaneous outbound requests to a rate-limited API.',
  },
  {
    question: 'What is deadlock?',
    answer: 'A state where two or more threads are each waiting on a resource held by another in the group, forming a cycle, so none of them can ever proceed.',
    misconception: 'Assuming deadlock requires many threads or complex code. The classic case is just two threads each acquiring two locks in opposite order — a simple, easy-to-write bug.',
    implication: 'The standard production mitigation is a consistent global lock-ordering convention (always acquire locks in the same order) or lock timeouts, since detecting deadlock after the fact is far harder than preventing it.',
  },
  {
    question: 'What is starvation?',
    answer: 'A situation where a thread is perpetually denied the resources or scheduling turn it needs to make progress, even though the system as a whole is not deadlocked.',
    misconception: 'Confusing starvation with deadlock. In deadlock nothing progresses; in starvation the system keeps progressing overall, just never for the unlucky thread — e.g. a low-priority thread that never gets scheduled.',
    implication: 'Naive locking or scheduling policies (e.g. always favoring the most recent requester) can starve some clients indefinitely — fairness (FIFO queues, aging priorities) has to be designed in deliberately.',
  },
  {
    question: 'What is backpressure?',
    answer: 'A mechanism where a system under load signals upstream producers to slow down or stop, rather than silently accepting more work than it can process.',
    misconception: 'Assuming backpressure means "drop everything and reject requests." It more commonly means bounded buffering plus an explicit slow-down signal — the goal is controlled degradation, not necessarily hard rejection.',
    implication: 'A system with no backpressure just queues unboundedly under load until it runs out of memory — backpressure is what turns an overload into a graceful, observable slowdown instead of a crash.',
  },
  {
    question: 'What is cancellation?',
    answer: 'A cooperative mechanism for signaling that an in-progress (often async) operation should stop, freeing its resources — the operation itself has to check for and honor the signal.',
    misconception: 'Assuming cancellation is instantaneous, like killing a process. In most async/threading models cancellation is cooperative: the running task must periodically check a token/flag and cannot be forcibly halted mid-instruction.',
    implication: 'A task that never checks its cancellation token keeps running (and holding resources) after the caller has "cancelled" it — cancellation support has to be threaded through every await point deliberately.',
  },
  {
    question: 'Why can more threads make performance worse?',
    answer: 'Past the number of available cores, additional threads compete for CPU time via context switching, and for shared resources via lock contention — the overhead of coordination can exceed the value of the added parallelism.',
    misconception: '"More threads = more throughput" as a universal rule. It is only true up to roughly the number of cores (for CPU-bound work) or up to what downstream systems can absorb (for I/O-bound work) — beyond that, throughput can plateau or actively decline.',
    implication: 'This is why thread-pool sizing and load testing at realistic concurrency levels matter — a config that looks fine at low load can regress badly at high load precisely because of added threads.',
  },
  {
    question: 'Why can more concurrency increase latency?',
    answer: 'As concurrent demand approaches a resource\'s capacity, incoming work spends increasing time waiting in queue rather than being served — queueing delay grows sharply (non-linearly) as utilization nears 100%.',
    misconception: 'Assuming latency only depends on how fast the server processes one request. Latency = queue wait + service time, and queue wait is the term that explodes near saturation, even if per-request service time never changes.',
    implication: 'This is why "CPU looks fine at 70%" can still coexist with terrible tail latency — the queueing effect is what a simple average-utilization dashboard can hide.',
  },
  {
    question: 'What is Amdahl\'s Law?',
    answer: 'A formula, speedup = 1 / ((1-P) + P/N), describing the maximum possible speedup from parallelizing a workload where P is the parallelizable fraction and N is the number of processors — the serial fraction (1-P) puts a hard ceiling on speedup regardless of N.',
    misconception: 'Assuming doubling cores roughly doubles speed. Once the serial portion dominates, adding cores yields rapidly diminishing returns — a workload that is 90% parallel caps out around 10x speedup no matter how many cores you throw at it.',
    implication: 'Amdahl\'s Law is the mathematical reason "just add more cores/machines" has limits — real scaling work usually means shrinking the serial fraction, not just adding parallel capacity.',
  },
];

@Component({
  selector: 'app-concurrency-interview-mode',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-interview-mode">
      <div class="container">
        <p class="lab-index mono">55 — INTERVIEW MODE</p>
        <h2 class="lab-title">Interview mode</h2>
        <p class="lab-lede">
          Click a question to expand it. Each answer comes with the misconception people usually state instead,
          and why the distinction actually matters in production systems.
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
    .body-label-warn { color: var(--accent); }
    .body-label-accent2 { color: var(--c-task); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; margin: 0; }
  `,
})
export class ConcurrencyInterviewMode {
  protected readonly questions = QUESTIONS;
  protected readonly openIndex = signal<number | null>(0);

  protected toggle(i: number): void {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }
}
