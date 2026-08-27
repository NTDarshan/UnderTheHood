import { Component } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { currentLearning } from '../../../../data/current-learning.data';

@Component({
  selector: 'app-current-learning',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './current-learning.html',
  styleUrl: './current-learning.css',
})
export class CurrentLearningComponent {
  protected readonly data = currentLearning;
}
