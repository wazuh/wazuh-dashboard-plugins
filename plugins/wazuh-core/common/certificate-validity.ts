/** One X.509 certificate: the listener leaf, or an entry of the CA bundle. */
export interface ServerCertificate {
  subject: string;
  issuer: string;
  not_before: string;
  not_before_ts: number;
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
  /** Listener leaf only: when the manager loaded it, which is its last start. */
  loaded_at?: string;
  loaded_at_ts?: number;
}

/** Present only while the manager cannot read the bundle file. */
export interface CaBundleReadFailure {
  cause: string;
  errno?: number;
  consecutive: number;
}

export interface ServerCaBundle {
  path: string;
  /** `null` without a servable bundle, `0` served but unvouched. */
  publication: number | null;
  publication_vouched: boolean;
  content_sha256: string;
  certificates_count: number;
  certificates_limit: number;
  serialized_bytes: number;
  serialized_bytes_limit: number;
  /**
   * Whether some CA in the bundle signs the certificate the listener serves.
   * `null` for a bundle the manager could not read, which is not the same as
   * no CA signing it.
   */
  matches_active_leaf?: boolean | null;
  /**
   * Whether the listener certificate validates with this bundle as its only
   * trust store: dates and constraints included, unlike `signs_active_leaf`.
   * `null` when there is nothing to validate against.
   */
  chain_valid: boolean | null;
  /** Present only when `chain_valid` is false. */
  chain_error?: string;
  /**
   * The certificates, sizes and hash beside this describe the last good read.
   * A bundle that never read shows a count of 0 and this failure together.
   */
  last_read_failure?: CaBundleReadFailure;
  certificates: ServerCertificate[];
}

/** One node's certificate snapshot. */
export interface CertificateValiditySnapshot {
  node: string;
  available: true;
  /**
   * The manager keeps the listener leaf until it restarts, so this can lag by
   * `certificateStatusInterval`, 24 h by default.
   */
  evaluated_at: string;
  evaluated_at_ts: number;
  listener: ServerCertificate;
  ca_bundle: ServerCaBundle;
}

/** The manager answers this instead when the node cannot describe its certificates. */
export interface CertificateValidityUnavailable {
  node: string;
  available: false;
  reason: string;
}

export type CertificateValidityOutcome =
  | { kind: 'ok'; node: string; snapshot: CertificateValiditySnapshot }
  /** The manager does not expose the resource yet. */
  | { kind: 'notFound'; node: string }
  /** The API user lacks `cluster:read` on this node. */
  | { kind: 'forbidden'; node: string }
  /** The manager answered and told us the node could not describe its certificates. */
  | { kind: 'unavailable'; node: string; reason: string }
  /** The manager answered with a body we do not recognise. */
  | { kind: 'malformed'; node: string; detail: string }
  /** The request never reached the manager. */
  | { kind: 'transportError'; node: string; code?: string; message: string };
