import { Component } from '@angular/core';
import { SectionHeading } from '../../../../shared/components/section-heading/section-heading';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface FlowStep {
  index: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-learning-flow',
  standalone: true,
  imports: [SectionHeading, RevealDirective],
  templateUrl: './learning-flow.html',
  styleUrl: './learning-flow.css',
})
export class LearningFlow {
  protected readonly steps: FlowStep[] = [
    { index: '01', title: 'Learn', description: 'Understand the concept from first principles.' },
    { index: '02', title: 'Model', description: 'Build a mental model of what is happening.' },
    { index: '03', title: 'Visualize', description: 'Turn the mental model into an interactive experience.' },
    { index: '04', title: 'Share', description: 'Publish it and make it useful to other developers.' },
  ];
}
