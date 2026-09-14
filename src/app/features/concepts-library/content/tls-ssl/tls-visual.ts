import { Component, OnDestroy, computed, signal } from '@angular/core';

type HandshakeStage = 'idle' | 'hello' | 'certificate' | 'key-exchange' | 'encrypted' | 'done';

const HANDSHAKE_SEQUENCE: { stage: HandshakeStage; label: string; side: 'client' | 'server' | 'mid' }[] = [
  { stage: 'hello', label: 'ClientHello — supported versions, cipher suites, random value', side: 'client' },
  { stage: 'certificate', label: 'ServerHello + Certificate — proves server identity', side: 'server' },
  { stage: 'key-exchange', label: 'Key exchange — both sides derive a shared secret', side: 'mid' },
  { stage: 'encrypted', label: 'Switch to symmetric session key', side: 'mid' },
];

const STAGE_MS = 650;

function randomHex(bytes: number): string {
  let out = '';
  for (let i = 0; i < bytes; i++) {
    out += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
    if (i % 16 === 15) out += '\n';
    else if (i % 2 === 1) out += ' ';
  }
  return out.trim();
}

@Component({
  selector: 'app-tls-visual',
  standalone: true,
  imports: [],
  template: `
    <div class="tv-root">
      <div class="tv-toggle-row">
        <button
          type="button"
          class="tv-toggle"
          [class.is-off]="!tlsOn()"
          [attr.aria-pressed]="tlsOn()"
          [disabled]="sending()"
          (click)="setTls(true)"
        >
          🔒 TLS ON
        </button>
        <button
          type="button"
          class="tv-toggle tv-toggle-danger"
          [class.is-off]="tlsOn()"
          [attr.aria-pressed]="!tlsOn()"
          [disabled]="sending()"
          (click)="setTls(false)"
        >
          🔓 TLS OFF
        </button>
      </div>

      <div class="tv-topology">
        <div class="tv-node">
          <span class="tv-node-icon">🖥</span>
          <span class="tv-node-label mono">BROWSER</span>
        </div>

        <div class="tv-wire">
          <div class="tv-wire-line" [class.is-secure]="tlsOn()"></div>
          @if (tlsOn()) {
            <span class="tv-wire-lock">🔒</span>
          }
          @if (sending() && stage() !== 'idle' && stage() !== 'done') {
            <span class="tv-wire-packet mono" [class.is-flying]="true">{{ activeStageLabel() }}</span>
          }
        </div>

        <div class="tv-node">
          <span class="tv-node-icon">☁️</span>
          <span class="tv-node-label mono">SERVER</span>
        </div>
      </div>

      @if (tlsOn()) {
        <ol class="tv-handshake mono">
          @for (step of handshakeSteps; track step.stage) {
            <li [class.is-active]="stage() === step.stage" [class.is-done]="isStageDone(step.stage)">
              <span class="tv-hs-dot"></span>
              {{ step.label }}
            </li>
          }
        </ol>
      }

      <div class="tv-actions">
        <button type="button" class="lab-btn lab-btn-primary" [disabled]="sending()" (click)="send()">
          {{ sending() ? 'SENDING…' : 'SEND LOGIN REQUEST' }}
        </button>
        <button type="button" class="lab-btn" (click)="reset()">RESET</button>
      </div>

      <div class="tv-capture">
        <div class="tv-capture-head mono">
          <span>PACKET CAPTURE — what a device on this network actually sees</span>
          @if (wireContent() && tlsOn()) {
            <span class="tv-flag tv-flag-safe">🔒 ENCRYPTED — UNREADABLE IN TRANSIT</span>
          }
          @if (wireContent() && !tlsOn()) {
            <span class="tv-flag tv-flag-danger">⚠ PLAINTEXT — READABLE BY ANYONE ON THIS NETWORK</span>
          }
        </div>
        <pre class="tv-capture-body mono">{{ wireContent() || 'Click "Send login request" to capture traffic…' }}</pre>
      </div>
    </div>
  `,
  styles: `
    .tv-root {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tv-toggle-row {
      display: flex;
      gap: 8px;
    }

    .tv-toggle {
      flex: 1;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid color-mix(in srgb, var(--el-success) 45%, var(--border-strong));
      background: color-mix(in srgb, var(--el-success) 12%, transparent);
      color: var(--el-success);
      font-size: 0.8125rem;
      font-weight: 600;
      transition: opacity 0.15s ease;
    }

    .tv-toggle.is-off {
      opacity: 0.4;
      border-color: var(--border-strong);
      background: transparent;
      color: var(--text-muted);
    }

    .tv-toggle-danger {
      border-color: color-mix(in srgb, var(--danger) 45%, var(--border-strong));
      background: color-mix(in srgb, var(--danger) 12%, transparent);
      color: var(--danger);
    }

    .tv-toggle-danger.is-off {
      opacity: 0.4;
      border-color: var(--border-strong);
      background: transparent;
      color: var(--text-muted);
    }

    .tv-topology {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tv-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--bg);
      min-width: 76px;
    }

    .tv-node-icon {
      font-size: 1.25rem;
    }

    .tv-node-label {
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      color: var(--text-faint);
    }

    .tv-wire {
      position: relative;
      flex: 1;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tv-wire-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: repeating-linear-gradient(90deg, var(--border-strong) 0 6px, transparent 6px 10px);
    }

    .tv-wire-line.is-secure {
      background: repeating-linear-gradient(90deg, var(--el-success) 0 6px, transparent 6px 10px);
    }

    .tv-wire-lock {
      position: relative;
      background: var(--surface);
      padding-inline: 4px;
      font-size: 0.875rem;
    }

    .tv-wire-packet {
      position: absolute;
      top: -22px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.625rem;
      white-space: nowrap;
      color: var(--el-cyan);
      background: var(--surface);
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--el-cyan) 45%, var(--border-strong));
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tv-handshake {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .tv-handshake li {
      display: flex;
      align-items: center;
      gap: 8px;
      transition: color 0.2s ease;
    }

    .tv-hs-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-strong);
      flex-shrink: 0;
      transition: background 0.2s ease, box-shadow 0.2s ease;
    }

    .tv-handshake li.is-active {
      color: var(--el-cyan);
    }

    .tv-handshake li.is-active .tv-hs-dot {
      background: var(--el-cyan);
      box-shadow: 0 0 6px color-mix(in srgb, var(--el-cyan) 60%, transparent);
    }

    .tv-handshake li.is-done {
      color: var(--el-success);
    }

    .tv-handshake li.is-done .tv-hs-dot {
      background: var(--el-success);
    }

    .tv-actions {
      display: flex;
      gap: 8px;
    }

    .tv-capture {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .tv-capture-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      font-size: 0.625rem;
      letter-spacing: 0.04em;
      color: var(--text-faint);
    }

    .tv-flag {
      font-size: 0.625rem;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid currentColor;
    }

    .tv-flag-safe {
      color: var(--el-success);
    }

    .tv-flag-danger {
      color: var(--danger);
    }

    .tv-capture-body {
      margin: 0;
      padding: 14px 16px;
      font-size: 0.75rem;
      line-height: 1.6;
      color: var(--text-muted);
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--bg);
      min-height: 92px;
    }

    @media (prefers-reduced-motion: reduce) {
      .tv-toggle, .tv-handshake li, .tv-hs-dot { transition: none; }
    }
  `,
})
export class TlsVisual implements OnDestroy {
  protected readonly handshakeSteps = HANDSHAKE_SEQUENCE;

  protected readonly tlsOn = signal(true);
  protected readonly sending = signal(false);
  protected readonly stage = signal<HandshakeStage>('idle');
  protected readonly wireContent = signal('');

  private readonly doneStages = signal<Set<HandshakeStage>>(new Set());
  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly activeStageLabel = computed(() => {
    const current = this.handshakeSteps.find((s) => s.stage === this.stage());
    return current ? current.label.split('—')[0].trim() : '';
  });

  private readonly reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  setTls(on: boolean): void {
    if (this.sending()) return;
    this.tlsOn.set(on);
    this.reset();
  }

  isStageDone(stage: HandshakeStage): boolean {
    return this.doneStages().has(stage);
  }

  send(): void {
    if (this.sending()) return;
    this.reset();
    this.sending.set(true);

    const requestBody = 'POST /login HTTP/1.1\nHost: accounts.example.com\nContent-Type: application/x-www-form-urlencoded\n\nusername=alice&password=hunter2';

    if (!this.tlsOn()) {
      const delay = this.reducedMotion ? 0 : 500;
      this.timers.push(
        setTimeout(() => {
          this.wireContent.set(requestBody);
          this.sending.set(false);
        }, delay),
      );
      return;
    }

    const stepDelay = this.reducedMotion ? 0 : STAGE_MS;
    this.handshakeSteps.forEach((step, index) => {
      this.timers.push(
        setTimeout(() => {
          this.stage.set(step.stage);
          if (index > 0) {
            const prev = this.handshakeSteps[index - 1].stage;
            this.doneStages.update((s) => new Set(s).add(prev));
          }
        }, stepDelay * index),
      );
    });

    const finalDelay = stepDelay * this.handshakeSteps.length;
    this.timers.push(
      setTimeout(() => {
        this.doneStages.update((s) => new Set(s).add('encrypted'));
        this.stage.set('done');
        this.wireContent.set(`${randomHex(96)}`);
        this.sending.set(false);
      }, finalDelay),
    );
  }

  reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.sending.set(false);
    this.stage.set('idle');
    this.doneStages.set(new Set());
    this.wireContent.set('');
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
