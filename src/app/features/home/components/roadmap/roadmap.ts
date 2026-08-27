import { Component } from '@angular/core';
import { SectionHeading } from '../../../../shared/components/section-heading/section-heading';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { RoadmapCategoryComponent } from '../roadmap-category/roadmap-category';
import { roadmapData } from '../../../../data/roadmap.data';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [SectionHeading, RevealDirective, RoadmapCategoryComponent],
  templateUrl: './roadmap.html',
  styleUrl: './roadmap.css',
})
export class Roadmap {
  protected readonly categories = roadmapData;
  protected readonly topicCount = roadmapData.reduce((sum, c) => sum + c.topics.length, 0);
}
