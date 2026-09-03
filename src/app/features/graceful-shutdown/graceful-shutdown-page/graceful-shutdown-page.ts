import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { GracefulShutdownHero } from '../components/graceful-shutdown-hero/graceful-shutdown-hero';
import { WhyShutdownIsAProblem } from '../components/why-shutdown-is-a-problem/why-shutdown-is-a-problem';
import { HardShutdownLab } from '../components/hard-shutdown-lab/hard-shutdown-lab';
import { GracefulShutdownLab } from '../components/graceful-shutdown-lab/graceful-shutdown-lab';
import { ProcessLifecycle } from '../components/process-lifecycle/process-lifecycle';
import { UnixSignalsOverview } from '../components/unix-signals-overview/unix-signals-overview';
import { SigtermFlow } from '../components/sigterm-flow/sigterm-flow';
import { SigintFlow } from '../components/sigint-flow/sigint-flow';
import { SigkillFlow } from '../components/sigkill-flow/sigkill-flow';
import { ConnectionDraining } from '../components/connection-draining/connection-draining';
import { ReadinessVsLiveness } from '../components/readiness-vs-liveness/readiness-vs-liveness';
import { DrainingWindow } from '../components/draining-window/draining-window';
import { LongRunningRequests } from '../components/long-running-requests/long-running-requests';
import { CancellationFlow } from '../components/cancellation-flow/cancellation-flow';
import { RequestContextCancellation } from '../components/request-context-cancellation/request-context-cancellation';
import { BackgroundJobsShutdown } from '../components/background-jobs-shutdown/background-jobs-shutdown';
import { QueueDraining } from '../components/queue-draining/queue-draining';
import { IdempotencyRetry } from '../components/idempotency-retry/idempotency-retry';
import { DatabaseConnectionsShutdown } from '../components/database-connections-shutdown/database-connections-shutdown';
import { ExternalServicesShutdown } from '../components/external-services-shutdown/external-services-shutdown';
import { ResourceCleanupInventory } from '../components/resource-cleanup-inventory/resource-cleanup-inventory';
import { ShutdownObservabilityDashboard } from '../components/shutdown-observability-dashboard/shutdown-observability-dashboard';
import { ShutdownOrderChallenge } from '../components/shutdown-order-challenge/shutdown-order-challenge';
import { ShutdownDeadline } from '../components/shutdown-deadline/shutdown-deadline';
import { KubernetesShutdown } from '../components/kubernetes-shutdown/kubernetes-shutdown';
import { ZeroDowntimeDeployment } from '../components/zero-downtime-deployment/zero-downtime-deployment';
import { RollingDeployment } from '../components/rolling-deployment/rolling-deployment';
import { ShutdownFailureModes } from '../components/shutdown-failure-modes/shutdown-failure-modes';
import { HardVsGracefulLab } from '../components/hard-vs-graceful-lab/hard-vs-graceful-lab';
import { ShutdownDebugger } from '../components/shutdown-debugger/shutdown-debugger';
import { ShutdownTraceTimeline } from '../components/shutdown-trace-timeline/shutdown-trace-timeline';
import { ShutdownPlaygroundSimulator } from '../components/shutdown-playground-simulator/shutdown-playground-simulator';
import { BreakFixTheShutdown } from '../components/break-the-shutdown/break-the-shutdown';
import { FinalShutdownMentalModel } from '../components/final-mental-model/final-mental-model';
import { ShutdownInterviewMode } from '../components/shutdown-interview-mode/shutdown-interview-mode';

@Component({
  selector: 'app-graceful-shutdown-page',
  standalone: true,
  imports: [
    RouterLink,
    GracefulShutdownHero,
    WhyShutdownIsAProblem,
    HardShutdownLab,
    GracefulShutdownLab,
    ProcessLifecycle,
    UnixSignalsOverview,
    SigtermFlow,
    SigintFlow,
    SigkillFlow,
    ConnectionDraining,
    ReadinessVsLiveness,
    DrainingWindow,
    LongRunningRequests,
    CancellationFlow,
    RequestContextCancellation,
    BackgroundJobsShutdown,
    QueueDraining,
    IdempotencyRetry,
    DatabaseConnectionsShutdown,
    ExternalServicesShutdown,
    ResourceCleanupInventory,
    ShutdownObservabilityDashboard,
    ShutdownOrderChallenge,
    ShutdownDeadline,
    KubernetesShutdown,
    ZeroDowntimeDeployment,
    RollingDeployment,
    ShutdownFailureModes,
    HardVsGracefulLab,
    ShutdownDebugger,
    ShutdownTraceTimeline,
    ShutdownPlaygroundSimulator,
    BreakFixTheShutdown,
    FinalShutdownMentalModel,
    ShutdownInterviewMode,
  ],
  templateUrl: './graceful-shutdown-page.html',
  styleUrl: './graceful-shutdown-page.css',
})
export class GracefulShutdownPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.titleService.setTitle('UnderTheHood — Graceful Shutdown');
    this.meta.updateTag({
      name: 'description',
      content:
        'Shut down a live server while requests are in flight and watch the difference between a clean drain and a hard kill — a shutdown lab, not a definitions page.',
    });
  }
}
