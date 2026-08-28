import { Component, computed, signal } from '@angular/core';

type Stage = 'idle' | 'a' | 'b' | 'controller' | 'stopped';

@Component({
  selector: 'app-next-function-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="next-visualizer">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 05 — THE next() VISUALIZER</p>
        <h2 class="lab-title">Middleware does not have to call next().</h2>
        <p class="lab-lede">It can terminate the request early — and downstream layers simply never run.</p>

        <div class="lab-panel">
          <div class="chain mono">
            <div class="chain-node" [class.is-active]="stage() === 'a'" [class.is-done]="doneA()">Middleware A</div>
            <div class="lab-flow-arrow">↓ next()</div>
            @if (stage() === 'stopped') {
              <div class="chain-node is-stopped">STOP ✋</div>
              <div class="lab-flow-arrow is-dim">↓</div>
              <div class="chain-node is-skipped">Controller NOT REACHED</div>
            } @else {
              <div class="chain-node" [class.is-active]="stage() === 'b'" [class.is-done]="doneB()">Middleware B</div>
              <div class="lab-flow-arrow">↓ next()</div>
              <div class="chain-node" [class.is-active]="stage() === 'controller'">Controller</div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="callNext()">Call Next</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="doNotCallNext()">Do Not Call Next</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <p class="lab-note" [class.lab-note-warn]="stage() === 'stopped'">
            @switch (stage()) {
              @case ('idle') { Press a button to run the chain. }
              @case ('a') { Middleware A is executing. }
              @case ('b') { Middleware A called next() — Middleware B is executing. }
              @case ('controller') { Middleware B called next() — the controller finally runs. }
              @case ('stopped') { Middleware A did not call next(). Example: authentication failed → 401 Unauthorized → the controller is never reached. }
            }
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .chain-node { font-size: 0.8125rem; font-weight: 700; padding: 12px 22px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); text-align: center; min-width: 220px; transition: all 0.2s ease; }
    .chain-node.is-active { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 16px var(--glow-accent); }
    .chain-node.is-done { color: var(--accent-2); border-color: var(--accent-2-dim); }
    .chain-node.is-stopped { color: var(--danger); border-color: var(--danger); }
    .chain-node.is-skipped { color: var(--text-faint); opacity: 0.6; }
    .lab-flow-arrow.is-dim { opacity: 0.4; }
  `,
})
export class NextFunctionVisualizer {
  protected readonly stage = signal<Stage>('idle');
  protected readonly doneA = computed(() => ['b', 'controller'].includes(this.stage()));
  protected readonly doneB = computed(() => this.stage() === 'controller');

  callNext(): void {
    this.stage.set('a');
    setTimeout(() => this.stage.set('b'), 500);
    setTimeout(() => this.stage.set('controller'), 1000);
  }

  doNotCallNext(): void {
    this.stage.set('a');
    setTimeout(() => this.stage.set('stopped'), 500);
  }

  reset(): void {
    this.stage.set('idle');
  }
}
