import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import {
  ConceptCategory,
  ConceptCategoryMeta,
  EngineeringConcept,
  conceptCategories,
  engineeringConcepts,
} from '../../../data/concepts.data';
import { ConceptCard } from '../components/concept-card/concept-card';
import { ConceptDetail } from '../components/concept-detail/concept-detail';
import { ConceptsProgressService } from '../services/concepts-progress.service';

type StatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed';
type CategoryFilter = 'all' | ConceptCategory;

@Component({
  selector: 'app-concepts-library-page',
  standalone: true,
  imports: [RouterLink, ConceptCard, ConceptDetail],
  templateUrl: './concepts-library-page.html',
  styleUrl: './concepts-library-page.css',
})
export class ConceptsLibraryPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  protected readonly progress = inject(ConceptsProgressService);

  @ViewChild('searchInput') private searchInputRef?: ElementRef<HTMLInputElement>;

  protected readonly categories = conceptCategories;
  protected readonly totalCount = engineeringConcepts.length;
  protected readonly domainCount = conceptCategories.length;

  protected readonly searchTerm = signal('');
  protected readonly categoryFilter = signal<CategoryFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly selectedConcept = signal<EngineeringConcept | null>(null);

  private readonly categoryLookup = new Map<ConceptCategory, ConceptCategoryMeta>(
    conceptCategories.map((c) => [c.id, c]),
  );

  protected readonly filteredConcepts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.categoryFilter();
    const status = this.statusFilter();

    return engineeringConcepts.filter((concept) => {
      if (category !== 'all' && concept.category !== category) return false;

      if (status !== 'all') {
        const complete = this.progress.isCompleted(concept.id);
        const viewed = this.progress.isViewed(concept.id);
        if (status === 'completed' && !complete) return false;
        if (status === 'in-progress' && !(viewed && !complete)) return false;
        if (status === 'not-started' && (complete || viewed)) return false;
      }

      if (term) {
        const haystack = `${concept.name} ${concept.blurb} ${this.categoryLookup.get(concept.category)?.label ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  });

  constructor() {
    this.titleService.setTitle('UnderTheHood — Engineering Concepts Library');
    this.meta.updateTag({
      name: 'description',
      content:
        'A browsable library of small, essential engineering concepts across backend, frontend, databases, systems, cloud, security, and AI — learn a piece at a time.',
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === '/' && !this.isTypingTarget(event.target) && !this.selectedConcept()) {
      event.preventDefault();
      this.searchInputRef?.nativeElement.focus();
    }
    if (event.key === 'Escape' && this.selectedConcept()) {
      this.selectedConcept.set(null);
    }
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  protected categoryMetaFor(category: ConceptCategory): ConceptCategoryMeta | undefined {
    return this.categoryLookup.get(category);
  }

  protected setCategoryFilter(category: CategoryFilter): void {
    this.categoryFilter.set(category);
  }

  protected setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  protected openConcept(concept: EngineeringConcept): void {
    this.selectedConcept.set(concept);
    this.progress.markViewed(concept.id);
  }

  protected closeConcept(): void {
    this.selectedConcept.set(null);
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('all');
    this.statusFilter.set('all');
  }

  protected trackById(_: number, concept: EngineeringConcept): string {
    return concept.id;
  }
}
