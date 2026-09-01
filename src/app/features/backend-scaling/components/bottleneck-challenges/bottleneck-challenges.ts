import { Component, computed, signal } from '@angular/core';

interface Stat {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'crit';
}

interface Option {
  id: string;
  text: string;
}

interface Challenge {
  title: string;
  scenario: string;
  stats: Stat[];
  question: string;
  options: Option[];
  correctId: string;
  explanation: string;
  principle: string;
}

const CHALLENGES: Challenge[] = [
  {
    title: 'The slow response',
    scenario:
      'A dashboard endpoint that normally responds in 40ms is now taking 900ms. Traffic hasn\'t changed. The team pulls a live snapshot.',
    stats: [
      { label: 'CPU (API)', value: '38%', tone: 'ok' },
      { label: 'Cache hit rate', value: '91%', tone: 'ok' },
      { label: 'Avg query time', value: '860ms', tone: 'crit' },
      { label: 'Network RTT', value: '4ms', tone: 'ok' },
    ],
    question: 'Where is the bottleneck?',
    options: [
      { id: 'cpu', text: 'CPU — the API server is compute-bound' },
      { id: 'db', text: 'Database — a query is running slow' },
      { id: 'cache', text: 'Cache — the hit rate is too low' },
      { id: 'net', text: 'Network — packets are taking too long in transit' },
    ],
    correctId: 'db',
    explanation:
      'CPU is idle, the cache is doing its job, and the network is fine — but average query time jumped to 860ms, almost exactly matching the extra latency the endpoint gained. A missing index, a lock, or a bad query plan on the database is the culprit.',
    principle: 'Match the metric that moved to the symptom — latency spikes point straight at whichever stage\'s own timing spiked.',
  },
  {
    title: 'Low CPU, high latency',
    scenario:
      'Requests are taking 1.2 seconds. Engineers check CPU first, expecting it pegged — but it isn\'t.',
    stats: [
      { label: 'CPU (API)', value: '40%', tone: 'ok' },
      { label: 'Memory', value: '55%', tone: 'ok' },
      { label: 'DB CPU', value: '35%', tone: 'ok' },
      { label: 'Connections waiting', value: '45', tone: 'crit' },
    ],
    question: 'What is the REAL bottleneck?',
    options: [
      { id: 'db', text: 'Database is overloaded' },
      { id: 'external', text: 'A slow external dependency' },
      { id: 'pool', text: 'Connection pool exhaustion' },
      { id: 'net', text: 'Network congestion' },
    ],
    correctId: 'pool',
    explanation:
      'Every resource that\'s easy to check — CPU, memory, DB load — looks healthy. But 45 requests are stuck waiting for a free connection out of a pool that\'s too small. Requests aren\'t slow because work is hard; they\'re slow because they\'re queued waiting for a slot.',
    principle: 'CPU is not the only resource that saturates — connection pools, thread pools, and semaphores can bottleneck a system that looks compute-idle.',
  },
  {
    title: 'The cache stops helping',
    scenario:
      'A service that normally serves 95% of reads from cache suddenly sees its database load triple within minutes.',
    stats: [
      { label: 'Cache hit rate (before)', value: '95%', tone: 'ok' },
      { label: 'Cache hit rate (now)', value: '12%', tone: 'crit' },
      { label: 'DB load (now)', value: '3.1x baseline', tone: 'crit' },
      { label: 'Deploy 6 min ago', value: 'yes', tone: 'warn' },
    ],
    question: 'Why is the database suddenly overloaded?',
    options: [
      { id: 'traffic', text: 'A sudden traffic spike' },
      { id: 'keys', text: 'A cache-key change (deploy) or mass expiry emptied the cache' },
      { id: 'disk', text: 'The database ran out of disk space' },
      { id: 'index', text: 'A missing index was just dropped' },
    ],
    correctId: 'keys',
    explanation:
      'Traffic didn\'t move — only the hit rate did, right after a deploy. A cache-key scheme change (or a mass TTL expiry / cold cache after a restart) means requests that used to be absorbed by the cache are now all falling through to the database at once.',
    principle: 'Caching only helps while the hit rate holds — any change that invalidates keys en masse turns the cache off and dumps its normal traffic straight onto the database.',
  },
  {
    title: 'More servers, same latency',
    scenario:
      'The API tier is scaled from 2 servers to 8. P99 latency does not improve at all.',
    stats: [
      { label: 'API servers', value: '2 → 8', tone: 'ok' },
      { label: 'API CPU (avg)', value: '78% → 22%', tone: 'ok' },
      { label: 'DB CPU', value: '96%', tone: 'crit' },
      { label: 'P99 latency', value: 'unchanged', tone: 'crit' },
    ],
    question: 'Why didn\'t adding API servers help?',
    options: [
      { id: 'lb', text: 'The load balancer isn\'t distributing traffic evenly' },
      { id: 'db', text: 'The database is the actual bottleneck, not the API tier' },
      { id: 'cold', text: 'The new servers are still cold-starting' },
      { id: 'net', text: 'Inter-server network overhead' },
    ],
    correctId: 'db',
    explanation:
      'API CPU dropped a lot — those servers are no longer the constraint. But DB CPU sits at 96% the whole time. Every one of those 8 servers is now just queuing more requests against the same saturated database — more front-door capacity feeding the same narrow back door.',
    principle: 'Scaling the tier that isn\'t the bottleneck doesn\'t move the ceiling — find the saturated resource first, then scale that one.',
  },
  {
    title: 'Fine at 500, collapses at 800',
    scenario:
      'Load testing shows latency stays flat from 100 to roughly 650 req/sec, then rises sharply and the system effectively falls over by 800 req/sec.',
    stats: [
      { label: 'Latency @ 500 req/s', value: '45ms', tone: 'ok' },
      { label: 'Latency @ 650 req/s', value: '70ms', tone: 'warn' },
      { label: 'Latency @ 750 req/s', value: '410ms', tone: 'crit' },
      { label: 'Latency @ 800 req/s', value: '2,900ms', tone: 'crit' },
    ],
    question: 'Where is this system\'s actual capacity limit?',
    options: [
      { id: '500', text: '~500 req/sec — that\'s where testing started' },
      { id: '650', text: '~650–700 req/sec — where the curve bends upward' },
      { id: '800', text: '~800 req/sec — where it fully collapses' },
      { id: 'none', text: 'There isn\'t a real limit, just noisy measurements' },
    ],
    correctId: '650',
    explanation:
      'Latency is flat well below the limit, then bends sharply upward as a resource approaches saturation, then goes vertical once it\'s fully saturated. The knee of that curve — not the collapse point — is the honest capacity number. 800 req/sec is already well past the cliff.',
    principle: 'Capacity is the point where the latency curve bends, not the point where it breaks — plan headroom against the knee, not the wall.',
  },
  {
    title: 'P99 spikes, average looks fine',
    scenario:
      'Average latency holds steady at 60ms, but P99 jumps from 120ms to 1.8 seconds. Support tickets mention "random" slow requests.',
    stats: [
      { label: 'Average latency', value: '60ms', tone: 'ok' },
      { label: 'P50', value: '48ms', tone: 'ok' },
      { label: 'P99', value: '1,800ms', tone: 'crit' },
      { label: 'Affected DB replica', value: '1 of 4', tone: 'warn' },
    ],
    question: 'What does this pattern point to?',
    options: [
      { id: 'systemwide', text: 'A system-wide capacity problem' },
      { id: 'subset', text: 'A small subset of requests hitting a slow path (e.g. one bad replica)' },
      { id: 'network', text: 'General network jitter affecting all requests' },
      { id: 'nothing', text: 'Nothing meaningful — P99 is always noisy' },
    ],
    correctId: 'subset',
    explanation:
      'If the whole system were struggling, the average would rise too — it hasn\'t. Only the tail moved. That\'s the signature of a small slice of traffic — here, whatever\'s landing on one degraded replica of four — taking a much slower path while everything else is untouched.',
    principle: 'The average hides tail problems by design — P99/P999 exist specifically to catch a slow subset that a healthy-looking average would mask.',
  },
  {
    title: 'The queue keeps growing',
    scenario:
      'A background job queue\'s depth has been climbing steadily for the last hour and shows no sign of leveling off.',
    stats: [
      { label: 'Jobs arriving', value: '85/sec', tone: 'warn' },
      { label: 'Jobs processed', value: '60/sec', tone: 'warn' },
      { label: 'Queue depth', value: '4,200 and rising', tone: 'crit' },
      { label: 'Worker count', value: '6 (unchanged)', tone: 'ok' },
    ],
    question: 'What is causing the queue to keep growing?',
    options: [
      { id: 'spike', text: 'A one-time traffic spike that will drain on its own' },
      { id: 'rate', text: 'Arrival rate exceeds processing rate on an ongoing basis' },
      { id: 'workers', text: 'The workers crashed and aren\'t running' },
      { id: 'capacity', text: 'The queue itself has a size limit that was misconfigured' },
    ],
    correctId: 'rate',
    explanation:
      'Jobs are arriving at 85/sec and only 60/sec are being drained — a steady 25/sec deficit, not a burst. As long as that gap holds, depth rises without bound; it won\'t resolve on its own no matter how long you wait. The fix is either more/faster workers or fewer jobs arriving.',
    principle: 'A queue is stable only when average processing rate meets or exceeds average arrival rate — any sustained gap grows the backlog forever, it never self-corrects.',
  },
];

@Component({
  selector: 'app-bottleneck-challenges',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="bottleneck-challenges">
      <div class="container">
        <p class="lab-index">29 — FIND THE BOTTLENECK CHALLENGES</p>
        <h2 class="lab-title">Seven scenarios. One real cause each. Diagnose before you scroll.</h2>
        <p class="lab-lede">
          Every earlier lab handed you the dashboard and let you watch cause and effect happen live. Here you get
          only the snapshot — the way an on-call engineer actually finds a bottleneck.
        </p>

        <div class="lab-panel">
          <div class="progress-row mono">
            <span>Challenge {{ index() + 1 }} of {{ challenges.length }}</span>
            <div class="dots">
              @for (c of challenges; track $index; let i = $index) {
                <button
                  type="button"
                  class="dot"
                  [class.dot-active]="i === index()"
                  [class.dot-answered]="answered().has(i)"
                  [attr.aria-label]="'Go to challenge ' + (i + 1)"
                  [attr.aria-current]="i === index() ? 'step' : null"
                  (click)="goTo(i)"
                ></button>
              }
            </div>
          </div>

          <h3 class="challenge-title">{{ current().title }}</h3>
          <p class="scenario">{{ current().scenario }}</p>

          <div class="stats-row">
            @for (s of current().stats; track s.label) {
              <div class="stat-chip" [class]="'tone-' + (s.tone ?? 'ok')">
                <span class="stat-chip-label mono">{{ s.label }}</span>
                <span class="stat-chip-value mono">{{ s.value }}</span>
              </div>
            }
          </div>

          <p class="question">{{ current().question }}</p>

          <div class="options">
            @for (opt of current().options; track opt.id) {
              <button
                type="button"
                class="option-btn"
                [class.is-selected]="selected() === opt.id"
                [class.is-correct]="isRevealed() && opt.id === current().correctId"
                [class.is-wrong]="isRevealed() && selected() === opt.id && opt.id !== current().correctId"
                [disabled]="isRevealed()"
                (click)="choose(opt.id)"
              >
                <span class="option-marker mono">{{ opt.id === current().correctId && isRevealed() ? '✓' : (selected() === opt.id ? '●' : '○') }}</span>
                {{ opt.text }}
              </button>
            }
          </div>

          @if (isRevealed()) {
            <div class="reveal-box" [class.reveal-box-correct]="selected() === current().correctId">
              <p class="reveal-verdict mono">
                {{ selected() === current().correctId ? 'CORRECT DIAGNOSIS' : 'NOT QUITE' }}
              </p>
              <p class="reveal-text">{{ current().explanation }}</p>
              <p class="reveal-principle"><strong>Principle:</strong> {{ current().principle }}</p>
            </div>
          }

          <div class="nav-row">
            <button type="button" class="lab-btn" (click)="prev()" [disabled]="index() === 0">← Previous</button>
            <span class="nav-score mono">{{ answered().size }} / {{ challenges.length }} attempted</span>
            <button type="button" class="lab-btn lab-btn-primary" (click)="next()" [disabled]="index() === challenges.length - 1">Next →</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .progress-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; color: var(--text-muted); font-size: 0.75rem; }
    .dots { display: flex; gap: 8px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid var(--border-strong); background: transparent; padding: 0; }
    .dot-answered { background: var(--border-strong); }
    .dot-active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--glow-accent); }

    .challenge-title { margin-top: 22px; font-size: 1.25rem; color: var(--text); }
    .scenario { margin-top: 10px; color: var(--text-muted); line-height: 1.6; max-width: 640px; }

    .stats-row { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; }
    .stat-chip { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); min-width: 130px; }
    .stat-chip-label { font-size: 0.625rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-faint); }
    .stat-chip-value { font-size: 0.9375rem; font-weight: 700; color: var(--text); }
    .stat-chip.tone-warn .stat-chip-value { color: var(--warn); }
    .stat-chip.tone-crit .stat-chip-value { color: var(--crit); }
    .stat-chip.tone-ok .stat-chip-value { color: var(--ok); }

    .question { margin-top: 22px; font-weight: 600; color: var(--text); }

    .options { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
    .option-btn {
      display: flex; align-items: flex-start; gap: 10px; text-align: left;
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
      color: var(--text); padding: 12px 14px; font-family: var(--font-sans); font-size: 0.9375rem; line-height: 1.5;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .option-btn:not(:disabled):hover { border-color: var(--accent); }
    .option-btn.is-selected { border-color: var(--accent-2); }
    .option-btn.is-correct { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 10%, var(--surface)); }
    .option-btn.is-wrong { border-color: var(--crit); background: color-mix(in srgb, var(--crit) 10%, var(--surface)); }
    .option-btn:disabled { cursor: default; }
    .option-marker { flex-shrink: 0; color: var(--text-faint); }

    .reveal-box { margin-top: 18px; padding: 16px 18px; border-radius: var(--radius-md); border-left: 3px solid var(--crit); background: var(--surface); }
    .reveal-box-correct { border-left-color: var(--ok); }
    .reveal-verdict { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); margin-bottom: 8px; }
    .reveal-text { color: var(--text-muted); line-height: 1.6; }
    .reveal-principle { margin-top: 10px; color: var(--text); line-height: 1.6; font-size: 0.9375rem; }

    .nav-row { margin-top: 26px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 18px; border-top: 1px solid var(--border); }
    .nav-score { color: var(--text-faint); font-size: 0.75rem; }
  `,
})
export class BottleneckChallenges {
  protected readonly challenges = CHALLENGES;

  protected readonly index = signal(0);
  protected readonly selections = signal<Map<number, string>>(new Map());

  protected readonly current = computed(() => this.challenges[this.index()]);
  protected readonly selected = computed(() => this.selections().get(this.index()) ?? null);
  protected readonly isRevealed = computed(() => this.selected() !== null);
  protected readonly answered = computed(() => new Set(this.selections().keys()));

  choose(optionId: string): void {
    if (this.isRevealed()) return;
    this.selections.update((map) => {
      const next = new Map(map);
      next.set(this.index(), optionId);
      return next;
    });
  }

  goTo(i: number): void {
    this.index.set(i);
  }

  prev(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  next(): void {
    this.index.update((i) => Math.min(this.challenges.length - 1, i + 1));
  }
}
