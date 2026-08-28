import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningTopic } from '../../../../data/roadmap.model';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-roadmap-topic',
  standalone: true,
  imports: [RouterLink, StatusBadge],
  template: `
    <a class="topic" [routerLink]="topic().route ?? ['/explore', topic().id]">
      <span class="topic-marker" aria-hidden="true"></span>
      <span class="topic-body">
        <span class="topic-title">{{ topic().title }}</span>
        <span class="topic-description">{{ topic().description }}</span>
      </span>
      <app-status-badge [status]="topic().status" />
    </a>
  `,
  styles: `
    .topic {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      transition: background 0.15s ease;
    }

    .topic:hover,
    .topic:focus-visible {
      background: var(--surface-raised);
    }

    .topic-marker {
      width: 7px;
      height: 7px;
      margin-top: 8px;
      border-radius: 50%;
      background: var(--border-strong);
      flex-shrink: 0;
    }

    .topic-body {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }

    .topic-title {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--text);
    }

    .topic-description {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
  `,
})
export class RoadmapTopic {
  readonly topic = input.required<LearningTopic>();
}
