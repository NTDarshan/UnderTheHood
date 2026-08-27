import { Component, signal } from '@angular/core';
import { siteConfig } from '../../../data/site-config';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  template: `
    <div class="avatar-wrap">
      <svg class="orbit" viewBox="0 0 240 240" aria-hidden="true">
        <circle cx="120" cy="120" r="112" class="orbit-ring" />
        <circle cx="120" cy="120" r="96" class="orbit-ring orbit-ring-dashed" />
        <circle cx="120" cy="8" r="3.5" class="orbit-node" />
        <circle cx="232" cy="120" r="3" class="orbit-node orbit-node-2" />
        <circle cx="24" cy="176" r="3" class="orbit-node orbit-node-3" />
      </svg>

      <div class="avatar-frame">
        @if (imageOk()) {
          <img
            [src]="profileImage"
            alt="Portrait of {{ name }}"
            class="avatar-image"
            (error)="imageOk.set(false)"
          />
        } @else {
          <div class="avatar-placeholder" role="img" [attr.aria-label]="'Portrait placeholder for ' + name">
            <span>D</span>
          </div>
        }
      </div>

      <div class="status-chip mono">
        <span class="status-chip-dot" aria-hidden="true"></span>
        Building in public
      </div>
    </div>
  `,
  styles: `
    .avatar-wrap {
      position: relative;
      width: 220px;
      height: 220px;
      margin-inline: auto;
    }

    .orbit {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      animation: spin 40s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .orbit {
        animation: none;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .orbit-ring {
      fill: none;
      stroke: var(--border);
      stroke-width: 1;
    }

    .orbit-ring-dashed {
      stroke: var(--border-strong);
      stroke-dasharray: 2 6;
    }

    .orbit-node {
      fill: var(--accent);
      filter: drop-shadow(0 0 5px var(--glow-accent));
    }

    .orbit-node-2 {
      fill: var(--accent-2);
      filter: drop-shadow(0 0 5px var(--glow-accent-2));
    }

    .orbit-node-3 {
      fill: var(--accent);
      filter: drop-shadow(0 0 5px var(--glow-accent));
    }

    .avatar-frame {
      position: absolute;
      inset: 26px;
      border-radius: 50%;
      overflow: hidden;
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      box-shadow: 0 0 0 6px var(--surface), 0 20px 50px -20px rgba(0, 0, 0, 0.6);
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 35% 25%, var(--surface-elevated), var(--surface-raised));
    }

    .avatar-placeholder span {
      font-family: var(--font-mono);
      font-size: 3rem;
      font-weight: 600;
      color: var(--accent);
      opacity: 0.85;
    }

    .status-chip {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      color: var(--text-muted);
      font-size: 0.6875rem;
      letter-spacing: 0.04em;
      padding: 5px 11px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .status-chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-2);
      box-shadow: 0 0 6px var(--glow-accent-2);
    }
  `,
})
export class ProfileAvatar {
  protected readonly imageOk = signal(true);
  protected readonly profileImage = siteConfig.profileImage;
  protected readonly name = siteConfig.name;
}
