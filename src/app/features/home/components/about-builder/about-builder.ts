import { Component } from '@angular/core';
import { ProfileAvatar } from '../../../../shared/components/profile-avatar/profile-avatar';
import { TechBadge } from '../../../../shared/components/tech-badge/tech-badge';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { siteConfig } from '../../../../data/site-config';

@Component({
  selector: 'app-about-builder',
  standalone: true,
  imports: [ProfileAvatar, TechBadge, RevealDirective],
  templateUrl: './about-builder.html',
  styleUrl: './about-builder.css',
})
export class AboutBuilder {
  protected readonly siteConfig = siteConfig;
  protected readonly stack = ['.NET', 'ASP.NET Core', 'C#', 'Angular', 'SQL Server', 'Azure', 'AI Engineering'];
}
