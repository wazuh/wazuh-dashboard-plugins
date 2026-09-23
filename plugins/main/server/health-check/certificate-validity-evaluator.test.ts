/* eslint-disable camelcase -- the Wazuh Server API reports these fields in snake_case */
import type {
  ServerCertificate,
  CertificateValidityOutcome,
  CertificateValiditySnapshot,
} from '../../../wazuh-core/common/certificate-validity';
import { evaluateCertificateValidity } from './certificate-validity-evaluator';

const DAY = 24 * 60 * 60;
const NOW = 1_789_423_200;
const OPTIONS = {
  now: NOW,
  warningSeconds: 30 * DAY,
  criticalSeconds: 7 * DAY,
};

const certificate = (
  overrides: Partial<ServerCertificate> = {},
): ServerCertificate => ({
  subject: 'CN=Corp Root CA',
  issuer: 'CN=Corp Root CA',
  not_before: '2026-01-01T00:00:00Z',
  not_before_ts: 1_767_225_600,
  not_after: '2036-01-01T00:00:00Z',
  not_after_ts: 2_082_758_400,
  seconds_until_expiry: 3650 * DAY,
  fingerprint: 'x509-sha256:bb',
  serial: '0x00',
  signs_active_leaf: true,
  ...overrides,
});

const snapshot = (
  overrides: {
    node?: string;
    listener?: Partial<ServerCertificate>;
    certificates?: ServerCertificate[];
    caBundle?: Partial<CertificateValiditySnapshot['ca_bundle']>;
  } = {},
): CertificateValiditySnapshot => ({
  node: overrides.node ?? 'node01',
  available: true,
  evaluated_at: '2026-09-15T10:00:00Z',
  evaluated_at_ts: NOW - 3600,
  listener: certificate({
    subject: 'CN=manager-01',
    signs_active_leaf: undefined,
    sans: ['manager-01.example.com'],
    path: 'etc/certs/remoted.pem',
    ...overrides.listener,
  }),
  ca_bundle: {
    path: 'etc/certs/root-ca.pem',
    publication: NOW,
    publication_vouched: true,
    content_sha256: 'abc',
    certificates_count: 1,
    certificates_limit: 6,
    serialized_bytes: 2428,
    serialized_bytes_limit: 8191,
    chain_valid: true,
    matches_active_leaf: (overrides.certificates ?? [certificate()]).some(
      candidate => candidate.signs_active_leaf === true,
    ),
    certificates: overrides.certificates ?? [certificate()],
    ...overrides.caBundle,
  },
});

const ok = (
  overrides?: Parameters<typeof snapshot>[0],
): CertificateValidityOutcome => ({
  kind: 'ok',
  node: overrides?.node ?? 'node01',
  snapshot: snapshot(overrides),
});

describe('the findings name the consequence the manager documents', () => {
  it('names the 503 the manager answers when no CA chains to the leaf', () => {
    const result = evaluateCertificateValidity(
      [ok({ caBundle: { matches_active_leaf: false } })],
      OPTIONS,
    );

    const finding = result.findings.find(
      candidate => candidate.reason === 'ca-mismatch',
    );

    expect(finding?.detail).toContain('503');
    expect(finding?.detail).toContain('/cacerts');
  });

  it('warns that a verifying agent fails the handshake once a CA expires', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          certificates: [
            certificate({
              signs_active_leaf: true,
              seconds_until_expiry: 10 * DAY,
            }),
          ],
        }),
      ],
      OPTIONS,
    );

    const finding = result.findings.find(candidate => candidate.scope === 'ca');

    expect(finding?.detail).toContain('fails the handshake');
  });

  it('does not repeat the CA consequence on an expiring listener certificate', () => {
    const result = evaluateCertificateValidity(
      [ok({ listener: { seconds_until_expiry: 10 * DAY } })],
      OPTIONS,
    );

    const finding = result.findings.find(
      candidate => candidate.scope === 'listener',
    );

    expect(finding?.detail).toContain('expires in 10 day(s)');
    expect(finding?.detail).not.toContain('/cacerts');
    expect(finding?.detail).not.toContain('fails the handshake');
  });
});

describe('an expired listener certificate is reported as one problem', () => {
  const expiredLeaf = () =>
    ok({
      listener: { seconds_until_expiry: -3 * DAY },
      caBundle: {
        matches_active_leaf: false,
        chain_valid: false,
        chain_error: 'certificate has expired',
      },
    });

  it('reports the expiry and not the bundle verdicts it causes', () => {
    const result = evaluateCertificateValidity([expiredLeaf()], OPTIONS);
    const reasons = result.findings.map(finding => finding.reason);

    expect(reasons).toEqual(['expired']);
    expect(reasons).not.toContain('ca-mismatch');
    expect(reasons).not.toContain('chain-invalid');
  });

  it('still reports the bundle verdicts while the certificate is only expiring', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          listener: { seconds_until_expiry: 10 * DAY },
          caBundle: { matches_active_leaf: false },
        }),
      ],
      OPTIONS,
    );

    expect(result.findings.map(finding => finding.reason)).toContain(
      'ca-mismatch',
    );
  });

  it('keeps an unreadable bundle, which the expiry does not explain', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          listener: { seconds_until_expiry: -3 * DAY },
          caBundle: {
            last_read_failure: {
              cause: 'cannot be opened (Permission denied)',
              consecutive: 2,
            },
          },
        }),
      ],
      OPTIONS,
    );

    expect(result.findings.map(finding => finding.reason)).toContain(
      'bundle-unreadable',
    );
  });
});

describe('mismatchFinding — the CA match verdict has three states', () => {
  it('reports a mismatch only when the manager says so', () => {
    const result = evaluateCertificateValidity(
      [ok({ caBundle: { matches_active_leaf: false } })],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(result.findings.map(finding => finding.reason)).toContain(
      'ca-mismatch',
    );
  });

  it('does not claim a mismatch for a bundle the manager could not read', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          certificates: [],
          caBundle: {
            matches_active_leaf: null,
            certificates_count: 0,
            last_read_failure: {
              cause: 'cannot be opened (No such file or directory)',
              errno: 2,
              consecutive: 7,
            },
          },
        }),
      ],
      OPTIONS,
    );

    const reasons = result.findings.map(finding => finding.reason);

    expect(reasons).not.toContain('ca-mismatch');
    expect(reasons).toContain('bundle-unreadable');
    expect(
      result.findings.every(
        finding => !finding.detail.includes('No CA in the bundle'),
      ),
    ).toBe(true);
  });

  it('does not infer the verdict from the certificates it was given', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          certificates: [certificate({ signs_active_leaf: false })],
          caBundle: { matches_active_leaf: true },
        }),
      ],
      OPTIONS,
    );

    expect(result.findings.map(finding => finding.reason)).not.toContain(
      'ca-mismatch',
    );
  });
});

describe('evaluateCertificateValidity — single node severity', () => {
  it('reports ok when everything is valid and far from expiry', () => {
    const result = evaluateCertificateValidity([ok()], OPTIONS);

    expect(result.severity).toBe('ok');
    expect(result.findings).toHaveLength(0);
  });

  it.each`
    secondsUntilExpiry | expected
    ${31 * DAY}        | ${'ok'}
    ${30 * DAY}        | ${'warning'}
    ${29 * DAY}        | ${'warning'}
    ${8 * DAY}         | ${'warning'}
    ${7 * DAY}         | ${'critical'}
    ${1 * DAY}         | ${'critical'}
  `(
    'maps $secondsUntilExpiry seconds remaining to $expected',
    ({ secondsUntilExpiry, expected }) => {
      const result = evaluateCertificateValidity(
        [ok({ listener: { seconds_until_expiry: secondsUntilExpiry } })],
        OPTIONS,
      );

      expect(result.severity).toBe(expected);
    },
  );

  it('treats an expired certificate as expired, not as expiring', () => {
    const result = evaluateCertificateValidity(
      [ok({ listener: { seconds_until_expiry: -5 * DAY } })],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(result.findings[0].reason).toBe('expired');
    expect(result.findings[0].detail).not.toMatch(/expires in/i);
  });

  it('reports a bundle that does not sign the active leaf', () => {
    const result = evaluateCertificateValidity(
      [ok({ certificates: [certificate({ signs_active_leaf: false })] })],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(result.findings.map(finding => finding.reason)).toContain(
      'ca-mismatch',
    );
  });

  it('reports a mismatch even when every certificate is far from expiry', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          listener: { seconds_until_expiry: 3650 * DAY },
          certificates: [
            certificate({
              signs_active_leaf: false,
              seconds_until_expiry: 3650 * DAY,
            }),
          ],
        }),
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
  });

  // wazuh/wazuh#39410: a CA:FALSE or expired signer reads signs_active_leaf true
  // and chain_valid false. Reading only the signature reported this as healthy.
  it('reports a bundle that signs the leaf but does not validate', () => {
    const evaluation = evaluateCertificateValidity(
      [
        ok({
          caBundle: {
            chain_valid: false,
            chain_error: 'invalid CA certificate',
          },
        }),
      ],
      OPTIONS,
    );

    expect(evaluation.severity).toBe('critical');
    expect(evaluation.findings).toContainEqual(
      expect.objectContaining({
        reason: 'chain-invalid',
        severity: 'critical',
      }),
    );
    expect(evaluation.findings[0].detail).toContain('invalid CA certificate');
  });

  it('does not treat an unknown chain verdict as a failure', () => {
    const evaluation = evaluateCertificateValidity(
      [ok({ caBundle: { chain_valid: null } })],
      OPTIONS,
    );

    expect(evaluation.severity).toBe('ok');
  });

  it('warns while the bundle file cannot be read', () => {
    const evaluation = evaluateCertificateValidity(
      [
        ok({
          caBundle: {
            last_read_failure: {
              cause: 'cannot be opened (No such file or directory)',
              consecutive: 2,
            },
          },
        }),
      ],
      OPTIONS,
    );

    expect(evaluation.severity).toBe('warning');
    expect(evaluation.findings).toContainEqual(
      expect.objectContaining({ reason: 'bundle-unreadable' }),
    );
  });

  it('points at the last copy it read while one exists', () => {
    const evaluation = evaluateCertificateValidity(
      [
        ok({
          caBundle: {
            certificates_count: 3,
            last_read_failure: {
              cause: 'cannot be opened (Permission denied)',
              consecutive: 2,
            },
          },
        }),
      ],
      OPTIONS,
    );

    const finding = evaluation.findings.find(
      candidate => candidate.reason === 'bundle-unreadable',
    );

    expect(finding?.detail).toContain('the last copy the manager read');
  });

  it('describes no copy for a bundle that never read', () => {
    const evaluation = evaluateCertificateValidity(
      [
        ok({
          certificates: [],
          caBundle: {
            certificates_count: 0,
            matches_active_leaf: null,
            last_read_failure: {
              cause: 'cannot be opened (No such file or directory)',
              consecutive: 17,
            },
          },
        }),
      ],
      OPTIONS,
    );

    const finding = evaluation.findings.find(
      candidate => candidate.reason === 'bundle-unreadable',
    );

    expect(finding?.detail).toContain('never been read');
    expect(finding?.detail).not.toContain('the last copy the manager read');
  });

  it('accepts a bundle where any CA signs the active leaf', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          certificates: [
            certificate({ subject: 'CN=Old CA', signs_active_leaf: false }),
            certificate({ subject: 'CN=New CA', signs_active_leaf: true }),
          ],
        }),
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('ok');
  });

  it('reports both the leaf and a CA, taking the worst severity', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          listener: { seconds_until_expiry: 20 * DAY },
          certificates: [certificate({ seconds_until_expiry: 3 * DAY })],
        }),
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(result.findings.map(finding => finding.scope).sort()).toEqual([
      'ca',
      'listener',
    ]);
  });

  it('depends on the reported period, not on the wall clock', () => {
    const outcomes = [ok({ listener: { seconds_until_expiry: 10 * DAY } })];

    const early = evaluateCertificateValidity(outcomes, OPTIONS);
    const late = evaluateCertificateValidity(outcomes, {
      ...OPTIONS,
      now: NOW + 5000 * DAY,
    });

    expect(late.severity).toBe(early.severity);
  });
});

describe('evaluateCertificateValidity — multi-node aggregation', () => {
  it('takes the worst state and names the affected node', () => {
    const result = evaluateCertificateValidity(
      [
        ok({ node: 'node01' }),
        ok({ node: 'worker-02', listener: { seconds_until_expiry: 10 * DAY } }),
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('warning');
    expect(result.findings.map(finding => finding.node)).toEqual(['worker-02']);
  });

  it('keeps each node with its own state', () => {
    const result = evaluateCertificateValidity(
      [
        ok({ node: 'node01', listener: { seconds_until_expiry: 20 * DAY } }),
        ok({ node: 'worker-02', listener: { seconds_until_expiry: 2 * DAY } }),
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(
      result.findings.map(({ node, severity }) => ({ node, severity })),
    ).toEqual([
      { node: 'node01', severity: 'warning' },
      { node: 'worker-02', severity: 'critical' },
    ]);
  });

  it('does not treat divergent bundles as an error', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          node: 'node01',
          certificates: [certificate({ subject: 'CN=A' })],
        }),
        ok({
          node: 'worker-02',
          certificates: [
            certificate({ subject: 'CN=A' }),
            certificate({ subject: 'CN=B' }),
          ],
        }),
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('ok');
    expect(result.findings).toHaveLength(0);
  });

  it('reports ok only when every node is ok', () => {
    const result = evaluateCertificateValidity(
      [ok({ node: 'node01' }), ok({ node: 'worker-02' })],
      OPTIONS,
    );

    expect(result.severity).toBe('ok');
    expect(result.nodesEvaluated).toBe(2);
  });
});

describe('evaluateCertificateValidity — undetermined states', () => {
  it.each`
    kind                | outcome
    ${'notFound'}       | ${{ kind: 'notFound', node: 'node01' }}
    ${'forbidden'}      | ${{ kind: 'forbidden', node: 'node01' }}
    ${'unavailable'}    | ${{ kind: 'unavailable', node: 'node01', reason: 'remoted is down' }}
    ${'malformed'}      | ${{ kind: 'malformed', node: 'node01', detail: 'bad shape' }}
    ${'transportError'} | ${{ kind: 'transportError', node: 'node01', message: 'ECONNREFUSED' }}
  `('reports $kind as unknown, never as healthy', ({ outcome }) => {
    const result = evaluateCertificateValidity([outcome], OPTIONS);

    expect(result.severity).toBe('unknown');
    expect(result.nodesUndetermined).toEqual(['node01']);
  });

  it('states the permission problem when forbidden', () => {
    const result = evaluateCertificateValidity(
      [{ kind: 'forbidden', node: 'node01' }],
      OPTIONS,
    );

    expect(result.findings[0].detail).toMatch(/permission/i);
  });

  it("includes the manager's reason when unavailable (S6.3)", () => {
    const result = evaluateCertificateValidity(
      [{ kind: 'unavailable', node: 'node01', reason: 'remoted is down' }],
      OPTIONS,
    );

    expect(result.findings[0].detail).toContain('remoted is down');
  });

  it('does not resolve when only some nodes are undetermined', () => {
    const result = evaluateCertificateValidity(
      [ok({ node: 'node01' }), { kind: 'notFound', node: 'worker-02' }],
      OPTIONS,
    );

    expect(result.severity).toBe('unknown');
    expect(result.nodesUndetermined).toEqual(['worker-02']);
  });

  it('ranks unknown above critical, so ignorance never hides a failure', () => {
    const result = evaluateCertificateValidity(
      [
        ok({ node: 'node01', listener: { seconds_until_expiry: -1 } }),
        { kind: 'notFound', node: 'worker-02' },
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('unknown');
  });

  it('never asserts a certificate is expiring when the state is unknown', () => {
    const result = evaluateCertificateValidity(
      [{ kind: 'notFound', node: 'node01' }],
      OPTIONS,
    );

    expect(result.findings[0].reason).toBe('undetermined');
    expect(result.findings[0].detail).not.toMatch(/expir/i);
  });

  it('reports unknown when there is nothing to evaluate', () => {
    const result = evaluateCertificateValidity([], OPTIONS);

    expect(result.severity).toBe('unknown');
  });
});

describe('evaluateCertificateValidity — finding content', () => {
  it('identifies the node, the certificate, its subject and the expiry', () => {
    const result = evaluateCertificateValidity(
      [
        ok({
          node: 'worker-02',
          listener: {
            subject: 'CN=manager-01',
            not_after: '2026-10-01T00:00:00Z',
            seconds_until_expiry: 10 * DAY,
          },
        }),
      ],
      OPTIONS,
    );
    const [finding] = result.findings;

    expect(finding).toMatchObject({
      node: 'worker-02',
      scope: 'listener',
      subject: 'CN=manager-01',
      notAfter: '2026-10-01T00:00:00Z',
      daysRemaining: 10,
    });
  });

  it('exposes the oldest listener load time, not the evaluation time', () => {
    const older = snapshot({ node: 'node01' });
    const newer = snapshot({ node: 'worker-02' });

    older.evaluated_at = '2026-09-14T00:00:00Z';
    older.listener.loaded_at = '2026-09-10T00:00:00Z';
    newer.listener.loaded_at = '2026-09-12T00:00:00Z';

    const result = evaluateCertificateValidity(
      [
        { kind: 'ok', node: 'node01', snapshot: older },
        { kind: 'ok', node: 'worker-02', snapshot: newer },
      ],
      OPTIONS,
    );

    expect(result.oldestListenerLoadedAt).toBe('2026-09-10T00:00:00Z');
  });

  it('exposes no load time when the manager does not date the listener', () => {
    const undated = snapshot({ node: 'node01' });

    delete undated.listener.loaded_at;

    const result = evaluateCertificateValidity(
      [{ kind: 'ok', node: 'node01', snapshot: undated }],
      OPTIONS,
    );

    expect(result.oldestListenerLoadedAt).toBeUndefined();
  });
});
