export type HeaderCategory = 'general' | 'request' | 'response' | 'representation';

export interface HttpHeaderInfo {
  name: string;
  category: HeaderCategory;
  example: string;
  description: string;
}

export const headerCategoryInfo: Record<HeaderCategory, { label: string; blurb: string }> = {
  general: {
    label: 'General',
    blurb: 'Apply to the message as a whole — not tied to the request, the response, or the body specifically.',
  },
  request: {
    label: 'Request',
    blurb: "Sent by the client to describe who's asking, what they'll accept, and how to identify them.",
  },
  response: {
    label: 'Response',
    blurb: 'Sent by the server to describe what it did and how the client should treat the result.',
  },
  representation: {
    label: 'Representation',
    blurb: 'Describe the actual body being sent — its format, size, and encoding — on either a request or a response.',
  },
};

export const httpHeaders: HttpHeaderInfo[] = [
  { name: 'Host', category: 'request', example: 'Host: api.example.com', description: "Which domain the request is for — required on every HTTP/1.1 request, since one server can host many domains." },
  { name: 'Accept', category: 'request', example: 'Accept: application/json', description: 'What representation formats the client is willing to receive back.' },
  { name: 'Accept-Language', category: 'request', example: 'Accept-Language: en-US', description: "The client's preferred language(s) for the response." },
  { name: 'Accept-Encoding', category: 'request', example: 'Accept-Encoding: br, gzip', description: 'Which compression algorithms the client can decode.' },
  { name: 'Authorization', category: 'request', example: 'Authorization: Bearer <token>', description: 'Credentials proving who the client is.' },
  { name: 'User-Agent', category: 'request', example: 'User-Agent: Mozilla/5.0 ...', description: 'Identifies the client software making the request — a browser, a script, a mobile app.' },
  { name: 'Location', category: 'response', example: 'Location: /orders/42', description: 'Where to go next — the new resource on a 201, or the redirect target on a 3xx.' },
  { name: 'ETag', category: 'response', example: 'ETag: "abc123"', description: 'A version identifier for this exact representation, used for cache validation.' },
  { name: 'Set-Cookie', category: 'response', example: 'Set-Cookie: session=xyz; HttpOnly', description: 'Asks the client to store a small piece of state and send it back on future requests.' },
  { name: 'Cache-Control', category: 'general', example: 'Cache-Control: max-age=30', description: 'Caching rules — how long a response stays fresh, and who is allowed to store it.' },
  { name: 'Connection', category: 'general', example: 'Connection: keep-alive', description: "Controls whether the underlying connection should stay open for reuse after this message." },
  { name: 'Content-Type', category: 'representation', example: 'Content-Type: application/json', description: 'The media type of the body — how to parse the bytes that follow.' },
  { name: 'Content-Length', category: 'representation', example: 'Content-Length: 128', description: 'The size of the body in bytes, so the receiver knows when it has all of it.' },
  { name: 'Content-Encoding', category: 'representation', example: 'Content-Encoding: br', description: 'Which compression, if any, was applied to the body.' },
];
