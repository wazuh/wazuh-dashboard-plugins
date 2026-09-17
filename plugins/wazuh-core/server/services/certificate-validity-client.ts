import { Logger } from 'opensearch-dashboards/server';
import { ServerAPIClient } from './server-api-client';
import {
  CertificateValidityOutcome,
  CertificateValiditySnapshot,
} from '../../common/certificate-validity';

export const CLUSTER_NODES_ENDPOINT = '/cluster/nodes';

/** Provisional: the server team has not published the final path. */
export const certificateValidityEndpoint = (nodeId: string) =>
  `/cluster/${nodeId}/daemons/remoted/tls`;

interface ServerAPIRequestError {
  response?: { status?: number };
  code?: string;
  message?: string;
}

const asRequestError = (error: unknown): ServerAPIRequestError =>
  (error ?? {}) as ServerAPIRequestError;

/** The resource has not shipped, so a bare document is accepted too. */
function unwrap(response: unknown): unknown {
  const payload = (response as { data?: { data?: unknown } })?.data?.data;
  const items = (payload as { affected_items?: unknown[] })?.affected_items;

  return Array.isArray(items) ? items[0] : payload;
}

export function isCertificateValiditySnapshot(
  value: unknown,
): value is CertificateValiditySnapshot {
  const candidate = value as CertificateValiditySnapshot | undefined;

  return (
    typeof candidate?.node === 'string' &&
    typeof candidate?.listener?.seconds_until_expiry === 'number' &&
    Array.isArray(candidate?.ca_bundle?.certificates)
  );
}

export class CertificateValidityClient {
  constructor(
    private readonly serverAPIClient: ServerAPIClient,
    private readonly logger: Logger,
  ) {}

  /** A deployment without clustering answers with one entry. */
  async getNodes(apiHostID: string): Promise<string[]> {
    const response = await this.serverAPIClient.asInternalUser.request(
      'GET',
      CLUSTER_NODES_ENDPOINT,
      {},
      { apiHostID },
    );
    const items: { name?: string }[] =
      response?.data?.data?.affected_items ?? [];

    return items
      .map(item => item?.name)
      .filter((name): name is string => Boolean(name));
  }

  /** Never rejects: every failure is returned as an outcome. */
  async getNodeTls(
    apiHostID: string,
    node: string,
  ): Promise<CertificateValidityOutcome> {
    try {
      const response = await this.serverAPIClient.asInternalUser.request(
        'GET',
        certificateValidityEndpoint(node),
        {},
        { apiHostID },
      );

      return this.toOutcome(node, unwrap(response));
    } catch (error: unknown) {
      return this.toFailure(node, error);
    }
  }

  private toOutcome(
    node: string,
    document: unknown,
  ): CertificateValidityOutcome {
    const reported = document as
      | { state?: string; reason?: string }
      | undefined;

    if (reported?.state === 'unavailable') {
      this.logger.debug(
        `Certificate state unavailable on node [${node}]: ${reported.reason}`,
      );

      return {
        kind: 'unavailable',
        node,
        reason: reported.reason ?? 'The manager did not report a reason',
      };
    }

    if (!isCertificateValiditySnapshot(document)) {
      return {
        kind: 'malformed',
        node,
        detail: 'The response does not match the certificate validity resource',
      };
    }

    return { kind: 'ok', node, snapshot: document };
  }

  /** A missing status means the request never reached the manager. */
  private toFailure(node: string, error: unknown): CertificateValidityOutcome {
    const requestError = asRequestError(error);
    const status = requestError.response?.status;

    if (status === 404) {
      this.logger.debug(
        `Node [${node}] does not expose the certificate validity resource`,
      );

      return { kind: 'notFound', node };
    }

    if (status === 403) {
      return { kind: 'forbidden', node };
    }

    if (status !== undefined) {
      return {
        kind: 'malformed',
        node,
        detail: `The manager answered with status ${status}`,
      };
    }

    const message = requestError.message ?? String(error);

    this.logger.debug(`Could not reach node [${node}]: ${message}`);

    return { kind: 'transportError', node, code: requestError.code, message };
  }
}
