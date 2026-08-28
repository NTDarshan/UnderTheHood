import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { RoutingHero } from '../components/routing-hero/routing-hero';
import { MethodRouteMatrix } from '../components/method-route-matrix/method-route-matrix';
import { StaticDynamicRoutes } from '../components/static-dynamic-routes/static-dynamic-routes';
import { PathQueryParams } from '../components/path-query-params/path-query-params';
import { RouteMatchingEngine } from '../components/route-matching-engine/route-matching-engine';
import { RouteOrderingDemo } from '../components/route-ordering-demo/route-ordering-demo';
import { NestedRouting } from '../components/nested-routing/nested-routing';
import { RouteConstraints } from '../components/route-constraints/route-constraints';
import { VersioningLifecycle } from '../components/versioning-lifecycle/versioning-lifecycle';
import { RedirectsDemo } from '../components/redirects-demo/redirects-demo';
import { Catchall404 } from '../components/catchall-404/catchall-404';
import { BreakTheRouter } from '../components/break-the-router/break-the-router';
import { RealWorldFlow } from '../components/real-world-flow/real-world-flow';
import { BestPractices } from '../components/best-practices/best-practices';
import { RoutingSummary } from '../components/routing-summary/routing-summary';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'what-is-routing', label: 'What is Routing?' },
  { id: 'http-methods', label: 'HTTP Methods' },
  { id: 'static-dynamic', label: 'Static & Dynamic' },
  { id: 'path-params', label: 'Path Parameters' },
  { id: 'query-params', label: 'Query Parameters' },
  { id: 'route-matching', label: 'Route Matching' },
  { id: 'route-ordering', label: 'Route Ordering' },
  { id: 'nested-routes', label: 'Nested Routes' },
  { id: 'constraints', label: 'Route Constraints' },
  { id: 'optional-params', label: 'Optional Parameters' },
  { id: 'versioning', label: 'Versioning' },
  { id: 'redirects', label: 'Redirects' },
  { id: 'catch-all', label: 'Catch-all Routes' },
  { id: 'not-found', label: '404 Handling' },
  { id: 'playground', label: 'Interactive Playground' },
  { id: 'real-world', label: 'Real-world Flow' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'summary', label: 'Summary' },
];

@Component({
  selector: 'app-routing-page',
  standalone: true,
  imports: [
    RouterLink,
    RoutingHero,
    MethodRouteMatrix,
    StaticDynamicRoutes,
    PathQueryParams,
    RouteMatchingEngine,
    RouteOrderingDemo,
    NestedRouting,
    RouteConstraints,
    VersioningLifecycle,
    RedirectsDemo,
    Catchall404,
    BreakTheRouter,
    RealWorldFlow,
    BestPractices,
    RoutingSummary,
  ],
  templateUrl: './routing-page.html',
  styleUrl: './routing-page.css',
})
export class RoutingPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('what-is-routing');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Routing in Backend');
    this.meta.updateTag({
      name: 'description',
      content:
        'Explore backend routing through an interactive route matching engine — HTTP methods, path and query parameters, ordering, constraints, nested routes, versioning, and 404 handling, all simulated live in your browser.',
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
