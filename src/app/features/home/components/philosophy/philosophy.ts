import { Component } from '@angular/core';
import { SectionHeading } from '../../../../shared/components/section-heading/section-heading';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface FlowStep {
  label: string;
  muted?: boolean;
}

@Component({
  selector: 'app-philosophy',
  standalone: true,
  imports: [SectionHeading, RevealDirective],
  templateUrl: './philosophy.html',
  styleUrl: './philosophy.css',
})
export class Philosophy {
  protected readonly traditional: FlowStep[] = [
    { label: 'Definition' },
    { label: 'Code example' },
    { label: 'Move on', muted: true },
  ];

  protected readonly underTheHood: FlowStep[] = [
    { label: 'Concept' },
    { label: 'Visualize' },
    { label: 'Interact' },
    { label: 'Inspect' },
    { label: 'Understand' },
    { label: 'Explain' },
  ];
}
