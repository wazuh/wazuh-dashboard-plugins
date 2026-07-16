import { getHttp } from '../../../../../kibana-services';
import { DATA_SOURCE_NOT_FOUND, TopItem } from './types';

/**
 * The reusable Security Analytics count client: GETs an SA proxy route via
 * `core.http` and reads its `{ ok, response, error }` envelope — the shape
 * every route the Security Analytics dashboards plugin registers uses. A
 * 404 (the route doesn't exist because the plugin isn't installed) is
 * surfaced as the same `data_source_not_found` shape a missing index
 * pattern already throws, so callers hide the dependent widget instead of
 * showing an error; an in-envelope `ok: false` is a genuine query failure.
 *
 * There is no aggregation-capable route over the IOC catalog (verified: the
 * plugin only exposes `GET .../threat_intel/iocs`, a paged list — no
 * `_search`/`_count` variant), so the by-type breakdown is derived by
 * paging a bounded number of IOCs and counting client-side, the same
 * fallback the Security Analytics UI itself uses for its own counts.
 */

const SECURITY_ANALYTICS_BASE = '../_plugins/_security_analytics';

export const SECURITY_ANALYTICS_ROUTES = {
  iocs: `${SECURITY_ANALYTICS_BASE}/threat_intel/iocs`,
};

/** Upper bound on IOCs paged in to derive the by-type breakdown. */
const IOC_PAGE_SIZE = 5000;

interface GetIocsResponse {
  ok?: boolean;
  error?: string;
  response?: { iocs?: Array<{ type?: string }>; total?: number };
}

function isSecurityAnalyticsNotFound(error: unknown): boolean {
  const err = error as {
    response?: { status?: number };
    body?: { statusCode?: number };
    statusCode?: number;
  };
  return (
    err?.response?.status === 404 ||
    err?.body?.statusCode === 404 ||
    err?.statusCode === 404
  );
}

/** IOC feed broken down by type (top `size`), counted over a bounded page
 * of the IOC catalog. */
export async function fetchIocFeedByType(size = 5): Promise<TopItem[]> {
  let body: GetIocsResponse;
  try {
    body = (await getHttp().get(SECURITY_ANALYTICS_ROUTES.iocs, {
      query: { size: IOC_PAGE_SIZE },
    })) as GetIocsResponse;
  } catch (error) {
    if (isSecurityAnalyticsNotFound(error)) {
      throw { type: DATA_SOURCE_NOT_FOUND };
    }
    throw error;
  }

  if (!body?.ok) {
    throw new Error(body?.error ?? 'Security Analytics returned an error');
  }

  const counts = new Map<string, number>();
  for (const ioc of body.response?.iocs ?? []) {
    if (!ioc?.type) {
      continue;
    }
    counts.set(ioc.type, (counts.get(ioc.type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([key, count]) => ({ key, count }));
}
