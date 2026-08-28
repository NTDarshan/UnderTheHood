import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HttpHero } from '../components/http-hero/http-hero';
import { ProtocolBasics } from '../components/protocol-basics/protocol-basics';
import { HttpEvolution } from '../components/http-evolution/http-evolution';
import { MessageLab } from '../components/message-lab/message-lab';
import { HeaderCatalog } from '../components/header-catalog/header-catalog';
import { MethodExplorer } from '../components/method-explorer/method-explorer';
import { IdempotencyMatrix } from '../components/idempotency-matrix/idempotency-matrix';
import { CorsLab } from '../components/cors-lab/cors-lab';
import { StatusCodeExplorer } from '../components/status-code-explorer/status-code-explorer';
import { CacheLab } from '../components/cache-lab/cache-lab';
import { ContentNegotiation } from '../components/content-negotiation/content-negotiation';
import { CompressionLab } from '../components/compression-lab/compression-lab';
import { ConnectionLab } from '../components/connection-lab/connection-lab';
import { MultipartLab } from '../components/multipart-lab/multipart-lab';
import { ChunkedTransfer } from '../components/chunked-transfer/chunked-transfer';
import { TlsLab } from '../components/tls-lab/tls-lab';
import { RequestJourney } from '../components/request-journey/request-journey';
import { CommonMisconceptions } from '../components/common-misconceptions/common-misconceptions';
import { KnowledgeSummary } from '../components/knowledge-summary/knowledge-summary';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'messages', label: 'Messages' },
  { id: 'headers', label: 'Headers' },
  { id: 'methods', label: 'Methods' },
  { id: 'cors', label: 'CORS' },
  { id: 'status-codes', label: 'Status Codes' },
  { id: 'caching', label: 'Caching' },
  { id: 'connections', label: 'Connections' },
  { id: 'tls', label: 'Security' },
  { id: 'journey', label: 'Full Journey' },
  { id: 'misconceptions', label: 'Misconceptions' },
];

@Component({
  selector: 'app-http-page',
  standalone: true,
  imports: [
    RouterLink,
    HttpHero,
    ProtocolBasics,
    HttpEvolution,
    MessageLab,
    HeaderCatalog,
    MethodExplorer,
    IdempotencyMatrix,
    CorsLab,
    StatusCodeExplorer,
    CacheLab,
    ContentNegotiation,
    CompressionLab,
    ConnectionLab,
    MultipartLab,
    ChunkedTransfer,
    TlsLab,
    RequestJourney,
    CommonMisconceptions,
    KnowledgeSummary,
  ],
  templateUrl: './http-page.html',
  styleUrl: './http-page.css',
})
export class HttpPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('foundations');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — HTTP Under the Hood');
    this.meta.updateTag({
      name: 'description',
      content:
        'Explore HTTP through interactive visualizations covering requests, responses, methods, headers, caching, CORS, connections, compression, HTTP versions and HTTPS.',
    });

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', this.onScroll));
  }

  ngAfterViewInit(): void {
    // Sections lay out after the view initializes, so measure on the next frame.
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
    // The section whose top has most recently crossed a line ~30% down the viewport is "current".
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
