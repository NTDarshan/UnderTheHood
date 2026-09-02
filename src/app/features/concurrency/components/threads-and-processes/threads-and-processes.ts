import { Component, signal } from '@angular/core';

type ConceptId = 'process' | 'thread' | 'stack' | 'heap';

interface ConceptInfo {
  id: ConceptId;
  label: string;
  title: string;
  body: string;
}

const CONCEPTS: ConceptInfo[] = [
  {
    id: 'process',
    label: 'PROCESS',
    title: 'A process is an isolated unit',
    body:
      'A process is an independently running program with its own memory space, file handles, and resources, ' +
      'managed by the operating system. One process cannot directly read another process\'s memory — the OS ' +
      'keeps them isolated. If a process crashes, it does not take down other processes with it.',
  },
  {
    id: 'thread',
    label: 'THREAD',
    title: 'Threads run inside a process, and are not isolated from each other',
    body:
      'A thread is a unit of execution scheduled by the OS. A process can contain multiple threads, and every ' +
      'thread inside the same process shares that process\'s memory and heap. Unlike processes, threads in the ' +
      'same process are NOT isolated from each other — one thread can read and corrupt data another thread is ' +
      'using, which is exactly why concurrent access to shared data needs synchronization.',
  },
  {
    id: 'stack',
    label: 'STACK',
    title: 'Each thread has its own stack',
    body:
      'The stack holds a thread\'s local variables, function call frames, and return addresses — its private ' +
      'execution state. Every thread gets its own stack, even though threads in the same process share the same ' +
      'heap. This is why one thread\'s local variables are invisible to another thread: they simply live on a ' +
      'different stack.',
  },
  {
    id: 'heap',
    label: 'HEAP / MEMORY',
    title: 'The heap is shared by every thread in the process',
    body:
      'The heap (and the process\'s memory space more broadly) is shared: every thread inside the process can ' +
      'read and write the same heap-allocated objects. This sharing is what makes threads useful for cooperating ' +
      'on shared state cheaply — and it is also the source of race conditions when two threads mutate the same ' +
      'memory without coordination.',
  },
];

@Component({
  selector: 'app-threads-and-processes',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="threads-and-processes">
      <div class="container">
        <p class="lab-index">08 — PROCESSES &amp; THREADS</p>
        <h2 class="lab-title">Processes and threads</h2>
        <p class="lab-lede">
          A process is an isolated box with its own memory. Threads live inside that box and share everything in
          it — except a small private slice each one keeps for itself. Click any part of the diagram below to see
          what it actually means.
        </p>

        <div class="lab-panel">
          <div class="diagram">
            <div class="proc-box" [class.is-active]="selected() === 'process'">
              <button
                type="button"
                class="proc-label-btn"
                [attr.aria-pressed]="selected() === 'process'"
                (click)="select('process')"
              >
                <span class="box-label mono">PROCESS</span>
              </button>

              <button
                type="button"
                class="heap-box"
                [class.is-active]="selected() === 'heap'"
                [attr.aria-pressed]="selected() === 'heap'"
                (click)="select('heap')"
              >
                <span class="box-label mono">HEAP / SHARED MEMORY</span>
                <span class="box-sub mono">shared by all threads below</span>
              </button>

              <div class="threads-row">
                @for (t of threadIds; track t) {
                  <div class="thread-box" [class.is-active]="selected() === 'thread'">
                    <button
                      type="button"
                      class="thread-label-btn"
                      [attr.aria-pressed]="selected() === 'thread'"
                      (click)="select('thread')"
                    >
                      <span class="box-label mono">THREAD {{ t }}</span>
                    </button>
                    <button
                      type="button"
                      class="stack-box"
                      [class.is-active]="selected() === 'stack'"
                      [attr.aria-pressed]="selected() === 'stack'"
                      (click)="select('stack')"
                    >
                      <span class="box-sub mono">stack</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Concept picker">
            @for (c of concepts; track c.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="selected() === c.id"
                [attr.aria-pressed]="selected() === c.id"
                (click)="select(c.id)"
              >
                {{ c.label }}
              </button>
            }
          </div>

          <div class="explain-panel" aria-live="polite">
            @if (activeConcept(); as c) {
              <p class="explain-title mono">{{ c.title }}</p>
              <p class="explain-body">{{ c.body }}</p>
            } @else {
              <p class="explain-body explain-empty">Click PROCESS, THREAD, STACK, or HEAP to see what it means.</p>
            }
          </div>
        </div>

        <p class="lab-note">
          Rule of thumb: a process isolates you from other programs; a thread does not isolate you from other
          threads in the same program. Shared heap access is what makes threads powerful and what makes them
          dangerous without synchronization.
        </p>
      </div>
    </section>
  `,
  styles: `
    .diagram { margin-top: 8px; }

    .proc-box {
      box-sizing: border-box;
      width: 100%;
      padding: 18px;
      border: 2px dashed var(--border-strong);
      border-radius: var(--radius-lg);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .proc-box.is-active { border-color: var(--c-task); background: color-mix(in srgb, var(--c-task) 8%, var(--surface)); }

    .proc-label-btn {
      all: unset;
      cursor: pointer;
      display: inline-block;
      margin-bottom: 14px;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
    }
    .proc-label-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .box-label { display: block; font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .box-sub { display: block; font-size: 0.6875rem; color: var(--text-faint); margin-top: 4px; }

    .heap-box {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      display: block;
      width: 100%;
      text-align: center;
      padding: 14px;
      margin-bottom: 16px;
      border: 1px solid var(--c-queue);
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--c-queue) 10%, var(--surface));
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .heap-box.is-active { box-shadow: 0 0 0 2px var(--c-queue); }
    .heap-box:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .threads-row { display: grid; grid-template-columns: repeat(1, 1fr); gap: 10px; }
    @media (min-width: 640px) { .threads-row { grid-template-columns: repeat(3, 1fr); } }

    .thread-box {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--c-thread);
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--c-thread) 8%, var(--surface));
      text-align: center;
      transition: box-shadow 0.2s ease;
    }
    .thread-box.is-active { box-shadow: 0 0 0 2px var(--c-thread); }

    .thread-label-btn {
      all: unset;
      cursor: pointer;
      width: 100%;
    }
    .thread-label-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .stack-box {
      display: block;
      width: 100%;
      padding: 8px;
      border: 1px dashed var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      cursor: pointer;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
      font: inherit;
      color: inherit;
    }
    .stack-box.is-active { border-color: var(--c-lock); box-shadow: 0 0 0 2px var(--c-lock); }
    .stack-box:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .explain-panel {
      margin-top: 20px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      min-height: 88px;
    }
    .explain-title { font-size: 0.9375rem; color: var(--text); margin: 0 0 8px; letter-spacing: 0.01em; }
    .explain-body { margin: 0; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .explain-empty { color: var(--text-faint); font-style: italic; }
  `,
})
export class ThreadsAndProcesses {
  protected readonly concepts = CONCEPTS;
  protected readonly threadIds = [1, 2, 3];

  protected readonly selected = signal<ConceptId | null>(null);

  protected activeConcept(): ConceptInfo | undefined {
    const id = this.selected();
    return id ? CONCEPTS.find((c) => c.id === id) : undefined;
  }

  protected select(id: ConceptId): void {
    this.selected.set(id);
  }
}
