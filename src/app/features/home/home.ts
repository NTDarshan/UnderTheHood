import { Component } from '@angular/core';
import { Hero } from './components/hero/hero';
import { Philosophy } from './components/philosophy/philosophy';
import { AboutBuilder } from './components/about-builder/about-builder';
import { LearningFlow } from './components/learning-flow/learning-flow';
import { Roadmap } from './components/roadmap/roadmap';
import { CurrentLearningComponent } from './components/current-learning/current-learning';
import { ComingSoon } from './components/coming-soon/coming-soon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, Philosophy, AboutBuilder, LearningFlow, Roadmap, CurrentLearningComponent, ComingSoon],
  templateUrl: './home.html',
})
export class Home {}
