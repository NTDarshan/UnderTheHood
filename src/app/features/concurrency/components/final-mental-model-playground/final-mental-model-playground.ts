import { Component, OnDestroy, computed, signal } from '@angular/core';

type ArchNodeId =
  | 'clients'
  | 'lb'
  | 'api'
  | 'queue'
  | 'limit'
  | 'handlers'
  | 'pool'
  | 'dbpool'
  | 'db'
  | 'cache'
  | 'extqueue'
  | 'external';

interface ArchNode {
  id: ArchNodeId;
  label: string;
  colorVar: string;
  supporting?: boolean;
  workHere: string;
  canBlock: string;
  canRunConcurrently: string;
  sharedResource: string;
  bottleneck: string;
  failureMode: string;
  concurrencyControl: string;
}

const ARCH_MAIN: ArchNodeId[] = ['clients', 'lb', 'api', 'queue', 'limit', 'handlers', 'pool', 'dbpool', 'db'];
const ARCH_SUPPORTING: ArchNodeId[] = ['cache', 'extqueue', 'external'];

const ARCH_NODES: Record<ArchNodeId, ArchNode> = {
  clients: {
    id: 'clients', label: 'Clients', colorVar: '--c-task',
    workHere: 'Originate requests independently, with no coordination between them.',
    canBlock: 'Nothing on the server blocks here — clients block on their own network round trip.',
    canRunConcurrently: 'Every client request is independent and fully concurrent with every other.',
    sharedResource: 'None — this is the one node with no shared state.',
    bottleneck: 'Never the bottleneck itself, but the source of the load that reveals every other bottleneck.',
    failureMode: 'A thundering herd (many clients retrying at once) can look like an attack on everything downstream.',
    concurrencyControl: 'Client-side: request coalescing, exponential backoff with jitter on retry.',
  },
  lb: {
    id: 'lb', label: 'Load Balancer', colorVar: '--c-cpu',
    workHere: 'Accepts every inbound connection and routes it to one of many API servers.',
    canBlock: 'Can block briefly on health-check state or a full connection table.',
    canRunConcurrently: 'Yes — routes many connections at once, typically on an async event loop itself.',
    sharedResource: 'Its own connection table and the pool of healthy backend servers.',
    bottleneck: 'Rare, but a single LB instance can saturate its NIC or connection limit under extreme fan-in.',
    failureMode: 'Routing to an already-overloaded server amplifies that server\'s failure instead of isolating it.',
    concurrencyControl: 'Least-connections or round-robin routing, active health checks, connection draining.',
  },
  api: {
    id: 'api', label: 'API Servers', colorVar: '--c-cpu',
    workHere: 'Parses each request, authenticates it, and dispatches it into the request-handling pipeline.',
    canBlock: 'Blocks on CPU if oversubscribed, or on downstream calls if not truly async.',
    canRunConcurrently: 'Yes across server instances (horizontal), and across requests within one instance (concurrent, not necessarily parallel on one core).',
    sharedResource: 'The CPU cores of the instance, and any in-process caches.',
    bottleneck: 'CPU saturation once request-parsing and business logic outpace available cores.',
    failureMode: 'One slow request path holding a thread can starve unrelated fast requests behind it.',
    concurrencyControl: 'A per-instance concurrency limit; horizontal scaling behind the load balancer.',
  },
  queue: {
    id: 'queue', label: 'Request Queues', colorVar: '--c-queue',
    workHere: 'Buffers accepted requests that are waiting for a free handler, absorbing bursts.',
    canBlock: 'The queue itself never blocks — but everything waiting in it is, by definition, waiting.',
    canRunConcurrently: 'N/A — a queue is inherently sequential bookkeeping, though enqueue/dequeue can be lock-free.',
    sharedResource: 'The queue\'s memory allocation — bounded or it grows without limit.',
    bottleneck: 'An unbounded queue hides an overloaded downstream stage until memory or latency collapses.',
    failureMode: 'Queueing delay dominates total latency long before any handler is actually slow.',
    concurrencyControl: 'A bounded size plus backpressure — reject or shed load once full, don\'t just keep buffering.',
  },
  limit: {
    id: 'limit', label: 'Concurrency Limit', colorVar: '--c-lock',
    workHere: 'Caps how many requests are in flight at once, admitting new work only as old work completes.',
    canBlock: 'By design — it deliberately holds back excess requests rather than let them all proceed.',
    canRunConcurrently: 'The gate itself is a small shared counter, usually implemented with an atomic or a semaphore.',
    sharedResource: 'A single shared counter or semaphore that every request must pass through.',
    bottleneck: 'A limit set too low starves throughput even when spare capacity exists downstream.',
    failureMode: 'Set too high, it stops protecting anything; set too low, it becomes an artificial ceiling.',
    concurrencyControl: 'Semaphore or token-bucket admission control, tuned to downstream capacity.',
  },
  handlers: {
    id: 'handlers', label: 'Async Request Handlers', colorVar: '--c-cpu',
    workHere: 'Executes the actual business logic for an admitted request — validation, orchestration, response building.',
    canBlock: 'Blocks whenever it awaits a downstream call (DB, cache, external API) unless truly non-blocking end to end.',
    canRunConcurrently: 'Many handlers run concurrently, interleaved on the event loop or thread pool.',
    sharedResource: 'The event loop (if async) or the thread pool (if blocking) that executes them.',
    bottleneck: 'A handler that blocks synchronously defeats an otherwise async design and stalls its whole worker.',
    failureMode: 'An unhandled exception or unbounded await can leak a handler slot forever.',
    concurrencyControl: 'Structured concurrency (await everything, leak nothing), timeouts, cancellation tokens.',
  },
  pool: {
    id: 'pool', label: 'Thread Pool / Event Loop', colorVar: '--c-thread',
    workHere: 'The actual execution substrate — a fixed set of OS threads, or a single-threaded event loop dispatching callbacks.',
    canBlock: 'A blocking call on a thread-pool thread ties it up entirely; on an event loop it stalls everything.',
    canRunConcurrently: 'Threads run truly in parallel across cores; an event loop interleaves concurrently on one core (plus worker threads for CPU work).',
    sharedResource: 'CPU cores, and for a thread pool, the fixed number of worker threads itself.',
    bottleneck: 'Too few threads underuses cores; far too many causes context-switch thrashing that reduces real throughput.',
    failureMode: 'Thread-pool exhaustion — every worker blocked on a slow dependency — silently stalls all new work.',
    concurrencyControl: 'Size the pool to the workload (CPU-bound: ~core count; I/O-bound: higher, or switch to async).',
  },
  dbpool: {
    id: 'dbpool', label: 'Database Connection Pool', colorVar: '--c-lock',
    workHere: 'Hands out a limited number of pre-established database connections to handlers that need one.',
    canBlock: 'Yes — a handler waits here if every connection is currently checked out.',
    canRunConcurrently: 'Each checked-out connection serves one query at a time; the pool serves many handlers over time.',
    sharedResource: 'The fixed set of open connections, which is itself bounded by what the database can accept.',
    bottleneck: 'A pool smaller than concurrent demand becomes the queueing point, no matter how fast the API tier is.',
    failureMode: 'Connection exhaustion cascades into request queueing and timeouts that look like a "database problem" but are a pool-sizing problem.',
    concurrencyControl: 'Size the pool to what the database can serve, not to how many handlers exist; add a checkout timeout.',
  },
  db: {
    id: 'db', label: 'Database', colorVar: '--c-lock',
    workHere: 'Executes queries, enforces constraints, and is the durable source of truth.',
    canBlock: 'Extensively — on row locks, table locks, I/O, and its own connection limits.',
    canRunConcurrently: 'Many queries run concurrently under MVCC or locking, but conflicting writes serialize.',
    sharedResource: 'Rows, tables, indexes, and disk I/O bandwidth — all genuinely shared, unlike most of the stack above it.',
    bottleneck: 'Very often the true bottleneck — everything above it can scale horizontally; one primary database usually can\'t, as easily.',
    failureMode: 'Lock contention or a slow query can serialize otherwise-independent requests without any code bug.',
    concurrencyControl: 'Transactions with an appropriate isolation level, indexes, read replicas, and query timeouts.',
  },
  cache: {
    id: 'cache', label: 'Cache', colorVar: '--c-task', supporting: true,
    workHere: 'Serves hot reads directly from memory, skipping the database entirely on a hit.',
    canBlock: 'Rarely — cache lookups are fast, but a cache-aside miss stampede can hammer the DB simultaneously.',
    canRunConcurrently: 'Yes, heavily — reads scale near-linearly since there\'s no write contention on a hit.',
    sharedResource: 'The cache\'s own memory and, on a miss storm, the database it protects.',
    bottleneck: 'A low hit ratio turns the cache into pure overhead instead of relief.',
    failureMode: 'Cache stampede — many concurrent misses on the same hot key all regenerate it at once.',
    concurrencyControl: 'Request coalescing on miss, jittered TTLs, and a lock or "single-flight" per key.',
  },
  extqueue: {
    id: 'extqueue', label: 'Queue (background)', colorVar: '--c-queue', supporting: true,
    workHere: 'Decouples slow or non-critical work from the request path, to be processed by workers later.',
    canBlock: 'Producers never block on it (if bounded correctly); consumers block waiting for new items.',
    canRunConcurrently: 'Multiple workers dequeue and process concurrently, scaled independently of the API tier.',
    sharedResource: 'The queue\'s storage/broker and, at the far end, whatever the workers write to.',
    bottleneck: 'Too few workers vs. arrival rate grows backlog and lag without an request-path symptom.',
    failureMode: 'A poison message or crashing worker can wedge consumption without any request-path error.',
    concurrencyControl: 'Visibility timeouts, dead-letter queues, and worker autoscaling on backlog depth.',
  },
  external: {
    id: 'external', label: 'External Services', colorVar: '--c-thread', supporting: true,
    workHere: 'Third-party APIs the system depends on — payments, email, geocoding — outside its own control.',
    canBlock: 'Yes, and by far the least predictably — their latency and availability are someone else\'s SLA.',
    canRunConcurrently: 'Concurrent calls are possible, but many third parties enforce their own rate limits.',
    sharedResource: 'The connection/thread that\'s waiting on the external call, and any shared client-side rate-limit budget.',
    bottleneck: 'A slow external dependency without a timeout becomes the slowest part of every request that touches it.',
    failureMode: 'Cascading failure — a hung external call ties up local threads until the whole service is starved.',
    concurrencyControl: 'Timeouts, circuit breakers, bulkheads (isolate its thread/connection pool from everything else).',
  },
};

interface FlowStep {
  id: string;
  label: string;
  detail: string;
  branch?: { yes: string; no: string };
}

const FLOW: FlowStep[] = [
  { id: 'start', label: 'START WITH WORK', detail: 'A unit of work arrives — a request, a job, a computation.' },
  { id: 'shape', label: 'IS IT CPU-BOUND OR I/O-BOUND?', detail: 'CPU-bound work needs cores; I/O-bound work mostly waits on something else.' },
  { id: 'independent', label: 'CAN TASKS PROGRESS INDEPENDENTLY?', detail: 'If tasks don\'t depend on each other\'s results, they can be structured concurrently.' },
  { id: 'concurrency', label: 'CONCURRENCY', detail: 'Multiple tasks are in flight and making independent progress, interleaved or not.' },
  { id: 'simultaneous', label: 'CAN THEY EXECUTE SIMULTANEOUSLY?', detail: 'Simultaneity needs multiple actual execution units — cores, machines.' },
  { id: 'parallelism', label: 'PARALLELISM', detail: 'Tasks literally run at the same instant on separate cores or machines.' },
  { id: 'model', label: 'WHAT EXECUTION MODEL?', detail: 'Threads (OS-scheduled, preemptive), async/event loop (cooperative), or lightweight concurrency (green threads / goroutines).' },
  { id: 'shared', label: 'IS STATE SHARED?', detail: 'Shared mutable state accessed from multiple tasks is where correctness gets hard.',
    branch: { yes: 'Synchronization, atomicity, or message passing — pick one deliberately.', no: 'Simpler concurrency — no locks needed if nothing is shared.' } },
  { id: 'resources', label: 'WHAT RESOURCES CAN SATURATE?', detail: 'CPU, memory, database, connections, network, external services — name the real ceiling.' },
  { id: 'add', label: 'ADD: LIMITS / TIMEOUTS / CANCELLATION / BACKPRESSURE / RETRIES / OBSERVABILITY', detail: 'The controls that keep an overloaded system degrading gracefully instead of collapsing.' },
  { id: 'measure', label: 'MEASURE: LATENCY / THROUGHPUT / UTILIZATION / QUEUE DEPTH', detail: 'You cannot tune what you don\'t measure — then the cycle starts again on the next unit of work.' },
];

type TaskState = 'READY' | 'RUNNING' | 'WAITING' | 'BLOCKED' | 'COMPLETED';

interface TaskChip {
  id: number;
  state: TaskState;
}

@Component({
  selector: 'app-final-mental-model-playground',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="final-mental-model">
      <div class="container">
        <p class="lab-index">52-53,56 — THE COMPLETE MENTAL MODEL</p>
        <h2 class="lab-title">The complete mental model — and the concurrency playground</h2>
        <p class="lab-lede">
          Everything you've learned lives in one architecture. Click any stage to see exactly what it does, what
          can go wrong there, and how concurrency is controlled at that layer.
        </p>

        <div class="lab-panel">
          <h3 class="panel-heading">The end-to-end path a request takes</h3>
          <div class="arch-flow">
            @for (id of archMain; track id; let last = $last) {
              <button
                type="button"
                class="lab-node arch-node"
                [style.--node-color]="'var(' + archNodes[id].colorVar + ')'"
                [class.is-active]="selectedNode() === id"
                [attr.aria-pressed]="selectedNode() === id"
                (click)="selectNode(id)"
              >
                {{ archNodes[id].label }}
              </button>
              @if (!last) {
                <span class="lab-flow-arrow arch-arrow" aria-hidden="true">&rarr;</span>
              }
            }
          </div>

          <p class="lab-note supporting-caption mono">SUPPORTING SYSTEMS</p>
          <div class="arch-flow supporting-row">
            @for (id of archSupporting; track id) {
              <button
                type="button"
                class="lab-node arch-node arch-node-supporting"
                [style.--node-color]="'var(' + archNodes[id].colorVar + ')'"
                [class.is-active]="selectedNode() === id"
                [attr.aria-pressed]="selectedNode() === id"
                (click)="selectNode(id)"
              >
                {{ archNodes[id].label }}
              </button>
            }
          </div>

          <div class="lab-panel node-detail" aria-live="polite">
            <p class="detail-name">{{ archNodes[selectedNode()].label }}</p>
            <dl class="detail-grid">
              <dt>What work happens here</dt>
              <dd>{{ archNodes[selectedNode()].workHere }}</dd>
              <dt>What can block</dt>
              <dd>{{ archNodes[selectedNode()].canBlock }}</dd>
              <dt>What can run concurrently</dt>
              <dd>{{ archNodes[selectedNode()].canRunConcurrently }}</dd>
              <dt>What resource is shared</dt>
              <dd>{{ archNodes[selectedNode()].sharedResource }}</dd>
              <dt>What can bottleneck</dt>
              <dd>{{ archNodes[selectedNode()].bottleneck }}</dd>
              <dt>What failure can occur</dt>
              <dd>{{ archNodes[selectedNode()].failureMode }}</dd>
              <dt>How concurrency is controlled here</dt>
              <dd>{{ archNodes[selectedNode()].concurrencyControl }}</dd>
            </dl>
          </div>
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">The final decision flow</h3>
          <p class="lab-note">
            Every concurrency decision in this chapter reduces to this one path. Click a step for the reasoning.
          </p>
          <div class="flow-map">
            @for (step of flow; track step.id; let last = $last) {
              <button
                type="button"
                class="lab-node flow-node"
                [class.is-active]="selectedFlow() === step.id"
                [attr.aria-pressed]="selectedFlow() === step.id"
                (click)="selectedFlow.set(step.id)"
              >
                {{ step.label }}
              </button>
              @if (!last) {
                <div class="lab-flow-arrow flow-arrow" aria-hidden="true">&darr;</div>
              }
            }
          </div>

          <div class="lab-panel node-detail">
            <p class="detail-name">{{ activeFlowStep().label }}</p>
            <p class="detail-text">{{ activeFlowStep().detail }}</p>
            @if (activeFlowStep().branch; as branch) {
              <div class="branch-row">
                <span class="pill pill-yes">YES &rarr; {{ branch.yes }}</span>
                <span class="pill pill-no">NO &rarr; {{ branch.no }}</span>
              </div>
            }
          </div>
        </div>

        <div class="lab-panel playground-panel">
          <h3 class="panel-heading">The concurrency playground</h3>
          <p class="lab-note">
            One last simulator, everything at once. Tune the system, run it, and click any task chip to inspect its
            lifecycle state.
          </p>

          <div class="controls-grid">
            <label class="lab-field">
              <span>Requests/sec: {{ requestsPerSec() }}</span>
              <input type="range" min="1" max="40" step="1" [value]="requestsPerSec()"
                     (input)="requestsPerSec.set(+$any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>CPU cores: {{ cpuCores() }}</span>
              <input type="range" min="1" max="8" step="1" [value]="cpuCores()"
                     (input)="cpuCores.set(+$any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>Thread count: {{ threadCount() }}</span>
              <input type="range" min="1" max="64" step="1" [value]="threadCount()"
                     (input)="threadCount.set(+$any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>Concurrency limit: {{ concurrencyLimit() }}</span>
              <input type="range" min="1" max="64" step="1" [value]="concurrencyLimit()"
                     (input)="concurrencyLimit.set(+$any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>DB connections: {{ dbConnections() }}</span>
              <input type="range" min="1" max="32" step="1" [value]="dbConnections()"
                     (input)="dbConnections.set(+$any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>I/O latency: {{ ioLatencyMs() }} ms</span>
              <input type="range" min="5" max="400" step="5" [value]="ioLatencyMs()"
                     (input)="ioLatencyMs.set(+$any($event.target).value)" />
            </label>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" [attr.aria-pressed]="lockContention()"
                    (click)="lockContention.set(!lockContention())">
              Lock contention: {{ lockContention() ? 'HIGH' : 'low' }}
            </button>
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="start()">Run</button>
            <button type="button" class="lab-btn" [disabled]="!isRunning()" (click)="pause()">Pause</button>
            <button type="button" class="lab-btn" (click)="resetPlayground()">Reset</button>
          </div>

          <div class="pg-metric-grid">
            <div class="pg-metric"><p class="metric-label mono">CPU</p><p class="metric-value">{{ pgMetrics().cpuPct }}%</p></div>
            <div class="pg-metric"><p class="metric-label mono">THROUGHPUT</p><p class="metric-value">{{ pgMetrics().throughput }}/s</p></div>
            <div class="pg-metric"><p class="metric-label mono">LATENCY</p><p class="metric-value">{{ pgMetrics().latencyMs }}ms</p></div>
            <div class="pg-metric"><p class="metric-label mono">QUEUE DEPTH</p><p class="metric-value">{{ pgMetrics().queueDepth }}</p></div>
            <div class="pg-metric"><p class="metric-label mono">ACTIVE</p><p class="metric-value">{{ pgMetrics().active }}</p></div>
            <div class="pg-metric"><p class="metric-label mono">WAITING</p><p class="metric-value">{{ pgMetrics().waiting }}</p></div>
          </div>

          <div class="task-grid" role="list" aria-label="In-flight tasks" aria-live="polite">
            @for (task of tasks(); track task.id) {
              <button
                type="button"
                class="task-chip"
                role="listitem"
                [class]="'state-' + task.state.toLowerCase()"
                [class.is-selected]="selectedTask() === task.id"
                [attr.aria-pressed]="selectedTask() === task.id"
                (click)="selectedTask.set(task.id)"
              >
                {{ task.id }}
              </button>
            }
          </div>

          @if (selectedTaskInfo(); as info) {
            <p class="lab-note task-note mono">
              TASK {{ info.id }} — STATE: <strong>{{ info.state }}</strong>
            </p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .panel-heading { font-size: 1.125rem; color: var(--text); margin: 0 0 4px; }

    .arch-flow { margin-top: 18px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .arch-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      padding: 10px 14px;
      border: 1px solid var(--node-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      transition: box-shadow 0.2s ease, color 0.2s ease, background 0.2s ease;
    }
    .arch-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .arch-node.is-active { color: var(--text); background: color-mix(in srgb, var(--node-color) 16%, var(--surface-elevated)); box-shadow: 0 0 0 2px var(--node-color); }
    .arch-arrow { font-size: 0.9rem; }
    .arch-node-supporting { border-style: dashed; }
    .supporting-caption { margin-top: 22px; margin-bottom: 0; }
    .supporting-row { margin-top: 10px; }

    .node-detail { margin-top: 20px; background: var(--surface-elevated); }
    .detail-name { font-size: 1.0625rem; font-weight: 700; color: var(--accent-strong); margin: 0 0 12px; }
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 3px 12px; margin: 0; }
    @media (min-width: 780px) { .detail-grid { grid-template-columns: 240px 1fr; } }
    .detail-grid dt { font-size: 0.75rem; color: var(--text-faint); margin-top: 10px; }
    .detail-grid dd { margin: 2px 0 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.55; }
    .detail-text { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; margin: 0; }

    .flow-map { margin-top: 18px; display: flex; flex-direction: column; align-items: center; }
    .flow-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      width: 100%;
      max-width: 560px;
      text-align: center;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      transition: box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
    }
    .flow-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .flow-node.is-active { color: var(--accent-strong); background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated)); box-shadow: 0 0 0 2px var(--accent); }
    .flow-arrow { margin: 2px 0; }

    .branch-row { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; }
    .branch-row .pill { white-space: normal; text-align: left; }

    .playground-panel { border-color: var(--accent-2); }
    .controls-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .controls-grid { grid-template-columns: repeat(3, 1fr); } }
    .controls-grid input[type='range'] { accent-color: var(--accent-2); width: 100%; }

    .pg-metric-grid { margin-top: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    @media (min-width: 640px) { .pg-metric-grid { grid-template-columns: repeat(6, 1fr); } }
    .pg-metric { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; text-align: center; }
    .metric-label { font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .metric-value { margin-top: 4px; font-size: 1.0625rem; font-weight: 700; color: var(--text); }

    .task-grid { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 6px; }
    .task-chip {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      min-width: 34px;
      text-align: center;
      padding: 6px 8px;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      color: var(--text-faint);
      transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }
    .task-chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
    .task-chip.is-selected { box-shadow: 0 0 0 2px currentColor; }
    .task-chip.state-ready { border-color: var(--idle); color: var(--idle); }
    .task-chip.state-running { border-color: var(--running); color: var(--running); }
    .task-chip.state-waiting { border-color: var(--waiting); color: var(--waiting); }
    .task-chip.state-blocked { border-color: var(--blocked); color: var(--blocked); }
    .task-chip.state-completed { border-color: var(--border); color: var(--text-faint); opacity: 0.5; }

    .task-note { margin-top: 14px; }
  `,
})
export class FinalMentalModelPlayground implements OnDestroy {
  // --- Architecture map ---
  protected readonly archNodes = ARCH_NODES;
  protected readonly archMain = ARCH_MAIN;
  protected readonly archSupporting = ARCH_SUPPORTING;
  protected readonly selectedNode = signal<ArchNodeId>('clients');

  protected selectNode(id: ArchNodeId): void {
    this.selectedNode.set(id);
  }

  // --- Decision flow ---
  protected readonly flow = FLOW;
  protected readonly selectedFlow = signal<string>(FLOW[0].id);
  protected readonly activeFlowStep = computed(
    () => this.flow.find((s) => s.id === this.selectedFlow()) ?? FLOW[0],
  );

  // --- Playground ---
  protected readonly requestsPerSec = signal(10);
  protected readonly cpuCores = signal(4);
  protected readonly threadCount = signal(16);
  protected readonly concurrencyLimit = signal(16);
  protected readonly dbConnections = signal(10);
  protected readonly ioLatencyMs = signal(80);
  protected readonly lockContention = signal(false);

  protected readonly isRunning = signal(false);
  protected readonly tasks = signal<TaskChip[]>([]);
  protected readonly selectedTask = signal<number | null>(null);

  protected readonly selectedTaskInfo = computed(() => {
    const id = this.selectedTask();
    if (id === null) return null;
    return this.tasks().find((t) => t.id === id) ?? null;
  });

  protected readonly pgMetrics = computed(() => {
    const cores = Math.max(1, this.cpuCores());
    const cap = Math.max(1, this.concurrencyLimit());
    const arrival = this.requestsPerSec();
    const accepted = Math.min(arrival, cap);

    const capacity = cores * (1000 / Math.max(5, this.ioLatencyMs())) * Math.min(1, this.dbConnections() / 8);
    const utilization = accepted / Math.max(0.5, capacity);

    const cpuPct = Math.min(100, Math.round(utilization * 70 + (this.lockContention() ? 15 : 0)));
    const throughput = Math.round(Math.min(accepted, capacity));
    const queueDepth = Math.max(0, Math.round((arrival - cap) * 2));
    const latencyMs = Math.round(
      this.ioLatencyMs() * (1 + utilization) + (this.lockContention() ? 40 : 0) + queueDepth * 5,
    );

    const active = this.tasks().filter((t) => t.state === 'RUNNING').length;
    const waiting = this.tasks().filter((t) => t.state === 'WAITING' || t.state === 'BLOCKED').length;

    return { cpuPct, throughput, latencyMs, queueDepth, active, waiting };
  });

  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTaskId = 1;

  protected start(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    if (this.tasks().length === 0) this.seedTasks();

    this.timer = setInterval(() => this.tick(), 700);
  }

  protected pause(): void {
    this.isRunning.set(false);
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  protected resetPlayground(): void {
    this.pause();
    this.tasks.set([]);
    this.selectedTask.set(null);
    this.nextTaskId = 1;
  }

  private seedTasks(): void {
    const count = Math.min(24, Math.max(4, this.concurrencyLimit()));
    const seeded: TaskChip[] = [];
    for (let i = 0; i < count; i++) {
      seeded.push({ id: this.nextTaskId++, state: i % 3 === 0 ? 'RUNNING' : i % 3 === 1 ? 'WAITING' : 'READY' });
    }
    this.tasks.set(seeded);
  }

  private tick(): void {
    this.tasks.update((list) =>
      list.map((task) => {
        if (task.state === 'COMPLETED') {
          return Math.random() < 0.3 ? { ...task, id: this.nextTaskId++, state: 'READY' } : task;
        }
        const roll = Math.random();
        const contentionPenalty = this.lockContention() ? 0.15 : 0;

        switch (task.state) {
          case 'READY':
            return roll < 0.6 ? { ...task, state: 'RUNNING' } : task;
          case 'RUNNING':
            if (roll < contentionPenalty + 0.2) return { ...task, state: 'BLOCKED' };
            if (roll < contentionPenalty + 0.45) return { ...task, state: 'WAITING' };
            if (roll < contentionPenalty + 0.65) return { ...task, state: 'COMPLETED' };
            return task;
          case 'WAITING':
            return roll < 0.5 ? { ...task, state: 'READY' } : task;
          case 'BLOCKED':
            return roll < 0.35 - contentionPenalty ? { ...task, state: 'READY' } : task;
          default:
            return task;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.pause();
  }
}
