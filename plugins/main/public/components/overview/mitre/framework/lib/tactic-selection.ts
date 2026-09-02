import { tFilter } from '../../../../common/data-source';
import { MITRE_TACTIC_NAME_FIELD } from '../../../../../../common/constants';

/**
 * A filter created in this session carries the plain value in `meta.params`,
 * while one restored from the `_a` app state has been normalised by the
 * platform into `{ query: value }`.
 */
const readTacticName = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'query' in value) {
    const { query } = value as { query?: unknown };
    return typeof query === 'string' ? query : undefined;
  }
  return undefined;
};

/**
 * Tactic names carried by the enabled, non-negated filters on the tactic-name
 * field. `meta.params` holds a single value for a `phrase` filter and an array
 * for an `is one of` filter. Never reads a tactic id.
 */
export const getTacticNamesFromFilters = (filters?: tFilter[]): string[] =>
  (filters || [])
    .filter(
      filter =>
        filter?.meta?.key === MITRE_TACTIC_NAME_FIELD &&
        !filter.meta.disabled &&
        !filter.meta.negate,
    )
    .flatMap(filter => {
      const params = (filter.meta as { params?: unknown }).params;
      return (Array.isArray(params) ? params : [params])
        .map(readTacticName)
        .filter((name): name is string => Boolean(name));
    });

/** Order-insensitive identity of a tactic-name set. */
const getSignature = (names: string[]): string => [...names].sort().join('|');

/**
 * Selects only the incoming tactics, or all of them when no incoming name
 * matches `tacticsObject`, so the techniques list never renders empty. Keys on
 * tactic name, never id.
 */
const buildSelectedTactics = (
  tacticsObject: Record<string, unknown>,
  incomingTacticNames: string[],
): Record<string, boolean> => {
  const tacticNames = Object.keys(tacticsObject);
  const selectAll = !incomingTacticNames.some(name =>
    tacticNames.includes(name),
  );

  return tacticNames.reduce<Record<string, boolean>>((selected, name) => {
    selected[name] = selectAll || incomingTacticNames.includes(name);
    return selected;
  }, {});
};

/**
 * Facet selection for a render. Re-derives when the incoming tactic set
 * changed, and whenever the previous selection is still empty so a selection is
 * never left unresolved. Otherwise the previous selection is preserved, which
 * keeps manual facet clicks across unrelated refreshes.
 */
export const resolveSelectedTactics = ({
  previousSelectedTactics,
  tacticsObject,
  incomingTacticNames,
  previousSignature,
}: {
  previousSelectedTactics: Record<string, boolean>;
  tacticsObject: Record<string, unknown>;
  incomingTacticNames: string[];
  previousSignature: string | null;
}): { selectedTactics: Record<string, boolean>; signature: string } => {
  const signature = getSignature(incomingTacticNames);
  const keepPrevious =
    signature === previousSignature &&
    Object.keys(previousSelectedTactics || {}).length > 0;

  return {
    signature,
    selectedTactics: keepPrevious
      ? previousSelectedTactics
      : buildSelectedTactics(tacticsObject, incomingTacticNames),
  };
};
