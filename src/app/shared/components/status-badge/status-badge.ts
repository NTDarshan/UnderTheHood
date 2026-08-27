import { Component, computed, input } from '@angular/core';
import { TopicStatus } from '../../../data/roadmap.model';

const LABELS: Record<TopicStatus, string> = {
  'coming-soon': 'Coming Soon',
  'in-progress': 'In Progress',
  interactive: 'Interactive',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="status status-{{ status() }}">
      <span class="status-dot" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
  styles: `
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 9px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      color: var(--text-muted);
      white-space: nowrap;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-faint);
    }

    .status-in-progress {
      color: var(--accent-2);
      border-color: var(--accent-2-dim);
    }
    .status-in-progress .status-dot {
      background: var(--accent-2);
      box-shadow: 0 0 6px var(--glow-accent-2);
      animation: pulse-node 1.8s ease-in-out infinite;
    }

    .status-interactive {
      color: var(--accent);
      border-color: var(--accent-dim);
    }
    .status-interactive .status-dot {
      background: var(--accent);
      box-shadow: 0 0 6px var(--glow-accent);
    }
  `,
})
export class StatusBadge {
  readonly status = input.required<TopicStatus>();
  protected readonly label = computed(() => LABELS[this.status()]);
}
