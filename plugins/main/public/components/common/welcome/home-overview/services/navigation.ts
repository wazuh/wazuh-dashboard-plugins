import NavigationService from '../../../../../react-services/navigation-service';
import {
  threatHunting,
  mitreAttack,
  ITHygiene,
} from '../../../../../utils/applications';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../data-source/pattern/pattern-data-source-filter-manager';
import { MITRE_TACTIC_NAME_FIELD } from './aggs';

/**
 * Navigation helpers for the Home overview. Kept in one module so the section
 * (and its tests) depend on a single boundary rather than on `applications` and
 * the filter manager directly.
 */

const navigate = (appId: string, options?: Record<string, unknown>) =>
  NavigationService.getInstance().navigateToApp(appId, options);

export const goToThreatHunting = () => navigate(threatHunting.id);
export const goToMitre = () => navigate(mitreAttack.id);
export const goToItHygiene = () => navigate(ITHygiene.id);

/** Open MITRE ATT&CK filtered to a tactic (falls back to unfiltered). */
export const goToMitreTactic = (
  tacticName: string,
  indexPatternId?: string,
): void => {
  if (!indexPatternId) {
    navigate(mitreAttack.id);
    return;
  }
  const filters = [
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      MITRE_TACTIC_NAME_FIELD,
      tacticName,
      indexPatternId,
    ),
  ];
  const params = `tab=mitre&tabView=dashboard&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
    filters,
  )}`;
  navigate(mitreAttack.id, { path: `#/overview?${params}` });
};
