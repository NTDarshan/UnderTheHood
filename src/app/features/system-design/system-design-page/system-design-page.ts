import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { SystemDesignHero } from '../components/system-design-hero/system-design-hero';
import { IntroToSystemDesign } from '../components/intro-to-system-design/intro-to-system-design';

@Component({
  selector: 'app-system-design-page',
  standalone: true,
  imports: [RouterLink, SystemDesignHero, IntroToSystemDesign],
  templateUrl: './system-design-page.html',
  styleUrl: './system-design-page.css',
})
export class SystemDesignPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.titleService.setTitle('UnderTheHood — System Design');
    this.meta.updateTag({
      name: 'description',
      content:
        'How real systems are actually put together — trade-offs, scale, and the decisions behind them, built one concept at a time.',
    });
  }
}
