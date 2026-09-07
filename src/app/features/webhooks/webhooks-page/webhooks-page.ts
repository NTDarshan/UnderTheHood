import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { WebhooksHero } from '../components/webhooks-hero/webhooks-hero';
import { WebhookVsPolling } from '../components/webhook-vs-polling/webhook-vs-polling';
import { WhatIsAWebhook } from '../components/what-is-a-webhook/what-is-a-webhook';
import { EndToEndDelivery } from '../components/end-to-end-delivery/end-to-end-delivery';
import { WebhookEndpointAnatomy } from '../components/webhook-endpoint-anatomy/webhook-endpoint-anatomy';
import { AcknowledgementSimulator } from '../components/acknowledgement-simulator/acknowledgement-simulator';
import { FastAckVsSyncProcessing } from '../components/fast-ack-vs-sync-processing/fast-ack-vs-sync-processing';
import { DeliveryAnatomyInspector } from '../components/delivery-anatomy-inspector/delivery-anatomy-inspector';
import { TimeoutVisualization } from '../components/timeout-visualization/timeout-visualization';
import { DuplicateDeliveryAndIdempotency } from '../components/duplicate-delivery-and-idempotency/duplicate-delivery-and-idempotency';
import { EventOrdering } from '../components/event-ordering/event-ordering';
import { RetriesAndBackoff } from '../components/retries-and-backoff/retries-and-backoff';
import { DeadLetterQueue } from '../components/dead-letter-queue/dead-letter-queue';
import { TrustProblem } from '../components/trust-problem/trust-problem';
import { HmacSignatureLab } from '../components/hmac-signature-lab/hmac-signature-lab';
import { RawBodyAndTimingSafety } from '../components/raw-body-and-timing-safety/raw-body-and-timing-safety';
import { ReplayAttackLab } from '../components/replay-attack-lab/replay-attack-lab';
import { WebhookSsrf } from '../components/webhook-ssrf/webhook-ssrf';
import { DevTunnels } from '../components/dev-tunnels/dev-tunnels';
import { BuildingYourOwnWebhookSystem } from '../components/building-your-own-webhook-system/building-your-own-webhook-system';
import { OutboxPattern } from '../components/outbox-pattern/outbox-pattern';
import { DispatcherAndDeliveryDatabase } from '../components/dispatcher-and-delivery-database/dispatcher-and-delivery-database';
import { DeliveryStateMachine } from '../components/delivery-state-machine/delivery-state-machine';
import { WebhookObservabilityDashboard } from '../components/webhook-observability-dashboard/webhook-observability-dashboard';
import { SecretRotationAndVersioning } from '../components/secret-rotation-and-versioning/secret-rotation-and-versioning';
import { WebhookVsApiAndWhenNotToUse } from '../components/webhook-vs-api-and-when-not-to-use/webhook-vs-api-and-when-not-to-use';
import { ProductionArchitectureDiagram } from '../components/production-architecture-diagram/production-architecture-diagram';
import { WebhookPlaygroundSimulator } from '../components/webhook-playground-simulator/webhook-playground-simulator';
import { BreakFixTheWebhook } from '../components/break-fix-the-webhook/break-fix-the-webhook';
import { WebhookSecurityLab } from '../components/webhook-security-lab/webhook-security-lab';
import { WebhookProductionChecklist } from '../components/webhook-production-checklist/webhook-production-checklist';
import { WebhooksInterviewMode } from '../components/webhooks-interview-mode/webhooks-interview-mode';
import { WebhooksFinalMentalModel } from '../components/webhooks-final-mental-model/webhooks-final-mental-model';

@Component({
  selector: 'app-webhooks-page',
  standalone: true,
  imports: [
    RouterLink,
    WebhooksHero,
    WebhookVsPolling,
    WhatIsAWebhook,
    EndToEndDelivery,
    WebhookEndpointAnatomy,
    AcknowledgementSimulator,
    FastAckVsSyncProcessing,
    DeliveryAnatomyInspector,
    TimeoutVisualization,
    DuplicateDeliveryAndIdempotency,
    EventOrdering,
    RetriesAndBackoff,
    DeadLetterQueue,
    TrustProblem,
    HmacSignatureLab,
    RawBodyAndTimingSafety,
    ReplayAttackLab,
    WebhookSsrf,
    DevTunnels,
    BuildingYourOwnWebhookSystem,
    OutboxPattern,
    DispatcherAndDeliveryDatabase,
    DeliveryStateMachine,
    WebhookObservabilityDashboard,
    SecretRotationAndVersioning,
    WebhookVsApiAndWhenNotToUse,
    ProductionArchitectureDiagram,
    WebhookPlaygroundSimulator,
    BreakFixTheWebhook,
    WebhookSecurityLab,
    WebhookProductionChecklist,
    WebhooksInterviewMode,
    WebhooksFinalMentalModel,
  ],
  templateUrl: './webhooks-page.html',
  styleUrl: './webhooks-page.css',
})
export class WebhooksPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.titleService.setTitle('UnderTheHood — Webhooks');
    this.meta.updateTag({
      name: 'description',
      content:
        'A webhook delivery lab, not a definitions page — trigger events, break deliveries, verify HMAC signatures, and build your own reliable webhook dispatcher.',
    });
  }
}
