import { Component, computed, signal } from '@angular/core';

interface Stage {
  id: string;
  index: string;
  title: string;
  detail: string;
}

const STAGES: Stage[] = [
  { id: 'community', index: '01', title: 'Small communities', detail: '"I know who you are." Identity was established by direct, personal recognition.' },
  { id: 'seals', index: '02', title: 'Physical seals / signatures', detail: 'As trade grew beyond people who knew each other, physical marks stood in for a face.' },
  { id: 'passwords', index: '03', title: 'Passwords / passphrases', detail: 'A shared secret replaced a physical object — but the secret had to travel and be checked.' },
  { id: 'digital', index: '04', title: 'Digital authentication', detail: 'Computers needed a way to check that secret automatically, over and over, at scale.' },
  { id: 'hashing', index: '05', title: 'Password hashing + cryptography', detail: 'Storing the secret itself became a liability — systems learned to store a verifier instead.' },
  { id: 'sessions', index: '06', title: 'Sessions', detail: 'Re-checking a password on every request was impractical — servers started remembering you.' },
  { id: 'tokens', index: '07', title: 'Tokens / JWT', detail: 'As systems became distributed, a self-contained proof of identity became attractive.' },
  { id: 'oauth', index: '08', title: 'OAuth 2.0 / OpenID Connect', detail: 'Applications needed to act on a user\'s behalf with a third party, without ever seeing their password.' },
  { id: 'modern', index: '09', title: 'MFA / Passkeys / modern identity', detail: 'A single secret is fragile — modern identity increasingly combines multiple, harder-to-steal factors.' },
];

@Component({
  selector: 'app-identity-timeline',
  standalone: true,
  template: `
    <section class="lab-section" id="identity-timeline">
      <div class="container">
        <p class="lab-index">AUTH / 04 — THE EVOLUTION OF IDENTITY</p>
        <h2 class="lab-title">As systems grew apart, "who is this?" got harder to answer.</h2>
        <p class="lab-lede">
          Not an exhaustive history — the point is the trend: distributed systems keep needing new
          ways to answer the same question a neighbor once answered by sight.
        </p>

        <div class="timeline">
          @for (s of stages; track s.id; let i = $index) {
            <button
              type="button"
              class="timeline-node"
              [class.is-active]="active() === i"
              (click)="active.set(i)"
            >
              <span class="node-index mono">{{ s.index }}</span>
              <span class="node-title">{{ s.title }}</span>
            </button>
          }
        </div>

        <div class="lab-panel detail-panel">
          <p class="detail-title mono">{{ current().index }} — {{ current().title }}</p>
          <p class="detail-text">{{ current().detail }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .timeline {
      margin-top: 32px;
      display: flex;
      overflow-x: auto;
      gap: 8px;
      padding-bottom: 8px;
    }

    .timeline-node {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 12px 16px;
      min-width: 160px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-muted);
      text-align: left;
      transition: border-color 0.2s ease, color 0.2s ease;
    }

    .timeline-node.is-active {
      border-color: var(--accent);
      color: var(--text);
      box-shadow: 0 0 16px var(--glow-accent);
    }

    .node-index { font-size: 0.6875rem; color: var(--accent-2); }
    .node-title { font-size: 0.8125rem; font-weight: 600; line-height: 1.3; }

    .detail-panel { margin-top: 20px; }
    .detail-title { font-size: 0.8125rem; color: var(--accent-strong); }
    .detail-text { margin-top: 10px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; max-width: 640px; }
  `,
})
export class IdentityTimeline {
  protected readonly stages = STAGES;
  protected readonly active = signal(0);
  protected readonly current = computed(() => this.stages[this.active()]);
}
