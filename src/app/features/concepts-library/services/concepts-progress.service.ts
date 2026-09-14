import { Injectable, computed, signal } from '@angular/core';

const COMPLETED_KEY = 'utth-concepts-completed';
const VIEWED_KEY = 'utth-concepts-viewed';

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, value: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
  } catch {
    // storage unavailable — progress just won't persist this session
  }
}

@Injectable({ providedIn: 'root' })
export class ConceptsProgressService {
  private readonly completedIds = signal<Set<string>>(loadSet(COMPLETED_KEY));
  private readonly viewedIds = signal<Set<string>>(loadSet(VIEWED_KEY));

  readonly completedCount = computed(() => this.completedIds().size);

  isCompleted(id: string): boolean {
    return this.completedIds().has(id);
  }

  isViewed(id: string): boolean {
    return this.viewedIds().has(id);
  }

  toggleCompleted(id: string): void {
    this.completedIds.update((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSet(COMPLETED_KEY, next);
      return next;
    });
  }

  markViewed(id: string): void {
    if (this.viewedIds().has(id)) return;
    this.viewedIds.update((current) => {
      const next = new Set(current);
      next.add(id);
      saveSet(VIEWED_KEY, next);
      return next;
    });
  }
}
