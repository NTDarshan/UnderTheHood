import { LearningTopic, RoadmapCategory } from './roadmap.model';

/**
 * Single source of truth for the learning roadmap. Flip a topic's `status`
 * from 'coming-soon' to 'interactive' as its visualization ships — no
 * component changes required.
 */
export const roadmapData: RoadmapCategory[] = [
  {
    id: 'foundation',
    index: '01',
    title: 'Foundation',
    description: 'What actually happens between a client and a server.',
    topics: [
      { id: 'http-protocol', title: 'HTTP Protocol', description: 'The request/response cycle underneath every API call.', status: 'coming-soon', visualizationType: 'http' },
      { id: 'routing', title: 'Routing', description: 'How a URL resolves to the code that handles it.', status: 'coming-soon' },
      { id: 'serialization', title: 'Serialization & Deserialization', description: 'Turning objects into bytes and back again.', status: 'coming-soon' },
      { id: 'auth', title: 'Authentication & Authorization', description: 'Proving who you are, then what you are allowed to do.', status: 'coming-soon' },
      { id: 'validation', title: 'Validation & Transformation', description: 'Shaping untrusted input into something safe to use.', status: 'coming-soon' },
      { id: 'middleware', title: 'Middleware', description: 'The pipeline a request travels through before it is handled.', status: 'coming-soon', visualizationType: 'middleware' },
      { id: 'request-context', title: 'Request Context', description: 'State that travels with a request through its lifetime.', status: 'coming-soon' },
      { id: 'handlers-controllers-services', title: 'Handlers, Controllers & Services', description: 'Where responsibility actually lives in a backend app.', status: 'coming-soon' },
      { id: 'crud', title: 'CRUD', description: 'The four operations underneath almost every feature.', status: 'coming-soon' },
      { id: 'rest', title: 'RESTful Architecture & Best Practices', description: 'Why REST looks the way it does, not just how to use it.', status: 'coming-soon' },
    ],
  },
  {
    id: 'data-application',
    index: '02',
    title: 'Data & Application Layer',
    description: 'Where state lives, and how it moves.',
    topics: [
      { id: 'databases', title: 'Databases', description: 'Storage engines, indexes and query execution underneath.', status: 'coming-soon', visualizationType: 'database' },
      { id: 'business-logic', title: 'Business Logic Layer', description: 'Keeping the rules of the domain in one honest place.', status: 'coming-soon' },
      { id: 'caching', title: 'Caching', description: 'Trading correctness risk for speed, on purpose.', status: 'coming-soon' },
      { id: 'transactional-emails', title: 'Transactional Emails', description: 'What triggers a send, and what can go wrong.', status: 'coming-soon' },
      { id: 'task-queuing', title: 'Task Queuing & Scheduling', description: 'Doing work later, reliably, without blocking a request.', status: 'coming-soon' },
      { id: 'elasticsearch', title: 'Elasticsearch', description: 'Search that a relational index was never built for.', status: 'coming-soon' },
    ],
  },
  {
    id: 'production-backend',
    index: '03',
    title: 'Production Backend',
    description: 'What it takes to keep a system alive under real traffic.',
    topics: [
      { id: 'error-handling', title: 'Error Handling', description: 'Failing in a way that is diagnosable, not just caught.', status: 'coming-soon' },
      { id: 'configuration', title: 'Configuration Management', description: 'The same code, behaving correctly across environments.', status: 'coming-soon' },
      { id: 'observability', title: 'Logging, Monitoring & Observability', description: 'Knowing what your system is doing without guessing.', status: 'coming-soon' },
      { id: 'graceful-shutdown', title: 'Graceful Shutdown', description: 'Stopping a process without dropping work in flight.', status: 'coming-soon' },
      { id: 'security', title: 'Security', description: 'The threats a backend has to assume by default.', status: 'coming-soon' },
      { id: 'scaling', title: 'Scaling & Performance', description: 'What actually breaks first, and why.', status: 'coming-soon' },
      { id: 'concurrency', title: 'Concurrency & Parallelism', description: 'Doing many things at once versus doing them together.', status: 'coming-soon', visualizationType: 'concurrency' },
      { id: 'object-storage', title: 'Object Storage & Large Files', description: 'Why big files don’t belong in a database row.', status: 'coming-soon' },
      { id: 'realtime', title: 'Real-time Backend Systems', description: 'Pushing state to clients instead of waiting to be asked.', status: 'coming-soon' },
      { id: 'testing', title: 'Testing & Code Quality', description: 'Confidence that the system does what you think it does.', status: 'coming-soon' },
    ],
  },
  {
    id: 'engineering-practices',
    index: '04',
    title: 'Engineering Practices',
    description: 'The habits that separate a project from a product.',
    topics: [
      { id: 'twelve-factor', title: '12-Factor Applications', description: 'A checklist for backends that survive contact with production.', status: 'coming-soon' },
      { id: 'openapi', title: 'OpenAPI Standards', description: 'Describing an API so both humans and machines can trust it.', status: 'coming-soon' },
      { id: 'webhooks', title: 'Webhooks', description: 'Letting other systems tell you when something happened.', status: 'coming-soon' },
      { id: 'devops', title: 'DevOps for Backend Engineers', description: 'Everything past `git push` that makes code someone’s reality.', status: 'coming-soon' },
    ],
  },
];

export const featuredPreviewIds = ['http-protocol', 'middleware', 'databases', 'concurrency'];

export const featuredPreviews: LearningTopic[] = roadmapData
  .flatMap((category) => category.topics)
  .filter((topic) => featuredPreviewIds.includes(topic.id));
