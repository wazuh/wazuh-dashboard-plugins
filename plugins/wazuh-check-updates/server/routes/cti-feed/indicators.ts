import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import type { CtiFeedIndicatorsResponse } from '../../../common/cti-feed';

const THREAT_INTEL_ENRICHMENTS_PATTERN = 'wazuh-threatintel-enrichments*';
const THREAT_INTEL_VULNERABILITIES_PATTERN =
  '.wazuh-threatintel-vulnerabilities*';
/** The vulnerabilities index also holds feed metadata documents; only CVEs count. */
const CVE_DOCUMENT_TYPE = 'CVE';

/**
 * Counts the feed content that does not live in Security Analytics: indicators
 * of compromise and CVEs. Each count is independent, so a missing index or
 * privilege leaves that count `null` instead of failing the whole response.
 */
export const getCtiFeedIndicatorsRoute = (router: IRouter) => {
  router.get(
    {
      path: routes.ctiFeedIndicators,
      validate: false,
    },
    async (context, _request, response) => {
      const client = context.core.opensearch.client.asCurrentUser;

      const [iocs, vulnerabilities] = await Promise.allSettled([
        client.count({ index: THREAT_INTEL_ENRICHMENTS_PATTERN }),
        client.count({
          index: THREAT_INTEL_VULNERABILITIES_PATTERN,
          body: { query: { term: { type: CVE_DOCUMENT_TYPE } } },
        }),
      ]);

      const toCount = (
        result: PromiseSettledResult<{ body: { count?: number } }>,
      ): number | null =>
        result.status === 'fulfilled' &&
        typeof result.value.body?.count === 'number'
          ? result.value.body.count
          : null;

      return response.ok<CtiFeedIndicatorsResponse>({
        body: {
          iocs: toCount(iocs),
          vulnerabilities: toCount(vulnerabilities),
        },
      });
    },
  );
};
