import { Component, OnDestroy, computed, signal } from '@angular/core';

type Mode = 'traditional' | 'lightweight';

interface ComparisonRow {
  aspect: string;
  traditional: string;
  lightweight: string;
}

const OS_THREADS = 6;
const TASK_CHIPS = 48;
const REPRESENTED_TASKS = '100,000';

const COMPARISON: ComparisonRow[] = [
  {
    aspect: 'Memory overhead',
    traditional: 'Each OS thread reserves a large stack (often ~1-8 MB), allocated up front by the OS.',
    lightweight: 'Each unit starts with a tiny stack (a few KB) that grows on demand — orders of magnitude cheaper per unit.',
  },
  {
    aspect: 'Creation cost',
    traditional: 'Creating a thread is a real syscall into the kernel — relatively slow, not something you do casually per request.',
    lightweight: 'Creating one is closer to a plain allocation in the language runtime — cheap enough to spin up per request or per task.',
  },
  {
    aspect: 'Scheduling',
    traditional: 'Scheduled preemptively by the OS kernel. Context switches cross into kernel space.',
    lightweight: 'Scheduled cooperatively by the language runtime, which multiplexes many logical units onto a small pool of real OS threads.',
  },
  {
    aspect: 'Scalability',
    traditional: 'Practically limited to thousands of concurrent threads before memory and context-switch overhead dominate.',
    lightweight: 'Designed for hundreds of thousands to millions of concurrently live units on the same hardware.',
  },
  {
    aspect: 'Programming model',
    traditional: 'Looks like ordinary blocking, sequential code — one OS thread carries one logical task, top to bottom.',
    lightweight: 'Still looks like ordinary blocking, sequential code — the runtime hides the multiplexing, so you rarely write callbacks to get the scalability.',
  },
];

@Component({
  selector: 'app-virtual-threads-goroutines',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="virtual-threads-goroutines">
      <div class="container">
        <p class="lab-index">19 — LIGHTWEIGHT CONCURRENCY</p>
        <h2 class="lab-title">Lightweight concurrency: virtual threads &amp; goroutines</h2>
        <p class="lab-lede">
          {{ REPRESENTED_TASKS }} logical tasks cannot each get their own OS thread — the machine would run out of
          memory and the kernel scheduler would choke on context switches. Lightweight concurrency units (Java
          virtual threads, Go goroutines, and similar constructs — the exact mechanics differ per runtime) solve
          this by having the language runtime multiplex huge numbers of logical units onto a small, fixed pool of
          real OS threads.
        </p>

        <div class="lab-panel">
          <div class="mode-row" role="group" aria-label="Threading model">
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="mode() === 'traditional'"
              [attr.aria-pressed]="mode() === 'traditional'"
              (click)="setMode('traditional')"
            >
              Traditional: 1 task = 1 OS thread
            </button>
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="mode() === 'lightweight'"
              [attr.aria-pressed]="mode() === 'lightweight'"
              (click)="setMode('lightweight')"
            >
              Lightweight: runtime-multiplexed
            </button>
          </div>

          <p class="fan-caption mono">
            {{ TASK_CHIPS }} chips shown, standing in for {{ REPRESENTED_TASKS }} logical tasks
          </p>

          <div class="fan-grid">
            @for (i of chipIndexes; track i) {
              <div
                class="chip"
                [class.is-running]="isChipRunning(i)"
                [class.is-blocked]="mode() === 'traditional' && i >= OS_THREADS"
              ></div>
            }
          </div>

          <div class="funnel-arrows" aria-hidden="true">
            @for (t of threadIndexes; track t) {
              <span class="lab-flow-arrow">&darr;</span>
            }
          </div>

          <div class="threads-row">
            @for (t of threadIndexes; track t) {
              <span class="lab-node thread-box" [class.is-hot]="mode() === 'lightweight'">OS THREAD {{ t + 1 }}</span>
            }
          </div>

          @if (mode() === 'traditional') {
            <p class="mode-readout mono">
              {{ OS_THREADS }} threads running &middot;
              <strong class="is-crit">{{ TASK_CHIPS - OS_THREADS }} tasks blocked</strong>, waiting for a thread to
              free up
            </p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" [disabled]="isRunning()" (click)="runLoop('traditional')">
                Try to run more tasks
              </button>
            </div>
          } @else {
            <p class="mode-readout mono">
              All {{ TASK_CHIPS }} tasks are logically "running" — the runtime rotates which ones actually occupy
              the {{ OS_THREADS }} real threads at any instant.
            </p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="runLoop('lightweight')">
                {{ isRunning() ? 'Multiplexing…' : 'Run the scheduler' }}
              </button>
            </div>
          }
        </div>

        <div class="lab-panel table-panel">
          <p class="lab-node table-heading">TRADITIONAL OS THREADS VS. LIGHTWEIGHT RUNTIME-MANAGED UNITS</p>
          <div class="table-scroll">
            <table class="compare-table">
              <thead>
                <tr>
                  <th scope="col">Aspect</th>
                  <th scope="col">Traditional OS thread</th>
                  <th scope="col">Lightweight unit (goroutine / virtual thread)</th>
                </tr>
              </thead>
              <tbody>
                @for (row of comparison; track row.aspect) {
                  <tr>
                    <th scope="row" class="mono">{{ row.aspect }}</th>
                    <td>{{ row.traditional }}</td>
                    <td>{{ row.lightweight }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="table-caveat">
            Not every language or runtime implements this identically — Go's goroutines and Java's virtual threads
            differ in scheduling detail (e.g. how blocking system calls are handled), but the core idea is shared.
          </p>
        </div>

        <p class="lab-note">
          Lightweight concurrency abstractions can make expressing very high concurrency much easier, without
          requiring one real OS thread per logical task.
        </p>
      </div>
    </section>
  `,
  styles: `
    .mode-row { display: flex; flex-wrap: wrap; gap: 10px; }

    .fan-caption { margin-top: 22px; font-size: 0.6875rem; letter-spacing: 0.04em; color: var(--text-faint); }

    .fan-grid {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(18px, 1fr));
      gap: 5px;
    }
    .chip {
      aspect-ratio: 1;
      border-radius: 3px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .chip.is-running { background: color-mix(in srgb, var(--c-task) 55%, var(--surface-elevated)); border-color: var(--c-task); }
    .chip.is-blocked { background: var(--surface); border: 1px dashed var(--border-strong); opacity: 0.55; }

    .funnel-arrows {
      margin-top: 10px;
      display: flex;
      justify-content: space-evenly;
      color: var(--text-faint);
    }

    .threads-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-evenly; }
    .thread-box { border-color: var(--c-cpu); color: var(--c-cpu); }
    .thread-box.is-hot { box-shadow: 0 0 12px rgba(96, 165, 250, 0.35); }

    .mode-readout { margin-top: 18px; font-size: 0.8125rem; color: var(--text-muted); }
    .mode-readout .is-crit { color: var(--danger); }

    .table-panel { margin-top: 24px; }
    .table-heading { margin-bottom: 16px; }
    .table-scroll { overflow-x: auto; }

    .compare-table { width: 100%; border-collapse: collapse; min-width: 640px; }
    .compare-table th, .compare-table td {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 0.8125rem;
      line-height: 1.55;
      vertical-align: top;
    }
    .compare-table thead th {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.05em;
      color: var(--text-faint);
      border-bottom: 1px solid var(--border-strong);
    }
    .compare-table tbody th { color: var(--text); white-space: nowrap; font-size: 0.75rem; }
    .compare-table tbody td { color: var(--text-muted); }

    .table-caveat { margin-top: 16px; font-size: 0.75rem; color: var(--text-faint); line-height: 1.5; }
  `,
})
export class VirtualThreadsGoroutines implements OnDestroy {
  protected readonly OS_THREADS = OS_THREADS;
  protected readonly TASK_CHIPS = TASK_CHIPS;
  protected readonly REPRESENTED_TASKS = REPRESENTED_TASKS;
  protected readonly comparison = COMPARISON;

  protected readonly chipIndexes = Array.from({ length: TASK_CHIPS }, (_, i) => i);
  protected readonly threadIndexes = Array.from({ length: OS_THREADS }, (_, i) => i);

  protected readonly mode = signal<Mode>('traditional');
  protected readonly isRunning = signal(false);
  private readonly batchStart = signal(0);

  protected readonly runningSet = computed(() => {
    const set = new Set<number>();
    if (this.mode() === 'traditional') {
      for (let i = 0; i < OS_THREADS; i++) set.add(i);
      return set;
    }
    const start = this.batchStart();
    for (let i = 0; i < OS_THREADS; i++) {
      set.add((start + i) % TASK_CHIPS);
    }
    return set;
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  isChipRunning(i: number): boolean {
    return this.runningSet().has(i);
  }

  setMode(m: Mode): void {
    if (this.isRunning()) return;
    this.mode.set(m);
    this.batchStart.set(0);
  }

  runLoop(mode: Mode): void {
    if (this.isRunning() || mode !== this.mode()) return;
    if (mode === 'traditional') {
      // Traditional model has nothing more to run — it is already saturated at OS_THREADS.
      return;
    }
    this.isRunning.set(true);
    let cycles = 0;
    const totalCycles = Math.ceil(TASK_CHIPS / OS_THREADS) * 2;
    this.timer = setInterval(() => {
      this.batchStart.update((v) => (v + OS_THREADS) % TASK_CHIPS);
      cycles++;
      if (cycles >= totalCycles) {
        this.clearTimer();
        this.isRunning.set(false);
      }
    }, 260);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
