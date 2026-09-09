import { WzRequest } from '../../../../react-services/wz-request';

export const ENROLLMENT_TOKENS_ENDPOINT = '/agents/enrollment-tokens';

/* What the wizard asks the manager to mint. Only the address is required: the
manager reads the port and the path prefix from its own listener when they are
omitted, applies a 30 day lifetime, and allows unlimited enrollments. */
export interface EnrollmentTokenRequest {
  address: string;
  port?: string;
  prefix?: string;
  ttl?: string;
  maxUses?: string;
  description?: string;
}

/* What the manager answers. `token` is the text the agent is installed with and
is returned by this response only -- listing the tokens later never gives it
back. */
export interface EnrollmentToken {
  token: string;
  id: string;
  address: string;
  expires: string;
  pin_hex?: string;
}

const isEmpty = (value?: string) =>
  value === undefined || value === null || String(value).trim().length === 0;

/**
 * Build the request body, leaving out every optional the operator did not fill
 * so the manager applies its own defaults instead of a value invented here.
 */
export const buildEnrollmentTokenRequestBody = (
  parameters: EnrollmentTokenRequest,
) => {
  const { address, port, prefix, ttl, maxUses, description } = parameters;
  const body: Record<string, string | number> = { address: address.trim() };

  if (!isEmpty(port)) {
    body.port = Number.parseInt(String(port), 10);
  }
  if (!isEmpty(prefix)) {
    body.prefix = String(prefix).trim();
  }
  if (!isEmpty(ttl)) {
    body.ttl = String(ttl).trim();
  }
  if (!isEmpty(maxUses)) {
    // eslint-disable-next-line camelcase -- the Wazuh Server API body uses snake_case
    body.max_uses = Number.parseInt(String(maxUses), 10);
  }
  if (!isEmpty(description)) {
    body.description = String(description).trim();
  }

  return body;
};

/**
 * Mint an enrollment token on the master node.
 *
 * The manager validates the address against the names in its listener
 * certificate and refuses one it does not cover, so no equivalent check is done
 * here: a second, locally computed rule would drift from the one the manager
 * actually enforces. The rejection reaches the caller as the manager wrote it.
 */
export const createEnrollmentToken = async (
  parameters: EnrollmentTokenRequest,
): Promise<EnrollmentToken> => {
  const response = await WzRequest.apiReq(
    'POST',
    ENROLLMENT_TOKENS_ENDPOINT,
    buildEnrollmentTokenRequestBody(parameters),
  );
  const enrollmentToken = response?.data?.data;

  if (!enrollmentToken?.token) {
    throw new Error(
      response?.data?.message ||
        'The server API did not return an enrollment token.',
    );
  }

  return enrollmentToken as EnrollmentToken;
};
