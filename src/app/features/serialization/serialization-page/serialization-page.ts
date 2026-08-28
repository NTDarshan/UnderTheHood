import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { SerializationHero } from '../components/serialization-hero/serialization-hero';
import { DataTypeDilemma } from '../components/data-type-dilemma/data-type-dilemma';
import { MemoryVsWire } from '../components/memory-vs-wire/memory-vs-wire';
import { SerializeDeserializeFlow } from '../components/serialize-deserialize-flow/serialize-deserialize-flow';
import { OsiVisualizer } from '../components/osi-visualizer/osi-visualizer';
import { FormatExplorer } from '../components/format-explorer/format-explorer';
import { JsonAnatomy } from '../components/json-anatomy/json-anatomy';
import { HttpRequestInspector } from '../components/http-request-inspector/http-request-inspector';
import { SerializationPlayground } from '../components/serialization-playground/serialization-playground';
import { DeserializationPlayground } from '../components/deserialization-playground/deserialization-playground';
import { SchemaEvolution } from '../components/schema-evolution/schema-evolution';
import { PerformanceSecurity } from '../components/performance-security/performance-security';
import { RealWorldFlow } from '../components/real-world-flow/real-world-flow';
import { BreakSerializer } from '../components/break-serializer/break-serializer';
import { KnowledgeQuiz } from '../components/knowledge-quiz/knowledge-quiz';
import { SerializationSummary } from '../components/serialization-summary/serialization-summary';

interface ProgressItem {
  id: string;
  label: string;
}

const PROGRESS: ProgressItem[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'why-serialization', label: 'Why Serialization?' },
  { id: 'data-dilemma', label: 'The Data Type Dilemma' },
  { id: 'memory-vs-wire', label: 'Memory vs Wire' },
  { id: 'serialize-deserialize', label: 'Serialize & Deserialize' },
  { id: 'osi', label: 'OSI Perspective' },
  { id: 'formats', label: 'Serialization Formats' },
  { id: 'text-vs-binary', label: 'Text vs Binary' },
  { id: 'json-anatomy', label: 'JSON Deep Dive' },
  { id: 'http-flow', label: 'HTTP Request Flow' },
  { id: 'content-type', label: 'Content-Type' },
  { id: 'serialize-playground', label: 'Serialization Playground' },
  { id: 'deserialize-playground', label: 'Deserialization Playground' },
  { id: 'validation', label: 'Validation' },
  { id: 'schema-evolution', label: 'Schema Evolution' },
  { id: 'performance', label: 'Performance' },
  { id: 'security', label: 'Security' },
  { id: 'real-world', label: 'Real-world Flow' },
  { id: 'break-serializer', label: 'Break the Serializer' },
  { id: 'misconceptions', label: 'Common Misconceptions' },
  { id: 'quiz', label: 'Knowledge Check' },
  { id: 'summary', label: 'Summary' },
];

@Component({
  selector: 'app-serialization-page',
  standalone: true,
  imports: [
    RouterLink,
    SerializationHero,
    DataTypeDilemma,
    MemoryVsWire,
    SerializeDeserializeFlow,
    OsiVisualizer,
    FormatExplorer,
    JsonAnatomy,
    HttpRequestInspector,
    SerializationPlayground,
    DeserializationPlayground,
    SchemaEvolution,
    PerformanceSecurity,
    RealWorldFlow,
    BreakSerializer,
    KnowledgeQuiz,
    SerializationSummary,
  ],
  templateUrl: './serialization-page.html',
  styleUrl: './serialization-page.css',
})
export class SerializationPage implements OnInit, AfterViewInit {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly progress = PROGRESS;
  protected readonly activeSection = signal('hero');

  private tickScheduled = false;
  private readonly onScroll = () => this.scheduleUpdate();

  ngOnInit(): void {
    this.titleService.setTitle('UnderTheHood — Serialization & Deserialization');
    this.meta.updateTag({
      name: 'description',
      content:
        'How an in-memory object becomes JSON on the wire and back again — an interactive lab covering serialization formats, JSON anatomy, validation, schema evolution, and a live request/response simulator.',
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
