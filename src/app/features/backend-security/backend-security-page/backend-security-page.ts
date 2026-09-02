import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { SecurityHero } from '../components/security-hero/security-hero';
import { WhatIsSecurity } from '../components/what-is-security/what-is-security';
import { ThreatModeling } from '../components/threat-modeling/threat-modeling';
import { InjectionOverview } from '../components/injection-overview/injection-overview';
import { SqlInjectionLab } from '../components/sql-injection-lab/sql-injection-lab';
import { ParameterizedQueries } from '../components/parameterized-queries/parameterized-queries';
import { CommandInjection } from '../components/command-injection/command-injection';
import { ValidationBoundary } from '../components/validation-boundary/validation-boundary';
import { AuthenticationBasics } from '../components/authentication-basics/authentication-basics';
import { PasswordSecurity } from '../components/password-security/password-security';
import { HashingVsEncryption } from '../components/hashing-vs-encryption/hashing-vs-encryption';
import { SessionsCookies } from '../components/sessions-cookies/sessions-cookies';
import { JwtLab } from '../components/jwt-lab/jwt-lab';
import { JwtTradeoffsApiKeys } from '../components/jwt-tradeoffs-api-keys/jwt-tradeoffs-api-keys';
import { AuthorizationBasics } from '../components/authorization-basics/authorization-basics';
import { RbacMatrix } from '../components/rbac-matrix/rbac-matrix';
import { BolaIdorLab } from '../components/bola-idor-lab/bola-idor-lab';
import { AuthorizationVulnerabilities } from '../components/authorization-vulnerabilities/authorization-vulnerabilities';
import { RateLimitingSecurity } from '../components/rate-limiting-security/rate-limiting-security';
import { TimingAndErrors } from '../components/timing-and-errors/timing-and-errors';
import { XssLab } from '../components/xss-lab/xss-lab';
import { CsrfLab } from '../components/csrf-lab/csrf-lab';
import { SecurityHeadersCors } from '../components/security-headers-cors/security-headers-cors';
import { SecurityMisconfiguration } from '../components/security-misconfiguration/security-misconfiguration';
import { SecretsManagement } from '../components/secrets-management/secrets-management';
import { SsrfLab } from '../components/ssrf-lab/ssrf-lab';
import { FileUploadPathTraversal } from '../components/file-upload-path-traversal/file-upload-path-traversal';
import { DependencySecurity } from '../components/dependency-security/dependency-security';
import { LeastPrivilege } from '../components/least-privilege/least-privilege';
import { DefenseInDepth } from '../components/defense-in-depth/defense-in-depth';
import { SecurityLoggingAuditing } from '../components/security-logging-auditing/security-logging-auditing';
import { IncidentInvestigation } from '../components/incident-investigation/incident-investigation';
import { SecureRequestLifecycle } from '../components/secure-request-lifecycle/secure-request-lifecycle';
import { CompleteSecurityArchitecture } from '../components/complete-security-architecture/complete-security-architecture';
import { SecurityDecisionEngine } from '../components/security-decision-engine/security-decision-engine';
import { SecurityConfigChallenge } from '../components/security-config-challenge/security-config-challenge';
import { SecurityPrinciplesMindset } from '../components/security-principles-mindset/security-principles-mindset';
import { SecurityTerminologyMap } from '../components/security-terminology-map/security-terminology-map';
import { SecurityInterviewMode } from '../components/security-interview-mode/security-interview-mode';
import { SecurityMentalModelFinale } from '../components/security-mental-model-finale/security-mental-model-finale';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'security-landing', label: 'Your Attack Surface' },
  { id: 'what-is-security', label: 'What Is Backend Security?' },
  { id: 'threat-modeling', label: 'Threat Modeling' },
  { id: 'injection-overview', label: 'Injection Attacks Overview' },
  { id: 'sql-injection', label: 'SQL Injection' },
  { id: 'parameterized-queries', label: 'Parameterized Queries' },
  { id: 'command-injection', label: 'Command Injection' },
  { id: 'validation-boundary', label: 'Validation as a Security Boundary' },
  { id: 'authentication-basics', label: 'Authentication' },
  { id: 'password-security', label: 'Password Security' },
  { id: 'hashing-vs-encryption', label: 'Hashing vs Encryption' },
  { id: 'sessions-cookies', label: 'Sessions & Cookies' },
  { id: 'jwt-lab', label: 'JWT & Stateless Auth' },
  { id: 'jwt-tradeoffs', label: 'JWT Trade-offs & API Keys' },
  { id: 'authorization-basics', label: 'Authorization' },
  { id: 'rbac-matrix', label: 'RBAC' },
  { id: 'bola-idor', label: 'BOLA / IDOR' },
  { id: 'authorization-vulnerabilities', label: 'Authorization Vulnerabilities' },
  { id: 'rate-limiting-security', label: 'Rate Limiting' },
  { id: 'timing-and-errors', label: 'Timing Attacks & Generic Errors' },
  { id: 'xss-lab', label: 'Cross-Site Scripting' },
  { id: 'csrf-lab', label: 'CSRF' },
  { id: 'security-headers', label: 'Security Headers & CORS' },
  { id: 'security-misconfiguration', label: 'Security Misconfiguration' },
  { id: 'secrets-management', label: 'Secrets Management' },
  { id: 'ssrf-lab', label: 'SSRF' },
  { id: 'file-upload-security', label: 'File Upload & Path Traversal' },
  { id: 'dependency-security', label: 'Dependency Security' },
  { id: 'least-privilege', label: 'Least Privilege' },
  { id: 'defense-in-depth', label: 'Defense in Depth' },
  { id: 'security-logging', label: 'Security Logging & Auditing' },
  { id: 'incident-investigation', label: 'Incident Investigation' },
  { id: 'secure-request-lifecycle', label: 'The Secure Request Lifecycle' },
  { id: 'security-architecture', label: 'Complete Security Architecture' },
  { id: 'security-decision-engine', label: 'Security Decision Engine' },
  { id: 'security-config-challenge', label: 'Security Configuration Challenge' },
  { id: 'security-principles', label: 'Security Principles & Mindset' },
  { id: 'security-terminology', label: 'Connected Security Concepts' },
  { id: 'security-interview-mode', label: 'Interview Mode' },
  { id: 'security-mental-model', label: 'The Final Mental Model' },
];

@Component({
  selector: 'app-backend-security-page',
  standalone: true,
  imports: [
    RouterLink,
    SecurityHero,
    WhatIsSecurity,
    ThreatModeling,
    InjectionOverview,
    SqlInjectionLab,
    ParameterizedQueries,
    CommandInjection,
    ValidationBoundary,
    AuthenticationBasics,
    PasswordSecurity,
    HashingVsEncryption,
    SessionsCookies,
    JwtLab,
    JwtTradeoffsApiKeys,
    AuthorizationBasics,
    RbacMatrix,
    BolaIdorLab,
    AuthorizationVulnerabilities,
    RateLimitingSecurity,
    TimingAndErrors,
    XssLab,
    CsrfLab,
    SecurityHeadersCors,
    SecurityMisconfiguration,
    SecretsManagement,
    SsrfLab,
    FileUploadPathTraversal,
    DependencySecurity,
    LeastPrivilege,
    DefenseInDepth,
    SecurityLoggingAuditing,
    IncidentInvestigation,
    SecureRequestLifecycle,
    CompleteSecurityArchitecture,
    SecurityDecisionEngine,
    SecurityConfigChallenge,
    SecurityPrinciplesMindset,
    SecurityTerminologyMap,
    SecurityInterviewMode,
    SecurityMentalModelFinale,
  ],
  templateUrl: './backend-security-page.html',
  styleUrl: './backend-security-page.css',
})
export class BackendSecurityPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('security-landing');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Backend Security');
    this.meta.updateTag({
      name: 'description',
      content:
        'A backend security lab — watch input become a query, try to reach someone else’s object, flood a login form, and build the defenses that stop each attack.',
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
