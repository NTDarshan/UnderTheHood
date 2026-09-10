import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { DevopsHero } from '../components/devops-hero/devops-hero';
import { WhatDevopsSolves } from '../components/what-devops-solves/what-devops-solves';
import { DoraMetrics } from '../components/dora-metrics/dora-metrics';
import { GitBranchingStrategies } from '../components/git-branching-strategies/git-branching-strategies';
import { CiPipeline } from '../components/ci-pipeline/ci-pipeline';
import { SecretsManagement } from '../components/secrets-management/secrets-management';
import { ContainersIntro } from '../components/containers-intro/containers-intro';
import { ContainerInternals } from '../components/container-internals/container-internals';
import { DockerImagesDockerfile } from '../components/docker-images-dockerfile/docker-images-dockerfile';
import { RegistrySupplyChain } from '../components/registry-supply-chain/registry-supply-chain';
import { RunningAContainer } from '../components/running-a-container/running-a-container';
import { KubernetesIntro } from '../components/kubernetes-intro/kubernetes-intro';
import { KubernetesControlLoop } from '../components/kubernetes-control-loop/kubernetes-control-loop';
import { KubernetesManifests } from '../components/kubernetes-manifests/kubernetes-manifests';
import { DeploymentsSimulator } from '../components/deployments-simulator/deployments-simulator';
import { RollingDeployment } from '../components/rolling-deployment/rolling-deployment';
import { BlueGreenDeployment } from '../components/blue-green-deployment/blue-green-deployment';
import { CanaryDeployment } from '../components/canary-deployment/canary-deployment';
import { Gitops } from '../components/gitops/gitops';
import { InfrastructureAsCode } from '../components/infrastructure-as-code/infrastructure-as-code';
import { ObservabilityControlRoom } from '../components/observability-control-room/observability-control-room';
import { SlosErrorBudget } from '../components/slos-error-budget/slos-error-budget';
import { IncidentSimulation } from '../components/incident-simulation/incident-simulation';
import { OncallPostmortem } from '../components/oncall-postmortem/oncall-postmortem';
import { SecuritySupplyChain } from '../components/security-supply-chain/security-supply-chain';
import { ProductionArchitectureMap } from '../components/production-architecture-map/production-architecture-map';
import { ShipToProductionSimulator } from '../components/ship-to-production-simulator/ship-to-production-simulator';

@Component({
  selector: 'app-devops-page',
  standalone: true,
  imports: [
    RouterLink,
    DevopsHero,
    WhatDevopsSolves,
    DoraMetrics,
    GitBranchingStrategies,
    CiPipeline,
    SecretsManagement,
    ContainersIntro,
    ContainerInternals,
    DockerImagesDockerfile,
    RegistrySupplyChain,
    RunningAContainer,
    KubernetesIntro,
    KubernetesControlLoop,
    KubernetesManifests,
    DeploymentsSimulator,
    RollingDeployment,
    BlueGreenDeployment,
    CanaryDeployment,
    Gitops,
    InfrastructureAsCode,
    ObservabilityControlRoom,
    SlosErrorBudget,
    IncidentSimulation,
    OncallPostmortem,
    SecuritySupplyChain,
    ProductionArchitectureMap,
    ShipToProductionSimulator,
  ],
  templateUrl: './devops-page.html',
  styleUrl: './devops-page.css',
})
export class DevopsPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.titleService.setTitle('UnderTheHood — DevOps for Backend Engineers');
    this.meta.updateTag({
      name: 'description',
      content:
        'Everything past git push that makes code someone’s reality — follow a backend service from commit to production through CI, containers, Kubernetes, deployments, GitOps, observability and a live incident.',
    });
  }
}
