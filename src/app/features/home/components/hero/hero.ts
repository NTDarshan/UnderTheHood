import { Component, signal } from '@angular/core';
import { ScrollToDirective } from '../../../../shared/directives/scroll-to.directive';

interface HeroNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  detail: string;
  accent?: boolean;
}

interface HeroEdge {
  from: string;
  to: string;
}

const NODES: HeroNode[] = [
  { id: 'client', label: 'CLIENT', sub: 'browser · app', x: 200, y: 24, detail: 'A user triggers a request. Everything below is what you don’t normally see.' },
  { id: 'api', label: 'API', sub: 'routing · middleware', x: 200, y: 128, detail: 'The request passes through middleware before it reaches a handler.' },
  { id: 'database', label: 'DATABASE', sub: 'query · index', x: 68, y: 240, detail: 'Rows are located using an index instead of a full scan.' },
  { id: 'cache', label: 'CACHE', sub: 'hit · miss', x: 200, y: 240, detail: 'A cache hit skips the database entirely — if the data is still valid.' },
  { id: 'queue', label: 'QUEUE', sub: 'async · retry', x: 332, y: 240, detail: 'Work that doesn’t need to block the response gets queued instead.' },
  { id: 'core', label: 'UNDER THE HOOD', sub: 'runtime · os', x: 200, y: 344, detail: 'Underneath all of it: a runtime, a scheduler, memory, and an operating system.', accent: true },
];

const EDGES: HeroEdge[] = [
  { from: 'client', to: 'api' },
  { from: 'api', to: 'database' },
  { from: 'api', to: 'cache' },
  { from: 'api', to: 'queue' },
  { from: 'database', to: 'core' },
  { from: 'cache', to: 'core' },
  { from: 'queue', to: 'core' },
];

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollToDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  protected readonly nodes = NODES;
  protected readonly edges = EDGES;
  protected readonly activeId = signal<string>('api');

  protected nodeById(id: string): HeroNode {
    return this.nodes.find((n) => n.id === id)!;
  }

  protected setActive(id: string) {
    this.activeId.set(id);
  }

  protected get activeNode(): HeroNode {
    return this.nodeById(this.activeId());
  }

  protected edgePath(edge: HeroEdge): string {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    const midY = (from.y + to.y) / 2;
    return `M ${from.x} ${from.y + 16} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 16}`;
  }

  protected isEdgeActive(edge: HeroEdge): boolean {
    return edge.from === this.activeId() || edge.to === this.activeId();
  }
}
