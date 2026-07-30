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
    label: 'Rules',
    testSubj: 'security-analytics-tile-rules',
    onSelect: getRulesUrl,
  },
  {
    key: 'decoders',
    label: 'Decoders',
    testSubj: 'security-analytics-tile-decoders',
    onSelect: getDecodersUrl,
  },
  {
    key: 'detectors',
    label: 'Detectors',
    testSubj: 'security-analytics-tile-detectors',
    onSelect: getDetectorsUrl,
  },
  {
    key: 'integrations',
    label: 'Integrations',
    testSubj: 'security-analytics-tile-integrations',
    onSelect: getIntegrationsUrl,
  },
  {
    key: 'kvdbs',
    label: 'KVDBs',
    testSubj: 'security-analytics-tile-kvdbs',
    onSelect: getKvdbsUrl,
  },
  {
    key: 'filters',
    label: 'Filters',
    testSubj: 'security-analytics-tile-filters',
    onSelect: getFiltersUrl,
  },
];

export const SecurityAnalyticsTiles: React.FC<
  SecurityAnalyticsTilesProps
> = props => <StatTileGroup tiles={TILES} results={props} />;
