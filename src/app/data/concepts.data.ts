export type ConceptCategory =
  | 'backend'
  | 'frontend'
  | 'databases'
  | 'systems'
  | 'cloud-devops'
  | 'security'
  | 'ai-engineering'
  | 'machine-learning';

export interface ConceptCategoryMeta {
  id: ConceptCategory;
  label: string;
}

export const conceptCategories: ConceptCategoryMeta[] = [
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'databases', label: 'Databases' },
  { id: 'systems', label: 'Systems' },
  { id: 'cloud-devops', label: 'Cloud & DevOps' },
  { id: 'security', label: 'Security' },
  { id: 'ai-engineering', label: 'AI Engineering' },
  { id: 'machine-learning', label: 'Machine Learning' },
];

export type ConceptDifficulty = 'foundation' | 'intermediate' | 'advanced';

/**
 * A concept's own "deep dive" content (the WHAT/WHY/HOW/VISUAL/WHERE/REMEMBER
 * breakdown) is authored later, one at a time. Until then every concept is
 * browsable and can be marked understood, but its detail view shows a
 * coming-soon state instead of the full template.
 */
export interface EngineeringConcept {
  id: string;
  name: string;
  category: ConceptCategory;
  blurb: string;
  difficulty: ConceptDifficulty;
  minutes: number;
}

export const engineeringConcepts: EngineeringConcept[] = [
  // ── BACKEND ─────────────────────────────────────────────────────────
  { id: 'backend-tls-ssl', name: 'TLS / SSL', category: 'backend', blurb: 'How your browser creates a secure connection to a server.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-dns', name: 'DNS', category: 'backend', blurb: 'How a domain name like example.com turns into an IP address.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-tcp', name: 'TCP', category: 'backend', blurb: 'The reliable, ordered connection most of the internet is built on.', difficulty: 'foundation', minutes: 6 },
  { id: 'backend-udp', name: 'UDP', category: 'backend', blurb: "A fast, connectionless alternative to TCP that doesn't guarantee delivery.", difficulty: 'foundation', minutes: 5 },
  { id: 'backend-sockets', name: 'Sockets', category: 'backend', blurb: 'The endpoint a program uses to send and receive data over a network.', difficulty: 'intermediate', minutes: 6 },
  { id: 'backend-ports', name: 'Ports', category: 'backend', blurb: 'The number that tells a machine which running program a connection is for.', difficulty: 'foundation', minutes: 3 },
  { id: 'backend-file-descriptors', name: 'File Descriptors', category: 'backend', blurb: 'The small integer handle an OS gives a process for every open file or connection.', difficulty: 'intermediate', minutes: 6 },
  { id: 'backend-processes', name: 'Processes', category: 'backend', blurb: 'An independent running instance of a program, with its own memory.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-threads', name: 'Threads', category: 'backend', blurb: 'A lightweight unit of execution that shares memory with its process.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-environment-variables', name: 'Environment Variables', category: 'backend', blurb: 'Configuration values injected into a program from outside its code.', difficulty: 'foundation', minutes: 3 },
  { id: 'backend-configuration', name: 'Configuration', category: 'backend', blurb: "Everything that changes how software behaves without changing its code.", difficulty: 'foundation', minutes: 4 },
  { id: 'backend-http-headers', name: 'HTTP Headers', category: 'backend', blurb: 'Metadata sent alongside a request or response, separate from the body.', difficulty: 'foundation', minutes: 4 },
  { id: 'backend-content-types', name: 'Content Types', category: 'backend', blurb: "How a request or response declares what kind of data it's carrying.", difficulty: 'foundation', minutes: 4 },
  { id: 'backend-mime-types', name: 'MIME Types', category: 'backend', blurb: 'The standardized labels (like image/png) content types are built from.', difficulty: 'foundation', minutes: 3 },
  { id: 'backend-compression', name: 'Compression', category: 'backend', blurb: 'Shrinking data before sending it, then expanding it back on arrival.', difficulty: 'foundation', minutes: 4 },
  { id: 'backend-serialization', name: 'Serialization', category: 'backend', blurb: 'Turning an in-memory object into bytes that can be sent or stored.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-deserialization', name: 'Deserialization', category: 'backend', blurb: 'Turning bytes back into an object a program can use.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-cookies', name: 'Cookies', category: 'backend', blurb: 'A small piece of state a server asks the browser to remember and resend.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-sessions', name: 'Sessions', category: 'backend', blurb: 'A way to remember who a user is across multiple requests.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-idempotency', name: 'Idempotency', category: 'backend', blurb: 'Doing the same request twice and ending up in the same state either way.', difficulty: 'intermediate', minutes: 6 },
  { id: 'backend-connection-pooling', name: 'Connection Pooling', category: 'backend', blurb: 'Reusing a small set of open connections instead of creating a new one per request.', difficulty: 'intermediate', minutes: 6 },
  { id: 'backend-reverse-proxy', name: 'Reverse Proxy', category: 'backend', blurb: 'A server that sits in front of your app and forwards requests to it.', difficulty: 'foundation', minutes: 5 },
  { id: 'backend-health-checks', name: 'Health Checks', category: 'backend', blurb: 'A lightweight endpoint that tells the outside world whether a service is alive.', difficulty: 'foundation', minutes: 4 },

  // ── FRONTEND ────────────────────────────────────────────────────────
  { id: 'frontend-dom', name: 'DOM', category: 'frontend', blurb: 'The tree structure the browser builds from your HTML that JavaScript can manipulate.', difficulty: 'foundation', minutes: 5 },
  { id: 'frontend-browser-rendering', name: 'Browser Rendering', category: 'frontend', blurb: 'The pipeline that turns HTML, CSS, and JS into pixels on screen.', difficulty: 'intermediate', minutes: 8 },
  { id: 'frontend-event-loop', name: 'Event Loop', category: 'frontend', blurb: 'How a single-threaded browser handles many things happening at once.', difficulty: 'intermediate', minutes: 8 },
  { id: 'frontend-local-storage', name: 'Local Storage', category: 'frontend', blurb: 'A simple key-value store the browser persists indefinitely on the device.', difficulty: 'foundation', minutes: 3 },
  { id: 'frontend-session-storage', name: 'Session Storage', category: 'frontend', blurb: 'Like local storage, but cleared when the tab closes.', difficulty: 'foundation', minutes: 3 },
  { id: 'frontend-cookies', name: 'Cookies', category: 'frontend', blurb: 'Small state the browser stores and automatically resends with matching requests.', difficulty: 'foundation', minutes: 5 },
  { id: 'frontend-cors', name: 'CORS', category: 'frontend', blurb: 'Why browsers sometimes refuse to let one website call another.', difficulty: 'foundation', minutes: 6 },
  { id: 'frontend-preflight-requests', name: 'Preflight Requests', category: 'frontend', blurb: 'An OPTIONS request the browser sends first to check if a cross-origin call is allowed.', difficulty: 'intermediate', minutes: 6 },
  { id: 'frontend-debouncing', name: 'Debouncing', category: 'frontend', blurb: 'Waiting until activity stops before reacting, to avoid firing on every keystroke.', difficulty: 'foundation', minutes: 4 },
  { id: 'frontend-throttling', name: 'Throttling', category: 'frontend', blurb: 'Limiting how often a handler can run, no matter how fast events fire.', difficulty: 'foundation', minutes: 4 },
  { id: 'frontend-lazy-loading', name: 'Lazy Loading', category: 'frontend', blurb: "Loading a piece of the app only when it's actually needed.", difficulty: 'foundation', minutes: 4 },
  { id: 'frontend-code-splitting', name: 'Code Splitting', category: 'frontend', blurb: 'Breaking one large bundle into smaller pieces loaded on demand.', difficulty: 'intermediate', minutes: 5 },
  { id: 'frontend-tree-shaking', name: 'Tree Shaking', category: 'frontend', blurb: 'Removing code from the final bundle that nothing actually uses.', difficulty: 'intermediate', minutes: 5 },
  { id: 'frontend-web-workers', name: 'Web Workers', category: 'frontend', blurb: 'Running JavaScript on a background thread, off the main UI thread.', difficulty: 'intermediate', minutes: 6 },
  { id: 'frontend-service-workers', name: 'Service Workers', category: 'frontend', blurb: 'A script the browser runs in the background to intercept network requests.', difficulty: 'advanced', minutes: 8 },
  { id: 'frontend-websockets', name: 'WebSockets', category: 'frontend', blurb: 'A persistent two-way connection between browser and server.', difficulty: 'intermediate', minutes: 6 },
  { id: 'frontend-sse', name: 'SSE', category: 'frontend', blurb: 'Server-Sent Events: a one-way stream of updates from server to browser over HTTP.', difficulty: 'intermediate', minutes: 5 },

  // ── DATABASES ───────────────────────────────────────────────────────
  { id: 'databases-primary-key', name: 'Primary Key', category: 'databases', blurb: 'The column (or columns) that uniquely identifies each row in a table.', difficulty: 'foundation', minutes: 3 },
  { id: 'databases-foreign-key', name: 'Foreign Key', category: 'databases', blurb: "A column that points to the primary key of another table.", difficulty: 'foundation', minutes: 4 },
  { id: 'databases-indexes', name: 'Indexes', category: 'databases', blurb: 'A structure that lets the database find rows without scanning the whole table.', difficulty: 'foundation', minutes: 6 },
  { id: 'databases-composite-index', name: 'Composite Index', category: 'databases', blurb: 'An index built across more than one column at once.', difficulty: 'intermediate', minutes: 6 },
  { id: 'databases-transactions', name: 'Transactions', category: 'databases', blurb: 'A group of operations that succeed or fail together, as one unit.', difficulty: 'foundation', minutes: 6 },
  { id: 'databases-acid', name: 'ACID', category: 'databases', blurb: 'The four guarantees — atomicity, consistency, isolation, durability — that make transactions trustworthy.', difficulty: 'intermediate', minutes: 8 },
  { id: 'databases-isolation-levels', name: 'Isolation Levels', category: 'databases', blurb: "How much one transaction is allowed to see of another's unfinished work.", difficulty: 'advanced', minutes: 10 },
  { id: 'databases-deadlocks', name: 'Deadlocks', category: 'databases', blurb: 'Two transactions each waiting on a lock the other one holds, forever.', difficulty: 'advanced', minutes: 8 },
  { id: 'databases-normalization', name: 'Normalization', category: 'databases', blurb: 'Structuring tables to remove duplicate data by splitting it apart.', difficulty: 'intermediate', minutes: 8 },
  { id: 'databases-denormalization', name: 'Denormalization', category: 'databases', blurb: 'Deliberately duplicating data to make reads faster, at the cost of writes.', difficulty: 'intermediate', minutes: 6 },
  { id: 'databases-views', name: 'Views', category: 'databases', blurb: 'A saved query that behaves like a virtual table.', difficulty: 'foundation', minutes: 4 },
  { id: 'databases-stored-procedures', name: 'Stored Procedures', category: 'databases', blurb: 'A block of database logic saved and executed inside the database itself.', difficulty: 'intermediate', minutes: 6 },
  { id: 'databases-query-plans', name: 'Query Plans', category: 'databases', blurb: 'The step-by-step strategy the database chose to execute your query.', difficulty: 'advanced', minutes: 10 },
  { id: 'databases-connection-pooling', name: 'Connection Pooling', category: 'databases', blurb: 'Reusing a small set of open database connections instead of opening one per query.', difficulty: 'intermediate', minutes: 6 },
  { id: 'databases-replication', name: 'Replication', category: 'databases', blurb: 'Copying data from one database to one or more others, automatically.', difficulty: 'intermediate', minutes: 8 },
  { id: 'databases-sharding', name: 'Sharding', category: 'databases', blurb: 'Splitting one dataset across multiple databases so no single one holds it all.', difficulty: 'advanced', minutes: 10 },

  // ── SYSTEMS ─────────────────────────────────────────────────────────
  { id: 'systems-process', name: 'Process', category: 'systems', blurb: 'An independently running program with its own isolated memory space.', difficulty: 'foundation', minutes: 5 },
  { id: 'systems-thread', name: 'Thread', category: 'systems', blurb: 'A unit of execution inside a process that shares its memory.', difficulty: 'foundation', minutes: 5 },
  { id: 'systems-context-switching', name: 'Context Switching', category: 'systems', blurb: 'The CPU pausing one task and resuming another, saving and restoring its state.', difficulty: 'intermediate', minutes: 6 },
  { id: 'systems-memory', name: 'Memory', category: 'systems', blurb: 'The space a running program uses to hold its data while it works.', difficulty: 'foundation', minutes: 5 },
  { id: 'systems-heap', name: 'Heap', category: 'systems', blurb: 'The region of memory used for dynamically allocated, long-lived data.', difficulty: 'intermediate', minutes: 5 },
  { id: 'systems-stack', name: 'Stack', category: 'systems', blurb: 'The region of memory that tracks function calls and their local variables.', difficulty: 'intermediate', minutes: 5 },
  { id: 'systems-cpu', name: 'CPU', category: 'systems', blurb: "The hardware that actually executes your program's instructions.", difficulty: 'foundation', minutes: 4 },
  { id: 'systems-io', name: 'I/O', category: 'systems', blurb: 'Any time a program talks to something outside itself — disk, network, another process.', difficulty: 'foundation', minutes: 4 },
  { id: 'systems-file-descriptor', name: 'File Descriptor', category: 'systems', blurb: "The OS's handle for anything a process has open — files, sockets, pipes.", difficulty: 'intermediate', minutes: 6 },
  { id: 'systems-sockets', name: 'Sockets', category: 'systems', blurb: 'The OS-level endpoint two processes use to exchange data over a network.', difficulty: 'intermediate', minutes: 6 },
  { id: 'systems-signals', name: 'Signals', category: 'systems', blurb: 'A small interrupt the OS sends a process to tell it something happened.', difficulty: 'intermediate', minutes: 5 },
  { id: 'systems-ipc', name: 'IPC', category: 'systems', blurb: 'Inter-process communication: ways for separate processes to exchange data.', difficulty: 'intermediate', minutes: 6 },
  { id: 'systems-caching', name: 'Caching', category: 'systems', blurb: 'Keeping a copy of expensive-to-compute data somewhere fast to fetch again.', difficulty: 'foundation', minutes: 5 },
  { id: 'systems-queues', name: 'Queues', category: 'systems', blurb: "A place work waits in line until something is free to process it.", difficulty: 'foundation', minutes: 5 },
  { id: 'systems-pub-sub', name: 'Pub/Sub', category: 'systems', blurb: "Publishers announce events; subscribers react, without knowing about each other.", difficulty: 'intermediate', minutes: 6 },
  { id: 'systems-load-balancing', name: 'Load Balancing', category: 'systems', blurb: 'Spreading incoming requests across multiple servers instead of one.', difficulty: 'foundation', minutes: 5 },
  { id: 'systems-horizontal-scaling', name: 'Horizontal Scaling', category: 'systems', blurb: 'Handling more load by adding more machines.', difficulty: 'foundation', minutes: 4 },
  { id: 'systems-vertical-scaling', name: 'Vertical Scaling', category: 'systems', blurb: 'Handling more load by making one machine bigger.', difficulty: 'foundation', minutes: 4 },

  // ── CLOUD & DEVOPS ──────────────────────────────────────────────────
  { id: 'cloud-devops-containers', name: 'Containers', category: 'cloud-devops', blurb: 'A lightweight, isolated package that runs an app the same way everywhere.', difficulty: 'foundation', minutes: 6 },
  { id: 'cloud-devops-images', name: 'Images', category: 'cloud-devops', blurb: 'The frozen, shareable snapshot a container is started from.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-dockerfile', name: 'Dockerfile', category: 'cloud-devops', blurb: 'The recipe that describes how to build a container image, step by step.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-registry', name: 'Registry', category: 'cloud-devops', blurb: 'Where built container images are stored and pulled from.', difficulty: 'foundation', minutes: 4 },
  { id: 'cloud-devops-reverse-proxy', name: 'Reverse Proxy', category: 'cloud-devops', blurb: 'A server that sits in front of your app and forwards requests to it.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-load-balancer', name: 'Load Balancer', category: 'cloud-devops', blurb: 'A dedicated layer that spreads traffic across many backend instances.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-cdn', name: 'CDN', category: 'cloud-devops', blurb: 'Servers spread around the world that cache your content close to users.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-dns', name: 'DNS', category: 'cloud-devops', blurb: 'How a domain name resolves to the servers actually running your app.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-secrets', name: 'Secrets', category: 'cloud-devops', blurb: 'Sensitive configuration — keys, passwords, tokens — kept out of code and version control.', difficulty: 'foundation', minutes: 5 },
  { id: 'cloud-devops-configuration', name: 'Configuration', category: 'cloud-devops', blurb: 'Everything that changes how a deployed service behaves without redeploying code.', difficulty: 'foundation', minutes: 4 },
  { id: 'cloud-devops-environment-variables', name: 'Environment Variables', category: 'cloud-devops', blurb: 'The most common way configuration and secrets reach a running container.', difficulty: 'foundation', minutes: 3 },
  { id: 'cloud-devops-health-checks', name: 'Health Checks', category: 'cloud-devops', blurb: 'A lightweight endpoint an orchestrator polls to know if an instance is alive.', difficulty: 'foundation', minutes: 4 },
  { id: 'cloud-devops-readiness', name: 'Readiness', category: 'cloud-devops', blurb: 'Whether an instance is currently able to accept traffic right now.', difficulty: 'intermediate', minutes: 5 },
  { id: 'cloud-devops-liveness', name: 'Liveness', category: 'cloud-devops', blurb: 'Whether an instance is still running at all, or needs to be restarted.', difficulty: 'intermediate', minutes: 5 },
  { id: 'cloud-devops-rolling-deployment', name: 'Rolling Deployment', category: 'cloud-devops', blurb: 'Replacing old instances with new ones a few at a time, with zero downtime.', difficulty: 'intermediate', minutes: 6 },
  { id: 'cloud-devops-blue-green-deployment', name: 'Blue-Green Deployment', category: 'cloud-devops', blurb: 'Running two full environments and switching traffic between them instantly.', difficulty: 'intermediate', minutes: 6 },
  { id: 'cloud-devops-canary-deployment', name: 'Canary Deployment', category: 'cloud-devops', blurb: 'Sending a small slice of traffic to a new version before trusting it with all of it.', difficulty: 'intermediate', minutes: 6 },
  { id: 'cloud-devops-infrastructure-as-code', name: 'Infrastructure as Code', category: 'cloud-devops', blurb: 'Defining servers and infrastructure in version-controlled files instead of clicking buttons.', difficulty: 'intermediate', minutes: 6 },

  // ── SECURITY ────────────────────────────────────────────────────────
  { id: 'security-hashing', name: 'Hashing', category: 'security', blurb: "Turning data into a fixed-size fingerprint you can't reverse back to the original.", difficulty: 'foundation', minutes: 5 },
  { id: 'security-encryption', name: 'Encryption', category: 'security', blurb: 'Scrambling data so only someone with the right key can read it — and reverse it.', difficulty: 'foundation', minutes: 5 },
  { id: 'security-symmetric-encryption', name: 'Symmetric Encryption', category: 'security', blurb: 'Encryption where the same key locks and unlocks the data.', difficulty: 'intermediate', minutes: 6 },
  { id: 'security-asymmetric-encryption', name: 'Asymmetric Encryption', category: 'security', blurb: 'Encryption using a public key to lock and a private key to unlock.', difficulty: 'intermediate', minutes: 7 },
  { id: 'security-tls', name: 'TLS', category: 'security', blurb: 'How your browser creates a secure connection to a server.', difficulty: 'foundation', minutes: 5 },
  { id: 'security-certificates', name: 'Certificates', category: 'security', blurb: "A signed document that proves a server's public key actually belongs to it.", difficulty: 'intermediate', minutes: 7 },
  { id: 'security-digital-signatures', name: 'Digital Signatures', category: 'security', blurb: "Proof that a message came from a specific sender and wasn't altered.", difficulty: 'intermediate', minutes: 7 },
  { id: 'security-hmac', name: 'HMAC', category: 'security', blurb: "A way to prove a message wasn't tampered with, using a shared secret key.", difficulty: 'intermediate', minutes: 6 },
  { id: 'security-nonce', name: 'Nonce', category: 'security', blurb: 'A number used once, to stop an old request from being replayed later.', difficulty: 'intermediate', minutes: 5 },
  { id: 'security-salt', name: 'Salt', category: 'security', blurb: 'Random data mixed into a password before hashing it, so identical passwords hash differently.', difficulty: 'foundation', minutes: 5 },
  { id: 'security-csrf', name: 'CSRF', category: 'security', blurb: 'Tricking a logged-in browser into submitting a request it never meant to send.', difficulty: 'intermediate', minutes: 7 },
  { id: 'security-xss', name: 'XSS', category: 'security', blurb: "Getting a browser to run attacker-controlled script inside someone else's page.", difficulty: 'intermediate', minutes: 7 },
  { id: 'security-sql-injection', name: 'SQL Injection', category: 'security', blurb: 'Smuggling database commands into an application through ordinary input fields.', difficulty: 'intermediate', minutes: 7 },
  { id: 'security-rate-limiting', name: 'Rate Limiting', category: 'security', blurb: 'Capping how many requests a client can make in a given window of time.', difficulty: 'foundation', minutes: 5 },
  { id: 'security-authentication', name: 'Authentication', category: 'security', blurb: 'Proving who you are.', difficulty: 'foundation', minutes: 4 },
  { id: 'security-authorization', name: 'Authorization', category: 'security', blurb: "Deciding what you're allowed to do, once we know who you are.", difficulty: 'foundation', minutes: 4 },
  { id: 'security-rbac', name: 'RBAC', category: 'security', blurb: 'Granting permissions based on the role a user holds, not the individual.', difficulty: 'intermediate', minutes: 5 },
  { id: 'security-oauth', name: 'OAuth', category: 'security', blurb: 'Letting one app access your data on another app, without ever seeing your password.', difficulty: 'intermediate', minutes: 8 },
  { id: 'security-oidc', name: 'OIDC', category: 'security', blurb: 'An identity layer built on top of OAuth, for proving who a user is.', difficulty: 'intermediate', minutes: 8 },
  { id: 'security-jwt', name: 'JWT', category: 'security', blurb: 'A compact, signed token that carries claims about a user from one place to another.', difficulty: 'intermediate', minutes: 6 },

  // ── AI ENGINEERING ──────────────────────────────────────────────────
  { id: 'ai-engineering-token', name: 'Token', category: 'ai-engineering', blurb: 'The small chunk of text — often a piece of a word — a model actually reads and writes.', difficulty: 'foundation', minutes: 5 },
  { id: 'ai-engineering-context-window', name: 'Context Window', category: 'ai-engineering', blurb: 'How much text a model can hold in view at once before it starts forgetting the rest.', difficulty: 'foundation', minutes: 5 },
  { id: 'ai-engineering-embedding', name: 'Embedding', category: 'ai-engineering', blurb: 'How text becomes numbers that machines can compare.', difficulty: 'foundation', minutes: 8 },
  { id: 'ai-engineering-vector-search', name: 'Vector Search', category: 'ai-engineering', blurb: 'Finding the nearest neighbors to a query in embedding space.', difficulty: 'intermediate', minutes: 7 },
  { id: 'ai-engineering-semantic-search', name: 'Semantic Search', category: 'ai-engineering', blurb: 'Search by meaning instead of exact keyword matches.', difficulty: 'foundation', minutes: 6 },
  { id: 'ai-engineering-rag', name: 'RAG', category: 'ai-engineering', blurb: 'Retrieving relevant documents and handing them to a model before it answers.', difficulty: 'intermediate', minutes: 8 },
  { id: 'ai-engineering-chunking', name: 'Chunking', category: 'ai-engineering', blurb: 'Splitting long documents into pieces small enough to embed and retrieve well.', difficulty: 'intermediate', minutes: 6 },
  { id: 'ai-engineering-retrieval', name: 'Retrieval', category: 'ai-engineering', blurb: 'The step that fetches the most relevant stored information for a given query.', difficulty: 'foundation', minutes: 5 },
  { id: 'ai-engineering-reranking', name: 'Reranking', category: 'ai-engineering', blurb: 'A second pass that reorders retrieved results by how relevant they really are.', difficulty: 'intermediate', minutes: 6 },
  { id: 'ai-engineering-prompt', name: 'Prompt', category: 'ai-engineering', blurb: 'The instructions and context you give a model before it generates a response.', difficulty: 'foundation', minutes: 4 },
  { id: 'ai-engineering-system-prompt', name: 'System Prompt', category: 'ai-engineering', blurb: 'The instructions set up front that quietly steer every response in a conversation.', difficulty: 'foundation', minutes: 5 },
  { id: 'ai-engineering-tool-calling', name: 'Tool Calling', category: 'ai-engineering', blurb: "Letting a model request that your code run a specific function on its behalf.", difficulty: 'intermediate', minutes: 7 },
  { id: 'ai-engineering-function-calling', name: 'Function Calling', category: 'ai-engineering', blurb: 'A structured way for a model to describe exactly which function to call, with what arguments.', difficulty: 'intermediate', minutes: 7 },
  { id: 'ai-engineering-agents', name: 'Agents', category: 'ai-engineering', blurb: 'A model that can plan, call tools, and act across multiple steps toward a goal.', difficulty: 'intermediate', minutes: 8 },
  { id: 'ai-engineering-memory', name: 'Memory', category: 'ai-engineering', blurb: 'Letting a model retain information across turns or sessions instead of starting fresh each time.', difficulty: 'intermediate', minutes: 6 },
  { id: 'ai-engineering-inference', name: 'Inference', category: 'ai-engineering', blurb: 'Running a trained model to produce an output for a new input.', difficulty: 'foundation', minutes: 4 },
  { id: 'ai-engineering-temperature', name: 'Temperature', category: 'ai-engineering', blurb: "A setting that controls how random or predictable a model's output is.", difficulty: 'foundation', minutes: 4 },
  { id: 'ai-engineering-top-p', name: 'Top-P', category: 'ai-engineering', blurb: 'Sampling only from the smallest set of likely next tokens whose probability adds up to P.', difficulty: 'advanced', minutes: 7 },
  { id: 'ai-engineering-structured-output', name: 'Structured Output', category: 'ai-engineering', blurb: "Forcing a model's response into a specific, parseable shape like JSON.", difficulty: 'intermediate', minutes: 6 },
  { id: 'ai-engineering-guardrails', name: 'Guardrails', category: 'ai-engineering', blurb: "Rules and checks that catch or block a model's response before it reaches the user.", difficulty: 'intermediate', minutes: 6 },
  { id: 'ai-engineering-hallucination', name: 'Hallucination', category: 'ai-engineering', blurb: 'A model stating something false with the same confidence as something true.', difficulty: 'foundation', minutes: 5 },
  { id: 'ai-engineering-evaluation', name: 'Evaluation', category: 'ai-engineering', blurb: "Systematically measuring whether a model's outputs are actually good.", difficulty: 'intermediate', minutes: 7 },
  { id: 'ai-engineering-mcp', name: 'MCP', category: 'ai-engineering', blurb: 'An open protocol that lets a model discover and call tools from any compliant server.', difficulty: 'intermediate', minutes: 7 },
  { id: 'ai-engineering-context-engineering', name: 'Context Engineering', category: 'ai-engineering', blurb: 'Deliberately shaping what information a model sees, not just what you ask it.', difficulty: 'intermediate', minutes: 7 },

  // ── MACHINE LEARNING ────────────────────────────────────────────────
  { id: 'machine-learning-feature', name: 'Feature', category: 'machine-learning', blurb: 'A single measurable input a model uses to make a prediction.', difficulty: 'foundation', minutes: 4 },
  { id: 'machine-learning-label', name: 'Label', category: 'machine-learning', blurb: 'The correct answer a supervised model is trained to predict.', difficulty: 'foundation', minutes: 3 },
  { id: 'machine-learning-dataset', name: 'Dataset', category: 'machine-learning', blurb: 'The collection of examples a model learns from and is tested against.', difficulty: 'foundation', minutes: 4 },
  { id: 'machine-learning-training', name: 'Training', category: 'machine-learning', blurb: "The process of adjusting a model's parameters so its predictions get better.", difficulty: 'foundation', minutes: 6 },
  { id: 'machine-learning-validation', name: 'Validation', category: 'machine-learning', blurb: "Data set aside during training to check the model isn't just memorizing.", difficulty: 'foundation', minutes: 5 },
  { id: 'machine-learning-test-set', name: 'Test Set', category: 'machine-learning', blurb: 'Data the model never sees until the very end, used for a final honest score.', difficulty: 'foundation', minutes: 5 },
  { id: 'machine-learning-inference', name: 'Inference', category: 'machine-learning', blurb: 'Using an already-trained model to make a prediction on new data.', difficulty: 'foundation', minutes: 4 },
  { id: 'machine-learning-model', name: 'Model', category: 'machine-learning', blurb: 'The function, with learned parameters, that turns an input into a prediction.', difficulty: 'foundation', minutes: 4 },
  { id: 'machine-learning-parameter', name: 'Parameter', category: 'machine-learning', blurb: 'A value inside the model that training adjusts to improve predictions.', difficulty: 'foundation', minutes: 5 },
  { id: 'machine-learning-hyperparameter', name: 'Hyperparameter', category: 'machine-learning', blurb: 'A setting you choose before training starts, like learning rate or batch size.', difficulty: 'intermediate', minutes: 6 },
  { id: 'machine-learning-loss-function', name: 'Loss Function', category: 'machine-learning', blurb: 'The score that tells training how wrong a prediction currently is.', difficulty: 'intermediate', minutes: 6 },
  { id: 'machine-learning-gradient', name: 'Gradient', category: 'machine-learning', blurb: 'The direction and size of the step that would most reduce the loss.', difficulty: 'advanced', minutes: 7 },
  { id: 'machine-learning-gradient-descent', name: 'Gradient Descent', category: 'machine-learning', blurb: 'Repeatedly nudging parameters in the direction that reduces the loss.', difficulty: 'advanced', minutes: 8 },
  { id: 'machine-learning-overfitting', name: 'Overfitting', category: 'machine-learning', blurb: 'A model that learned the training data too well, including its noise.', difficulty: 'foundation', minutes: 6 },
  { id: 'machine-learning-underfitting', name: 'Underfitting', category: 'machine-learning', blurb: 'A model too simple to capture the real pattern, even in training data.', difficulty: 'foundation', minutes: 5 },
  { id: 'machine-learning-bias', name: 'Bias', category: 'machine-learning', blurb: "Error from a model's assumptions being too simple for the real pattern.", difficulty: 'intermediate', minutes: 6 },
  { id: 'machine-learning-variance', name: 'Variance', category: 'machine-learning', blurb: 'Error from a model being too sensitive to the specific data it was trained on.', difficulty: 'intermediate', minutes: 6 },
  { id: 'machine-learning-classification', name: 'Classification', category: 'machine-learning', blurb: 'Predicting which category something belongs to.', difficulty: 'foundation', minutes: 4 },
  { id: 'machine-learning-regression', name: 'Regression', category: 'machine-learning', blurb: 'Predicting a continuous number instead of a category.', difficulty: 'foundation', minutes: 4 },
  { id: 'machine-learning-clustering', name: 'Clustering', category: 'machine-learning', blurb: 'Grouping similar examples together without being told the groups in advance.', difficulty: 'foundation', minutes: 5 },
  { id: 'machine-learning-embedding', name: 'Embedding', category: 'machine-learning', blurb: 'How raw data becomes numeric vectors a model can compare and reason over.', difficulty: 'foundation', minutes: 8 },
  { id: 'machine-learning-distance', name: 'Distance', category: 'machine-learning', blurb: 'A measurement of how similar or different two vectors are.', difficulty: 'foundation', minutes: 5 },
  { id: 'machine-learning-decision-boundary', name: 'Decision Boundary', category: 'machine-learning', blurb: 'The line (or surface) a model draws to separate one class from another.', difficulty: 'intermediate', minutes: 6 },
];
