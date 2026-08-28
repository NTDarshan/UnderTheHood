import { Component, computed, signal } from '@angular/core';

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { q: 'What does authentication answer?', options: ['What are you allowed to do?', 'Who are you?'], correctIndex: 1, explanation: 'Authentication establishes identity — a separate concern from what that identity may do.' },
  { q: 'What does authorization answer?', options: ['Who are you?', 'What are you allowed to do?'], correctIndex: 1, explanation: 'Authorization decides whether an already-identified requester may perform a specific action.' },
  { q: 'Why should passwords not be stored as plaintext?', options: ['A breach or leak exposes every password directly', 'It uses more disk space'], correctIndex: 0, explanation: 'Plaintext storage means any read access to the database exposes real, usable passwords.' },
  { q: 'What is the difference between hashing and encryption?', options: ['Hashing is reversible, encryption is not', 'Hashing is one-way; encryption is deliberately reversible with a key'], correctIndex: 1, explanation: 'Password verifiers use hashing precisely because it should not be reversible.' },
  { q: 'What is a session?', options: ['A server-side record of authentication state, referenced by an ID', 'A synonym for a JWT'], correctIndex: 0, explanation: 'A session ID is only meaningful because the server can look up the identity it points to.' },
  { q: 'What is the purpose of HttpOnly?', options: ['Prevents client-side scripts from directly reading the cookie', 'Forces HTTPS only'], correctIndex: 0, explanation: 'HttpOnly is a mitigation against certain script-based cookie theft, not a transport requirement.' },
  { q: 'What is the purpose of SameSite?', options: ['Encrypts the cookie value', 'Controls whether the cookie is sent on cross-site requests'], correctIndex: 1, explanation: 'SameSite is a key part of CSRF defense by limiting cross-site cookie transmission.' },
  { q: 'What are the three major JWT components?', options: ['Header, Payload, Signature', 'Issuer, Subject, Audience'], correctIndex: 0, explanation: 'A JWT is header.payload.signature, joined by dots.' },
  { q: 'Is a JWT payload inherently encrypted?', options: ['Yes, always', 'No — typically encoded and signed, not encrypted'], correctIndex: 1, explanation: 'Anyone can decode a standard JWT payload; the signature only detects tampering.' },
  { q: 'Why can JWT revocation be difficult?', options: ['A valid, unexpired token remains cryptographically valid on its own', 'JWTs cannot be signed'], correctIndex: 0, explanation: 'Without extra infrastructure, a stateless token stays usable until it naturally expires.' },
  { q: 'What is an access token?', options: ['A long-lived credential used to obtain new tokens', 'A typically short-lived credential used to call an API'], correctIndex: 1, explanation: 'Access tokens are usually short-lived and used directly against protected resources.' },
  { q: 'What is a refresh token?', options: ['A shorter-lived token for API access', 'A longer-lived token used to obtain a new access token'], correctIndex: 1, explanation: 'Refresh tokens exist to renew access without forcing the user to log in again.' },
  { q: 'What problem does OAuth solve?', options: ['Letting an app act on a user\'s behalf without holding their password', 'Encrypting HTTP traffic'], correctIndex: 0, explanation: 'OAuth is primarily a delegation/authorization framework.' },
  { q: 'What does OpenID Connect add to OAuth?', options: ['Faster tokens', 'An authentication/identity layer (the ID token)'], correctIndex: 1, explanation: 'OIDC layers identity information on top of OAuth\'s delegation model.' },
  { q: 'What is RBAC?', options: ['Access control based on assigned roles and their permissions', 'A type of encryption'], correctIndex: 0, explanation: 'Role-Based Access Control ties permissions to a role rather than to each individual user.' },
  { q: 'What is ABAC?', options: ['Access decisions based on attributes of user, resource, action, and context', 'A synonym for RBAC'], correctIndex: 0, explanation: 'ABAC evaluates a richer set of attributes, not just a single role.' },
  { q: 'What is the difference between 401 and 403?', options: ['401 = not authenticated; 403 = authenticated but not permitted', 'They mean the same thing'], correctIndex: 0, explanation: 'This distinction is one of the most important in the whole chapter.' },
  { q: 'Can an authenticated user still be unauthorized?', options: ['No, authentication implies full access', 'Yes — identity and permission are separate checks'], correctIndex: 1, explanation: 'Being known to the system says nothing about what that identity is allowed to do.' },
  { q: 'What is IDOR / broken object-level authorization?', options: ['Missing a resource-level ownership/permission check', 'A type of encryption downgrade attack'], correctIndex: 0, explanation: 'IDOR happens when authentication passes but the specific resource was never checked against the requester.' },
  { q: 'What is CSRF?', options: ['Tricking a victim\'s browser into sending an unwanted authenticated request', 'Injecting a script into a page'], correctIndex: 0, explanation: 'CSRF exploits automatic credential attachment (like cookies), not script execution.' },
];

@Component({
  selector: 'app-knowledge-quiz',
  standalone: true,
  template: `
    <section class="lab-section" id="quiz">
      <div class="container">
        <p class="lab-index">AUTH / 51 — KNOWLEDGE CHECK</p>
        <h2 class="lab-title">Twenty questions. Every answer explains itself.</h2>

        @if (!finished()) {
          <div class="lab-panel quiz-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="quiz-question">{{ current().q }}</p>
            <div class="option-list">
              @for (opt of current().options; track opt; let oi = $index) {
                <button
                  type="button"
                  class="option-btn"
                  [class.is-correct]="picked() !== null && oi === current().correctIndex"
                  [class.is-wrong]="picked() === oi && oi !== current().correctIndex"
                  [disabled]="picked() !== null"
                  (click)="choose(oi)"
                >
                  {{ opt }}
                </button>
              }
            </div>
            @if (picked() !== null) {
              <p class="explanation">{{ current().explanation }}</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="next()">{{ index() < questions.length - 1 ? 'Next →' : 'See score' }}</button>
              </div>
            }
          </div>
        } @else {
          <div class="lab-panel quiz-panel">
            <p class="quiz-score mono">{{ score() }} / {{ questions.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Retake the quiz</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .quiz-panel { margin-top: 24px; }
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 12px; }
    .quiz-question { font-size: 1.0625rem; color: var(--text); font-weight: 600; }

    .option-list { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }

    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }

    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class KnowledgeQuiz {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.questions[this.index()]);

  choose(oi: number): void {
    this.picked.set(oi);
    if (oi === this.current().correctIndex) this.score.update((s) => s + 1);
  }

  next(): void {
    if (this.index() < this.questions.length - 1) {
      this.index.update((i) => i + 1);
      this.picked.set(null);
    } else {
      this.finished.set(true);
    }
  }

  restart(): void {
    this.index.set(0);
    this.picked.set(null);
    this.score.set(0);
    this.finished.set(false);
  }
}
