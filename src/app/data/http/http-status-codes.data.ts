export interface HttpStatusCode {
  code: number;
  label: string;
  description: string;
}

export interface HttpStatusClass {
  range: string;
  name: string;
  meaning: string;
  codes: HttpStatusCode[];
}

export const httpStatusClasses: HttpStatusClass[] = [
  {
    range: '1xx',
    name: 'Informational',
    meaning: 'The request was received and understood; processing continues.',
    codes: [
      { code: 100, label: 'Continue', description: 'The client should continue sending the request body.' },
    ],
  },
  {
    range: '2xx',
    name: 'Success',
    meaning: 'The request was successfully received, understood and accepted.',
    codes: [
      { code: 200, label: 'OK', description: 'The request succeeded, and a representation is returned.' },
      { code: 201, label: 'Created', description: 'The request succeeded and a new resource was created.' },
      { code: 204, label: 'No Content', description: 'The request succeeded, but there is no response body to send.' },
    ],
  },
  {
    range: '3xx',
    name: 'Redirection',
    meaning: 'Further action is needed to complete the request, usually at a different URL.',
    codes: [
      { code: 301, label: 'Moved Permanently', description: 'The resource now has a new permanent URL.' },
      { code: 302, label: 'Found', description: 'A temporary redirect to a different URL.' },
      { code: 304, label: 'Not Modified', description: 'The cached representation is still valid — no body is sent.' },
      { code: 307, label: 'Temporary Redirect', description: 'Temporary redirect that preserves the original method and body.' },
      { code: 308, label: 'Permanent Redirect', description: 'Permanent redirect that preserves the original method and body.' },
    ],
  },
  {
    range: '4xx',
    name: 'Client Error',
    meaning: 'The request contains bad syntax or cannot be fulfilled by the client.',
    codes: [
      { code: 400, label: 'Bad Request', description: 'The server could not understand the request due to malformed syntax.' },
      { code: 401, label: 'Unauthorized', description: 'Authentication is required or the supplied credentials are invalid.' },
      { code: 403, label: 'Forbidden', description: 'The server understood the request but refuses to authorize it.' },
      { code: 404, label: 'Not Found', description: 'The server found no resource matching the request target.' },
      { code: 405, label: 'Method Not Allowed', description: 'The method is not supported for this resource.' },
      { code: 409, label: 'Conflict', description: 'The request conflicts with the current state of the resource.' },
      { code: 415, label: 'Unsupported Media Type', description: 'The request body’s format is not supported.' },
      { code: 422, label: 'Unprocessable Content', description: 'The syntax is correct, but the semantics are invalid.' },
      { code: 429, label: 'Too Many Requests', description: 'The client has sent too many requests in a given time.' },
    ],
  },
  {
    range: '5xx',
    name: 'Server Error',
    meaning: 'The server failed to fulfil a request that was apparently valid.',
    codes: [
      { code: 500, label: 'Internal Server Error', description: 'An unexpected condition prevented the server from fulfilling the request.' },
      { code: 502, label: 'Bad Gateway', description: 'A gateway/proxy received an invalid response from an upstream server.' },
      { code: 503, label: 'Service Unavailable', description: 'The server is temporarily unable to handle the request.' },
      { code: 504, label: 'Gateway Timeout', description: 'A gateway/proxy did not receive a timely response from upstream.' },
    ],
  },
];
