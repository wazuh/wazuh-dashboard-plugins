/**
 * Base URL for the Content Manager subscription API (OpenSearch node or mock).
 * Optional: when unset, CTI registration completes without forwarding the token.
 */
export function getContentManagerBaseUrl(): string | null {
  const raw = process.env.WAZUH_CONTENT_MANAGER_BASE_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/$/, '');
}
