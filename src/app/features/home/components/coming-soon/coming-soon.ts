import { Component } from '@angular/core';
import { SectionHeading } from '../../../../shared/components/section-heading/section-heading';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { RouterLink } from '@angular/router';
import { featuredPreviews } from '../../../../data/roadmap.data';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [SectionHeading, StatusBadge, RevealDirective, RouterLink],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.css',
})
export class ComingSoon {
  protected readonly previews = featuredPreviews;
}
