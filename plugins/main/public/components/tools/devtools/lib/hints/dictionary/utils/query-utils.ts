export interface KeyValue { key: string; value: string | undefined }

export function parseQueryString(qs?: string): KeyValue[] {
  if (!qs) return [];
  return qs
    .split('&')
    .filter(Boolean)
    .map((item) => {
      const [key, value] = item.split('=');
      return { key, value } as KeyValue;
    });
}

export function isDefiningQueryParamValue(
  fullRequest?: string,
  qs?: string,
): boolean {
  if (!fullRequest) return false;
  if (qs && qs.includes('&')) {
    return fullRequest.lastIndexOf('=') > fullRequest.lastIndexOf('&');
  }
  return (qs || '').includes('?') ||
    fullRequest.lastIndexOf('=') > fullRequest.lastIndexOf('?');
}

export function buildNextPathWithQuery(
  basePath: string,
  entries: KeyValue[] = [],
  nextKey: string,
): string {
  const valid = entries.filter(e => e.key && e.value != null && e.value !== '');
  const prefix = valid.reduce((acc: string, e: KeyValue, idx: number) =>
    `${acc}${idx > 0 ? '&' : ''}${e.key}=${e.value}`
  , '?');
  const sep = valid.length > 0 ? '&' : '';
  return `${basePath}${prefix}${sep}${nextKey}=`;
}

