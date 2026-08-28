import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ValidationHero } from '../components/validation-hero/validation-hero';
import { ApiLayerVisualizer } from '../components/api-layer-visualizer/api-layer-visualizer';
import { WhyValidationExists } from '../components/why-validation-exists/why-validation-exists';
import { ValidationVsTransformation } from '../components/validation-vs-transformation/validation-vs-transformation';
import { TypeValidationLab } from '../components/type-validation-lab/type-validation-lab';
import { SyntaxSemanticValidation } from '../components/syntax-semantic-validation/syntax-semantic-validation';
import { CrossFieldValidation } from '../components/cross-field-validation/cross-field-validation';
import { NullableOptionalDefaults } from '../components/nullable-optional-defaults/nullable-optional-defaults';
import { RangeLengthAllowlist } from '../components/range-length-allowlist/range-length-allowlist';
import { ValidationVsSanitization } from '../components/validation-vs-sanitization/validation-vs-sanitization';
import { FrontendBackendTrust } from '../components/frontend-backend-trust/frontend-backend-trust';
import { RequestBindingSources } from '../components/request-binding-sources/request-binding-sources';
import { ValidationOrderPipeline } from '../components/validation-order-pipeline/validation-order-pipeline';
import { BusinessRulesDomain } from '../components/business-rules-domain/business-rules-domain';
import { ErrorResponseDesign } from '../components/error-response-design/error-response-design';
import { NestedCollectionValidation } from '../components/nested-collection-validation/nested-collection-validation';
import { TransformationLab } from '../components/transformation-lab/transformation-lab';
import { DtoOverposting } from '../components/dto-overposting/dto-overposting';
import { ValidationPlayground } from '../components/validation-playground/validation-playground';
import { RequestDebugger } from '../components/request-debugger/request-debugger';
import { BreakTheApiGame } from '../components/break-the-api-game/break-the-api-game';
import { WhereRuleLiveGame } from '../components/where-rule-live-game/where-rule-live-game';
import { ObservabilityPerformance } from '../components/observability-performance/observability-performance';
import { PrinciplesMisconceptions } from '../components/principles-misconceptions/principles-misconceptions';
import { RealWorldOrderFlow } from '../components/real-world-order-flow/real-world-order-flow';
import { KnowledgeQuiz } from '../components/knowledge-quiz/knowledge-quiz';
import { ValidationSummary } from '../components/validation-summary/validation-summary';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'api-layers', label: 'The API Execution Pipeline' },
  { id: 'why-validation', label: 'Why Validation Exists' },
  { id: 'validation-vs-transformation', label: 'Validation vs Transformation' },
  { id: 'raw-transformed-validated', label: 'Raw → Transformed → Validated' },
  { id: 'type-validation', label: 'Type Validation' },
  { id: 'syntactic-validation', label: 'Syntactic Validation' },
  { id: 'semantic-validation', label: 'Semantic Validation' },
  { id: 'cross-field-validation', label: 'Cross-Field Validation' },
  { id: 'required-optional-nullable', label: 'Required vs Optional vs Nullable' },
  { id: 'default-values', label: 'Default Values' },
  { id: 'range-validation', label: 'Range Validation' },
  { id: 'length-validation', label: 'Length Validation' },
  { id: 'allowlist-validation', label: 'Allowlist vs Denylist' },
  { id: 'validation-vs-sanitization', label: 'Validation vs Sanitization' },
  { id: 'frontend-vs-backend', label: 'Frontend vs Backend' },
  { id: 'never-trust-client', label: 'Never Trust the Client' },
  { id: 'bypass-simulator', label: 'Frontend Bypass Simulator' },
  { id: 'trust-boundary', label: 'The Trust Boundary' },
  { id: 'model-binding', label: 'Model / Input Binding' },
  { id: 'request-sources', label: 'Request Sources' },
  { id: 'validation-order', label: 'Validation Order' },
  { id: 'validation-vs-auth', label: 'Validation vs Auth' },
  { id: 'validation-vs-business-rules', label: 'Validation vs Business Rules' },
  { id: 'domain-validation', label: 'Domain Validation' },
  { id: 'db-constraints', label: 'Database Constraints' },
  { id: 'error-response-design', label: 'Error Response Design' },
  { id: '400-vs-422', label: '400 vs 422' },
  { id: 'validation-error-structure', label: 'Structured Errors' },
  { id: 'nested-validation', label: 'Nested Object Validation' },
  { id: 'collection-validation', label: 'Collection Validation' },
  { id: 'cross-resource-validation', label: 'Cross-Resource Validation' },
  { id: 'transformation-types', label: 'Transformation Types' },
  { id: 'dangerous-transformation', label: 'Dangerous Transformation' },
  { id: 'whitelist-transformation', label: 'Whitelist Transformation' },
  { id: 'dto-vs-domain', label: 'DTO vs Domain Model' },
  { id: 'overposting', label: 'Overposting' },
  { id: 'validation-playground', label: 'Validation Playground' },
  { id: 'request-debugger', label: 'Request Debugger' },
  { id: 'break-the-api', label: '"Break the API"' },
  { id: 'where-rule-lives', label: '"Where Should This Rule Live?"' },
  { id: 'observability', label: 'Observability' },
  { id: 'performance-early-rejection', label: 'Performance' },
  { id: 'design-principles', label: 'Design Principles' },
  { id: 'misconceptions', label: 'Common Misconceptions' },
  { id: 'real-world-order', label: 'Real-World Example' },
  { id: 'quiz', label: 'Knowledge Check' },
  { id: 'final-architecture', label: 'Final Architecture' },
  { id: 'summary', label: 'Final Mental Model' },
  { id: 'connection-map', label: 'Chapter Connection Map' },
];

@Component({
  selector: 'app-validation-page',
  standalone: true,
  imports: [
    RouterLink,
    ValidationHero,
    ApiLayerVisualizer,
    WhyValidationExists,
    ValidationVsTransformation,
    TypeValidationLab,
    SyntaxSemanticValidation,
    CrossFieldValidation,
    NullableOptionalDefaults,
    RangeLengthAllowlist,
    ValidationVsSanitization,
    FrontendBackendTrust,
    RequestBindingSources,
    ValidationOrderPipeline,
    BusinessRulesDomain,
    ErrorResponseDesign,
    NestedCollectionValidation,
    TransformationLab,
    DtoOverposting,
    ValidationPlayground,
    RequestDebugger,
    BreakTheApiGame,
    WhereRuleLiveGame,
    ObservabilityPerformance,
    PrinciplesMisconceptions,
    RealWorldOrderFlow,
    KnowledgeQuiz,
    ValidationSummary,
  ],
  templateUrl: './validation-page.html',
  styleUrl: './validation-page.css',
})
export class ValidationPage implements OnInit, AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('hero');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Validation & Transformation');
    this.meta.updateTag({
      name: 'description',
      content:
        'Before a backend trusts incoming data, it must understand it, normalize it, validate it, and only then let it into the business layer. An interactive lab covering parsing, transformation, syntactic/semantic/cross-field validation, trust boundaries, DTOs, and a live request debugger.',
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
