import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { ScrollToDirective } from '../../shared/directives/scroll-to.directive';
import { roadmapData } from '../../data/roadmap.data';
import { LearningTopic } from '../../data/roadmap.model';

@Component({
  selector: 'app-coming-soon-page',
  standalone: true,
  imports: [RouterLink, StatusBadge, ScrollToDirective],
  templateUrl: './coming-soon-page.html',
  styleUrl: './coming-soon-page.css',
})
export class ComingSoonPage {
  private readonly route = inject(ActivatedRoute);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly topic = computed<LearningTopic | undefined>(() =>
    roadmapData.flatMap((c) => c.topics).find((t) => t.id === this.id()),
  );

  protected readonly category = computed(() =>
    roadmapData.find((c) => c.topics.some((t) => t.id === this.id())),
  );
}
