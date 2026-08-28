import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { RequestLifecycleHero } from '../components/request-lifecycle-hero/request-lifecycle-hero';
import { BadBackendVsLayers } from '../components/bad-backend-vs-layers/bad-backend-vs-layers';
import { BackendPipelineVisualizer } from '../components/backend-pipeline-visualizer/backend-pipeline-visualizer';
import { LifecycleTimeline } from '../components/lifecycle-timeline/lifecycle-timeline';
import { MiddlewarePipeline } from '../components/middleware-pipeline/middleware-pipeline';
import { NextFunctionVisualizer } from '../components/next-function-visualizer/next-function-visualizer';
import { MiddlewareOrderingLab } from '../components/middleware-ordering-lab/middleware-ordering-lab';
import { ErrorPropagationVisualizer } from '../components/error-propagation-visualizer/error-propagation-visualizer';
import { ControllerVisualizer } from '../components/controller-visualizer/controller-visualizer';
import { ServiceLayerVisualizer } from '../components/service-layer-visualizer/service-layer-visualizer';
import { RepositoryVisualizer } from '../components/repository-visualizer/repository-visualizer';
import { LayerComparison } from '../components/layer-comparison/layer-comparison';
import { RulePlacementGame } from '../components/rule-placement-game/rule-placement-game';
import { RequestContextVisualizer } from '../components/request-context-visualizer/request-context-visualizer';
import { ContextSecurityLab } from '../components/context-security-lab/context-security-lab';
import { CorrelationIdVisualizer } from '../components/correlation-id-visualizer/correlation-id-visualizer';
import { CancellationVisualizer } from '../components/cancellation-visualizer/cancellation-visualizer';
import { ContextVsGlobalState } from '../components/context-vs-global-state/context-vs-global-state';
import { ContextPropagationLab } from '../components/context-propagation-lab/context-propagation-lab';
import { RequestDebugger } from '../components/request-debugger/request-debugger';
import { FailureSimulator } from '../components/failure-simulator/failure-simulator';
import { ResponseLifecycle } from '../components/response-lifecycle/response-lifecycle';
import { DependencyDirection } from '../components/dependency-direction/dependency-direction';
import { ArchitecturalSmells } from '../components/architectural-smells/architectural-smells';
import { MiddlewareVsService } from '../components/middleware-vs-service/middleware-vs-service';
import { RealWorldOrderFlow } from '../components/real-world-order-flow/real-world-order-flow';
import { ObservabilityPanel } from '../components/observability-panel/observability-panel';
import { TraceRequestGame } from '../components/trace-request-game/trace-request-game';
import { InterviewMode } from '../components/interview-mode/interview-mode';
import { KnowledgeQuiz } from '../components/knowledge-quiz/knowledge-quiz';
import { BackendLayersSummary } from '../components/backend-layers-summary/backend-layers-summary';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'big-question', label: 'Why Layer a Backend?' },
  { id: 'pipeline', label: 'The Complete Request Lifecycle' },
  { id: 'timeline', label: 'Request Lifecycle Timeline' },
  { id: 'middleware-pipeline', label: 'Middleware: The Pipeline' },
  { id: 'next-visualizer', label: 'The next() Visualizer' },
  { id: 'ordering-lab', label: 'Middleware Order Lab' },
  { id: 'error-propagation', label: 'Error Propagation' },
  { id: 'controller', label: 'Controller: HTTP Boundary' },
  { id: 'service-layer', label: 'Service Layer' },
  { id: 'repository', label: 'Repository: Data Access' },
  { id: 'layer-comparison', label: 'Controller vs Service vs Repository' },
  { id: 'rule-placement', label: '"Where Should This Code Go?"' },
  { id: 'request-context', label: 'Request Context' },
  { id: 'context-security', label: 'Context Security Lab' },
  { id: 'correlation-id', label: 'Correlation ID' },
  { id: 'cancellation', label: 'Cancellation' },
  { id: 'context-vs-global', label: 'Context vs Global State' },
  { id: 'context-propagation', label: 'Context Propagation' },
  { id: 'request-debugger', label: 'Live Request Debugger' },
  { id: 'failure-simulator', label: 'Request Failure Simulator' },
  { id: 'response-lifecycle', label: 'The Response Journey' },
  { id: 'dependency-direction', label: 'Dependency Direction & Testability' },
  { id: 'architectural-smells', label: 'Architectural Mistakes' },
  { id: 'middleware-vs-service', label: 'Middleware vs Controller vs Service' },
  { id: 'real-world-order', label: 'Real-World Order Request' },
  { id: 'observability', label: 'Observability & Performance' },
  { id: 'trace-game', label: '"Trace This Request"' },
  { id: 'interview-mode', label: 'Interview Mode' },
  { id: 'quiz', label: 'Knowledge Check' },
  { id: 'summary', label: 'Final Mental Model' },
  { id: 'connection-map', label: 'Chapter Connection Map' },
];

@Component({
  selector: 'app-backend-layers-page',
  standalone: true,
  imports: [
    RouterLink,
    RequestLifecycleHero,
    BadBackendVsLayers,
    BackendPipelineVisualizer,
    LifecycleTimeline,
    MiddlewarePipeline,
    NextFunctionVisualizer,
    MiddlewareOrderingLab,
    ErrorPropagationVisualizer,
    ControllerVisualizer,
    ServiceLayerVisualizer,
    RepositoryVisualizer,
    LayerComparison,
    RulePlacementGame,
    RequestContextVisualizer,
    ContextSecurityLab,
    CorrelationIdVisualizer,
    CancellationVisualizer,
    ContextVsGlobalState,
    ContextPropagationLab,
    RequestDebugger,
    FailureSimulator,
    ResponseLifecycle,
    DependencyDirection,
    ArchitecturalSmells,
    MiddlewareVsService,
    RealWorldOrderFlow,
    ObservabilityPanel,
    TraceRequestGame,
    InterviewMode,
    KnowledgeQuiz,
    BackendLayersSummary,
  ],
  templateUrl: './backend-layers-page.html',
  styleUrl: './backend-layers-page.css',
})
export class BackendLayersPage implements OnInit, AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('hero');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Controllers, Services, Repositories & Middleware');
    this.meta.updateTag({
      name: 'description',
      content:
        'Follow one request from the network all the way to the database and back — a live backend request lifecycle lab covering middleware, controllers, services, repositories, and request context.',
    });

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', this.onScroll));
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.updateActiveSection());
  }

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
