import { Component, signal } from '@angular/core';

interface Term {
  name: string;
  simple: string;
  technical: string;
  why: string;
  when: string;
  tradeoffs: string;
  related: string[];
}

const TERMS: Term[] = [
  {
    name: 'Latency',
    simple: 'How long one request takes, start to finish.',
    technical: 'The elapsed time between a request being issued and its response being received, measured per operation.',
    why: 'It exists as the fundamental unit of "how fast" a system feels to a single caller.',
    when: 'Use it to reason about a single request\'s experience, not the system\'s overall capacity.',
    tradeoffs: 'Optimizing latency for one path can add complexity or cost elsewhere in the system.',
    related: ['Throughput', 'Tail Latency', 'P99'],
  },
  {
    name: 'Throughput',
    simple: 'How much work the whole system gets done per second.',
    technical: 'The number of operations (requests, jobs, bytes) completed per unit time across the whole system.',
    why: 'It measures aggregate capacity, distinct from how fast any single request feels.',
    when: 'Use it when reasoning about capacity planning and scaling, not user-perceived speed.',
    tradeoffs: 'Maximizing throughput (e.g. via batching) can increase the latency of individual requests.',
    related: ['Latency', 'Concurrency', 'Utilization'],
  },
  {
    name: 'Concurrency',
    simple: 'Multiple things in flight at once — not necessarily running at the exact same instant.',
    technical: 'The number of operations that are active or in-progress simultaneously, whether interleaved on one core or truly parallel across many.',
    why: 'It distinguishes "how many things are happening" from parallelism, which is "how many are literally executing right now."',
    when: 'Relevant when sizing thread pools, connection pools, or async worker counts.',
    tradeoffs: 'Higher concurrency raises resource contention and complexity even when it increases throughput.',
    related: ['Throughput', 'Connection Pool', 'Worker'],
  },
  {
    name: 'Utilization',
    simple: 'How busy a resource is, as a percentage.',
    technical: 'The fraction of time a resource (CPU, disk, connection pool) is actively in use, typically expressed 0-100%.',
    why: 'High utilization signals a resource is close to becoming the bottleneck.',
    when: 'Track it to know when a component needs headroom or scaling.',
    tradeoffs: 'Pushing utilization too close to 100% causes queueing delay to grow non-linearly.',
    related: ['Bottleneck', 'Capacity Planning', 'Autoscaling'],
  },
  {
    name: 'Tail Latency',
    simple: 'How slow the worst requests are, not the typical ones.',
    technical: 'Latency at the high percentiles of the distribution (e.g. P95, P99) — the requests much slower than average.',
    why: 'It exists because averages hide exactly the requests users actually complain about.',
    when: 'Use it when the goal is a consistent experience for nearly every user, not just most.',
    tradeoffs: 'Chasing tail latency down often costs more engineering effort than the average-latency gains justify.',
    related: ['P99', 'Latency', 'Bottleneck'],
  },
  {
    name: 'P50',
    simple: 'The "typical" request — half are faster, half slower.',
    technical: 'The value below which 50% of measured latencies fall (the median): a position in the latency distribution.',
    why: 'It exists as a robust measure of central tendency, less skewed by outliers than the mean.',
    when: 'Use for a sense of the typical experience — never as the full picture on its own.',
    tradeoffs: 'It hides how bad the slowest requests are entirely.',
    related: ['Tail Latency', 'P99', 'Latency'],
  },
  {
    name: 'P90',
    simple: '9 out of 10 requests are at least this fast.',
    technical: 'The value below which 90% of measured latencies fall.',
    why: 'It sits as a middle ground between typical (P50) and worst-case (P99) experience.',
    when: 'Useful for SLOs that can tolerate a small fraction of slower requests.',
    tradeoffs: 'Still hides the worst 10% of requests, which can be a large absolute number at scale.',
    related: ['P50', 'P95', 'Tail Latency'],
  },
  {
    name: 'P95',
    simple: '95 out of 100 requests are at least this fast.',
    technical: 'The value below which 95% of measured latencies fall.',
    why: 'It\'s a common SLO threshold — tight enough to matter, loose enough to be achievable.',
    when: 'Use for service-level targets when P99 is too strict for the workload or traffic volume.',
    tradeoffs: 'At high request volume, the remaining 5% can still be a large absolute number of slow requests.',
    related: ['P90', 'P99', 'Tail Latency'],
  },
  {
    name: 'P99',
    simple: '99 out of 100 requests are at least this fast — the long-tail measure.',
    technical: 'The value below which 99% of measured latencies fall; the slowest 1% exceed it.',
    why: 'It exists because at scale, 1% of requests can still mean thousands of unhappy users.',
    when: 'Use to catch problems that averages and even P95 would miss entirely.',
    tradeoffs: 'It is a position in a distribution, not a guarantee — one P99 number can hide multi-modal behavior, like separate cache-hit and cache-miss paths.',
    related: ['P95', 'Tail Latency', 'Bottleneck'],
  },
  {
    name: 'Bottleneck',
    simple: 'The one part of the system actually limiting speed right now.',
    technical: 'The component with the least available capacity relative to demand, capping the throughput or latency of the whole system regardless of how fast other components are.',
    why: 'Systems are chains — improving anything but the current bottleneck does not help overall performance.',
    when: 'Identify it before optimizing anything else.',
    tradeoffs: 'Bottlenecks move: fixing one reveals the next one behind it.',
    related: ['Profiling', 'Utilization', 'Distributed Tracing'],
  },
  {
    name: 'Profiling',
    simple: 'Measuring exactly where time is spent inside your code.',
    technical: 'Instrumenting or sampling a running program to attribute CPU time, memory, or wall-clock time to specific functions or lines.',
    why: 'It replaces guessing about slow code with evidence.',
    when: 'Use it once you\'ve localized a bottleneck to a service, before micro-optimizing.',
    tradeoffs: 'Profiling itself adds overhead and can distort the very timings being measured.',
    related: ['Bottleneck', 'Distributed Tracing', 'N+1 Query Problem'],
  },
  {
    name: 'Distributed Tracing',
    simple: 'Following one request as it hops across multiple services.',
    technical: 'A technique that attaches a shared trace ID to a request and records timed spans across every service it touches, reconstructing an end-to-end timeline.',
    why: 'A single request can be slow because of any one of many services, and logs alone don\'t show causality across them.',
    when: 'Use when a single-service profiler can\'t explain latency because the request crosses network boundaries.',
    tradeoffs: 'Requires instrumentation in every service and adds some overhead and storage cost.',
    related: ['Profiling', 'Bottleneck', 'N+1 Query Problem'],
  },
  {
    name: 'N+1 Query Problem',
    simple: 'Running one query per item in a list instead of one query for the whole list.',
    technical: 'An anti-pattern where fetching N related records triggers 1 query for the list plus N additional queries — one per item — instead of a single joined or batched query.',
    why: 'It\'s an easy trap in ORMs that lazily load related data by default.',
    when: 'Watch for it whenever a loop contains a database call.',
    tradeoffs: 'Fixing it via joins or batch-loading can mean fetching more data than any single request actually needs.',
    related: ['Database Index', 'Connection Pool', 'Profiling'],
  },
  {
    name: 'Database Index',
    simple: 'A lookup structure that lets the database find rows without scanning the whole table.',
    technical: 'An ordered data structure (commonly a B-tree) built on one or more columns, letting the database locate matching rows in roughly logarithmic time instead of a full table scan.',
    why: 'Reads on unindexed large tables get linearly slower as the table grows.',
    when: 'Add one on columns used in WHERE, JOIN, or ORDER BY clauses on large tables.',
    tradeoffs: 'Every index speeds reads but slows writes (it must be updated) and consumes storage.',
    related: ['N+1 Query Problem', 'Bottleneck', 'Sharding'],
  },
  {
    name: 'Connection Pool',
    simple: 'A reusable set of open database connections instead of opening a new one per request.',
    technical: 'A managed cache of established database (or network) connections that requests borrow and return, avoiding the cost of a fresh handshake on every call.',
    why: 'Opening a connection per request is expensive, and connections are a limited resource on the database.',
    when: 'Use for any service making frequent database calls.',
    tradeoffs: 'A pool sized too small becomes a bottleneck itself, waiting on a free connection; too large can overwhelm the database.',
    related: ['Concurrency', 'Bottleneck', 'Backpressure'],
  },
  {
    name: 'Caching',
    simple: 'Storing a computed or fetched result so the next request can skip redoing the work.',
    technical: 'Storing the result of an expensive operation — a query, a computation, a rendered page — in a fast-access store, keyed for retrieval on subsequent requests.',
    why: 'Recomputing or refetching identical data repeatedly is wasted work.',
    when: 'Use for data that is expensive to produce and safe to serve slightly stale.',
    tradeoffs: 'Introduces staleness risk and invalidation complexity in exchange for speed.',
    related: ['Cache Hit Ratio', 'Cache Invalidation', 'CDN'],
  },
  {
    name: 'Cache Hit Ratio',
    simple: 'What fraction of lookups the cache actually answers, versus falling through.',
    technical: 'Hits divided by (hits + misses) over a time window — the proportion of requests served from cache rather than the origin.',
    why: 'It\'s the key signal for whether a cache is actually earning its complexity.',
    when: 'Monitor it to decide whether to resize, re-key, or remove a cache.',
    tradeoffs: 'Chasing a higher ratio, e.g. via longer TTLs, trades away freshness.',
    related: ['Caching', 'Cache Invalidation', 'Cache Stampede'],
  },
  {
    name: 'Cache Invalidation',
    simple: 'Knowing when cached data is no longer correct and must be refreshed or removed.',
    technical: 'The process and policy for removing or updating cache entries when the underlying source data changes, so the cache doesn\'t keep serving stale results indefinitely.',
    why: 'Caching only helps if staleness is bounded and controlled.',
    when: 'Design it explicitly whenever caching mutable data — famously one of the hardest problems in caching.',
    tradeoffs: 'Aggressive invalidation keeps data fresh but increases origin load; lax invalidation risks serving wrong data.',
    related: ['Caching', 'Cache Hit Ratio', 'Cache Stampede'],
  },
  {
    name: 'Cache Stampede',
    simple: 'Many requests all missing the cache at the same instant and hammering the origin together.',
    technical: 'A failure mode where a popular cache entry expires or is invalidated and a burst of concurrent requests all miss simultaneously, each independently regenerating the value and overloading the backing store.',
    why: 'It\'s a side effect of naive TTL-based expiry under high read concurrency.',
    when: 'Guard against it when a hot key has high read concurrency and an expensive regeneration cost.',
    tradeoffs: 'Mitigations — locking, request coalescing, jittered TTLs — add implementation complexity.',
    related: ['Cache Invalidation', 'Cache Hit Ratio', 'Backpressure'],
  },
  {
    name: 'Vertical Scaling',
    simple: 'Making one machine bigger (more CPU/RAM) instead of adding more machines.',
    technical: 'Increasing the resources — CPU, memory, disk, IOPS — of a single server instance to handle more load.',
    why: 'It\'s the simplest scaling lever available — no distributed coordination required.',
    when: 'Use it first when a single component is the bottleneck and hardware headroom exists.',
    tradeoffs: 'Has a hard ceiling (the biggest machine available) and keeps a single point of failure.',
    related: ['Horizontal Scaling', 'Bottleneck', 'Capacity Planning'],
  },
  {
    name: 'Horizontal Scaling',
    simple: 'Adding more machines instead of making one bigger.',
    technical: 'Increasing capacity by running more instances of a service behind a load balancer, distributing load across them.',
    why: 'It removes the hard ceiling of vertical scaling and improves availability, since no single instance is critical.',
    when: 'Use once a single instance can\'t be made bigger, or when availability matters as much as capacity.',
    tradeoffs: 'Requires the service to be stateless (or externalize state) and introduces distributed-system complexity.',
    related: ['Statelessness', 'Load Balancer', 'Vertical Scaling'],
  },
  {
    name: 'Statelessness',
    simple: 'Each request carries everything the server needs, so any server can handle it.',
    technical: 'A design property where a service instance retains no client-specific session state between requests, letting any instance serve any request.',
    why: 'Horizontal scaling and load balancing require requests to be freely distributable across instances.',
    when: 'Design for it whenever a service needs to scale horizontally.',
    tradeoffs: 'State has to live somewhere — pushing it to a shared store adds a dependency and a network hop.',
    related: ['Horizontal Scaling', 'Load Balancer', 'Resilience'],
  },
  {
    name: 'Load Balancer',
    simple: 'The traffic cop that spreads requests across multiple servers.',
    technical: 'A component that distributes incoming requests across a pool of backend instances, using a strategy (round robin, least connections) and health checks to route around failures.',
    why: 'It makes horizontal scaling and failover possible in the first place.',
    when: 'Sits in front of any service with more than one instance.',
    tradeoffs: 'Becomes a critical path and potential bottleneck or single point of failure itself, unless it is also made redundant.',
    related: ['Horizontal Scaling', 'Statelessness', 'Autoscaling'],
  },
  {
    name: 'Read Replica',
    simple: 'A copy of the database that only serves reads, so the main database has less to do.',
    technical: 'A secondary database instance that continuously receives updates from the primary via replication and serves read-only queries, offloading read traffic from the primary.',
    why: 'Reads usually outnumber writes and can be parallelized across copies while writes stay centralized.',
    when: 'Use when read load, not write load, is the database bottleneck.',
    tradeoffs: 'Replication is asynchronous in most setups, so replicas lag behind the primary — reads from them can return slightly stale data.',
    related: ['Horizontal Scaling', 'Sharding', 'Caching'],
  },
  {
    name: 'Sharding',
    simple: 'Splitting one big database into smaller pieces, each holding a portion of the data.',
    technical: 'Horizontally partitioning a dataset across multiple database instances by a shard key, so each shard holds a subset of rows and handles a subset of load.',
    why: 'A single database eventually can\'t hold or serve all the data, no matter how it\'s replicated.',
    when: 'Reach for it only after vertical scaling and read replicas are exhausted — it is a last resort, not a first move.',
    tradeoffs: 'Cross-shard queries, joins, and transactions become significantly harder; resharding later is a major operation.',
    related: ['Read Replica', 'Horizontal Scaling', 'Database Index'],
  },
  {
    name: 'CDN',
    simple: 'A network of servers around the world that cache and serve content close to the user.',
    technical: 'Content Delivery Network — a geographically distributed set of edge servers that cache static (and some dynamic) content near end users, cutting the distance data travels.',
    why: 'Network latency is bounded by physical distance, and serving from a nearby edge beats a round trip to a distant origin.',
    when: 'Use for static assets and cacheable responses served to geographically spread users.',
    tradeoffs: 'Invalidating content across many edge locations is slower and harder than invalidating one cache; not all content is safely cacheable.',
    related: ['Caching', 'Edge Computing', 'Cache Invalidation'],
  },
  {
    name: 'Edge Computing',
    simple: 'Running actual computation near the user, not just caching static files there.',
    technical: 'Executing application logic on servers physically close to the end user, at the network edge, rather than in a centralized data center.',
    why: 'It extends the CDN\'s latency benefit beyond static content to dynamic logic.',
    when: 'Use for latency-sensitive logic that doesn\'t need the full context of a central data store.',
    tradeoffs: 'Edge environments are more resource-constrained and harder to keep consistent with central systems.',
    related: ['CDN', 'Latency', 'Statelessness'],
  },
  {
    name: 'Async Processing',
    simple: 'Doing slow work in the background instead of making the caller wait for it.',
    technical: 'Decoupling the execution of an operation from the request that triggered it, typically by handing it to a queue and worker so the caller gets an immediate response while the work completes later.',
    why: 'Slow, non-critical work shouldn\'t hold up the request path.',
    when: 'Use for work whose result the caller doesn\'t need immediately — emails, video processing, reports.',
    tradeoffs: 'Async changes WHEN work completes, not WHETHER it completes correctly — it trades an immediate response for eventual consistency and adds operational complexity: retries, failure handling, monitoring.',
    related: ['Queue', 'Worker', 'Backpressure'],
  },
  {
    name: 'Queue',
    simple: 'A waiting line that holds work until something is free to process it.',
    technical: 'An ordered buffer that decouples producers, which enqueue work, from consumers, which dequeue and process it, smoothing bursts and enabling async processing.',
    why: 'It absorbs bursts of demand and lets producers and consumers scale independently.',
    when: 'Use whenever work should be processed asynchronously or at a different rate than it arrives.',
    tradeoffs: 'An unbounded queue can hide a struggling downstream system until the backlog grows dangerously large, and queued work always incurs added latency.',
    related: ['Async Processing', 'Worker', 'Backpressure'],
  },
  {
    name: 'Worker',
    simple: 'The process that actually does the work sitting in the queue.',
    technical: 'A process or pool of processes that pulls tasks off a queue and executes them, often scaled independently from the request-handling tier.',
    why: 'It separates "who accepts work" from "who performs work," so each can scale on its own terms.',
    when: 'Pair with a queue whenever processing is asynchronous.',
    tradeoffs: 'Worker count must be tuned to queue arrival rate — too few and the backlog grows, too many and downstream systems like the database get overwhelmed.',
    related: ['Queue', 'Async Processing', 'Autoscaling'],
  },
  {
    name: 'Backpressure',
    simple: 'Telling upstream producers to slow down because downstream can\'t keep up.',
    technical: 'A flow-control mechanism where a system under load signals, or forces, its callers to reduce their rate rather than silently accepting work it cannot process in time.',
    why: 'Unbounded acceptance of work under overload leads to unbounded queues and eventual collapse, not graceful degradation.',
    when: 'Implement it at any boundary where a fast producer can outpace a slower consumer.',
    tradeoffs: 'Applying backpressure means rejecting or delaying some work now, pushing the problem back onto the caller.',
    related: ['Queue', 'Rate Limiting', 'Connection Pool'],
  },
  {
    name: 'Rate Limiting',
    simple: 'Capping how many requests a client can make in a given time window.',
    technical: 'Enforcing a maximum number of requests or operations per client, key, or endpoint over a time window, rejecting or delaying requests beyond the limit.',
    why: 'It protects a system from being overwhelmed by any single client, intentional or accidental.',
    when: 'Apply at public API boundaries and to protect scarce downstream resources.',
    tradeoffs: 'Overly strict limits degrade the experience for legitimate heavy users; overly loose limits fail to protect the system.',
    related: ['Backpressure', 'Load Balancer', 'Resilience'],
  },
  {
    name: 'Autoscaling',
    simple: 'Automatically adding or removing capacity based on current load.',
    technical: 'A control system that monitors a metric — CPU, queue depth, request rate — and adjusts the number of running instances up or down to match it, within configured bounds.',
    why: 'It matches capacity to demand without manual intervention, saving cost during quiet periods and adding headroom during spikes.',
    when: 'Use for workloads with variable, somewhat predictable load patterns.',
    tradeoffs: 'Autoscaling has reaction time — new instances take time to boot and warm up, so it doesn\'t help with sudden, instantaneous spikes, and it requires the service to be stateless.',
    related: ['Load Balancer', 'Capacity Planning', 'Statelessness'],
  },
  {
    name: 'Load Testing',
    simple: 'Deliberately hammering a system with traffic before real users do.',
    technical: 'Generating synthetic load against a system to measure its behavior — latency, error rate, resource usage — under conditions approximating or exceeding expected peak traffic.',
    why: 'It finds bottlenecks and breaking points before they happen in production.',
    when: 'Run it before major launches, after significant architecture changes, and on a regular cadence.',
    tradeoffs: 'Synthetic load rarely perfectly matches real traffic patterns, so it reduces but doesn\'t eliminate production surprises.',
    related: ['Capacity Planning', 'Bottleneck', 'Resilience'],
  },
  {
    name: 'Capacity Planning',
    simple: 'Figuring out ahead of time how much infrastructure you\'ll need.',
    technical: 'Forecasting expected load, based on growth trends, seasonality, or planned events, and provisioning enough resources — with margin — to handle it reliably.',
    why: 'Reactive scaling alone can\'t cover instantaneous or predictable-but-sudden spikes.',
    when: 'Do it ahead of known events like launches and sales, and on a regular cadence for organic growth.',
    tradeoffs: 'Over-provisioning wastes money; under-provisioning risks outages — it is inherently a forecast, not a guarantee.',
    related: ['Autoscaling', 'Utilization', 'Load Testing'],
  },
  {
    name: 'Resilience',
    simple: 'The system keeps working, or fails gracefully, when something goes wrong.',
    technical: 'A system\'s ability to continue operating in a degraded but acceptable way in the presence of partial failures — a dependency going down, a node crashing, a network partition.',
    why: 'Failures are inevitable at scale — the goal shifts from preventing all failures to surviving them.',
    when: 'Design for it in any distributed system, especially ones with external dependencies.',
    tradeoffs: 'Resilience patterns — retries, timeouts, circuit breakers, fallbacks — add code paths and testing surface that must themselves be correct.',
    related: ['Statelessness', 'Rate Limiting', 'Load Testing'],
  },
];

@Component({
  selector: 'app-terminology-map',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="terminology-map">
      <div class="container">
        <p class="lab-index">34 &mdash; CONNECTED CONCEPTS</p>
        <h2 class="lab-title">Every term here means something because of the terms around it.</h2>
        <p class="lab-lede">
          Click a term to unpack it &mdash; plain language, the precise definition, why it exists,
          when to reach for it, and its trade-offs. Then follow the related terms to see how the
          whole vocabulary connects.
        </p>

        <div class="term-grid">
          @for (t of terms; track t.name) {
            <button
              type="button"
              class="lab-btn term-chip"
              [class.is-active]="selected().name === t.name"
              (click)="select(t)"
            >
              {{ t.name }}
            </button>
          }
        </div>

        <div class="lab-panel detail-panel">
          <p class="detail-name">{{ selected().name }}</p>

          <div class="detail-block">
            <p class="detail-label mono">PLAIN LANGUAGE</p>
            <p class="detail-text">{{ selected().simple }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">TECHNICAL DEFINITION</p>
            <p class="detail-text">{{ selected().technical }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">WHY IT EXISTS</p>
            <p class="detail-text">{{ selected().why }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">WHEN TO USE IT</p>
            <p class="detail-text">{{ selected().when }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">TRADE-OFFS</p>
            <p class="detail-text">{{ selected().tradeoffs }}</p>
          </div>

          <div class="detail-block related-block">
            <p class="detail-label mono">RELATED TERMS</p>
            <div class="related-row">
              @for (r of selected().related; track r) {
                <button type="button" class="lab-btn related-chip" (click)="selectByName(r)">{{ r }}</button>
              }
            </div>
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

    .term-grid { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .term-chip { font-size: 0.8125rem; }

    .detail-panel { margin-top: 24px; }
    .detail-name { font-size: 1.375rem; font-weight: 700; color: var(--accent-strong); }

    .detail-block { margin-top: 18px; }
    .detail-block:first-of-type { margin-top: 20px; }
    .detail-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 6px; }
    .detail-text { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; }

    .related-block { padding-top: 16px; border-top: 1px solid var(--border); }
    .related-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .related-chip { font-size: 0.75rem; padding: 6px 12px; color: var(--text-muted); }
    .related-chip:hover { color: var(--text); }
  `,
})
export class TerminologyMap {
  protected readonly terms = TERMS;
  protected readonly selected = signal<Term>(TERMS[0]);

  select(t: Term): void {
    this.selected.set(t);
  }

  selectByName(name: string): void {
    const t = this.terms.find((term) => term.name === name);
    if (t) this.selected.set(t);
  }
}
