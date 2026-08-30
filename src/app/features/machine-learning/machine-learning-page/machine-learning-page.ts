import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MlHero } from '../components/ml-hero/ml-hero';
import { WhatIsMl } from '../components/what-is-ml/what-is-ml';
import { WhyMl } from '../components/why-ml/why-ml';
import { MlTypesMap } from '../components/ml-types-map/ml-types-map';
import { FeaturesLabels } from '../components/features-labels/features-labels';
import { FeatureSpace } from '../components/feature-space/feature-space';
import { LineEquationLab } from '../components/line-equation-lab/line-equation-lab';
import { LineAsModel } from '../components/line-as-model/line-as-model';
import { ResidualError } from '../components/residual-error/residual-error';
import { SquaredErrorMse } from '../components/squared-error-mse/squared-error-mse';
import { FeatureSpace3d } from '../components/feature-space-3d/feature-space-3d';
import { PlaneLab } from '../components/plane-lab/plane-lab';
import { HyperplaneConcept } from '../components/hyperplane-concept/hyperplane-concept';
import { PointPlaneDistance } from '../components/point-plane-distance/point-plane-distance';
import { DistanceInMl } from '../components/distance-in-ml/distance-in-ml';
import { KnnLab } from '../components/knn-lab/knn-lab';
import { ModelBasedLearning } from '../components/model-based-learning/model-based-learning';
import { InstanceVsModel } from '../components/instance-vs-model/instance-vs-model';
import { FeatureScaling } from '../components/feature-scaling/feature-scaling';
import { TrainingVsInference } from '../components/training-vs-inference/training-vs-inference';
import { GeneralizationLab } from '../components/generalization-lab/generalization-lab';
import { MlMentalModel } from '../components/ml-mental-model/ml-mental-model';
import { MlPlayground } from '../components/ml-playground/ml-playground';
import { BreakTheModel } from '../components/break-the-model/break-the-model';
import { MlTerminologyMap } from '../components/ml-terminology-map/ml-terminology-map';
import { MlInterviewMode } from '../components/ml-interview-mode/ml-interview-mode';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'ml-landing', label: 'The Problem' },
  { id: 'what-is-ml', label: 'What Is This, Really?' },
  { id: 'why-ml', label: 'Why Not Just Rules?' },
  { id: 'ml-types', label: 'Three Ways to Learn' },
  { id: 'features-labels', label: 'Features & Labels' },
  { id: 'feature-space', label: 'Data as Geometry' },
  { id: 'line-lab', label: 'Equation of a Line' },
  { id: 'line-as-model', label: 'The Line as a Model' },
  { id: 'residual', label: 'Residuals' },
  { id: 'squared-error', label: 'Why Square the Error?' },
  { id: 'feature-space-3d', label: 'Into 3D' },
  { id: 'plane-lab', label: 'Equation of a Plane' },
  { id: 'hyperplane', label: 'The Hyperplane' },
  { id: 'point-plane-distance', label: 'Point-to-Plane Distance' },
  { id: 'distance-ml', label: 'Distance in ML' },
  { id: 'knn', label: 'K-Nearest Neighbors' },
  { id: 'model-based', label: 'Model-Based Learning' },
  { id: 'instance-vs-model', label: 'Instance vs Model' },
  { id: 'feature-scaling', label: 'Feature Scaling' },
  { id: 'training-inference', label: 'Training vs Inference' },
  { id: 'generalization', label: 'Generalization' },
  { id: 'mental-model', label: 'The Mental Model' },
  { id: 'playground', label: 'The Playground' },
  { id: 'break-the-model', label: 'Break the Model' },
  { id: 'terminology', label: 'Connected Terms' },
  { id: 'interview-mode', label: 'Interview Mode' },
];

@Component({
  selector: 'app-machine-learning-page',
  standalone: true,
  imports: [
    RouterLink,
    MlHero,
    WhatIsMl,
    WhyMl,
    MlTypesMap,
    FeaturesLabels,
    FeatureSpace,
    LineEquationLab,
    LineAsModel,
    ResidualError,
    SquaredErrorMse,
    FeatureSpace3d,
    PlaneLab,
    HyperplaneConcept,
    PointPlaneDistance,
    DistanceInMl,
    KnnLab,
    ModelBasedLearning,
    InstanceVsModel,
    FeatureScaling,
    TrainingVsInference,
    GeneralizationLab,
    MlMentalModel,
    MlPlayground,
    BreakTheModel,
    MlTerminologyMap,
    MlInterviewMode,
  ],
  templateUrl: './machine-learning-page.html',
  styleUrl: './machine-learning-page.css',
})
export class MachineLearningPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('ml-landing');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Machine Learning Under the Hood');
    this.meta.updateTag({
      name: 'description',
      content:
        'A mathematical playground for machine learning — drag a line, rotate a plane, watch residuals shrink, and discover the geometry underneath a model, one experiment at a time.',
    });

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', this.onScroll));
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.updateActiveSection());
  }

  ngOnDestroy(): void {}

  private scheduleUpdate(): void {
    if (this.tickScheduled) return;
    this.tickScheduled = true;
    requestAnimationFrame(() => {
      this.tickScheduled = false;
      this.updateActiveSection();
    });
  }

  private updateActiveSection(): void {
    const line = window.innerHeight * 0.3;
    let current = PROGRESS[0].id;

    for (const item of PROGRESS) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= line) {
        current = item.id;
      }
    }

    this.activeSection.set(current);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
