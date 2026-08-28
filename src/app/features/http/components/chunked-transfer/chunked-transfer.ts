import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-chunked-transfer',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="chunked-transfer">
      <div class="container">
        <p class="lab-index">HTTP / 15 — CHUNKED TRANSFER</p>
        <h2 class="lab-title">Sending a response before knowing its final size.</h2>
        <p class="lab-lede">
          HTTP/1.1's chunked transfer coding lets a sender stream a response as a series of chunks, ending with a
          zero-length chunk, without knowing the total content length upfront.
        </p>

        <app-explain-simply>
          It's like a chef sending out a meal course by course, as each one finishes, instead of making
          everyone wait at the table until the entire menu is fully cooked before anything is served.
        </app-explain-simply>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="play()" [disabled]="playing()">
            {{ playing() ? 'Streaming…' : 'Stream Response' }}
          </button>
          <button type="button" class="lab-btn" (click)="reset()">Reset</button>
        </div>

        <div class="lab-panel chunk-panel">
          <div class="chunk-track">
            @for (c of chunkLabels; track c; let i = $index) {
              <div class="chunk-box" [class.is-arrived]="arrived() > i">
                <span class="mono">{{ c }}</span>
              </div>
            }
            <div class="chunk-box chunk-end" [class.is-arrived]="arrived() > chunkLabels.length">
              <span class="mono">0 = end</span>
            </div>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Chunked transfer coding is an HTTP/1.1 mechanism. HTTP/2 and HTTP/3 use their own binary framing instead
          of HTTP/1.1 chunked transfer coding.
        </p>
      </div>
    </section>
  `,
  styles: `
    .chunk-panel {
      overflow-x: auto;
    }

    .chunk-track {
      display: flex;
      gap: 10px;
      min-width: 480px;
    }

    .chunk-box {
      flex: 1;
      padding: 18px 10px;
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--text-faint);
      opacity: 0.4;
      transform: translateY(6px);
      transition: opacity 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
    }

    .chunk-box.is-arrived {
      opacity: 1;
      transform: translateY(0);
      border-color: var(--accent);
      color: var(--accent-strong);
      box-shadow: 0 0 12px var(--glow-accent);
    }

    .chunk-end.is-arrived {
      border-color: var(--accent-2);
      color: var(--accent-2);
      box-shadow: 0 0 12px var(--glow-accent-2);
    }
  `,
})
export class ChunkedTransfer {
  protected readonly chunkLabels = ['Chunk 1', 'Chunk 2', 'Chunk 3', 'Chunk 4'];
  protected readonly arrived = signal(0);
  protected readonly playing = signal(false);

  play(): void {
    this.reset();
    this.playing.set(true);
    const total = this.chunkLabels.length + 1;
    let i = 0;
    const tick = () => {
      i += 1;
      this.arrived.set(i);
      if (i < total) {
        setTimeout(tick, 450);
      } else {
        this.playing.set(false);
      }
    };
    setTimeout(tick, 300);
  }

  reset(): void {
    this.arrived.set(0);
    this.playing.set(false);
  }
}
