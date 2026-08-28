import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { RestHero } from '../components/rest-hero/rest-hero';
import { CentralQuestion } from '../components/central-question/central-question';
import { RestHistory } from '../components/rest-history/rest-history';
import { RestConstraints } from '../components/rest-constraints/rest-constraints';
import { StatelessnessLab } from '../components/statelessness-lab/statelessness-lab';
import { ResourceThinkingLab } from '../components/resource-thinking-lab/resource-thinking-lab';
import { UrlNamingLab } from '../components/url-naming-lab/url-naming-lab';
import { UrlAnatomy } from '../components/url-anatomy/url-anatomy';
import { ResourceHierarchy } from '../components/resource-hierarchy/resource-hierarchy';
import { HttpMethodLab } from '../components/http-method-lab/http-method-lab';
import { MethodDeepDive } from '../components/method-deep-dive/method-deep-dive';
import { IdempotencyLab } from '../components/idempotency-lab/idempotency-lab';
import { SafeVsIdempotent } from '../components/safe-vs-idempotent/safe-vs-idempotent';
import { CustomActionDesigner } from '../components/custom-action-designer/custom-action-designer';
import { StatusCodeLab } from '../components/status-code-lab/status-code-lab';
import { ListApiSemantics } from '../components/list-api-semantics/list-api-semantics';
import { PaginationLab } from '../components/pagination-lab/pagination-lab';
import { CursorPaginationLab } from '../components/cursor-pagination-lab/cursor-pagination-lab';
import { PaginationEdgeCases } from '../components/pagination-edge-cases/pagination-edge-cases';
import { SortingLab } from '../components/sorting-lab/sorting-lab';
import { FilteringLab } from '../components/filtering-lab/filtering-lab';
import { ListApiBuilder } from '../components/list-api-builder/list-api-builder';
import { ConsistencyLab } from '../components/consistency-lab/consistency-lab';
import { JsonContractExplorer } from '../components/json-contract-explorer/json-contract-explorer';
import { VersioningLab } from '../components/versioning-lab/versioning-lab';
import { CompatibilityLab } from '../components/compatibility-lab/compatibility-lab';
import { HateoasContentNegotiation } from '../components/hateoas-content-negotiation/hateoas-content-negotiation';
import { RequestVsResponse } from '../components/request-vs-response/request-vs-response';
import { ApiDesignStudio } from '../components/api-design-studio/api-design-studio';
import { ApiLinter } from '../components/api-linter/api-linter';
import { CrudDesigner } from '../components/crud-designer/crud-designer';
import { ErrorDesignLab } from '../components/error-design-lab/error-design-lab';
import { ApiSecurityConnection } from '../components/api-security-connection/api-security-connection';
import { NestedResourceLab } from '../components/nested-resource-lab/nested-resource-lab';
import { BulkAsyncOperations } from '../components/bulk-async-operations/bulk-async-operations';
import { ApiCrimeScene } from '../components/api-crime-scene/api-crime-scene';
import { FixApiGame } from '../components/fix-api-game/fix-api-game';
import { StatusCodeGame } from '../components/status-code-game/status-code-game';
import { HttpMethodGame } from '../components/http-method-game/http-method-game';
import { IdempotencyGame } from '../components/idempotency-game/idempotency-game';
import { ApiEvolutionGame } from '../components/api-evolution-game/api-evolution-game';
import { ApiRequestDebugger } from '../components/api-request-debugger/api-request-debugger';
import { ApiDesignScore } from '../components/api-design-score/api-design-score';
import { EcommerceScenario } from '../components/ecommerce-scenario/ecommerce-scenario';
import { ProductionChecklist } from '../components/production-checklist/production-checklist';
import { ApiDesignPrinciples } from '../components/api-design-principles/api-design-principles';
import { RestSummary } from '../components/rest-summary/rest-summary';
import { InterviewMode } from '../components/interview-mode/interview-mode';
import { KnowledgeQuiz } from '../components/knowledge-quiz/knowledge-quiz';
import { FinalChallenge } from '../components/final-challenge/final-challenge';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'central-question', label: 'What Makes an API Well Designed?' },
  { id: 'history', label: 'What Is REST?' },
  { id: 'constraints', label: 'REST Constraints' },
  { id: 'statelessness', label: 'Statelessness' },
  { id: 'resource-thinking', label: 'Resource Thinking' },
  { id: 'url-naming', label: 'Nouns, Plurals & URL Linting' },
  { id: 'url-anatomy', label: 'URL Anatomy' },
  { id: 'resource-hierarchy', label: 'Resource Hierarchy' },
  { id: 'http-methods', label: 'HTTP Methods Laboratory' },
  { id: 'method-deep-dive', label: 'GET, POST, PUT, PATCH, DELETE' },
  { id: 'idempotency-lab', label: 'Idempotency Lab' },
  { id: 'safe-vs-idempotent', label: 'Safe vs Idempotent' },
  { id: 'custom-actions', label: 'Custom Actions' },
  { id: 'status-codes', label: 'Status Code Laboratory' },
  { id: 'list-semantics', label: 'List API Semantics' },
  { id: 'pagination', label: 'Pagination' },
  { id: 'cursor-pagination', label: 'Cursor Pagination' },
  { id: 'pagination-edge-cases', label: 'Pagination Edge Cases' },
  { id: 'sorting', label: 'Sorting' },
  { id: 'filtering', label: 'Filtering' },
  { id: 'list-api-builder', label: 'The Complete List API' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'json-contract', label: 'The JSON Contract' },
  { id: 'versioning', label: 'API Versioning & Strategies' },
  { id: 'compatibility', label: 'Backward Compatibility' },
  { id: 'hateoas', label: 'HATEOAS & Content Negotiation' },
  { id: 'request-response', label: 'Request vs Response' },
  { id: 'api-design-studio', label: 'The API Design Studio' },
  { id: 'api-linter', label: 'API Design Linter' },
  { id: 'crud-designer', label: 'Design a Complete CRUD API' },
  { id: 'error-design', label: 'Error Design Lab' },
  { id: 'api-security', label: 'API Design Meets Security' },
  { id: 'nested-resources', label: 'Nested Resource Design' },
  { id: 'bulk-async', label: 'Bulk & Async Operations' },
  { id: 'crime-scene', label: 'API Crime Scene' },
  { id: 'fix-api-game', label: 'Fix This API' },
  { id: 'status-code-game', label: 'Choose the Status Code' },
  { id: 'http-method-game', label: 'Choose the HTTP Method' },
  { id: 'idempotency-game', label: 'Is This Idempotent?' },
  { id: 'api-evolution-game', label: 'API Contract Evolution Game' },
  { id: 'request-debugger', label: 'The Complete API Request Debugger' },
  { id: 'design-score', label: 'API Design Score' },
  { id: 'ecommerce', label: 'Real-World E-Commerce API' },
  { id: 'production-checklist', label: 'Production API Checklist' },
  { id: 'principles', label: 'API Design Principles' },
  { id: 'summary', label: 'Final Mental Model' },
  { id: 'connection-map', label: 'Chapter Connection Map' },
  { id: 'interview-mode', label: 'Interview Mode' },
  { id: 'quiz', label: 'Knowledge Check' },
  { id: 'final-challenge', label: 'Build Your API: Final Challenge' },
];

@Component({
  selector: 'app-rest-api-page',
  standalone: true,
  imports: [
    RouterLink,
    RestHero,
    CentralQuestion,
    RestHistory,
    RestConstraints,
    StatelessnessLab,
    ResourceThinkingLab,
    UrlNamingLab,
    UrlAnatomy,
    ResourceHierarchy,
    HttpMethodLab,
    MethodDeepDive,
    IdempotencyLab,
    SafeVsIdempotent,
    CustomActionDesigner,
    StatusCodeLab,
    ListApiSemantics,
    PaginationLab,
    CursorPaginationLab,
    PaginationEdgeCases,
    SortingLab,
    FilteringLab,
    ListApiBuilder,
    ConsistencyLab,
    JsonContractExplorer,
    VersioningLab,
    CompatibilityLab,
    HateoasContentNegotiation,
    RequestVsResponse,
    ApiDesignStudio,
    ApiLinter,
    CrudDesigner,
    ErrorDesignLab,
    ApiSecurityConnection,
    NestedResourceLab,
    BulkAsyncOperations,
    ApiCrimeScene,
    FixApiGame,
    StatusCodeGame,
    HttpMethodGame,
    IdempotencyGame,
    ApiEvolutionGame,
    ApiRequestDebugger,
    ApiDesignScore,
    EcommerceScenario,
    ProductionChecklist,
    ApiDesignPrinciples,
    RestSummary,
    InterviewMode,
    KnowledgeQuiz,
    FinalChallenge,
  ],
  templateUrl: './rest-api-page.html',
  styleUrl: './rest-api-page.css',
})
export class RestApiPage implements OnInit, AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('hero');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Complete REST API Design');
    this.meta.updateTag({
      name: 'description',
      content:
        'Design, send, debug and evolve a real REST API — an interactive studio covering resources, HTTP methods, idempotency, status codes, pagination, filtering, sorting, versioning, and API design tradeoffs.',
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
