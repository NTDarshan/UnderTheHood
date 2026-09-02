import { Component, computed, signal } from '@angular/core';

const ROUNDS_PER_CLICK = 8;
// Thread A wins the resource this often; the rest of the time Thread B gets a shot,
// but the priority scheme keeps re-favoring A, so B's share barely grows.
const A_WIN_PROBABILITY = 0.9;

@Component({
  selector: 'app-starvation-liveness-safety',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="starvation-liveness-safety">
      <div class="container">
        <p class="lab-index">29-30 — STARVATION, LIVENESS &amp; SAFETY</p>
        <h2 class="lab-title">Starvation, liveness and safety</h2>
        <p class="lab-lede">
          Deadlock is total standstill — nobody moves. Starvation is different: the system keeps making progress,
          it just never shares that progress fairly. Run the scheduler below and watch one thread get everything
          while another gets almost nothing.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Starvation simulation controls">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runRounds()">
              Run {{ ROUNDS_PER_CLICK }} rounds
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="bars" aria-live="polite">
            <div class="bar-row">
              <p class="lab-node">Thread A</p>
              <div class="bar-track">
                <div class="bar-fill bar-a" [style.width.%]="aPercent()"></div>
              </div>
              <p class="bar-count mono">{{ aWins() }} / {{ totalRounds() }} rounds won</p>
            </div>
            <div class="bar-row">
              <p class="lab-node">Thread B</p>
              <div class="bar-track">
                <div class="bar-fill bar-b" [style.width.%]="bPercent()"></div>
              </div>
              <p class="bar-count mono">{{ bWins() }} / {{ totalRounds() }} rounds won</p>
            </div>
          </div>

          @if (totalRounds() > 0) {
            <div class="verdict">
              <span class="pill" [class.pill-yes]="true">progress: yes, A keeps running</span>
              <span class="pill" [class.pill-no]="bWins() < totalRounds() * 0.15">B scheduled: rarely</span>
              @if (totalRounds() >= 24 && bWins() === 0) {
                <span class="pill pill-no">STARVATION — B has never once won the resource</span>
              }
            </div>
          }

          <p class="lab-note lab-note-warn">
            This is <strong>starvation</strong>, not deadlock. Thread A is never blocked — the system as a whole is
            making progress every single round. Thread B is technically free to run too; it is simply never chosen
            by the scheduler's priority rule. Deadlock is a standstill where nothing progresses; starvation is
            unfairness where something always progresses, just never the same something twice.
          </p>
        </div>

        <div class="lab-panel comparison-panel">
          <p class="conditions-title mono">Safety vs. liveness</p>
          <div class="compare-grid">
            <div class="compare-card">
              <p class="compare-heading mono">SAFETY</p>
              <p class="compare-tagline">"Nothing bad ever happens."</p>
              <p class="compare-body">
                Two threads never corrupt shared state, an invariant is never violated, a counter never loses an
                update. This is exactly what a
                <a href="#race-conditions-lab" (click)="scrollTo($event, 'race-conditions-lab')">race condition</a>
                violates: an unsynchronized increment can let two threads overwrite each other's write, breaking a
                safety property that should hold at every instant.
              </p>
            </div>
            <div class="compare-card">
              <p class="compare-heading mono">LIVENESS</p>
              <p class="compare-tagline">"Something good eventually happens."</p>
              <p class="compare-body">
                A thread waiting for a lock or a resource eventually gets it. The starvation demo above is a
                liveness failure: Thread B is never correct in the sense of corrupting anything — it just never
                eventually gets its turn, so the "eventually" promise is broken.
              </p>
            </div>
          </div>
          <p class="lab-note">
            A correct concurrent system needs <strong>both</strong> properties. Safety without liveness gives you a
            system that never breaks but can starve or deadlock forever. Liveness without safety gives you a system
            that always makes progress but corrupts data while doing it.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .bars { margin-top: 24px; display: flex; flex-direction: column; gap: 18px; }
    .bar-row { display: flex; flex-direction: column; gap: 6px; }
    .bar-track {
      width: 100%;
      height: 22px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .bar-fill { height: 100%; transition: width 0.4s ease; border-radius: var(--radius-sm); }
    .bar-a { background: var(--running); }
    .bar-b { background: var(--blocked); }
    .bar-count { margin: 0; font-size: 0.75rem; color: var(--text-muted); }

    .verdict { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; }

    .comparison-panel { margin-top: 24px; }
    .conditions-title { color: var(--text-faint); letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.6875rem; margin-bottom: 14px; }

    .compare-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 720px) { .compare-grid { grid-template-columns: 1fr 1fr; } }

    .compare-card {
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .compare-heading { color: var(--accent-2); letter-spacing: 0.06em; font-size: 0.8125rem; margin: 0 0 6px; }
    .compare-tagline { margin: 0 0 10px; color: var(--text); font-style: italic; }
    .compare-body { margin: 0; color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; }
    .compare-body a { color: var(--accent-strong); text-decoration: underline; text-underline-offset: 2px; }
  `,
})
export class StarvationLivenessSafety {
  protected readonly ROUNDS_PER_CLICK = ROUNDS_PER_CLICK;

  protected readonly aWins = signal(0);
  protected readonly bWins = signal(0);

  protected readonly totalRounds = computed(() => this.aWins() + this.bWins());

  protected readonly aPercent = computed(() => {
    const total = this.totalRounds();
    return total === 0 ? 0 : (this.aWins() / total) * 100;
  });

  protected readonly bPercent = computed(() => {
    const total = this.totalRounds();
    return total === 0 ? 0 : (this.bWins() / total) * 100;
  });

  protected runRounds(): void {
    let aDelta = 0;
    let bDelta = 0;
    for (let i = 0; i < ROUNDS_PER_CLICK; i++) {
      if (Math.random() < A_WIN_PROBABILITY) {
        aDelta++;
      } else {
        bDelta++;
      }
    }
    this.aWins.update((v) => v + aDelta);
    this.bWins.update((v) => v + bDelta);
  }

  protected reset(): void {
    this.aWins.set(0);
    this.bWins.set(0);
  }

  protected scrollTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
