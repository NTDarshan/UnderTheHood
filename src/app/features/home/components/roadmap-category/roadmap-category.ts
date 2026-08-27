import { Component, input, signal } from '@angular/core';
import { RoadmapCategory } from '../../../../data/roadmap.model';
import { RoadmapTopic } from './roadmap-topic';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-roadmap-category',
  standalone: true,
  imports: [RoadmapTopic, RevealDirective],
  templateUrl: './roadmap-category.html',
  styleUrl: './roadmap-category.css',
})
export class RoadmapCategoryComponent {
  readonly category = input.required<RoadmapCategory>();
  readonly last = input(false);

  protected readonly expanded = signal(true);

  toggle() {
    this.expanded.update((v) => !v);
  }
}
