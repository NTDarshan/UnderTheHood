import { Component, OnDestroy, computed, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answerPoints: string[];
}

const QUESTIONS: InterviewQ[] = [
  { question: 'What problem does WebSocket solve?', answerPoints: ['Lets a server push data to a client without the client asking first', 'Replaces the request/response model with a persistent, bidirectional channel', 'Solves it at the transport/communication-model level, not just by being "faster"'] },
  { question: "Why isn't polling ideal for real-time communication?", answerPoints: ['Most requests return "no new data" — wasted round trips', 'Latency is bounded by the polling interval, not by when the event actually happened', 'Constant requests add server load even during quiet periods'] },
  { question: 'How is long polling different from WebSocket?', answerPoints: ['Long polling still opens a brand-new HTTP request/response cycle after every event', 'It reduces empty responses versus polling, but is still not truly bidirectional', 'WebSocket keeps one connection open indefinitely; long polling repeatedly reopens one'] },
  { question: 'SSE vs WebSocket?', answerPoints: ['SSE is server → client only; client → server still needs a normal HTTP request', 'WebSocket is bidirectional over the same open connection', 'SSE is simpler and has built-in reconnect via EventSource; choose it when the client rarely talks back'] },
  { question: 'How does the WebSocket handshake work?', answerPoints: ['Client sends a normal HTTP GET with Upgrade: websocket and a Sec-WebSocket-Key', 'Server replies 101 Switching Protocols with Sec-WebSocket-Accept derived from that key', 'From then on, the same TCP connection speaks WebSocket framing instead of HTTP'] },
  { question: 'Why does the server return 101?', answerPoints: ['101 means "switching protocols" — nothing was retrieved, the protocol on this connection is changing', '200 would imply a normal successful resource response, which this isn\'t', 'It signals both sides now agree to speak a different protocol over the same connection'] },
  { question: 'What is inside a WebSocket frame?', answerPoints: ['FIN, RSV1-3, opcode, MASK, payload length (possibly extended), masking key (if masked), payload', 'The opcode says what kind of frame it is (text, binary, close, ping, pong, continuation)', 'FIN says whether more fragments of this message are coming'] },
  { question: 'Why are client frames masked?', answerPoints: ['Required by RFC 6455 for every client → server frame', 'Protects against a specific class of cache/proxy-poisoning attacks by making client-sent bytes on the wire unpredictable', 'Server → client frames are not masked the same way'] },
  { question: 'Does masking provide encryption?', answerPoints: ['No — the masking key travels in plaintext in the same frame', 'Anyone reading the wire can unmask it as easily as the server can', 'Confidentiality only comes from TLS, i.e. wss://'] },
  { question: 'What does FIN mean?', answerPoints: ['Marks whether this frame is the final fragment of the current message', 'FIN=0 means more continuation frames are coming; FIN=1 means the message is complete', 'A single-frame message simply has FIN=1 on its only frame'] },
  { question: 'What is an opcode?', answerPoints: ['A 4-bit field telling the receiver what kind of frame this is', '0x1 text, 0x2 binary, 0x8 close, 0x9 ping, 0xA pong, 0x0 continuation', 'It determines how the payload should be interpreted'] },
  { question: 'What is ping/pong used for?', answerPoints: ['Detecting broken or half-open connections that never sent a proper close', 'Keeping intermediaries (proxies/load balancers) from timing out an idle-looking connection', 'A control-frame-level liveness check, distinct from any application heartbeat message'] },
  { question: 'What happens when the network silently dies?', answerPoints: ['No close frame is sent — the application has no immediate signal anything is wrong', 'A ping with no pong response is the usual way to detect it', 'Once suspected dead, the client closes locally and reconnects'] },
  { question: 'Why do WebSocket connections consume server resources?', answerPoints: ['Each open connection holds a socket, OS-level buffers, and usually application state in memory', 'Unlike short HTTP requests, this cost persists for the entire time the connection is open', 'More concurrent connections directly means more memory and file descriptors in use at once'] },
  { question: 'What is a file descriptor?', answerPoints: ['A small integer the OS uses to reference an open resource, including a network socket', 'Each process has a limited number available (an OS/process-level limit)', 'Every open WebSocket connection holds one for its whole lifetime'] },
  { question: 'What happens when you have 100,000 connections?', answerPoints: ['You need enough file descriptors, memory, and CPU across however many processes/hosts you run', 'A single process usually can\'t hold that many alone — horizontal scaling behind a load balancer is standard', 'Memory per connection has no universal number — it depends on OS, runtime, buffers and application state'] },
  { question: 'Why does a multi-server WebSocket architecture need pub/sub?', answerPoints: ['A server only has in-memory references to the connections it itself is holding', 'If Client B is on Server B, Server A cannot reach Client B\'s socket directly', 'Pub/sub lets any server publish an event that every subscribed server relays to its own connected clients'] },
  { question: 'What is fan-out?', answerPoints: ['Delivering one event to many subscribed clients', 'Cost scales with recipient count, not event size — 10,000 recipients means 10,000 separate sends', 'One of the biggest real operational costs in a real-time system'] },
  { question: 'What is backpressure?', answerPoints: ['What happens when a producer sends data faster than a consumer can process it', 'For a slow WebSocket client, its outbound buffer keeps growing unless something intervenes', 'Mitigations: bounded buffers, dropping/coalescing messages, disconnecting slow consumers, rate limiting'] },
  { question: 'Why do reconnect storms happen?', answerPoints: ['A mass disconnect (e.g. a server restart) causes every affected client to try reconnecting at once', 'Without any spread-out strategy, that\'s a synchronized spike hitting the server (and auth, and pub/sub) simultaneously', 'It can look like — or cause — a denial-of-service style overload'] },
  { question: 'Why use exponential backoff?', answerPoints: ['Doubling the wait between retries avoids hammering a struggling or recovering server', 'It gives the system time to recover instead of being immediately re-overwhelmed', 'Without it, failed clients retry as fast as possible, worsening an already-bad situation'] },
  { question: 'Why add jitter?', answerPoints: ['Pure exponential backoff still leaves many clients retrying at the exact same moments if they failed together', 'A small random offset spreads those retries out so they don\'t re-synchronize on every subsequent attempt', 'Jitter is what actually breaks the "everyone retries together" pattern, not backoff alone'] },
  { question: 'How would you authenticate a WebSocket connection?', answerPoints: ['Cookie-based session, since the handshake is still an HTTP request', 'A short-lived token in the URL or a WebSocket subprotocol value, since custom headers aren\'t always available', 'Or authenticate with an explicit application-level message right after the connection opens'] },
  { question: 'How would you authorize messages?', answerPoints: ['Authentication only establishes identity — authorization is checked separately, per action', 'Every subscribe/publish/action should be checked against what that specific user is allowed to do', 'The connection being open is not itself proof of permission for everything sent over it'] },
  { question: 'When would you choose SSE instead of WebSocket?', answerPoints: ['When communication is fundamentally one-directional: server → client', 'When you want a simpler protocol with built-in browser reconnect (EventSource)', 'When the client only occasionally needs to talk back, and a normal HTTP request for that is fine'] },
  { question: 'Does WebSocket replace REST?', answerPoints: ['No — they solve different problems', 'CRUD, resource retrieval, uploads/downloads, and cacheable responses still fit HTTP/REST better', 'WebSocket is for a persistent, bidirectional, real-time channel; most systems use both together'] },
  { question: 'How would you scale WebSockets horizontally?', answerPoints: ['Put a load balancer in front that correctly forwards the HTTP Upgrade handshake', 'Run multiple WebSocket server instances, each holding a subset of connections', 'Add a pub/sub layer so any server can reach clients connected to any other server'] },
  { question: 'What happens when one WebSocket server goes down?', answerPoints: ['Every connection that instance was holding drops immediately', 'Affected clients need to reconnect (ideally with backoff + jitter) to a healthy instance', 'Any in-memory-only state on that instance is lost unless it was also persisted or shared'] },
  { question: 'What observability metrics would you monitor?', answerPoints: ['Active connections, connection/disconnect/reconnect rates', 'Messages/sec, bytes/sec, average message size', 'Slow-consumer count, average connection duration, errors, and authentication failures'] },
  { question: 'Design a production chat system using WebSockets.', answerPoints: ['Clients hold one persistent connection each, through a load balancer that supports Upgrade', 'Multiple WebSocket server instances handle connections; a pub/sub layer (e.g. Redis) lets any server reach any client', 'Application services own the business logic (message storage, delivery receipts, authorization per room)', 'A database persists messages; the WebSocket layer is the live delivery path on top of that source of truth', 'Plan explicitly for reconnection with backoff+jitter, backpressure on slow clients, fan-out cost per room size, and connection-level observability'] },
];

@Component({
  selector: 'app-ws-interview-mode',
  standalone: true,
  template: `
    <section class="lab-section" id="interview-mode">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 024 — INTERVIEW MODE</p>
        <h2 class="lab-title">Could you explain this out loud, under pressure?</h2>
        <p class="lab-lede">Question {{ index() + 1 }} of {{ questions.length }}.</p>

        <div class="lab-panel">
          <p class="interviewer mono">INTERVIEWER</p>
          <p class="q-text">{{ current().question }}</p>

          @if (!revealed()) {
            <div class="timer-row">
              <p class="timer mono">{{ seconds() }}s</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="reveal()">Reveal Ideal Answer</button>
              </div>
            </div>
          } @else {
            <div class="answer-box">
              <p class="answer-title mono">IDEAL ANSWER STRUCTURE</p>
              <ol class="answer-list">
                @for (p of current().answerPoints; track p) {
                  <li>{{ p }}</li>
                }
              </ol>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="index() === 0" (click)="prev()">← Previous</button>
            <button type="button" class="lab-btn" [disabled]="index() === questions.length - 1" (click)="next()">Next Question →</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .interviewer { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .q-text { margin-top: 8px; font-size: 1.125rem; color: var(--text); font-weight: 600; }

    .timer-row { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
    .timer { font-size: 1.5rem; color: var(--accent-strong); }

    .answer-box { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .answer-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .answer-list { display: flex; flex-direction: column; gap: 6px; counter-reset: pt; list-style: decimal; padding-left: 20px; }
    .answer-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class WsInterviewMode implements OnDestroy {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly revealed = signal(false);
  protected readonly seconds = signal(60);
  protected readonly current = computed(() => this.questions[this.index()]);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.seconds.set(60);
    this.timer = setInterval(() => {
      this.seconds.update((s) => {
        if (s <= 1) {
          this.reveal();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  reveal(): void {
    this.revealed.set(true);
    if (this.timer) clearInterval(this.timer);
  }

  next(): void {
    this.index.update((i) => Math.min(i + 1, this.questions.length - 1));
    this.revealed.set(false);
    this.startTimer();
  }

  prev(): void {
    this.index.update((i) => Math.max(i - 1, 0));
    this.revealed.set(false);
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
