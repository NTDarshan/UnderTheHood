import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthHero } from '../components/auth-hero/auth-hero';
import { SecurityGateway } from '../components/security-gateway/security-gateway';
import { AuthVsAuthz } from '../components/auth-vs-authz/auth-vs-authz';
import { IdentityTimeline } from '../components/identity-timeline/identity-timeline';
import { PasswordSecurity } from '../components/password-security/password-security';
import { LoginFlow } from '../components/login-flow/login-flow';
import { SessionArchitecture } from '../components/session-architecture/session-architecture';
import { CookieVisualizer } from '../components/cookie-visualizer/cookie-visualizer';
import { StatefulVsStateless } from '../components/stateful-vs-stateless/stateful-vs-stateless';
import { JwtLab } from '../components/jwt-lab/jwt-lab';
import { TokenLifecycle } from '../components/token-lifecycle/token-lifecycle';
import { OAuthOidc } from '../components/oauth-oidc/oauth-oidc';
import { ApiKeyMfa } from '../components/api-key-mfa/api-key-mfa';
import { AuthorizationModels } from '../components/authorization-models/authorization-models';
import { RequestPipeline } from '../components/request-pipeline/request-pipeline';
import { BeTheServerGame } from '../components/be-the-server-game/be-the-server-game';
import { AttackLab } from '../components/attack-lab/attack-lab';
import { AuthRecap } from '../components/auth-recap/auth-recap';
import { ArchitectureComparison } from '../components/architecture-comparison/architecture-comparison';
import { RealWorldFlow } from '../components/real-world-flow/real-world-flow';
import { SecurityPlayground } from '../components/security-playground/security-playground';
import { KnowledgeQuiz } from '../components/knowledge-quiz/knowledge-quiz';
import { AuthSummary } from '../components/auth-summary/auth-summary';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'gateway', label: 'The Security Gateway' },
  { id: 'auth-vs-authz', label: 'Auth vs. Authz' },
  { id: 'identity-timeline', label: 'Evolution of Identity' },
  { id: 'password-problem', label: 'The Password Problem' },
  { id: 'hashing-vs-encryption', label: 'Hashing vs Encryption' },
  { id: 'salting', label: 'Salting' },
  { id: 'login-flow', label: 'The Login Flow' },
  { id: 'generic-errors', label: 'Generic Errors' },
  { id: 'timing-attacks', label: 'Timing Attacks' },
  { id: 'sessions', label: 'Stateful Authentication' },
  { id: 'session-scaling', label: 'Session Storage Scaling' },
  { id: 'session-vs-user-id', label: 'Session ID vs User ID' },
  { id: 'session-security', label: 'Session Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'cookie-flags', label: 'Cookie Security Flags' },
  { id: 'stateful-vs-stateless', label: 'Stateful vs Stateless' },
  { id: 'jwt-structure', label: 'JWT Structure' },
  { id: 'jwt-claims', label: 'JWT Claims' },
  { id: 'jwt-tamper', label: 'Signature Verification' },
  { id: 'jwt-not-magic', label: 'JWT Is Not Magic' },
  { id: 'jwt-revocation', label: 'The Revocation Problem' },
  { id: 'access-vs-refresh', label: 'Access vs Refresh Token' },
  { id: 'token-storage', label: 'Token Storage Tradeoffs' },
  { id: 'oauth', label: 'OAuth 2.0' },
  { id: 'oauth-roles', label: 'OAuth Roles' },
  { id: 'oauth-flow', label: 'Authorization Code Flow' },
  { id: 'scopes', label: 'Scopes' },
  { id: 'oidc', label: 'OpenID Connect' },
  { id: 'api-keys', label: 'API Key Authentication' },
  { id: 'mfa', label: 'Multi-Factor Authentication' },
  { id: 'rbac', label: 'RBAC' },
  { id: 'beyond-roles', label: 'Beyond Roles' },
  { id: 'abac', label: 'ABAC' },
  { id: 'policy-based', label: 'Policy-Based Authorization' },
  { id: '401-vs-403', label: '401 vs 403' },
  { id: 'complete-pipeline', label: 'Complete Request Pipeline' },
  { id: 'be-the-server', label: '"Be the Server" Game' },
  { id: 'attack-lab', label: 'How Authentication Fails' },
  { id: 'idor', label: 'Broken Authorization / IDOR' },
  { id: 'csrf', label: 'CSRF' },
  { id: 'xss-vs-csrf', label: 'XSS vs CSRF' },
  { id: 'session-fixation', label: 'Session Fixation' },
  { id: 'logout-lifetime', label: 'Logout & Token Lifetime' },
  { id: 'auth-matrix', label: 'Auth vs Authz Matrix' },
  { id: 'misconceptions', label: 'Common Misconceptions' },
  { id: 'security-checklist', label: 'Security Checklist' },
  { id: 'architecture-comparison', label: 'Architecture Comparison' },
  { id: 'real-world', label: 'Real-World Example' },
  { id: 'security-playground', label: 'Security Playground' },
  { id: 'quiz', label: 'Knowledge Check' },
  { id: 'summary', label: 'Final Mental Model' },
  { id: 'connection-map', label: 'Chapter Connection Map' },
];

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    RouterLink,
    AuthHero,
    SecurityGateway,
    AuthVsAuthz,
    IdentityTimeline,
    PasswordSecurity,
    LoginFlow,
    SessionArchitecture,
    CookieVisualizer,
    StatefulVsStateless,
    JwtLab,
    TokenLifecycle,
    OAuthOidc,
    ApiKeyMfa,
    AuthorizationModels,
    RequestPipeline,
    BeTheServerGame,
    AttackLab,
    AuthRecap,
    ArchitectureComparison,
    RealWorldFlow,
    SecurityPlayground,
    KnowledgeQuiz,
    AuthSummary,
  ],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
})
export class AuthPage implements OnInit, AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('hero');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Authentication & Authorization');
    this.meta.updateTag({
      name: 'description',
      content:
        'When a request reaches a backend, how does the server know who you are and whether you may do this? An interactive lab covering authentication, authorization, sessions, JWTs, OAuth/OIDC, RBAC/ABAC, and common security failures.',
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
