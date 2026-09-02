import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ConcurrencyHero } from '../components/concurrency-hero/concurrency-hero';
import { WhyConcurrencyMatters } from '../components/why-concurrency-matters/why-concurrency-matters';
import { SequentialExecution } from '../components/sequential-execution/sequential-execution';
import { ConcurrencySingleCore } from '../components/concurrency-single-core/concurrency-single-core';
import { ParallelismMultiCore } from '../components/parallelism-multi-core/parallelism-multi-core';
import { ConcurrencyVsParallelism } from '../components/concurrency-vs-parallelism/concurrency-vs-parallelism';
import { CpuBoundVsIoBound } from '../components/cpu-bound-vs-io-bound/cpu-bound-vs-io-bound';
import { CostOfNoConcurrency } from '../components/cost-of-no-concurrency/cost-of-no-concurrency';
import { ThreadsAndProcesses } from '../components/threads-and-processes/threads-and-processes';
import { ThreadLifecycle } from '../components/thread-lifecycle/thread-lifecycle';
import { ThreadScheduling } from '../components/thread-scheduling/thread-scheduling';
import { ContextSwitching } from '../components/context-switching/context-switching';
import { ThreadPools } from '../components/thread-pools/thread-pools';
import { ConcurrencyVisualizerLab } from '../components/concurrency-visualizer-lab/concurrency-visualizer-lab';
import { EventLoop } from '../components/event-loop/event-loop';
import { BlockingVsNonblocking } from '../components/blocking-vs-nonblocking/blocking-vs-nonblocking';
import { AsyncAwait } from '../components/async-await/async-await';
import { AsyncAwaitStateMachine } from '../components/async-await-state-machine/async-await-state-machine';
import { AsyncNotParallelMyth } from '../components/async-not-parallel-myth/async-not-parallel-myth';
import { VirtualThreadsGoroutines } from '../components/virtual-threads-goroutines/virtual-threads-goroutines';
import { RaceConditionsLab } from '../components/race-conditions-lab/race-conditions-lab';
import { AtomicityLocksMutexes } from '../components/atomicity-locks-mutexes/atomicity-locks-mutexes';
import { CriticalSectionsMutexSemaphore } from '../components/critical-sections-mutex-semaphore/critical-sections-mutex-semaphore';
import { ChannelsMessagePassing } from '../components/channels-message-passing/channels-message-passing';
import { Backpressure } from '../components/backpressure/backpressure';
import { DeadlockLab } from '../components/deadlock-lab/deadlock-lab';
import { StarvationLivenessSafety } from '../components/starvation-liveness-safety/starvation-liveness-safety';
import { ThreadSafetyImmutability } from '../components/thread-safety-immutability/thread-safety-immutability';
import { CancellationTimeouts } from '../components/cancellation-timeouts/cancellation-timeouts';
import { RetriesAndBackoff } from '../components/retries-and-backoff/retries-and-backoff';
import { ConcurrencyLimiting } from '../components/concurrency-limiting/concurrency-limiting';
import { ConcurrencyDbAndCache } from '../components/concurrency-db-and-cache/concurrency-db-and-cache';
import { ServerConcurrencyTrace } from '../components/server-concurrency-trace/server-concurrency-trace';
import { MetricsSaturationAmdahl } from '../components/metrics-saturation-amdahl/metrics-saturation-amdahl';
import { CommonMistakes } from '../components/common-mistakes/common-mistakes';
import { DesignPatternsFanout } from '../components/design-patterns-fanout/design-patterns-fanout';
import { BreakFixTheSystem } from '../components/break-fix-the-system/break-fix-the-system';
import { FinalMentalModelPlayground } from '../components/final-mental-model-playground/final-mental-model-playground';
import { ConcurrencyTerminologyMap } from '../components/concurrency-terminology-map/concurrency-terminology-map';
import { ConcurrencyInterviewMode } from '../components/concurrency-interview-mode/concurrency-interview-mode';

@Component({
  selector: 'app-concurrency-page',
  standalone: true,
  imports: [
    RouterLink,
    ConcurrencyHero,
    WhyConcurrencyMatters,
    SequentialExecution,
    ConcurrencySingleCore,
    ParallelismMultiCore,
    ConcurrencyVsParallelism,
    CpuBoundVsIoBound,
    CostOfNoConcurrency,
    ThreadsAndProcesses,
    ThreadLifecycle,
    ThreadScheduling,
    ContextSwitching,
    ThreadPools,
    ConcurrencyVisualizerLab,
    EventLoop,
    BlockingVsNonblocking,
    AsyncAwait,
    AsyncAwaitStateMachine,
    AsyncNotParallelMyth,
    VirtualThreadsGoroutines,
    RaceConditionsLab,
    AtomicityLocksMutexes,
    CriticalSectionsMutexSemaphore,
    ChannelsMessagePassing,
    Backpressure,
    DeadlockLab,
    StarvationLivenessSafety,
    ThreadSafetyImmutability,
    CancellationTimeouts,
    RetriesAndBackoff,
    ConcurrencyLimiting,
    ConcurrencyDbAndCache,
    ServerConcurrencyTrace,
    MetricsSaturationAmdahl,
    CommonMistakes,
    DesignPatternsFanout,
    BreakFixTheSystem,
    FinalMentalModelPlayground,
    ConcurrencyTerminologyMap,
    ConcurrencyInterviewMode,
  ],
  templateUrl: './concurrency-page.html',
  styleUrl: './concurrency-page.css',
})
export class ConcurrencyPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.titleService.setTitle('UnderTheHood — Concurrency & Parallelism');
    this.meta.updateTag({
      name: 'description',
      content:
        'Watch time, work, threads, cores, locks and schedulers interact — a hands-on concurrency lab, not a definitions page.',
    });
  }
}
