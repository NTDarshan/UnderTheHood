import { Component, signal } from '@angular/core';

type Phase = 'idle' | 'processing' | 'disconnected' | 'cancelled' | 'completed';

@Component({
  selector: 'app-cancellation-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="cancellation">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 16 — REQUEST CONTEXT: CANCELLATION</p>
        <h2 class="lab-title">When the client disappears, should the server keep working?</h2>

        <div class="lab-panel">
          <p class="scenario mono">GET /large-report</p>

          <div class="chain mono">
            <div class="chain-node" [class.is-active]="phase() === 'processing'">Request / Context</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node" [class.is-active]="phase() === 'processing'" [class.is-cancelled]="phase() === 'cancelled'">Service</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node" [class.is-active]="phase() === 'processing'" [class.is-cancelled]="phase() === 'cancelled'">Repository / downstream work</div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="start()">Start Processing</button>
            <button type="button" class="lab-btn lab-btn-danger" [disabled]="phase() !== 'processing'" (click)="disconnect()">Client Disconnects</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <p class="lab-note">
            @switch (phase()) {
              @case ('idle') { Not started. }
              @case ('processing') { Server is working on the report — client is still connected. }
              @case ('disconnected') { Client disconnected. A cancellation signal starts propagating through the request context. }
              @case ('cancelled') { Downstream work honored the cancellation signal and stopped — no wasted CPU/DB time on a response nobody will receive. }
              @case ('completed') { Completed normally — client stayed connected the whole time. }
            }
          </p>
          <p class="lab-note lab-note-warn">Important: cancellation is not automatic everywhere. It only works when the relevant framework, libraries, and operations actually check and honor the signal.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .scenario { font-size: 0.875rem; color: var(--accent); margin-bottom: 20px; }
    .chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .chain-node { font-size: 0.8125rem; font-weight: 700; padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); text-align: center; min-width: 240px; transition: all 0.2s ease; }
    .chain-node.is-active { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 14px var(--glow-accent); }
    .chain-node.is-cancelled { color: var(--danger); border-color: var(--danger); }
  `,
})
export class CancellationVisualizer {
  protected readonly phase = signal<Phase>('idle');
  private timer: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    this.phase.set('processing');
    this.timer = setTimeout(() => this.phase.set('completed'), 4000);
  }

  disconnect(): void {
    if (this.timer) clearTimeout(this.timer);
    this.phase.set('disconnected');
    setTimeout(() => this.phase.set('cancelled'), 700);
  }

  reset(): void {
    if (this.timer) clearTimeout(this.timer);
    this.phase.set('idle');
  }
}
