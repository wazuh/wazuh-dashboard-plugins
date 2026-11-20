import { WzRequest } from '../../../../../../../../../react-services/wz-request';

export type MitreReference = {
  source: string;
  url?: string;
  description?: string;
};

export type MitreTechnique = {
  id: string;
  external_id: string;
  name: string;
  description?: string;
  url?: string;
  mitre_version?: string;
  created_time?: string;
  modified_time?: string;
  deprecated?: number;
  tactics?: string[];
  mitigations?: string[];
  groups?: string[];
  software?: string[];
  references?: MitreReference[];
};

export type MitreItem = { id: string; external_id: string; name: string };

export type TechniqueStats = {
  findings: number;
  agents: number;
  highestSeverity?: string;
  lastSeen?: number;
};

export const SEVERITY_ORDER = [
  'critical',
  'high',
  'medium',
  'low',
  'informational',
];

const CITATION_REGEX = /\(Citation: ([^)]+)\)/g;

/**
 * Turns the `(Citation: <source>)` markers of a description into links to the matching
 * reference, numbered in order of appearance. Markers without a reference URL are removed.
 */
export const resolveCitations = (
  description: string,
  references: MitreReference[] = [],
) => {
  const numbers = new Map<string, number>();
  return description.replace(CITATION_REGEX, (_, source: string) => {
    const reference = references.find(
      item => item.source === source && item.url,
    );
    if (!reference) {
      return '';
    }
    if (!numbers.has(source)) {
      numbers.set(source, numbers.size + 1);
    }
    const title = source.replace(/"/g, '\\"');
    return `[[${numbers.get(source)}]](${reference.url} "${title}")`;
  });
};

/** Returns the parent ID of a sub-technique (`T1110.001` → `T1110`), or undefined. */
export const getParentTechniqueId = (externalId: string) =>
  externalId.includes('.') ? externalId.split('.')[0] : undefined;

export const getHighestSeverity = (levels: string[]) =>
  SEVERITY_ORDER.find(level => levels.includes(level));

export const STATS_AGGS = {
  agents: { cardinality: { field: 'wazuh.agent.id' } },
  levels: { terms: { field: 'wazuh.rule.level', size: SEVERITY_ORDER.length } },
  lastSeen: { max: { field: '@timestamp' } },
};

type StatsResponse = {
  hits?: { total?: number | { value: number; relation?: string } };
  aggregations?: {
    agents?: { value?: number };
    levels?: { buckets?: { key: string }[] };
    lastSeen?: { value?: number | null };
  };
};

export const parseStats = (response: StatsResponse): TechniqueStats => {
  const total = response?.hits?.total;
  const levels: string[] = (response?.aggregations?.levels?.buckets || []).map(
    ({ key }: { key: string }) => key,
  );
  return {
    findings: typeof total === 'number' ? total : total?.value ?? 0,
    agents: response?.aggregations?.agents?.value ?? 0,
    highestSeverity: getHighestSeverity(levels),
    lastSeen: response?.aggregations?.lastSeen?.value ?? undefined,
  };
};

type ApiResponse<T> = { data?: { data?: { affected_items?: T[] } } };

const getItems = <T>(response?: ApiResponse<T>): T[] =>
  response?.data?.data?.affected_items || [];

export const fetchTechnique = async (
  externalId: string,
): Promise<MitreTechnique | undefined> => {
  const response = await WzRequest.apiReq('GET', '/mitre/techniques', {
    params: { q: `external_id=${externalId}` },
  });
  return getItems(response)[0];
};

export const fetchSubtechniques = async (
  externalId: string,
): Promise<MitreItem[]> => {
  const response = await WzRequest.apiReq('GET', '/mitre/techniques', {
    params: {
      q: `external_id~${externalId}.`,
      select: 'external_id,name',
      sort: '+external_id',
    },
  });
  return getItems(response);
};

export type TechniqueFamily = {
  parent?: MitreItem;
  subtechniques: MitreItem[];
};

/** Gets the sub-techniques of a technique, or the parent of a sub-technique. */
export const fetchTechniqueFamily = async (
  externalId: string,
): Promise<TechniqueFamily> => {
  const parentId = getParentTechniqueId(externalId);
  if (parentId) {
    return { parent: await fetchTechnique(parentId), subtechniques: [] };
  }
  return { subtechniques: await fetchSubtechniques(externalId) };
};
