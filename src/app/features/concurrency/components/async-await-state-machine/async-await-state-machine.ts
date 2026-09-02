import { Component, computed, signal } from '@angular/core';

interface StateVar {
  name: string;
  value: string;
}

interface MachineState {
  key: string;
  label: string;
  vars: StateVar[];
  continuation: string;
}

const STATES: MachineState[] = [
  {
    key: 'start',
    label: 'START',
    vars: [
      { name: 'orderId', value: '482' },
      { name: 'order', value: '<undeclared>' },
    ],
    continuation:
      'The compiler-generated state machine has just been created for this call. Next, it will call the I/O operation (db.findOrder).',
  },
  {
    key: 'call-io',
    label: 'CALL I/O',
    vars: [
      { name: 'orderId', value: '482' },
      { name: 'order', value: '<pending>' },
    ],
    continuation:
      'db.findOrder(482) has been invoked and returned an awaitable immediately (a Promise/Task, not a result). The method is about to await it and suspend.',
  },
  {
    key: 'waiting',
    label: 'WAITING',
    vars: [
      { name: 'orderId', value: '482' },
      { name: 'order', value: '<pending>' },
      { name: '__state', value: '2  (resume point)' },
    ],
    continuation:
      'This is the suspended state. The machine has stashed orderId and a "resume at state 2" marker on the heap. No thread is dedicated to waiting here — the worker thread was released the moment this state was entered, and will pick up other work until the database responds.',
  },
  {
    key: 'resume',
    label: 'RESUME',
    vars: [
      { name: 'orderId', value: '482' },
      { name: 'order', value: '{ id: 482, total: 129.5, status: "shipped" }' },
    ],
    continuation:
      'The database call completed, which scheduled this continuation. The runtime picks up the stashed state and resumes execution right after the await — on whichever thread happens to be free, not necessarily the original one.',
  },
  {
    key: 'process',
    label: 'PROCESS RESULT',
    vars: [
      { name: 'orderId', value: '482' },
      { name: 'order', value: '{ id: 482, total: 129.5, status: "shipped" }' },
      { name: 'summary', value: '"Order #482 — $129.50 — shipped"' },
    ],
    continuation:
      'Code after the await line now runs synchronously — no more waiting — until it hits another await or a return statement.',
  },
  {
    key: 'complete',
    label: 'COMPLETE',
    vars: [
      { name: 'orderId', value: '482' },
      { name: 'order', value: '{ id: 482, total: 129.5, status: "shipped" }' },
      { name: 'returned', value: '"Order #482 — $129.50 — shipped"' },
    ],
    continuation:
      'The async method\'s own Promise/Task is now fulfilled with the returned value. Any caller that was awaiting getOrder(482) can resume too — the same suspend/resume pattern repeats one level up.',
  },
];

@Component({
  selector: 'app-async-await-state-machine',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="async-await-state-machine">
      <div class="container">
        <p class="lab-index">17 — ASYNC/AWAIT UNDER THE HOOD</p>
        <h2 class="lab-title">How async/await works under the hood — a state machine</h2>
        <p class="lab-lede">
          The compiler doesn't turn <span class="mono">await</span> into thread magic. It rewrites your method into
          an explicit state machine: a set of states, some local variables carried between them, and a "resume
          point" it stores while waiting. Step through it.
        </p>

        <div class="lab-panel">
          <div class="machine-row">
            @for (s of states; track s.key; let i = $index; let last = $last) {
              <button
                type="button"
                class="lab-node state-node"
                [class.is-active]="stateIndex() === i"
                [class.is-done]="hasVisited(i)"
                [attr.aria-pressed]="stateIndex() === i"
                (click)="jumpTo(i)"
              >
                {{ s.label }}
              </button>
              @if (!last) {
                <span class="lab-flow-arrow">&rarr;</span>
              }
            }
            <span class="lab-flow-arrow loop-arrow" title="Loops back to START">&#8635;</span>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="step()">
              Step &rarr; {{ nextLabel() }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
          <p class="mono step-counter">step {{ stateIndex() + 1 }} / {{ states.length }}</p>

          <div class="detail-panel" aria-live="polite">
            <p class="detail-state mono">CURRENT STATE: {{ current().label }}</p>

            <div class="detail-grid">
              <div class="detail-col">
                <p class="detail-heading mono">LOCAL VARIABLES</p>
                <div class="vars-list mono">
                  @for (v of current().vars; track v.name) {
                    <div class="var-row">
                      <span class="var-name">{{ v.name }}</span>
                      <span class="var-eq">=</span>
                      <span class="var-value">{{ v.value }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="detail-col">
                <p class="detail-heading mono">WHAT "CONTINUATION" MEANS HERE</p>
                <p class="continuation-text">{{ current().continuation }}</p>
              </div>
            </div>
          </div>
        </div>

        <p class="lab-note">
          The state machine loops back to START each time you finish stepping through it — exactly as a fresh call
          to <span class="mono">getOrder</span> would create a brand-new state machine instance.
        </p>
      </div>
    </section>
  `,
  styles: `
    .machine-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; row-gap: 12px; }
    .state-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      transition: all 0.2s ease;
    }
    .state-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .state-node.is-done { border-color: var(--running); color: var(--running); }
    .state-node.is-active {
      border-color: var(--waiting);
      color: var(--waiting);
      box-shadow: 0 0 14px rgba(255, 138, 61, 0.3);
    }
    .loop-arrow { color: var(--text-faint); font-size: 1.1rem; margin-left: 4px; }

    .step-counter { margin-top: 10px; color: var(--text-faint); font-size: 0.75rem; }

    .detail-panel {
      margin-top: 22px;
      padding: 18px 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .detail-state { color: var(--waiting); font-size: 0.8125rem; letter-spacing: 0.04em; margin: 0 0 16px; }

    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 720px) { .detail-grid { grid-template-columns: 1fr 1fr; } }

    .detail-heading { font-size: 0.6875rem; letter-spacing: 0.07em; color: var(--text-faint); margin-bottom: 10px; }

    .vars-list { display: flex; flex-direction: column; gap: 6px; }
    .var-row { display: flex; gap: 6px; font-size: 0.8125rem; flex-wrap: wrap; }
    .var-name { color: var(--c-task); }
    .var-eq { color: var(--text-faint); }
    .var-value { color: var(--text); word-break: break-word; }

    .continuation-text { margin: 0; font-size: 0.875rem; line-height: 1.6; color: var(--text-muted); }
  `,
})
export class AsyncAwaitStateMachine {
  protected readonly states = STATES;
  protected readonly stateIndex = signal(0);

  protected readonly current = computed(() => this.states[this.stateIndex()]);

  protected readonly nextLabel = computed(() => {
    const next = (this.stateIndex() + 1) % this.states.length;
    return this.states[next].label;
  });

  protected hasVisited(i: number): boolean {
    return i < this.stateIndex();
  }

  step(): void {
    this.stateIndex.set((this.stateIndex() + 1) % this.states.length);
  }

  jumpTo(i: number): void {
    this.stateIndex.set(i);
  }

  reset(): void {
    this.stateIndex.set(0);
  }
}
