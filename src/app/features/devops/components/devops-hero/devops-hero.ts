import { Component, OnDestroy, signal } from '@angular/core';

interface Stage {
  id: string;
  label: string;
  status: string;
}

const STAGES: Stage[] = [
  { id: 'code', label: 'CODE', status: 'WRITING' },
  { id: 'git', label: 'GIT', status: 'COMMITTED' },
  { id: 'ci', label: 'CI', status: 'BUILDING' },
  { id: 'image', label: 'IMAGE', status: 'PACKAGING' },
  { id: 'registry', label: 'REGISTRY', status: 'PUSHING' },
  { id: 'container', label: 'CONTAINER', status: 'DEPLOYING' },
  { id: 'kubernetes', label: 'KUBERNETES', status: 'SCHEDULING' },
  { id: 'production', label: 'PRODUCTION', status: 'HEALTHY' },
];

const STEP_MS = 650;

@Component({
  selector: 'app-devops-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section do-scene" id="do-hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">DEVOPS FOR BACKEND ENGINEERS</p>
        <h1 class="hero-title">Your code doesn't end at <span class="mono">git push</span>.</h1>
        <p class="hero-lede">
          Follow a backend application from a developer's laptop to production — and see what DevOps is actually
          doing along the way.
        </p>

        <div class="lab-panel hero-panel">
          <div class="pipeline-track" role="group" aria-label="Deployment pipeline">
            <div class="track-line" aria-hidden="true">
              <div class="track-progress" [style.width.%]="progressPct()"></div>
            </div>
            <div class="stage-row">
              @for (stage of stages; track stage.id; let i = $index) {
                <div class="stage" [class.is-active]="i === activeIndex()" [class.is-done]="i < activeIndex()">
                  <span class="stage-dot" aria-hidden="true"></span>
                  <span class="stage-label mono">{{ stage.label }}</span>
                  @if (i === activeIndex()) {
                    <span class="stage-status mono">{{ stage.status }}</span>
                  }
                </div>
              }
            </div>
          </div>

          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
        </div>

        <div class="cta-row">
          <a class="lab-btn lab-btn-primary" href="#ci-pipeline" (click)="scrollToSection($event, 'ci-pipeline')"
            >Run the pipeline &rarr;</a
          >
          <a
            class="lab-btn"
            href="#production-architecture-map"
            (click)="scrollToSection($event, 'production-architecture-map')"
            >Explore the architecture</a
          >
        </div>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #fbbf24;
    }

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { color: var(--do-accent); margin-bottom: 16px; }
    .eyebrow::before { background: var(--do-accent); box-shadow: 0 0 8px color-mix(in srgb, var(--do-accent) 45%, transparent); }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 820px; }
    .hero-lede { margin-top: 18px; max-width: 660px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

    .hero-panel { margin-top: 40px; }

    .pipeline-track { position: relative; }
    .track-line {
      position: relative;
      height: 2px;
      background: var(--border);
      border-radius: 999px;
      margin-bottom: 20px;
    }
    .track-progress {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      background: linear-gradient(90deg, var(--do-accent), var(--do-cyan));
      border-radius: 999px;
      transition: width 0.5s ease;
    }
    @media (prefers-reduced-motion: reduce) {
      .track-progress { transition: none; }
    }

    .stage-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; }
    .stage {
      flex: 1;
      min-width: 90px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
      opacity: 0.45;
      transition: opacity 0.3s ease;
    }
    .stage.is-done { opacity: 0.75; }
    .stage.is-active { opacity: 1; }

    .stage-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--border-strong);
      border: 1px solid var(--border-strong);
    }
    .stage.is-done .stage-dot { background: var(--do-cyan); border-color: var(--do-cyan); }
    .stage.is-active .stage-dot {
      background: var(--do-accent);
      border-color: var(--do-accent);
      box-shadow: 0 0 10px color-mix(in srgb, var(--do-accent) 60%, transparent);
      animation: stage-pulse 1s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .stage.is-active .stage-dot { animation: none; }
    }
    @keyframes stage-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.35); }
    }

    .stage-label { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text); font-weight: 700; }
    .stage.is-active .stage-label { color: var(--do-accent); }
    .stage-status { font-size: 0.5625rem; letter-spacing: 0.05em; color: var(--do-warning); }

    .log-line {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 0.8125rem;
      color: var(--text-faint);
      min-height: 1.2em;
    }

    .cta-row { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
  `,
})
export class DevopsHero implements OnDestroy {
  protected readonly stages = STAGES;
  protected readonly activeIndex = signal(0);
  protected readonly logLine = signal(`${STAGES[0].label} — ${STAGES[0].status.toLowerCase()}…`);

  protected readonly progressPct = () => (this.activeIndex() / (this.stages.length - 1)) * 100;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.timer = setInterval(() => {
      const next = (this.activeIndex() + 1) % this.stages.length;
      this.activeIndex.set(next);
      const stage = this.stages[next];
      this.logLine.set(
        next === this.stages.length - 1
          ? `${stage.label} — deployment ${stage.status.toLowerCase()}. Rolling to the next release.`
          : `${stage.label} — ${stage.status.toLowerCase()}…`,
      );
    }, STEP_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
