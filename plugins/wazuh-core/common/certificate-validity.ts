/** One X.509 certificate: the listener leaf, or an entry of the CA bundle. */
export interface ServerCertificate {
  subject: string;
  issuer: string;
  not_before: string;
  not_after: string;
  not_after_ts: number;
  /** Signed: goes negative once the certificate expires. */
  seconds_until_expiry: number;
  fingerprint: string;
  serial: string;
  /** CA bundle entries only: whether this CA signs the certificate the listener currently serves. */
  signs_active_leaf?: boolean;
  /** Listener leaf only. */
  sans?: string[];
  /** Listener leaf only. */
  path?: string;
}

export interface ServerCaBundle {
  path: string;
  publication: number;
  publication_vouched: boolean;
  content_sha256: string;
  certificates_count: number;
  serialized_bytes: number;
  serialized_bytes_limit: number;
  certificates: ServerCertificate[];
}

export interface CertificateValiditySnapshot {
  node: string;
  /**
   * The manager keeps the listener leaf until it restarts, so this can lag by
   * `certificateStatusInterval`, 24 h by default.
   */
  evaluated_at: string;
  evaluated_at_ts: number;
  listener: ServerCertificate;
  ca_bundle: ServerCaBundle;
}

export type CertificateValidityOutcome =
  | { kind: 'ok'; node: string; snapshot: CertificateValiditySnapshot }
  /** The manager does not expose the resource yet. */
  | { kind: 'notFound'; node: string }
  /** The API user lacks `cluster:read` on this node. */
  | { kind: 'forbidden'; node: string }
  /** The manager answered and told us it could not reach remoted. */
  | { kind: 'unavailable'; node: string; reason: string }
  /** The manager answered with a body we do not recognise. */
  | { kind: 'malformed'; node: string; detail: string }
  /** The request never reached the manager. */
  | { kind: 'transportError'; node: string; code?: string; message: string };
