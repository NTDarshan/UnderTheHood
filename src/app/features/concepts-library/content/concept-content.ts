export interface ConceptHowStep {
  label: string;
  detail: string;
}

export interface ConceptConnection {
  id: string;
  label: string;
}

/**
 * The full authored "deep dive" for a concept. Only concepts with an entry
 * here get the rich detail experience — everything else in the library
 * falls back to the coming-soon template. Filled in one concept at a time.
 */
export interface ConceptFullContent {
  id: string;
  hook: string;
  whatIsIt: string;
  whyIntroduced: string;
  howItWorks: ConceptHowStep[];
  whereUsed: string[];
  commonMistake: string;
  mentalModel: string;
  remember: string[];
  connected: ConceptConnection[];
}

export const CONCEPT_CONTENT: Record<string, ConceptFullContent> = {
  'backend-tls-ssl': {
    id: 'backend-tls-ssl',
    hook: 'Think of TLS as a sealed, tamper-evident tunnel between your browser and a server — anyone watching the network can see that a connection exists, but not one byte of what travels through it.',
    whatIsIt:
      "TLS — Transport Layer Security, the modern name for what used to be called SSL — is a protocol that sits between your data and the raw network connection. Before your browser sends anything to a server, TLS wraps it in encryption, so a connection that's intercepted in between shows only scrambled bytes, never the actual request.",
    whyIntroduced:
      "Early HTTP sent everything as plain, human-readable text: URLs, form fields, passwords, session cookies. Anyone with access to a network the traffic crossed — shared Wi-Fi, a compromised router, an ISP — could simply read it as it went by. SSL, introduced by Netscape in 1995 and later standardized as TLS, closed that gap by encrypting the connection itself, so the content stays unreadable in transit even if every packet is captured.",
    howItWorks: [
      { label: 'Browser', detail: 'Starts a connection and sends "ClientHello" — the TLS versions and cipher suites it supports, plus a random value.' },
      { label: '"Hello Server"', detail: 'The opening handshake message. Nothing sensitive has been sent yet — this is still in the clear.' },
      { label: 'Server', detail: 'Picks a cipher suite both sides support and responds.' },
      { label: 'Certificate', detail: "The server sends a certificate proving its identity, signed by a Certificate Authority the browser already trusts." },
      { label: 'Key Exchange', detail: 'Browser and server derive a shared secret together, without ever sending that secret itself over the wire.' },
      { label: 'Encrypted Connection', detail: 'Both sides now hold the same session key and switch to fast symmetric encryption for everything else.' },
      { label: 'Secure Communication', detail: 'Every request and response from this point on is encrypted with that session key, until the connection closes.' },
    ],
    whereUsed: ['HTTPS', 'REST & GraphQL APIs', 'Mobile app backends', 'Service-to-service traffic (mTLS)', 'SMTPS / IMAPS email', 'VPN tunnels'],
    commonMistake:
      "Assuming TLS protects data everywhere. It only protects data while it's actually moving between two points. The instant it lands in a database, a log file, or a cache, TLS no longer applies — that's a separate concern, encryption at rest.",
    mentalModel: 'A sealed envelope for your network traffic: an observer can see one was sent, and roughly when and how big — but never what was written inside.',
    remember: [
      'TLS provides encryption in transit — it protects data while it moves, not once it’s stored.',
      "Certificates establish server identity — encryption alone doesn't prove who you're talking to; a CA-signed certificate does.",
      'HTTPS = HTTP over TLS — the same HTTP semantics, just carried inside an encrypted tunnel.',
    ],
    connected: [
      { id: 'backend-tcp', label: 'TCP' },
      { id: 'security-certificates', label: 'Certificates' },
      { id: 'security-encryption', label: 'Encryption' },
      { id: 'security-asymmetric-encryption', label: 'Asymmetric Encryption' },
      { id: 'security-digital-signatures', label: 'Digital Signatures' },
    ],
  },
};
