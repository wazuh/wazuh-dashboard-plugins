export function getContentManagerBaseUrl(): string | null {
  const raw = process.env.WAZUH_CONTENT_MANAGER_BASE_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/$/, '');
}
