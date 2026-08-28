import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-redirects-demo',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="redirects">
      <div class="container">
        <p class="lab-index">ROUTING / 12 — REDIRECTS</p>
        <h2 class="lab-title">Sometimes a route's job is just to point somewhere else.</h2>
        <p class="lab-lede">
          A redirect tells the client "this isn't here anymore — go look over there," using a status code
          to say whether that move is permanent or temporary.
        </p>

        <app-explain-simply>
          It's a forwarding address on an old mailbox: mail sent to the old address still finds you, but
          the post office lets the sender know where you actually live now.
        </app-explain-simply>

        <div class="redirect-flow">
          <div class="redirect-node">
            <span class="mono">/old-users</span>
          </div>
          <button type="button" class="redirect-play" (click)="play()" [disabled]="playing()">
            {{ playing() ? '301 →' : 'Follow redirect →' }}
          </button>
          <div class="redirect-node" [class.is-active]="landed()">
            <span class="mono">/users</span>
          </div>
        </div>

        <p class="lab-note">
          <span class="mono">301 Moved Permanently</span> tells browsers and search engines to update their
          records and use the new URL from now on — a <span class="mono">302 Found</span> would say the
          move is only temporary, and to keep using the old URL next time.
        </p>
      </div>
    </section>
  `,
  styles: `
    .redirect-flow {
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .redirect-node {
      padding: 16px 22px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-faint);
      transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    }

    .redirect-node.is-active {
      border-color: var(--accent-2);
      color: var(--accent-2);
      box-shadow: 0 0 18px var(--glow-accent-2);
    }

    .redirect-play {
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--accent-dim);
      background: var(--surface-elevated);
      color: var(--accent);
      font-size: 0.8125rem;
    }
  `,
})
export class RedirectsDemo {
  protected readonly playing = signal(false);
  protected readonly landed = signal(false);

  async play(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    this.landed.set(false);
    await new Promise((r) => setTimeout(r, 700));
    this.landed.set(true);
    this.playing.set(false);
  }
}
