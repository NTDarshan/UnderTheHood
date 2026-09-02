import { Component, computed, signal } from '@angular/core';

interface Pattern {
  id: string;
  name: string;
  problem: string;
  mechanism: string;
  visual: 'lanes' | 'queue' | 'pipeline' | 'fanout' | 'actor';
  tradeoff: string;
  usefulWhere: string;
}

const PATTERNS: Pattern[] = [
  {
    id: 'thread-pool',
    name: 'Thread pool',
    problem: 'Spawning a new OS thread per unit of work is expensive and unbounded thread growth can exhaust memory and scheduler capacity.',
    mechanism: 'A fixed set of worker threads is created up front. Work items are submitted to a shared queue; idle workers pull the next item when free.',
    visual: 'lanes',
    tradeoff: 'Caps resource usage and avoids per-task thread creation cost, but a pool sized too small becomes its own bottleneck under bursty load.',
    usefulWhere: 'Web server request handling, background job processing, any CPU- or I/O-bound workload with many short-lived tasks.',
  },
  {
    id: 'producer-consumer',
    name: 'Producer-consumer',
    problem: 'Producers generate work faster or slower than consumers can process it, and coupling them directly means one side blocks or overwhelms the other.',
    mechanism: 'A bounded buffer/queue sits between producers and consumers. Producers push items in; consumers pull them out at their own pace.',
    visual: 'queue',
    tradeoff: 'Decouples rate of production from rate of consumption, but the buffer needs a bound — an unbounded queue just relocates the overload problem to memory.',
    usefulWhere: 'Log ingestion pipelines, message brokers, video/audio streaming buffers.',
  },
  {
    id: 'work-queue',
    name: 'Work queue',
    problem: 'A single dispatcher assigning work directly to workers creates a coordination bottleneck and uneven load distribution.',
    mechanism: 'Work items are pushed onto a shared queue; any available worker pulls the next item, naturally load-balancing without central assignment.',
    visual: 'queue',
    tradeoff: 'Self-balancing and simple, but ordering guarantees are weak — workers can finish out of submission order.',
    usefulWhere: 'Distributed task processing (Celery, Sidekiq, SQS-backed workers), batch job systems.',
  },
  {
    id: 'actor',
    name: 'Actor / message passing',
    problem: 'Shared mutable state accessed by multiple concurrent units requires careful locking, and locking mistakes cause races or deadlocks.',
    mechanism: 'Each actor owns its state privately and processes messages from its mailbox one at a time — communication happens only via async messages, never shared memory.',
    visual: 'actor',
    tradeoff: 'Eliminates whole classes of data races by construction, but message-passing overhead and mailbox back-pressure become new concerns.',
    usefulWhere: 'Erlang/Elixir (OTP), Akka-based systems, game server entity simulation, telecom switching systems.',
  },
  {
    id: 'async-io',
    name: 'Async I/O',
    problem: 'A thread blocked waiting on network or disk I/O sits idle, wasting a scheduling slot that could serve other work.',
    mechanism: 'A single thread (or small pool) issues non-blocking I/O calls and registers a callback/continuation; the event loop resumes the task when the I/O completes.',
    visual: 'pipeline',
    tradeoff: 'Achieves very high concurrency per thread, but a single long-running CPU-bound task on the event loop stalls everything else sharing it.',
    usefulWhere: 'Node.js servers, async Python (asyncio), high-concurrency API gateways, chat/notification services.',
  },
  {
    id: 'pipeline',
    name: 'Pipeline',
    problem: 'A multi-stage transformation run as one monolithic sequential pass cannot overlap the work of different stages.',
    mechanism: 'Work is split into ordered stages, each running concurrently on its own thread/queue; item N can be in stage 3 while item N+1 is still in stage 1.',
    visual: 'pipeline',
    tradeoff: 'Increases throughput via overlap, but total latency for a single item is not reduced — and the slowest stage caps overall throughput.',
    usefulWhere: 'Video/image processing pipelines, compiler passes, CI build stages, ETL data pipelines.',
  },
  {
    id: 'fanout-fanin',
    name: 'Fan-out/fan-in',
    problem: 'Several independent subtasks needed to answer one request are run sequentially, so the total time is the sum of every subtask.',
    mechanism: 'The request is dispatched ("fanned out") to all subtasks at once; the caller waits for all of them and combines ("fans in") the results.',
    visual: 'fanout',
    tradeoff: 'Total latency drops to roughly the slowest subtask instead of the sum, but the caller becomes as fragile as its slowest or least-reliable dependency.',
    usefulWhere: 'API gateways aggregating multiple backend calls, search systems querying multiple shards, map-reduce style batch jobs.',
  },
  {
    id: 'bounded-concurrency',
    name: 'Bounded concurrency',
    problem: 'Launching unlimited concurrent operations against a downstream resource (a DB, an external API) can overwhelm it or exhaust local resources like sockets.',
    mechanism: 'A semaphore or limiter caps how many operations may be in flight simultaneously; further requests wait until a slot frees up.',
    visual: 'lanes',
    tradeoff: 'Protects downstream systems and local resources, but an overly tight limit under-utilizes available capacity and adds queueing delay.',
    usefulWhere: 'Rate-limited third-party API clients, connection-pooled database access, controlled parallel file uploads/downloads.',
  },
];

type FanoutMode = 'sequential' | 'concurrent';

interface FanoutTask {
  id: string;
  label: string;
  ms: number;
}

const FANOUT_TASKS: FanoutTask[] = [
  { id: 'user', label: 'User profile', ms: 120 },
  { id: 'orders', label: 'Orders', ms: 260 },
  { id: 'recs', label: 'Recommendations', ms: 400 },
  { id: 'notifs', label: 'Notifications', ms: 90 },
];

@Component({
  selector: 'app-design-patterns-fanout',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="design-patterns-fanout">
      <div class="container">
        <p class="lab-index mono">47-48 — CONCURRENCY DESIGN PATTERNS</p>
        <h2 class="lab-title">Concurrency design patterns</h2>
        <p class="lab-lede">
          Most concurrent systems are built from a handful of recurring patterns. Click one to see the problem it
          solves, how it works, and where it trades something away.
        </p>

        <div class="lab-panel">
          <div class="pattern-chips">
            @for (p of patterns; track p.id) {
              <button
                type="button"
                class="pattern-chip mono"
                [class.is-active]="activeId() === p.id"
                [attr.aria-pressed]="activeId() === p.id"
                (click)="select(p.id)"
              >
                {{ p.name }}
              </button>
            }
          </div>

          @if (active(); as p) {
            <div class="pattern-detail">
              <p class="detail-title mono">{{ p.name }}</p>

              <p class="detail-label mono">PROBLEM IT SOLVES</p>
              <p class="detail-text">{{ p.problem }}</p>

              <p class="detail-label mono">MECHANISM</p>
              <p class="detail-text">{{ p.mechanism }}</p>

              <p class="detail-label mono">VISUALIZATION</p>
              <div class="mini-viz">
                @switch (p.visual) {
                  @case ('lanes') {
                    <div class="viz-lanes">
                      @for (n of [1, 2, 3]; track n) {
                        <div class="lab-node viz-node">worker {{ n }}</div>
                      }
                    </div>
                  }
                  @case ('queue') {
                    <div class="viz-queue">
                      <div class="lab-node viz-node">producer</div>
                      <span class="lab-flow-arrow">&rarr;</span>
                      <div class="viz-buffer mono">[ &nbsp;&nbsp;&nbsp; queue &nbsp;&nbsp;&nbsp; ]</div>
                      <span class="lab-flow-arrow">&rarr;</span>
                      <div class="lab-node viz-node">consumer</div>
                    </div>
                  }
                  @case ('pipeline') {
                    <div class="viz-pipeline">
                      @for (n of ['stage 1', 'stage 2', 'stage 3']; track n; let last = $last) {
                        <div class="lab-node viz-node">{{ n }}</div>
                        @if (!last) {
                          <span class="lab-flow-arrow">&rarr;</span>
                        }
                      }
                    </div>
                  }
                  @case ('fanout') {
                    <div class="viz-fanout">
                      <div class="lab-node viz-node viz-origin">caller</div>
                      <div class="viz-fanout-targets">
                        @for (n of ['A', 'B', 'C', 'D']; track n) {
                          <div class="lab-node viz-node">{{ n }}</div>
                        }
                      </div>
                    </div>
                  }
                  @case ('actor') {
                    <div class="viz-actor">
                      <div class="lab-node viz-node">actor A</div>
                      <span class="lab-flow-arrow">&rarr;</span>
                      <div class="viz-buffer mono">mailbox</div>
                      <span class="lab-flow-arrow">&rarr;</span>
                      <div class="lab-node viz-node">actor B</div>
                    </div>
                  }
                }
              </div>

              <p class="detail-label mono">TRADE-OFF</p>
              <p class="detail-text">{{ p.tradeoff }}</p>

              <p class="detail-label mono">COMMONLY USEFUL IN</p>
              <p class="detail-text">{{ p.usefulWhere }}</p>
            </div>
          }
        </div>

        <div class="lab-panel">
          <p class="section-label mono">WORKED EXAMPLE — FAN-OUT/FAN-IN</p>
          <p class="lab-lede small">
            One incoming request needs data from four independent sources: user profile, orders,
            recommendations, and notifications. Toggle between handling them sequentially and fanning them out
            concurrently.
          </p>

          <div class="lab-btn-row" role="group" aria-label="Fan-out mode">
            <button type="button" class="lab-btn" [class.lab-btn-primary]="mode() === 'sequential'" [attr.aria-pressed]="mode() === 'sequential'" (click)="setMode('sequential')">Sequential</button>
            <button type="button" class="lab-btn" [class.lab-btn-primary]="mode() === 'concurrent'" [attr.aria-pressed]="mode() === 'concurrent'" (click)="setMode('concurrent')">Concurrent fan-out/fan-in</button>
          </div>

          <div class="fanout-viz" aria-live="polite">
            @for (t of tasks; track t.id) {
              <div class="fanout-row">
                <span class="fanout-label mono">{{ t.label }}</span>
                <div class="fanout-track">
                  <div
                    class="fanout-bar"
                    [style.width.%]="barWidthPct(t)"
                    [style.margin-left.%]="barOffsetPct(t)"
                  ></div>
                </div>
                <span class="fanout-ms mono">{{ t.ms }}ms</span>
              </div>
            }
          </div>

          <p class="total-time mono">
            Total time: <strong>{{ totalTimeMs() }}ms</strong>
            {{ mode() === 'sequential' ? '(sum of all four calls)' : '(≈ slowest call, since all four run at once)' }}
          </p>

          <p class="lab-note">
            Sequential: A finishes, then B starts, then C, then D — total time is the sum of every call.
            Concurrent fan-out/fan-in: all four are requested at once and the response waits only for the last
            one to finish — total time collapses to roughly the slowest single call.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .pattern-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .pattern-chip { padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); font-size: 0.8125rem; cursor: pointer; }
    .pattern-chip.is-active { border-color: var(--accent); color: var(--accent-strong); }

    .pattern-detail { margin-top: 20px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-elevated); }
    .detail-title { font-size: 1rem; color: var(--text); margin: 0 0 14px; }
    .detail-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.05em; margin: 14px 0 6px; }
    .detail-label:first-of-type { margin-top: 0; }
    .detail-text { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; margin: 0; }

    .mini-viz { padding: 14px; border: 1px dashed var(--border); border-radius: var(--radius-sm); background: var(--surface); overflow-x: auto; }
    .viz-lanes { display: flex; gap: 10px; flex-wrap: wrap; }
    .viz-queue, .viz-pipeline, .viz-actor { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .viz-node { padding: 8px 12px; font-size: 0.75rem; }
    .viz-buffer { padding: 8px 12px; border: 1px solid var(--c-queue); color: var(--c-queue); border-radius: var(--radius-sm); font-size: 0.75rem; }
    .viz-fanout { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .viz-fanout-targets { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .viz-origin { border-color: var(--accent); color: var(--accent-strong); }

    .section-label { font-size: 0.75rem; color: var(--accent-2); letter-spacing: 0.06em; margin: 0 0 10px; }
    .lab-lede.small { font-size: 0.875rem; margin-bottom: 18px; }

    .fanout-viz { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .fanout-row { display: grid; grid-template-columns: 130px 1fr 60px; align-items: center; gap: 12px; }
    .fanout-label { font-size: 0.75rem; color: var(--text-faint); }
    .fanout-track { position: relative; height: 16px; border-radius: 4px; background: var(--surface-elevated); border: 1px solid var(--border); overflow: hidden; }
    .fanout-bar { height: 100%; background: var(--c-task); border-radius: 4px; transition: width 0.3s ease, margin-left 0.3s ease; }
    .fanout-ms { font-size: 0.75rem; color: var(--text-muted); text-align: right; }

    .total-time { font-size: 0.9375rem; color: var(--text); margin: 0 0 14px; }
    .total-time strong { color: var(--accent-strong); }
  `,
})
export class DesignPatternsFanout {
  protected readonly patterns = PATTERNS;
  protected readonly activeId = signal<string | null>('thread-pool');
  protected readonly active = computed<Pattern | undefined>(() =>
    this.patterns.find((p) => p.id === this.activeId()),
  );

  protected select(id: string): void {
    this.activeId.set(this.activeId() === id ? null : id);
  }

  protected readonly tasks = FANOUT_TASKS;
  protected readonly mode = signal<FanoutMode>('sequential');

  protected setMode(m: FanoutMode): void {
    this.mode.set(m);
  }

  private cumulativeStart(t: FanoutTask): number {
    if (this.mode() === 'concurrent') return 0;
    const idx = this.tasks.findIndex((x) => x.id === t.id);
    return this.tasks.slice(0, idx).reduce((s, x) => s + x.ms, 0);
  }

  protected readonly totalTimeMs = computed(() => {
    if (this.mode() === 'sequential') {
      return this.tasks.reduce((s, t) => s + t.ms, 0);
    }
    return Math.max(...this.tasks.map((t) => t.ms));
  });

  protected barWidthPct(t: FanoutTask): number {
    const total = this.totalTimeMs();
    return total === 0 ? 0 : (t.ms / total) * 100;
  }

  protected barOffsetPct(t: FanoutTask): number {
    const total = this.totalTimeMs();
    if (total === 0) return 0;
    return (this.cumulativeStart(t) / total) * 100;
  }
}
