import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PerfHero } from '../components/perf-hero/perf-hero';
import { LatencyBreakdown } from '../components/latency-breakdown/latency-breakdown';
import { AverageVsTail } from '../components/average-vs-tail/average-vs-tail';
import { PercentilesLab } from '../components/percentiles-lab/percentiles-lab';
import { ThroughputConcurrency } from '../components/throughput-concurrency/throughput-concurrency';
import { UtilizationCurve } from '../components/utilization-curve/utilization-curve';
import { QueueingBackpressure } from '../components/queueing-backpressure/queueing-backpressure';
import { BottleneckLab } from '../components/bottleneck-lab/bottleneck-lab';
import { MeasureDontGuess } from '../components/measure-dont-guess/measure-dont-guess';
import { ProfilingLab } from '../components/profiling-lab/profiling-lab';
import { DistributedTracing } from '../components/distributed-tracing/distributed-tracing';
import { NPlusOne } from '../components/n-plus-one/n-plus-one';
import { DatabaseIndexes } from '../components/database-indexes/database-indexes';
import { ConnectionPooling } from '../components/connection-pooling/connection-pooling';
import { CachingLab } from '../components/caching-lab/caching-lab';
import { CacheInvalidation } from '../components/cache-invalidation/cache-invalidation';
import { CacheStampede } from '../components/cache-stampede/cache-stampede';
import { VerticalVsHorizontalScaling } from '../components/vertical-vs-horizontal-scaling/vertical-vs-horizontal-scaling';
import { StatelessnessLoadbalancing } from '../components/statelessness-loadbalancing/statelessness-loadbalancing';
import { DatabaseScaling } from '../components/database-scaling/database-scaling';
import { CdnEdge } from '../components/cdn-edge/cdn-edge';
import { AsyncQueueWorkers } from '../components/async-queue-workers/async-queue-workers';
import { MicroservicesVsMonolith } from '../components/microservices-vs-monolith/microservices-vs-monolith';
import { Autoscaling } from '../components/autoscaling/autoscaling';
import { RateLimiting } from '../components/rate-limiting/rate-limiting';
import { LoadTestingCapacity } from '../components/load-testing-capacity/load-testing-capacity';
import { PerformanceVsScalability } from '../components/performance-vs-scalability/performance-vs-scalability';
import { ResiliencePatterns } from '../components/resilience-patterns/resilience-patterns';
import { FullSystemLab } from '../components/full-system-lab/full-system-lab';
import { BottleneckChallenges } from '../components/bottleneck-challenges/bottleneck-challenges';
import { SystemEvolution } from '../components/system-evolution/system-evolution';
import { MentalModelTradeoffs } from '../components/mental-model-tradeoffs/mental-model-tradeoffs';
import { BreakTheSystem } from '../components/break-the-system/break-the-system';
import { ObservabilityConsole } from '../components/observability-console/observability-console';
import { TerminologyMap } from '../components/terminology-map/terminology-map';
import { InterviewMode } from '../components/interview-mode/interview-mode';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'perf-landing', label: 'Your Backend Works' },
  { id: 'what-is-latency', label: 'What Is Latency?' },
  { id: 'average-misleading', label: 'Why Averages Lie' },
  { id: 'percentiles', label: 'P50 / P90 / P95 / P99' },
  { id: 'throughput-concurrency', label: 'Throughput & Concurrency' },
  { id: 'utilization-curve', label: 'Utilization & the Latency Curve' },
  { id: 'queueing-backpressure', label: 'Queueing & Backpressure' },
  { id: 'bottleneck-lab', label: 'Finding Bottlenecks' },
  { id: 'measure-dont-guess', label: "Measure, Don't Guess" },
  { id: 'profiling-lab', label: 'Profiling' },
  { id: 'distributed-tracing', label: 'Distributed Tracing' },
  { id: 'n-plus-one', label: 'The N+1 Query Problem' },
  { id: 'database-indexes', label: 'Database Indexes' },
  { id: 'connection-pooling', label: 'Connection Pooling' },
  { id: 'caching-lab', label: 'Caching' },
  { id: 'cache-invalidation', label: 'Cache Invalidation' },
  { id: 'cache-stampede', label: 'Cache Stampede' },
  { id: 'vertical-vs-horizontal', label: 'Vertical vs Horizontal Scaling' },
  { id: 'statelessness-loadbalancing', label: 'Statelessness & Load Balancing' },
  { id: 'database-scaling', label: 'Scaling the Database' },
  { id: 'cdn-edge', label: 'CDN & Edge Computing' },
  { id: 'async-queue-workers', label: 'Asynchronous Processing' },
  { id: 'microservices-vs-monolith', label: 'Microservices vs Monolith' },
  { id: 'autoscaling', label: 'Autoscaling' },
  { id: 'rate-limiting', label: 'Rate Limiting' },
  { id: 'load-testing-capacity', label: 'Load Testing & Capacity Planning' },
  { id: 'performance-vs-scalability', label: 'Performance vs Scalability' },
  { id: 'resilience-patterns', label: 'Resilience Under Load' },
  { id: 'full-system-lab', label: 'The Complete Performance Lab' },
  { id: 'bottleneck-challenges', label: 'Find the Bottleneck' },
  { id: 'system-evolution', label: 'Complete System Evolution' },
  { id: 'mental-model', label: 'The Mental Model' },
  { id: 'break-the-system', label: 'Break the System' },
  { id: 'observability-console', label: 'Observability' },
  { id: 'terminology-map', label: 'Connected Concepts' },
  { id: 'interview-mode', label: 'Interview Mode' },
];

@Component({
  selector: 'app-backend-scaling-page',
  standalone: true,
  imports: [
    RouterLink,
    PerfHero,
    LatencyBreakdown,
    AverageVsTail,
    PercentilesLab,
    ThroughputConcurrency,
    UtilizationCurve,
    QueueingBackpressure,
    BottleneckLab,
    MeasureDontGuess,
    ProfilingLab,
    DistributedTracing,
    NPlusOne,
    DatabaseIndexes,
    ConnectionPooling,
    CachingLab,
    CacheInvalidation,
    CacheStampede,
    VerticalVsHorizontalScaling,
    StatelessnessLoadbalancing,
    DatabaseScaling,
    CdnEdge,
    AsyncQueueWorkers,
    MicroservicesVsMonolith,
    Autoscaling,
    RateLimiting,
    LoadTestingCapacity,
    PerformanceVsScalability,
    ResiliencePatterns,
    FullSystemLab,
    BottleneckChallenges,
    SystemEvolution,
    MentalModelTradeoffs,
    BreakTheSystem,
    ObservabilityConsole,
    TerminologyMap,
    InterviewMode,
  ],
  templateUrl: './backend-scaling-page.html',
  styleUrl: './backend-scaling-page.css',
})
export class BackendScalingPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('perf-landing');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Backend Scaling & Performance Engineering');
    this.meta.updateTag({
      name: 'description',
      content:
        'A performance lab, system simulator, and observability console — break a backend under load, find the real bottleneck, then measure, optimize, and scale it.',
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
