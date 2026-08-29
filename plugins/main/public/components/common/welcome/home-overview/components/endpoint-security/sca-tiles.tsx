import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { StatTile, TabNumber } from '../common';
import { ScaTilesData } from '../../interfaces/types';
import { HOME_OVERVIEW_COLOR } from '../../lib/theme-colors';
import { getConfigurationAssessmentByStatusUrl } from '../../utils/navigation';
import { CheckResult } from '../../../../../overview/sca/utils/constants';
import { homeOverviewI18n } from '../../i18n';

export interface ScaTilesProps {
  tiles: ScaTilesData;
  /** Present once the SCA search resolves; enables the per-status links. */
  indexPatternId?: string;
}

interface ScaTileDef {
  key: keyof Pick<ScaTilesData, 'passed' | 'failed' | 'notApplicable'>;
  label: string;
  color: string;
  status: CheckResult;
  testSubj: string;
}

const TILES: ScaTileDef[] = [
  {
    key: 'passed',
    label: homeOverviewI18n.passed,
    color: HOME_OVERVIEW_COLOR.success,
    status: CheckResult.Passed,
    testSubj: 'sca-tile-passed',
  },
  {
    key: 'failed',
    label: homeOverviewI18n.failed,
    color: HOME_OVERVIEW_COLOR.failed,
    status: CheckResult.Failed,
    testSubj: 'sca-tile-failed',
  },
  {
    key: 'notApplicable',
    label: 'N/A',
    color: HOME_OVERVIEW_COLOR.info,
    status: CheckResult.NotApplicable,
    testSubj: 'sca-tile-not-applicable',
  },
];

/** Passed/Failed/N-A counts, each linking to Inventory filtered by `check.result`. */
export const ScaTiles: React.FC<ScaTilesProps> = ({
  tiles,
  indexPatternId,
}) => (
  <EuiFlexGroup gutterSize='m' responsive={false} wrap>
    {TILES.map(tile => {
      const number = <TabNumber value={tiles[tile.key]} />;
      return (
        <EuiFlexItem key={tile.key}>
          <StatTile
            value={
              indexPatternId ? (
                <RedirectAppLinks application={getCore().application}>
                  <EuiLink
                    style={{ fontWeight: 'inherit', color: tile.color }}
                    href={getConfigurationAssessmentByStatusUrl(
                      tile.status,
                      indexPatternId,
                    )}
                    data-test-subj={`${tile.testSubj}-link`}
                  >
                    {number}
                  </EuiLink>
                </RedirectAppLinks>
              ) : (
                number
              )
            }
            label={tile.label}
            color={tile.color}
            titleSize='m'
            reverse
            data-test-subj={tile.testSubj}
          />
        </EuiFlexItem>
      );
    })}
  </EuiFlexGroup>
);
