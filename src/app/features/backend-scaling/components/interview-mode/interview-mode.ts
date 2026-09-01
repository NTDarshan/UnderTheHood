import { Component, OnDestroy, computed, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answerPoints: string[];
  visual: string;
  caveat: string;
  followUp: string;
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is latency?',
    answerPoints: [
      'The time elapsed between a request being issued and its response being received',
      'A per-operation measurement — it describes one request, not the system as a whole',
    ],
    visual: 'Picture a stopwatch that starts when a request leaves the client and stops when the response arrives.',
    caveat: 'Latency and throughput are different axes — a system can have low latency and low throughput, or high throughput with high latency, at the same time.',
    followUp: 'How would you measure latency for a request that involves three downstream services?',
  },
  {
    question: 'Why is average latency misleading?',
    answerPoints: [
      'An average is pulled toward the bulk of fast requests and can hide a meaningful minority of very slow ones',
      'Two very different distributions — one tight, one with a long tail — can produce the same average',
      'Percentiles like P95/P99 report a position in the distribution and expose the tail that averages smooth over',
    ],
    visual: 'Ten requests at 100ms and one at 5000ms average to ~545ms — a number that describes almost none of the actual requests.',
    caveat: 'Even percentiles can mislead if the traffic is multi-modal (e.g. cache hits vs. misses) — look at the shape of the distribution, not just one number.',
    followUp: 'What would a bimodal latency histogram look like, and what would cause it?',
  },
  {
    question: 'What is P99?',
    answerPoints: [
      'The value below which 99% of measured latencies fall — a position in the latency distribution',
      'The slowest 1% of requests exceed it',
      'It surfaces tail behavior that the median (P50) or the mean would hide',
    ],
    visual: 'Line up every request\'s latency from fastest to slowest; P99 is the value 99% of the way along that line.',
    caveat: 'P99 is not a guarantee or a hard ceiling — it is a statistical position, and it will shift as traffic patterns shift.',
    followUp: 'If P99 is fine but P99.9 is terrible, what does that suggest about who is affected?',
  },
  {
    question: 'What is throughput?',
    answerPoints: [
      'The number of operations completed per unit of time across the whole system',
      'Measures aggregate capacity, not any single request\'s speed',
    ],
    visual: 'Picture a counter ticking up every time a request completes — throughput is the slope of that counter over time.',
    caveat: 'Techniques that raise throughput, like batching, often raise individual latency at the same time.',
    followUp: 'Could you increase throughput while making latency worse? How?',
  },
  {
    question: 'What is concurrency?',
    answerPoints: [
      'The number of operations that are active or in-progress at the same time',
      'Distinct from parallelism — concurrent work can be interleaved on one core, not necessarily executing at the same literal instant',
    ],
    visual: 'Imagine a single chef juggling three orders at once, switching between them, versus three chefs each cooking one order in parallel.',
    caveat: 'Raising concurrency increases resource contention (locks, connections, memory) even when it increases throughput.',
    followUp: 'What resource typically becomes the limiting factor as concurrency increases?',
  },
  {
    question: 'What is a bottleneck?',
    answerPoints: [
      'The component with the least available capacity relative to demand',
      'It caps the throughput or latency of the whole system, no matter how fast every other component is',
    ],
    visual: 'A chain of pipes of different widths — water flow through the whole chain is capped by the narrowest pipe.',
    caveat: 'Bottlenecks move: once you fix the current one, a different component becomes the new limit.',
    followUp: 'How would you confirm, with data, which component is the actual bottleneck right now?',
  },
  {
    question: 'Why does latency increase near saturation?',
    answerPoints: [
      'As a resource\'s utilization approaches 100%, incoming work has to wait longer for the resource to free up',
      'Queueing delay grows non-linearly as utilization nears its limit — not gradually, but sharply',
      'Small increases in load near saturation cause disproportionately large increases in wait time',
    ],
    visual: 'A single checkout lane at 60% busy has almost no line; at 95% busy, the line stretches out the door — the relationship is not a straight line.',
    caveat: 'This is why "average utilization looks fine" can still hide a system that is one small traffic spike away from a latency cliff.',
    followUp: 'What headroom would you target for a resource whose load is bursty rather than steady?',
  },
  {
    question: 'What is profiling?',
    answerPoints: [
      'Instrumenting or sampling a running program to attribute time (CPU, wall-clock, memory) to specific functions or lines',
      'Replaces guessing about slow code with measured evidence',
    ],
    visual: 'A flame graph where the widest bars are the functions consuming the most time.',
    caveat: 'Profiling adds overhead of its own and can distort the exact timings it is trying to measure.',
    followUp: 'Would you reach for profiling before or after distributed tracing, and why?',
  },
  {
    question: 'What is distributed tracing?',
    answerPoints: [
      'Attaching a shared trace ID to a request and recording timed spans as it crosses multiple services',
      'Reconstructs an end-to-end timeline showing which service (and which call within it) consumed the time',
    ],
    visual: 'A waterfall chart of stacked bars, one per service hop, where the longest bar is where the time actually went.',
    caveat: 'It requires instrumentation in every service in the path — a service that isn\'t instrumented is a blind spot in the trace.',
    followUp: 'How would you trace latency in a request that also touches an asynchronous queue?',
  },
  {
    question: 'What is the N+1 query problem?',
    answerPoints: [
      'Fetching a list with 1 query, then issuing N additional queries — one per item — instead of a single joined or batched query',
      'A common trap in ORMs that lazily load related data by default',
    ],
    visual: 'Fetching 50 orders, then looping over them and querying "get customer" separately for each — 51 round trips instead of 1 or 2.',
    caveat: 'The fix (joins or batch-loading) can mean fetching more data per request than strictly needed — it is a trade-off, not a free win.',
    followUp: 'How would you detect an N+1 query problem in a production system without reading every line of code?',
  },
  {
    question: 'Why do database indexes improve reads?',
    answerPoints: [
      'An index is an ordered structure (commonly a B-tree) built on one or more columns',
      'It lets the database locate matching rows in roughly logarithmic time instead of scanning every row in the table',
    ],
    visual: 'Like a book\'s index versus reading every page to find a topic — the index jumps straight to the relevant location.',
    caveat: 'Every index also has to be updated on every write, so it speeds reads at some cost to write performance and storage.',
    followUp: 'When would adding an index make a query slower, not faster?',
  },
  {
    question: 'What is connection pooling?',
    answerPoints: [
      'Maintaining a reusable set of already-open database (or network) connections that requests borrow and return',
      'Avoids paying the cost of the connection handshake on every single request',
    ],
    visual: 'A pool of pre-opened phone lines that agents pick up and hang up, instead of dialing a fresh call every time.',
    caveat: 'A pool sized too small becomes its own bottleneck — requests queue up waiting for a free connection.',
    followUp: 'How would you decide the right pool size for a given service?',
  },
  {
    question: 'What is a cache hit ratio?',
    answerPoints: [
      'Hits divided by (hits + misses) over a time window',
      'The proportion of requests the cache actually answers, versus falling through to the origin',
    ],
    visual: 'Out of 100 lookups, 90 found in cache and 10 missed — an 90% hit ratio.',
    caveat: 'A high hit ratio achieved by very long TTLs can trade freshness for speed — the ratio alone doesn\'t tell you if the data served is current.',
    followUp: 'What would you check first if the hit ratio suddenly dropped?',
  },
  {
    question: 'What makes cache invalidation difficult?',
    answerPoints: [
      'The cache and the source of truth can diverge the moment underlying data changes, and there is no single automatic signal for exactly when that happens',
      'Invalidating too aggressively increases load on the origin; invalidating too late serves stale or wrong data',
      'In distributed caches, invalidation has to reach every node holding a copy, which is itself a coordination problem',
    ],
    visual: 'A whiteboard copied into five other rooms — erasing and rewriting all five in sync, the instant the original changes, is the hard part.',
    caveat: 'This is why it is often called one of the two genuinely hard problems in computer science — treat it as a design decision, not an afterthought.',
    followUp: 'What strategies exist for invalidating a cache entry that is duplicated across many nodes?',
  },
  {
    question: 'What is vertical scaling?',
    answerPoints: [
      'Increasing the resources (CPU, memory, disk, IOPS) of a single server instance',
      'The simplest scaling lever — no distributed coordination required',
    ],
    visual: 'Swapping a small engine for a bigger one in the same car.',
    caveat: 'It has a hard ceiling — the largest machine available — and the single instance remains a single point of failure.',
    followUp: 'What would push a team to switch from vertical to horizontal scaling?',
  },
  {
    question: 'What is horizontal scaling?',
    answerPoints: [
      'Increasing capacity by running more instances of a service behind a load balancer',
      'Removes the hard ceiling of vertical scaling and improves availability, since no single instance is critical',
    ],
    visual: 'Adding more checkout lanes at a store instead of making one lane process customers faster.',
    caveat: 'Requires the service to be stateless (or externalize its state) and introduces distributed-system complexity.',
    followUp: 'What has to be true about a service before it can be horizontally scaled safely?',
  },
  {
    question: 'Why does statelessness help horizontal scaling?',
    answerPoints: [
      'A stateless instance retains no client-specific data between requests, so any instance can handle any request',
      'This lets a load balancer freely route requests to whichever instance has capacity, without needing "sticky" routing',
    ],
    visual: 'Any teller at any bank branch can help you, because your account data lives in a shared system, not in the teller\'s head.',
    caveat: 'Statelessness doesn\'t make state disappear — it moves it to a shared store (database, cache), which becomes a new dependency.',
    followUp: 'Where would session data typically live in a stateless architecture?',
  },
  {
    question: 'What does a load balancer do?',
    answerPoints: [
      'Distributes incoming requests across a pool of backend instances',
      'Uses a routing strategy (round robin, least connections) and health checks to route around failed instances',
    ],
    visual: 'A traffic officer at a busy intersection, directing cars to whichever lane is moving fastest.',
    caveat: 'The load balancer itself becomes a critical path — it needs to be made redundant, or it becomes a single point of failure.',
    followUp: 'How does a load balancer know an instance is unhealthy and should stop receiving traffic?',
  },
  {
    question: 'What are read replicas?',
    answerPoints: [
      'Secondary database instances that continuously receive updates from the primary via replication',
      'They serve read-only queries, offloading read traffic from the primary',
    ],
    visual: 'A photocopy of a ledger that updates a moment after the original — good enough for most reads, but not identical at every instant.',
    caveat: 'Replication is typically asynchronous, so replicas lag behind the primary — a read right after a write can return stale data.',
    followUp: 'What kind of read would be unsafe to send to a replica right after a write?',
  },
  {
    question: 'What is database sharding?',
    answerPoints: [
      'Horizontally partitioning a dataset across multiple database instances by a shard key',
      'Each shard holds a subset of the rows and handles a subset of the load',
    ],
    visual: 'Splitting one giant filing cabinet into several smaller cabinets, each holding files for a specific range of customer IDs.',
    caveat: 'Sharding is complex: cross-shard queries, joins, and transactions become much harder, and resharding later is a major operation — treat it as a last resort after replicas and vertical scaling are exhausted.',
    followUp: 'What would you choose as a shard key for a multi-tenant application, and why?',
  },
  {
    question: 'What is a CDN?',
    answerPoints: [
      'A Content Delivery Network — a geographically distributed set of edge servers',
      'They cache static (and some dynamic) content near end users, cutting the distance data has to travel',
    ],
    visual: 'Local libraries with copies of the same popular book, instead of every reader ordering from one central warehouse.',
    caveat: 'Invalidating content across many edge locations is slower than invalidating one cache, and not all content is safely cacheable.',
    followUp: 'What kind of response would be unsafe to cache at a CDN edge?',
  },
  {
    question: 'When should work be asynchronous?',
    answerPoints: [
      'When the caller doesn\'t need the result immediately to consider the request successful',
      'When decoupling the slow work from the request path improves the request\'s own latency',
    ],
    visual: 'Dropping a letter in a mailbox versus waiting at the counter for it to be delivered — the sender moves on immediately either way.',
    caveat: 'Async processing changes WHEN the work completes, not WHETHER it completes correctly — it trades an instant response for eventual completion and the operational burden of retries and failure handling.',
    followUp: 'How would you communicate to the user that async work succeeded or failed after the fact?',
  },
  {
    question: 'What is backpressure?',
    answerPoints: [
      'A flow-control mechanism where a system under load signals, or forces, its callers to slow down',
      'Prevents unbounded acceptance of work that a system cannot process in time',
    ],
    visual: 'A dam releasing a controlled amount of water instead of letting the reservoir overflow.',
    caveat: 'Applying backpressure means rejecting or delaying some work right now — the problem doesn\'t vanish, it moves back to the caller.',
    followUp: 'What should a client do when it receives a backpressure signal from a downstream service?',
  },
  {
    question: 'What is rate limiting?',
    answerPoints: [
      'Enforcing a maximum number of requests per client, key, or endpoint over a time window',
      'Requests beyond the limit are rejected or delayed',
    ],
    visual: 'A ticket dispenser that only prints one number every few seconds, no matter how many people are waiting.',
    caveat: 'Too strict and legitimate heavy users suffer; too loose and the system isn\'t actually protected — the limit has to be tuned to real usage.',
    followUp: 'What HTTP status code and headers would you use to signal a rate limit was hit?',
  },
  {
    question: 'What is autoscaling?',
    answerPoints: [
      'A control system that monitors a metric — CPU, queue depth, request rate — and adjusts instance count to match it',
      'Matches capacity to demand automatically, within configured bounds',
    ],
    visual: 'A thermostat that turns on more heaters as the room gets colder, and turns them off as it warms up.',
    caveat: 'Autoscaling has reaction time — new instances take time to boot and warm up, so it does not help against sudden, instantaneous spikes; it also requires the service to be stateless.',
    followUp: 'What metric would you scale on for a queue-processing service versus a request-serving API?',
  },
  {
    question: 'What is capacity planning?',
    answerPoints: [
      'Forecasting expected load, based on growth trends, seasonality, or planned events',
      'Provisioning enough resources, with margin, to handle that forecast reliably',
    ],
    visual: 'Ordering extra inventory ahead of a known sale date, rather than reacting once shelves are already empty.',
    caveat: 'It is a forecast, not a guarantee — over-provisioning wastes money, under-provisioning risks outages, and reality rarely matches the forecast exactly.',
    followUp: 'How would you capacity-plan for an event with no historical precedent to forecast from?',
  },
  {
    question: 'What is the difference between performance and scalability?',
    answerPoints: [
      'Performance describes how fast the system is at a given, fixed load — its latency and throughput right now',
      'Scalability describes how that performance holds up as load increases — whether adding resources actually buys proportional capacity',
      'A system can be fast at low load (good performance) but degrade sharply as load grows (poor scalability), or the reverse',
    ],
    visual: 'A sports car is fast on an empty road (performance) but might gridlock in rush-hour traffic (scalability) worse than a well-designed transit system.',
    caveat: 'Performance ≠ scalability — optimizing one does not automatically improve the other, and interview answers that conflate them miss the point of the question.',
    followUp: 'Can you describe a system that is fast for one user but does not scale to many?',
  },
];

@Component({
  selector: 'app-interview-mode',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="interview-mode">
      <div class="container">
        <p class="lab-index">35 &mdash; INTERVIEW MODE</p>
        <h2 class="lab-title">Could you explain this out loud, under pressure?</h2>

        <div class="lab-panel">
          <div class="q-meta">
            <p class="interviewer mono">INTERVIEWER &middot; QUESTION {{ index() + 1 }} / {{ questions.length }}</p>
          </div>
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

              <p class="visual-title mono">HOW TO PICTURE IT</p>
              <p class="visual-text">{{ current().visual }}</p>

              <p class="caveat-title mono">ENGINEERING CAVEAT</p>
              <p class="caveat-text">{{ current().caveat }}</p>

              <p class="followup-title mono">LIKELY FOLLOW-UP</p>
              <p class="followup-text">{{ current().followUp }}</p>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="index() === 0" (click)="prev()">&larr; Previous</button>
            <button type="button" class="lab-btn" [disabled]="index() === questions.length - 1" (click)="next()">Next Question &rarr;</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
    }

    .interviewer { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .q-text { margin-top: 8px; font-size: 1.125rem; color: var(--text); font-weight: 600; }

    .timer-row { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
    .timer { font-size: 1.5rem; color: var(--accent-strong); }

    .answer-box { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .answer-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .answer-list { display: flex; flex-direction: column; gap: 6px; list-style: decimal; padding-left: 20px; }
    .answer-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .visual-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--c-cache); letter-spacing: 0.06em; margin-bottom: 8px; }
    .visual-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .caveat-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--warn); letter-spacing: 0.06em; margin-bottom: 8px; }
    .caveat-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .followup-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--accent); letter-spacing: 0.06em; margin-bottom: 8px; }
    .followup-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; font-style: italic; }
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
