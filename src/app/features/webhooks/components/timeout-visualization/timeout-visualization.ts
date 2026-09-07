import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-timeout-visualization',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-timeout">
      <div class="container">
        <p class="lab-index mono">09 — THE TIMEOUT CLOCK</p>
        <h2 class="lab-title">A provider will not wait forever</h2>
        <p class="lab-lede">
          Start the clock and watch what happens if your endpoint doesn't respond before the provider's timeout.
        </p>

        <div class="lab-panel">
          <div class="clock-row">
            <div class="clock-side">
              <p class="clock-label mono">PROVIDER</p>
              <p class="clock-state mono" [attr.data-state]="providerState()">{{ providerState() === 'waiting' ? 'WAITING…' : providerState() === 'failed' ? 'MARKED FAILED' : 'IDLE' }}</p>
            </div>
            <div class="clock-face mono">{{ secondsLeft().toFixed(1) }}s</div>
            <div class="clock-side">
              <p class="clock-label mono">YOUR SERVER</p>
              <p class="clock-state mono" [attr.data-state]="receiverState()">{{ receiverState() === 'processing' ? 'PROCESSING…' : receiverState() === 'done' ? 'STILL WORKING' : 'IDLE' }}</p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="start()" [disabled]="running()">START THE REQUEST</button>
          </div>

          @if (message(); as m) {
            <p class="lab-note lab-note-warn">{{ m }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .clock-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .clock-side { flex: 1; min-width: 140px; text-align: center; }
    .clock-label { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 6px; }
    .clock-state { font-size: 0.8125rem; color: var(--text-muted); }
    .clock-state[data-state='waiting'], .clock-state[data-state='processing'] { color: var(--pending); }
    .clock-state[data-state='failed'] { color: var(--failure); }
    .clock-state[data-state='done'] { color: var(--retry); }
    .clock-face { font-size: 2.5rem; font-weight: 700; color: var(--text); min-width: 120px; text-align: center; }
    .lab-btn-row { margin-top: 20px; }
  `,
})
export class TimeoutVisualization implements OnDestroy {
  protected readonly secondsLeft = signal(5);
  protected readonly providerState = signal<'idle' | 'waiting' | 'failed'>('idle');
  protected readonly receiverState = signal<'idle' | 'processing' | 'done'>('idle');
  protected readonly running = signal(false);
  protected readonly message = signal<string | null>(null);

  private raf: number | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
  }

  protected start(): void {
    if (this.running()) return;
    this.running.set(true);
    this.message.set(null);
    this.providerState.set('waiting');
    this.receiverState.set('processing');
    this.secondsLeft.set(5);

    const start = performance.now();
    const durationMs = 5000;
    const step = (now: number) => {
      const remaining = Math.max(0, 5 - (now - start) / 1000);
      this.secondsLeft.set(remaining);
      if (remaining > 0) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.providerState.set('failed');
        this.receiverState.set('done');
        this.message.set(
          'The provider gave up at 5s and recorded this delivery as failed — but that does not prove your server did nothing. It may still be finishing the work right now; the timeout only means the provider stopped waiting for the response.',
        );
        this.running.set(false);
      }
    };
    this.raf = requestAnimationFrame(step);

    this.timers.push(setTimeout(() => {
      // Simulate the receiver actually finishing well after the provider gave up.
      if (!this.running()) return;
    }, durationMs));
  }
}
