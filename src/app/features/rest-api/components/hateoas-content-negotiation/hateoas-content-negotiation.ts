import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-hateoas-content-negotiation',
  standalone: true,
  template: `
    <section class="lab-section" id="hateoas">
      <div class="container">
        <p class="lab-index">REST API / 27 — HATEOAS &amp; CONTENT NEGOTIATION</p>
        <h2 class="lab-title">A response can tell the client what to do next — or not.</h2>

        <div class="lab-panel">
          <p class="lab-node">HATEOAS — HYPERMEDIA AS THE ENGINE OF APPLICATION STATE</p>
          <p class="lab-code">{{ '{' }}
  <span class="tok-key">"id"</span>: 42,
  <span class="tok-key">"title"</span>: "Book",
  <span class="tok-key">"_links"</span>: {{ '{' }}
    <span class="tok-key">"self"</span>: "/books/42",
    <span class="tok-key">"reviews"</span>: "/books/42/reviews"
  {{ '}' }}
{{ '}' }}</p>
          <p class="lab-note">Hypermedia links let a response describe the transitions available from where the client currently is — instead of the client having to already know every URL by heart.</p>
          <p class="lab-note lab-note-warn"><strong>Not every practical API implements HATEOAS</strong>, and that doesn't make it "not REST enough." Most real-world APIs skip it in favor of documented, stable URLs. It's worth understanding as a REST architectural idea — not a checklist item every API must tick.</p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">CONTENT NEGOTIATION</p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="step() === 0" (click)="step.set(0)">1. Client requests</button>
            <button type="button" class="lab-btn" [class.is-active]="step() === 1" (click)="step.set(1)">2. Server responds</button>
          </div>

          @if (step() === 0) {
            <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books/42</span>
<span class="tok-dim">Accept:</span> application/json</p>
            <p class="lab-note"><span class="tok-key mono">Accept</span> is the client stating what representation formats it is willing to receive.</p>
          } @else {
            <p class="lab-code"><span class="tok-status-ok">200 OK</span>
<span class="tok-dim">Content-Type:</span> application/json

{{ '{' }} <span class="tok-key">"id"</span>: 42, <span class="tok-key">"title"</span>: "Book" {{ '}' }}</p>
            <p class="lab-note"><span class="tok-key mono">Content-Type</span> is the server stating what format the body it just sent actually is — a different header describing a different direction of the same conversation.</p>
          }

          <p class="lab-note" style="margin-top: 20px;">This is the same JSON body you've already been turning into objects and back again in the Serialization/Deserialization chapter — content negotiation is just how client and server agree on which format that body should be in.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .mono { font-family: var(--font-mono); }
  `,
})
export class HateoasContentNegotiation {
  protected readonly step = signal(0);
}
