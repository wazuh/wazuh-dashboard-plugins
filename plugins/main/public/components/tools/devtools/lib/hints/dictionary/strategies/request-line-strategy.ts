import type { HintStrategy } from './hint-strategy';
import type { HintItem } from '../types';
import type { HintContext } from '../context';
import { parseQueryString, isDefiningQueryParamValue, buildNextPathWithQuery } from '../utils/query-utils';
import { buildEndpointHintItem, buildQueryParamHintItem } from '../utils/hint-builders';
import { dedupeByText, limitToSingleQuestionMark } from '../utils/hint-utils';

/**
 * Strategy for suggestions while cursor is on the request line:
 * - Query parameter keys (and flags) when adding query string
 * - Endpoint path suggestions
 */
export class RequestLineHintStrategy implements HintStrategy {
  canHandle(context: HintContext): boolean {
    return context.isOnRequestLine && !!context.parsed.method;
  }

  getHints(context: HintContext): Array<HintItem | string> {
    const { parsed, word, methodEndpoints, inputEndpoint, apiEndpoint } = context;

    // Query param suggestions
    if (parsed.method && parsed.path && parsed.queryMark) {
      const inputQuery = parseQueryString(parsed.queryString);
      const definingValue = isDefiningQueryParamValue(
        context.currentGroup?.requestText,
        parsed.queryString,
      );
      if (!definingValue && apiEndpoint && apiEndpoint.query) {
        const previousKeys = inputQuery
          .filter(q => q.key && q.value)
          .map(q => q.key);
        const results = apiEndpoint.query
          .filter(q => !previousKeys.includes(q.name))
          .map(q => {
            const nextPath = buildNextPathWithQuery(
              parsed.path!,
              inputQuery,
              q.name,
            );
            const isFlag = (q.schema || {}).type === 'boolean';
            return buildQueryParamHintItem(q.name, nextPath, isFlag);
          });
        // Keep historical behavior limiting '?' usage
        return limitToSingleQuestionMark(results) as HintItem[];
      }
    }

    // Endpoint path suggestions
    if (parsed.method) {
      const path = parsed.path || '';
      if (!path || path === '/') {
        return methodEndpoints.map(e => buildEndpointHintItem(e.name));
      }

      // Prefix matches
      const inputPathLc = String(path).toLowerCase();
      const prefixMatches = methodEndpoints
        .filter(e => String(e.name).toLowerCase().startsWith(inputPathLc))
        .map(e => buildEndpointHintItem(e.name));

      // Structured matches replacing ":param" segments with current input when possible
      const structuredMatches = methodEndpoints
        .map(e => ({ ...e, splitURL: e.name.split('/').filter(Boolean) }))
        .filter(e =>
          (e.splitURL || []).reduce(
            (acc: boolean, seg: string, idx: number) => {
              if (!acc) return acc;
              if (
                seg.startsWith(':') ||
                !inputEndpoint[idx] ||
                (inputEndpoint[idx] &&
                  seg.toLowerCase().startsWith(inputEndpoint[idx]))
              ) {
                return true;
              }
              return false;
            },
            true,
          ),
        )
        .map(e => {
          const suggestion = (e.splitURL || []).reduce(
            (acc: string, seg: string, idx: number) =>
              `${acc}/${(seg.startsWith(':') && inputEndpoint[idx]) || seg}`,
            '',
          );
          return buildEndpointHintItem(suggestion);
        });

      const allEndpoints = methodEndpoints.map(e => buildEndpointHintItem(e.name));

      return dedupeByText([
        ...prefixMatches,
        ...structuredMatches,
        ...allEndpoints,
      ]) as HintItem[];
    }

    return [];
  }
}

