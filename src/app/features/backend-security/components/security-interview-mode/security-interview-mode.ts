import { Component, OnDestroy, computed, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answerPoints: string[];
  visual: string;
  misconception: string;
  caveat: string;
  followUp: string;
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is the difference between authentication and authorization?',
    answerPoints: [
      'Authentication answers "who are you" — verifying a claimed identity via a credential',
      'Authorization answers "what are you allowed to do" — a separate decision made after identity is known',
      'A request can be fully authenticated and still be unauthorized for the specific action it is attempting',
    ],
    visual: 'A hotel key card checks in at the front desk (authentication) but only opens the doors it was actually programmed for (authorization).',
    misconception: 'That being logged in is the same as being allowed — many real vulnerabilities are exactly this gap: authenticated, but never checked against the specific resource requested.',
    caveat: 'A missing authorization check does not show up as an error — it shows up as a successful response returning data it should not have returned.',
    followUp: 'Where in a typical request-handling pipeline would you place the authorization check, and why there specifically?',
  },
  {
    question: 'Why should passwords be hashed rather than encrypted?',
    answerPoints: [
      'Encryption is reversible by design — anyone holding the key can recover the original value',
      'Hashing is one-way — there is no key that turns the hash back into the password',
      'A password only ever needs to be compared, never recovered, so a one-way function is the correct tool',
    ],
    visual: 'Encryption is a locked box with a key that opens it; hashing is a one-way blender — you can\'t turn a smoothie back into whole fruit.',
    misconception: 'That "encrypted passwords" is a stronger claim than "hashed passwords" — it is actually a red flag, since it implies the plaintext is recoverable by whoever holds the key.',
    caveat: 'Hashing alone is not enough — it must be a slow, purpose-built algorithm (bcrypt, Argon2) with a per-user salt, or it is still crackable at scale.',
    followUp: 'Why is a fast general-purpose hash like SHA-256 a bad choice for password storage even though it is technically one-way?',
  },
  {
    question: 'What does HttpOnly protect against?',
    answerPoints: [
      'It marks a cookie as inaccessible to JavaScript running on the page',
      'It prevents client-side script — including injected script from an XSS vulnerability — from reading that cookie\'s value',
    ],
    visual: 'It\'s a cookie the page can send but cannot look inside — like a sealed envelope handed to the browser to deliver, not to open.',
    misconception: 'That HttpOnly prevents XSS itself — it does not stop the injection from happening, it only reduces what an attacker can steal via document.cookie if XSS does occur.',
    caveat: 'HttpOnly reduces but doesn\'t eliminate XSS-related cookie exposure — an attacker with script execution can still act on the page as the user, make authenticated requests, or exfiltrate other unprotected data.',
    followUp: 'If an attacker can\'t read the cookie via HttpOnly, what else could they still do with an active XSS payload on the page?',
  },
  {
    question: 'What does SameSite help control?',
    answerPoints: [
      'It restricts whether a cookie is sent along with cross-site requests, based on its Strict/Lax/None setting',
      'This directly reduces the browser\'s default behavior of auto-attaching cookies to any request, regardless of origin',
    ],
    visual: 'It\'s a rule the browser checks before mailing your session cookie along with a request — "is this request actually coming from the same site, or a stranger\'s page?"',
    misconception: 'That SameSite is a complete CSRF fix on its own — some legitimate top-level navigations still send Lax cookies, and not all browsers/clients enforce it identically.',
    caveat: 'SameSite mitigates but isn\'t a universal CSRF solution — CSRF tokens tied to session state remain the more complete defense for state-changing requests.',
    followUp: 'What is the practical difference between SameSite=Strict and SameSite=Lax for a login flow that involves an external redirect?',
  },
  {
    question: 'Why are JWTs not automatically secure?',
    answerPoints: [
      'A JWT\'s payload is base64url-encoded, not encrypted — anyone holding the token can read the claims inside it',
      'Security depends entirely on correct signature verification, a fixed expected algorithm, and short expiry — not on the token format itself',
      'A server that fails to verify the signature, or accepts an unexpected algorithm like "none", will trust a forged token',
    ],
    visual: 'A JWT is like a sealed but transparent envelope — anyone can read what\'s inside, but only someone without the matching seal can\'t convincingly reseal it after tampering.',
    misconception: 'That "it\'s a JWT" implies encryption or inherent safety — the "signed" part protects integrity, not confidentiality, and only if verification is actually implemented correctly.',
    caveat: 'JWT payloads aren\'t automatically encrypted, so never place secrets or sensitive data directly in the claims.',
    followUp: 'How would you revoke a single JWT before its expiry, given that verification doesn\'t require a server-side lookup?',
  },
  {
    question: 'What is BOLA?',
    answerPoints: [
      'Broken Object Level Authorization — an authenticated request accesses an object it was never verified to be allowed to access',
      'It typically manifests as changing an ID in a request (like an order or account ID) and receiving another user\'s data',
      'The root cause is a missing per-object ownership or permission check, not a missing login check',
    ],
    visual: 'Being a verified hotel guest (authenticated) does not mean your key card should open every room in the hotel (object-level authorization).',
    misconception: 'That requiring login is sufficient protection — BOLA specifically happens to fully authenticated users who simply were never checked against the specific object requested.',
    caveat: 'It is consistently ranked among the most common and most damaging API vulnerabilities precisely because it is easy to miss in code review — the endpoint "works," it just works for the wrong data too.',
    followUp: 'Would switching from sequential IDs to random UUIDs fix this vulnerability? Why or why not?',
  },
  {
    question: 'Why is frontend validation insufficient?',
    answerPoints: [
      'Frontend code runs entirely inside a client the attacker controls — it can be disabled, bypassed, or ignored',
      'Any request can be crafted directly, without ever touching the frontend\'s validation logic at all',
      'Frontend validation is a legitimate usability feature — fast feedback — but it is not a security control',
    ],
    visual: 'A "please don\'t" sign at the entrance to a vault does not stop someone who walks in through a side door instead.',
    misconception: 'That client-side checks add meaningful security because "the UI won\'t let you" — the UI is optional the moment someone uses a direct API call instead of the form.',
    caveat: 'Server-side validation must independently enforce every rule the frontend enforces, treating every incoming request as if it came from an attacker directly.',
    followUp: 'If frontend validation provides no security value, why keep it at all?',
  },
  {
    question: 'Why are parameterized queries safer?',
    answerPoints: [
      'They separate the query\'s structure from its data values, sending each to the database independently',
      'The database binds values into fixed placeholders at execution time, so a value can never be reinterpreted as part of the query\'s syntax',
      'This structurally closes SQL injection, rather than relying on filtering or escaping attacker input, which is easy to get wrong or bypass',
    ],
    visual: 'It\'s the difference between mailing someone a pre-printed form with blank fields to fill in, versus letting them write and mail you the entire letter themselves.',
    misconception: 'That escaping special characters (quotes, semicolons) is an equivalent defense — escaping is a blocklist approach that is easy to bypass with encoding tricks; parameterization removes the injection class structurally.',
    caveat: 'Parameterized queries only protect values — they cannot parameterize identifiers like table or column names, which still require an allow-list if they come from user input.',
    followUp: 'How would you safely let a user choose which column to sort results by, given that parameterization doesn\'t cover identifiers?',
  },
  {
    question: 'What is command injection?',
    answerPoints: [
      'An injection attack where untrusted input reaches an operating-system shell call without proper isolation',
      'It lets an attacker append or chain additional OS commands beyond what the application intended to run',
    ],
    visual: 'Handing someone a form letter to fill in a blank, but they write an entire second letter in the blank and the mail system reads both.',
    misconception: 'That it only matters for obviously "shell-like" applications — any code that builds a command string with string concatenation and user input is exposed, even in a web backend that seems unrelated to OS commands.',
    caveat: 'The safest fix is avoiding shell invocation with user input entirely; when unavoidable, pass arguments as an array via a safe API rather than building a command string.',
    followUp: 'What is the difference in risk between `execSync(userInput)` and a safe array-based process spawn API?',
  },
  {
    question: 'What is CSRF?',
    answerPoints: [
      'Cross-Site Request Forgery — an attack that leverages a victim\'s existing authenticated session to submit a forged, unwanted request',
      'It exploits the browser\'s default behavior of automatically attaching cookies to requests, regardless of which site initiated them',
      'The victim doesn\'t need to be tricked into entering credentials — just into visiting a malicious page while already logged in elsewhere',
    ],
    visual: 'A forged letter mailed in an envelope stamped with your own return address — the recipient trusts the envelope, not the content inside it.',
    misconception: 'That CSRF requires stealing credentials or a session token — it does not; it relies entirely on the victim\'s browser doing what browsers normally do.',
    caveat: 'SameSite cookies help but aren\'t a complete fix — CSRF tokens bound to the session remain the standard defense for state-changing requests.',
    followUp: 'Why does CSRF specifically target state-changing requests (like POST/PUT/DELETE) rather than simple GET reads?',
  },
  {
    question: 'What is XSS?',
    answerPoints: [
      'Cross-Site Scripting — untrusted input is rendered into a page as executable script or markup instead of inert text',
      'The injected script then runs with the full trust and privileges of the page it was injected into, in the victim\'s browser',
    ],
    visual: 'A guest writes something in a "public comment board," but instead of text, they write a note that everyone who reads the board is tricked into acting on.',
    misconception: 'That XSS is only a "cosmetic" or minor issue because it "just runs in the browser" — it runs inside the victim\'s authenticated session, which can mean full account takeover.',
    caveat: 'Output encoding must be context-aware — the correct encoding differs for HTML body text, an HTML attribute, a URL, and inline JavaScript.',
    followUp: 'Why would encoding user input correctly for an HTML body still leave it vulnerable if it\'s later placed inside a JavaScript string?',
  },
  {
    question: 'What is SSRF?',
    answerPoints: [
      'Server-Side Request Forgery — the application itself is tricked into making a request to a destination the attacker chose',
      'The server, not the victim\'s browser, is the one issuing the malicious request — often to internal-only infrastructure',
    ],
    visual: 'Asking a trusted courier who has building access to "deliver a package to that door over there" — a door you\'re not allowed near yourself, but the courier is.',
    misconception: 'That SSRF is just "an unusual edge case" — any feature that fetches a user-supplied URL (webhooks, image import, link preview) is a candidate.',
    caveat: 'A destination allow-list combined with blocking internal/link-local IP ranges is more robust than trying to blocklist "bad" URLs, which is easy to bypass with redirects or encoding.',
    followUp: 'Why is a cloud provider\'s metadata endpoint (like 169.254.169.254) such a common SSRF target?',
  },
  {
    question: 'What is least privilege?',
    answerPoints: [
      'Every identity — user, service, or process — is granted only the access it actually needs to do its job',
      'It exists to bound the blast radius of any single compromised credential or component',
    ],
    visual: 'A hotel cleaning staff member\'s key opens the rooms on their assigned floor, not the entire building including the vault.',
    misconception: 'That it only applies to human user permissions — it applies equally, and often more critically, to service accounts, API keys, and database roles.',
    caveat: 'Permissions accumulate over time and are rarely revoked — least privilege requires ongoing review, not a one-time setup.',
    followUp: 'How would you audit whether a production service account currently holds more privilege than it actually uses?',
  },
  {
    question: 'What is defense in depth?',
    answerPoints: [
      'A strategy of layering multiple, independent security controls so the failure of any single one does not fully compromise the system',
      'Each layer assumes the previous one might fail, and is designed to still stop an attack on its own',
    ],
    visual: 'A castle with a moat, a wall, and an inner keep — breaching one layer does not hand over the whole castle.',
    misconception: 'That having one strong control (like "we validate all input") means additional layers are redundant — the point is precisely that any single layer, including that one, can fail or be bypassed.',
    caveat: 'More layers mean more code and configuration surface to maintain correctly — defense in depth is a deliberate trade of complexity for resilience, not a free win.',
    followUp: 'If you could only add one more security layer to a system that currently has just input validation, what would you add next and why?',
  },
];

@Component({
  selector: 'app-security-interview-mode',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-interview-mode">
      <div class="container">
        <p class="lab-index">38 — INTERVIEW MODE</p>
        <h2 class="lab-title">Could you explain this out loud, under pressure?</h2>

        <div class="lab-panel">
          <div class="q-meta">
            <p class="interviewer mono">INTERVIEWER &middot; QUESTION {{ index() + 1 }} / {{ questions.length }}</p>
          </div>
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

              <p class="visual-title mono">HOW TO PICTURE IT</p>
              <p class="visual-text">{{ current().visual }}</p>

              <p class="misconception-title mono">COMMON MISCONCEPTION</p>
              <p class="misconception-text">{{ current().misconception }}</p>

              <p class="caveat-title mono">PRODUCTION CAVEAT</p>
              <p class="caveat-text">{{ current().caveat }}</p>

              <p class="followup-title mono">LIKELY FOLLOW-UP</p>
              <p class="followup-text">{{ current().followUp }}</p>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="index() === 0" (click)="prev()">&larr; Previous</button>
            <button type="button" class="lab-btn" [disabled]="index() === questions.length - 1" (click)="next()">Next Question &rarr;</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
    }

    .interviewer { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .q-text { margin-top: 8px; font-size: 1.125rem; color: var(--text); font-weight: 600; }

    .timer-row { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
    .timer { font-size: 1.5rem; color: var(--accent-strong); }

    .answer-box { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .answer-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .answer-list { display: flex; flex-direction: column; gap: 6px; list-style: decimal; padding-left: 20px; }
    .answer-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .visual-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--c-db); letter-spacing: 0.06em; margin-bottom: 8px; }
    .visual-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .misconception-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--suspicious); letter-spacing: 0.06em; margin-bottom: 8px; }
    .misconception-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .caveat-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--attack); letter-spacing: 0.06em; margin-bottom: 8px; }
    .caveat-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .followup-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--blocked); letter-spacing: 0.06em; margin-bottom: 8px; }
    .followup-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; font-style: italic; }
  `,
})
export class SecurityInterviewMode implements OnDestroy {
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
