import React from 'react';
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
import { homeOverviewI18n } from '../../i18n';

export interface SecurityAnalyticsTilesProps {
  rules: DataGroupResult<number>;
  decoders: DataGroupResult<number>;
  detectors: DataGroupResult<number>;
  integrations: DataGroupResult<number>;
  kvdbs: DataGroupResult<number>;
  filters: DataGroupResult<number>;
}

const TILES: ReadonlyArray<StatTileSpec<keyof SecurityAnalyticsTilesProps>> = [
  {
    key: 'rules',
    label: homeOverviewI18n.rules,
    testSubj: 'security-analytics-tile-rules',
    onSelect: getRulesUrl,
  },
  {
    key: 'decoders',
    label: homeOverviewI18n.decoders,
    testSubj: 'security-analytics-tile-decoders',
    onSelect: getDecodersUrl,
  },
  {
    key: 'detectors',
    label: homeOverviewI18n.detectors,
    testSubj: 'security-analytics-tile-detectors',
    onSelect: getDetectorsUrl,
  },
  {
    key: 'integrations',
    label: homeOverviewI18n.integrations,
    testSubj: 'security-analytics-tile-integrations',
    onSelect: getIntegrationsUrl,
  },
  {
    key: 'kvdbs',
    label: homeOverviewI18n.kvdbs,
    testSubj: 'security-analytics-tile-kvdbs',
    onSelect: getKvdbsUrl,
  },
  {
    key: 'filters',
    label: homeOverviewI18n.filters,
    testSubj: 'security-analytics-tile-filters',
    onSelect: getFiltersUrl,
  },
];

export const SecurityAnalyticsTiles: React.FC<
  SecurityAnalyticsTilesProps
> = props => <StatTileGroup tiles={TILES} results={props} />;
