import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { WsHero } from '../components/ws-hero/ws-hero';
import { EvolutionLab } from '../components/evolution-lab/evolution-lab';
import { WhyWebsockets } from '../components/why-websockets/why-websockets';
import { HandshakeLab } from '../components/handshake-lab/handshake-lab';
import { FullDuplexDemo } from '../components/full-duplex-demo/full-duplex-demo';
import { LifecycleStateMachine } from '../components/lifecycle-state-machine/lifecycle-state-machine';
import { MessageVsFrame } from '../components/message-vs-frame/message-vs-frame';
import { FrameInspector } from '../components/frame-inspector/frame-inspector';
import { FragmentationMaskingLab } from '../components/fragmentation-masking-lab/fragmentation-masking-lab';
import { PingPongClose } from '../components/ping-pong-close/ping-pong-close';
import { ScalingResources } from '../components/scaling-resources/scaling-resources';
import { DistributedPubsub } from '../components/distributed-pubsub/distributed-pubsub';
import { FanoutBackpressure } from '../components/fanout-backpressure/fanout-backpressure';
import { ReconnectStorm } from '../components/reconnect-storm/reconnect-storm';
import { AuthAuthzLab } from '../components/auth-authz-lab/auth-authz-lab';
import { InfraProxiesSticky } from '../components/infra-proxies-sticky/infra-proxies-sticky';
import { ComparisonMatrix } from '../components/comparison-matrix/comparison-matrix';
import { DecisionGuide } from '../components/decision-guide/decision-guide';
import { SecurityObservability } from '../components/security-observability/security-observability';
import { CompleteSystemArchitecture } from '../components/complete-system-architecture/complete-system-architecture';
import { FailureLab } from '../components/failure-lab/failure-lab';
import { WsMisconceptions } from '../components/ws-misconceptions/ws-misconceptions';
import { FinalMentalModel } from '../components/final-mental-model/final-mental-model';
import { WsInterviewMode } from '../components/ws-interview-mode/ws-interview-mode';
import { SystemDesignChallenge } from '../components/system-design-challenge/system-design-challenge';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'the-problem', label: 'The Problem' },
  { id: 'evolution', label: 'Polling → SSE' },
  { id: 'why-websockets', label: 'Why WebSockets' },
  { id: 'handshake', label: 'The Handshake' },
  { id: 'full-duplex', label: 'Full-Duplex' },
  { id: 'lifecycle', label: 'Connection Lifecycle' },
  { id: 'message-vs-frame', label: 'Message vs Frame' },
  { id: 'frame-inspector', label: 'Frame Structure' },
  { id: 'fragmentation', label: 'Fragmentation & Masking' },
  { id: 'ping-pong', label: 'Health & Shutdown' },
  { id: 'scaling', label: 'Resources & Scaling' },
  { id: 'distributed', label: 'Multi-Server & Pub/Sub' },
  { id: 'fanout', label: 'Fan-Out & Backpressure' },
  { id: 'reconnect', label: 'Ordering & Reconnection' },
  { id: 'auth', label: 'Auth & Authorization' },
  { id: 'infra', label: 'Proxies & Sticky Sessions' },
  { id: 'comparison', label: 'Head to Head' },
  { id: 'decision', label: 'When to Use' },
  { id: 'security', label: 'Security & Observability' },
  { id: 'complete-system', label: 'Complete System' },
  { id: 'failure-lab', label: 'Failure Lab' },
  { id: 'misconceptions', label: 'Misconceptions' },
  { id: 'mental-model', label: 'Final Mental Model' },
  { id: 'interview-mode', label: 'Interview Mode' },
  { id: 'design-challenge', label: 'Final Challenge' },
];

@Component({
  selector: 'app-websockets-page',
  standalone: true,
  imports: [
    RouterLink,
    WsHero,
    EvolutionLab,
    WhyWebsockets,
    HandshakeLab,
    FullDuplexDemo,
    LifecycleStateMachine,
    MessageVsFrame,
    FrameInspector,
    FragmentationMaskingLab,
    PingPongClose,
    ScalingResources,
    DistributedPubsub,
    FanoutBackpressure,
    ReconnectStorm,
    AuthAuthzLab,
    InfraProxiesSticky,
    ComparisonMatrix,
    DecisionGuide,
    SecurityObservability,
    CompleteSystemArchitecture,
    FailureLab,
    WsMisconceptions,
    FinalMentalModel,
    WsInterviewMode,
    SystemDesignChallenge,
  ],
  templateUrl: './websockets-page.html',
  styleUrl: './websockets-page.css',
})
export class WebsocketsPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('the-problem');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — WebSockets Under the Hood');
    this.meta.updateTag({
      name: 'description',
      content:
        'An interactive engineering laboratory for WebSockets — the handshake, frames, fragmentation, masking, connection lifecycle, scaling, pub/sub, backpressure, reconnection, and when to actually reach for one.',
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
