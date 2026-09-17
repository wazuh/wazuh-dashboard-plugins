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
  } = {},
): CertificateValiditySnapshot => ({
  node: overrides.node ?? 'node01',
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
    serialized_bytes: 2428,
    serialized_bytes_limit: 8191,
    certificates: overrides.certificates ?? [certificate()],
  },
});

const ok = (
  overrides?: Parameters<typeof snapshot>[0],
): CertificateValidityOutcome => ({
  kind: 'ok',
  node: overrides?.node ?? 'node01',
  snapshot: snapshot(overrides),
});

describe('evaluateCertificateValidity — single node severity (R4)', () => {
  it('reports ok when everything is valid and far from expiry (S4.1)', () => {
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
    'maps $secondsUntilExpiry seconds remaining to $expected (S4.2, S4.3)',
    ({ secondsUntilExpiry, expected }) => {
      const result = evaluateCertificateValidity(
        [ok({ listener: { seconds_until_expiry: secondsUntilExpiry } })],
        OPTIONS,
      );

      expect(result.severity).toBe(expected);
    },
  );

  it('treats an expired certificate as expired, not as expiring (S4.4)', () => {
    const result = evaluateCertificateValidity(
      [ok({ listener: { seconds_until_expiry: -5 * DAY } })],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(result.findings[0].reason).toBe('expired');
    expect(result.findings[0].detail).not.toMatch(/expires in/i);
  });

  it('reports a bundle that does not sign the active leaf (S4.5)', () => {
    const result = evaluateCertificateValidity(
      [ok({ certificates: [certificate({ signs_active_leaf: false })] })],
      OPTIONS,
    );

    expect(result.severity).toBe('critical');
    expect(result.findings.map(finding => finding.reason)).toContain(
      'ca-mismatch',
    );
  });

  it('reports a mismatch even when every certificate is far from expiry (S4.5)', () => {
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

  it('reports both the leaf and a CA, taking the worst severity (S4.6)', () => {
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

  it('depends on the reported period, not on the wall clock (S4.7)', () => {
    const outcomes = [ok({ listener: { seconds_until_expiry: 10 * DAY } })];

    const early = evaluateCertificateValidity(outcomes, OPTIONS);
    const late = evaluateCertificateValidity(outcomes, {
      ...OPTIONS,
      now: NOW + 5000 * DAY,
    });

    expect(late.severity).toBe(early.severity);
  });
});

describe('evaluateCertificateValidity — multi-node aggregation (R5)', () => {
  it('takes the worst state and names the affected node (S5.1)', () => {
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

  it('keeps each node with its own state (S5.2)', () => {
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

  it('does not treat divergent bundles as an error (S5.3)', () => {
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

  it('reports ok only when every node is ok (S5.4)', () => {
    const result = evaluateCertificateValidity(
      [ok({ node: 'node01' }), ok({ node: 'worker-02' })],
      OPTIONS,
    );

    expect(result.severity).toBe('ok');
    expect(result.nodesEvaluated).toBe(2);
  });
});

describe('evaluateCertificateValidity — undetermined states (R6)', () => {
  it.each`
    kind                | outcome
    ${'notFound'}       | ${{ kind: 'notFound', node: 'node01' }}
    ${'forbidden'}      | ${{ kind: 'forbidden', node: 'node01' }}
    ${'unavailable'}    | ${{ kind: 'unavailable', node: 'node01', reason: 'remoted is down' }}
    ${'malformed'}      | ${{ kind: 'malformed', node: 'node01', detail: 'bad shape' }}
    ${'transportError'} | ${{ kind: 'transportError', node: 'node01', message: 'ECONNREFUSED' }}
  `('reports $kind as unknown, never as healthy (S6.1-S6.4)', ({ outcome }) => {
    const result = evaluateCertificateValidity([outcome], OPTIONS);

    expect(result.severity).toBe('unknown');
    expect(result.nodesUndetermined).toEqual(['node01']);
  });

  it('states the permission problem when forbidden (S6.2)', () => {
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

  it('does not resolve when only some nodes are undetermined (S6.5)', () => {
    const result = evaluateCertificateValidity(
      [ok({ node: 'node01' }), { kind: 'notFound', node: 'worker-02' }],
      OPTIONS,
    );

    expect(result.severity).toBe('unknown');
    expect(result.nodesUndetermined).toEqual(['worker-02']);
  });

  it('ranks unknown above critical, so ignorance never hides a failure (S6.5)', () => {
    const result = evaluateCertificateValidity(
      [
        ok({ node: 'node01', listener: { seconds_until_expiry: -1 } }),
        { kind: 'notFound', node: 'worker-02' },
      ],
      OPTIONS,
    );

    expect(result.severity).toBe('unknown');
  });

  it('never asserts a certificate is expiring when the state is unknown (S6.6)', () => {
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

describe('evaluateCertificateValidity — finding content (R7, R8)', () => {
  it('identifies the node, the certificate, its subject and the expiry (S7.1-S7.4)', () => {
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

  it('exposes the oldest evaluation time so staleness is visible (S8.1)', () => {
    const older = snapshot({ node: 'node01' });

    older.evaluated_at = '2026-09-14T00:00:00Z';

    const result = evaluateCertificateValidity(
      [
        { kind: 'ok', node: 'node01', snapshot: older },
        ok({ node: 'worker-02', listener: { seconds_until_expiry: 10 * DAY } }),
      ],
      OPTIONS,
    );

    expect(result.oldestEvaluatedAt).toBe('2026-09-14T00:00:00Z');
  });
});
