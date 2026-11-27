/* eslint-disable camelcase -- OAuth device authorization fields keep their RFC 8628 names */
/**
 * Validation for the links the check-updates plugin builds from CTI console
 * answers and from the CTI consumers index. Those values come from outside the
 * dashboard, so a link or window is built from them only when they are https
 * URLs, and the device-authorization link shows the same address it opens.
 */

const parseHttpsUrl = (value: unknown): URL | null => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

/** Whether `value` is an absolute `https:` URL. */
export const isHttpsUrl = (value: unknown): value is string =>
  parseHttpsUrl(value) !== null;

/** The device-authorization links once validated. Empty strings mean no link. */
export type CtiVerificationLinks = {
  verification_uri: string;
  verification_uri_complete: string;
};

const appendUserCode = (verificationUri: string, userCode: string): string =>
  userCode
    ? `${verificationUri}${
        verificationUri.includes('?') ? '&' : '?'
      }user_code=${encodeURIComponent(userCode)}`
    : verificationUri;

/**
 * Resolves the pair of device-authorization links (RFC 8628 §3.2) the dialog
 * shows, opens and copies:
 *
 * - Only `https:` URLs are kept; any other value yields no link.
 * - `verification_uri_complete` is kept only when it has the same origin as
 *   `verification_uri`; otherwise the target is built from `verification_uri`
 *   and the user code, so the link never shows one host and opens another.
 * - When the answer has only `verification_uri_complete`, it is both the
 *   address shown and the address opened.
 *
 * Applying it to its own output returns the same pair.
 */
export const resolveCtiVerificationLinks = (answer: {
  verification_uri?: unknown;
  verification_uri_complete?: unknown;
  user_code?: unknown;
}): CtiVerificationLinks => {
  const userCode = typeof answer.user_code === 'string' ? answer.user_code : '';
  const base = parseHttpsUrl(answer.verification_uri);
  const complete = parseHttpsUrl(answer.verification_uri_complete);

  if (!base) {
    const completeUri = complete
      ? (answer.verification_uri_complete as string)
      : '';
    return {
      verification_uri: completeUri,
      verification_uri_complete: completeUri,
    };
  }

  const verificationUri = answer.verification_uri as string;
  const verificationUriComplete =
    complete && complete.origin === base.origin
      ? (answer.verification_uri_complete as string)
      : appendUserCode(verificationUri, userCode);

  return {
    verification_uri: verificationUri,
    verification_uri_complete: verificationUriComplete,
  };
};
