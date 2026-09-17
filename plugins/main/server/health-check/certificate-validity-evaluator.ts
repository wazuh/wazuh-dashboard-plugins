import type {
  ServerCertificate,
  CertificateValidityOutcome,
  CertificateValiditySnapshot,
} from '../../../wazuh-core/common/certificate-validity';

const SECONDS_PER_DAY = 24 * 60 * 60;

export type Severity = 'ok' | 'warning' | 'critical' | 'unknown';

export type FindingReason =
  | 'expiring'
  | 'expired'
  | 'ca-mismatch'
  | 'undetermined';

export interface CertificateFinding {
  node: string;
  severity: Exclude<Severity, 'ok'>;
  scope: 'listener' | 'ca' | 'node';
  reason: FindingReason;
  subject?: string;
  notAfter?: string;
  secondsUntilExpiry?: number;
  daysRemaining?: number;
  detail: string;
}

export interface CertificateEvaluation {
  severity: Severity;
  findings: CertificateFinding[];
  nodesEvaluated: number;
  nodesUndetermined: string[];
  oldestEvaluatedAt?: string;
}

export interface EvaluationOptions {
  now: number;
  warningSeconds: number;
  criticalSeconds: number;
}

/** `unknown` ranks highest: an undetermined state never aggregates to healthy. */
const SEVERITY_ORDER: Record<Severity, number> = {
  ok: 0,
  warning: 1,
  critical: 2,
  unknown: 3,
};

const worst = (a: Severity, b: Severity): Severity =>
  SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;

const describeScope = (scope: CertificateFinding['scope']) =>
  scope === 'listener' ? 'listener certificate' : 'CA certificate';

function expirySeverity(
  secondsUntilExpiry: number,
  { warningSeconds, criticalSeconds }: EvaluationOptions,
): Severity {
  if (secondsUntilExpiry <= criticalSeconds) {
    return 'critical';
  }

  if (secondsUntilExpiry <= warningSeconds) {
    return 'warning';
  }

  return 'ok';
}

function expiryFinding(
  node: string,
  scope: 'listener' | 'ca',
  certificate: ServerCertificate,
  options: EvaluationOptions,
): CertificateFinding | null {
  const { seconds_until_expiry: secondsUntilExpiry } = certificate;
  const severity = expirySeverity(secondsUntilExpiry, options);

  if (severity === 'ok') {
    return null;
  }

  const expired = secondsUntilExpiry <= 0;
  const daysRemaining = Math.floor(secondsUntilExpiry / SECONDS_PER_DAY);
  const subject = certificate.subject;

  return {
    node,
    severity: expired ? 'critical' : (severity as 'warning' | 'critical'),
    scope,
    reason: expired ? 'expired' : 'expiring',
    subject,
    notAfter: certificate.not_after,
    secondsUntilExpiry,
    daysRemaining,
    detail: expired
      ? `The ${describeScope(scope)} ${subject} on node ${node} expired on ${
          certificate.not_after
        }.`
      : `The ${describeScope(
          scope,
        )} ${subject} on node ${node} expires in ${daysRemaining} day(s), on ${
          certificate.not_after
        }.`,
  };
}

function mismatchFinding(
  node: string,
  snapshot: CertificateValiditySnapshot,
): CertificateFinding | null {
  const certificates = snapshot.ca_bundle.certificates;

  if (certificates.some(candidate => candidate.signs_active_leaf === true)) {
    return null;
  }

  return {
    node,
    severity: 'critical',
    scope: 'ca',
    reason: 'ca-mismatch',
    detail: `No CA in the bundle on node ${node} signs the certificate the listener is serving. Agents validating against this bundle will be rejected.`,
  };
}

function undeterminedFinding(
  outcome: Exclude<CertificateValidityOutcome, { kind: 'ok' }>,
): CertificateFinding {
  const node = outcome.node;
  const detail = {
    notFound: `Node ${node} does not expose the certificate validity resource, so its certificate state could not be determined.`,
    forbidden: `The dashboard does not have permission to read the certificate state of node ${node}.`,
    unavailable: `Node ${node} could not report its certificate state: ${
      (outcome as { reason?: string }).reason
    }.`,
    malformed: `Node ${node} returned an unexpected certificate validity response, so its state could not be determined.`,
    transportError: `Node ${node} could not be reached, so its certificate state could not be determined.`,
  }[outcome.kind];

  return {
    node,
    severity: 'unknown',
    scope: 'node',
    reason: 'undetermined',
    detail,
  };
}

function evaluateSnapshot(
  snapshot: CertificateValiditySnapshot,
  options: EvaluationOptions,
): CertificateFinding[] {
  const node = snapshot.node;
  const findings = [
    expiryFinding(node, 'listener', snapshot.listener, options),
    mismatchFinding(node, snapshot),
    ...snapshot.ca_bundle.certificates.map(certificate =>
      expiryFinding(node, 'ca', certificate, options),
    ),
  ];

  return findings.filter(
    (finding): finding is CertificateFinding => finding !== null,
  );
}

export function evaluateCertificateValidity(
  outcomes: CertificateValidityOutcome[],
  options: EvaluationOptions,
): CertificateEvaluation {
  if (outcomes.length === 0) {
    return {
      severity: 'unknown',
      findings: [
        {
          node: '-',
          severity: 'unknown',
          scope: 'node',
          reason: 'undetermined',
          detail:
            'No manager node reported a certificate state, so nothing could be determined.',
        },
      ],
      nodesEvaluated: 0,
      nodesUndetermined: [],
    };
  }

  const findings: CertificateFinding[] = [];
  const nodesUndetermined: string[] = [];
  const evaluatedAt: string[] = [];

  for (const outcome of outcomes) {
    if (outcome.kind === 'ok') {
      evaluatedAt.push(outcome.snapshot.evaluated_at);
      findings.push(...evaluateSnapshot(outcome.snapshot, options));
    } else {
      nodesUndetermined.push(outcome.node);
      findings.push(undeterminedFinding(outcome));
    }
  }

  const severity = findings.reduce<Severity>(
    (accumulator, finding) => worst(accumulator, finding.severity),
    'ok',
  );

  return {
    severity,
    findings,
    nodesEvaluated: outcomes.length,
    nodesUndetermined,
    oldestEvaluatedAt: evaluatedAt.sort()[0],
  };
}
