export interface HttpVersionInfo {
  version: string;
  year: string;
  title: string;
  description: string;
  problem: string;
}

export const httpVersions: HttpVersionInfo[] = [
  {
    version: 'HTTP/0.9',
    year: '~1991',
    title: 'One line, one document',
    description: 'A single-line request for a document, with no headers, no status codes and no metadata at all.',
    problem: 'No way to describe what was being sent, negotiate formats, or send anything but plain HTML.',
  },
  {
    version: 'HTTP/1.0',
    year: '1996',
    title: 'Headers arrive',
    description: 'Introduced headers, status codes, and richer responses — but a new TCP connection was opened for every single request.',
    problem: 'Opening a fresh connection per request is expensive — every request pays a connection-setup cost.',
  },
  {
    version: 'HTTP/1.1',
    year: '1997',
    title: 'Connections stick around',
    description: 'Made persistent connections the default, added chunked transfer coding, host-based virtual hosting, and richer caching semantics.',
    problem: 'Requests on one connection are still processed one-at-a-time in order — a slow response blocks every request queued behind it. This bottleneck is called head-of-line blocking: one stuck item stalls the whole line.',
  },
  {
    version: 'HTTP/2',
    year: '2015',
    title: 'One connection, many streams',
    description: 'A binary framing layer lets many requests and responses multiplex over a single connection, with header compression to cut overhead.',
    problem: 'Still runs over TCP — a single lost packet stalls every multiplexed stream on that connection, not just one request.',
  },
  {
    version: 'HTTP/3',
    year: '2022',
    title: 'A transport built for this',
    description: 'Carries HTTP semantics over QUIC, a transport protocol built on UDP, so one lost packet no longer blocks unrelated streams.',
    problem: '',
  },
];
