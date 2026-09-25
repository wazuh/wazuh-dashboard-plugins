import React from 'react';
import { i18n } from '@osd/i18n';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import {
  getDecodersUrl,
  getDetectorsUrl,
  getFiltersUrl,
  getIntegrationsUrl,
  getKvdbsUrl,
  getRulesUrl,
} from '../../utils/navigation';

export interface SecurityAnalyticsTilesProps {
  rules: DataGroupResult<number>;
  decoders: DataGroupResult<number>;
  detectors: DataGroupResult<number>;
  integrations: DataGroupResult<number>;
  kvdbs: DataGroupResult<number>;
  filters: DataGroupResult<number>;
}

/**
 * Ordered by the Ruleset Management side menu: Overview (Integrations, with
 * Filters as its second tab), then Normalization (Decoders, KVDBs), then
 * Detection (Detectors, Rules).
 */
const TILES: ReadonlyArray<StatTileSpec<keyof SecurityAnalyticsTilesProps>> = [
  {
    key: 'integrations',
    label: i18n.translate(
      'wazuh.common.homeOverviewRulesetTiles.integrations',
      { defaultMessage: 'Integrations' },
    ),
    testSubj: 'security-analytics-tile-integrations',
    onSelect: getIntegrationsUrl,
  },
  {
    key: 'filters',
    label: i18n.translate('wazuh.common.homeOverviewRulesetTiles.filters', {
      defaultMessage: 'Filters',
    }),
    testSubj: 'security-analytics-tile-filters',
    onSelect: getFiltersUrl,
  },
  {
    key: 'decoders',
    label: i18n.translate('wazuh.common.homeOverviewRulesetTiles.decoders', {
      defaultMessage: 'Decoders',
    }),
    testSubj: 'security-analytics-tile-decoders',
    onSelect: getDecodersUrl,
  },
  {
    key: 'kvdbs',
    label: i18n.translate('wazuh.common.homeOverviewRulesetTiles.kvdbs', {
      defaultMessage: 'KVDBs',
    }),
    testSubj: 'security-analytics-tile-kvdbs',
    onSelect: getKvdbsUrl,
  },
  {
    key: 'detectors',
    label: i18n.translate('wazuh.common.homeOverviewRulesetTiles.detectors', {
      defaultMessage: 'Detectors',
    }),
    testSubj: 'security-analytics-tile-detectors',
    onSelect: getDetectorsUrl,
  },
  {
    key: 'rules',
    label: i18n.translate('wazuh.common.homeOverviewRulesetTiles.rules', {
      defaultMessage: 'Rules',
    }),
    testSubj: 'security-analytics-tile-rules',
    onSelect: getRulesUrl,
  },
];

export const SecurityAnalyticsTiles: React.FC<
  SecurityAnalyticsTilesProps
> = props => <StatTileGroup tiles={TILES} results={props} />;
