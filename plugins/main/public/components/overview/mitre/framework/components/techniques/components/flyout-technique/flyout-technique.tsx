/*
 * Wazuh app - Mitre flyout components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiAccordion,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { getUiSettings } from '../../../../../../../../kibana-services';
import {
  FilterManager,
  IndexPattern,
} from '../../../../../../../../../../../src/plugins/data/public/';
import { UI_LOGGER_LEVELS } from '../../../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../../../react-services/common-services';
import { WzFlyout } from '../../../../../../../../components/common/flyouts';
import {
  techniquesColumns,
  agentTechniquesColumns,
} from './flyout-technique-columns';
import { PatternDataSource } from '../../../../../../../../components/common/data-source';
import { WazuhFlyoutDiscover } from '../../../../../../../common/wazuh-discover/wz-flyout-discover';
import { tFilterParams } from '../../../../mitre';
import TechniqueRowDetails from './technique-row-details';
import { buildPhraseFilter } from '../../../../../../../../../../../src/plugins/data/common';
import store from '../../../../../../../../redux/store';
import { wzDiscoverRenderColumns } from '../../../../../../../common/wazuh-discover/render-columns';
import { setFilters } from '../../../../../../../common/search-bar/set-filters';
import { useAsyncActionRunOnStart } from '../../../../../../../common/hooks/use_async_action_run_on_start';
import { getMitreResourcesByIds } from '../../../../../lib/get-mitre-resources-by-ids';
import {
  fetchTechnique,
  MitreItem,
  parseStats,
  STATS_AGGS,
  TechniqueStats as tTechniqueStats,
} from './lib/technique';
import { TechniqueHeader } from './technique-header';
import { TechniqueStats } from './technique-stats';
import { TechniqueDetails } from './technique-details';

type tFlyoutTechniqueProps = {
  currentTechnique: string;
  onChangeFlyout: (value: boolean) => void;
  openDiscover: (e: any, id: string) => void;
  filterParams?: Pick<tFilterParams, 'filters'>;
};

const getTactics = (ids?: string[]): Promise<MitreItem[]> =>
  ids?.length
    ? getMitreResourcesByIds<MitreItem>('tactics', ids)
    : Promise.resolve([]);

export const FlyoutTechnique = (props: tFlyoutTechniqueProps) => {
  const { currentTechnique, onChangeFlyout, openDiscover, filterParams } =
    props;
  const filterManager = useMemo(() => new FilterManager(getUiSettings()), []);
  const technique = useAsyncActionRunOnStart(fetchTechnique, [
    currentTechnique,
  ]);
  const tactics = useAsyncActionRunOnStart(getTactics, [
    technique.data?.tactics,
  ]);
  const [stats, setStats] = useState<{
    data?: tTechniqueStats;
    isLoading: boolean;
  }>({ isLoading: true });

  const reportError = (error: Error | null, title: string) => {
    if (!error) {
      return;
    }
    getErrorOrchestrator().handleError({
      context: `${FlyoutTechnique.name}.getTechniqueData`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      display: true,
      error: { error, message: error.message || error, title },
    });
  };

  useEffect(
    () =>
      reportError(
        technique.error,
        i18n.translate(
          'wazuh.mitreAttack.techniqueFlyout.errorFetchingTechnique',
          { defaultMessage: 'Error obtaining the requested technique' },
        ),
      ),
    [technique.error],
  );

  useEffect(
    () =>
      reportError(
        tactics.error,
        i18n.translate(
          'wazuh.mitreAttack.techniqueFlyout.errorFetchingTactics',
          { defaultMessage: 'Error obtaining the tactics of the technique' },
        ),
      ),
    [tactics.error],
  );

  const getFilters = (filter: { [key: string]: any }, indexPattern) => {
    const filtersToAdd = [];
    const key = Object.keys(filter)[0];
    const value = filter[key];
    const valuesArray = Array.isArray(value) ? [...value] : [value];
    valuesArray.map(item => {
      const formattedFilter = buildPhraseFilter(
        { name: key, type: 'string' },
        item,
        indexPattern,
      );
      if (formattedFilter) {
        filtersToAdd.push(formattedFilter);
      }
    });
    return filtersToAdd;
  };

  const onItemClick = (value: any, indexPattern: IndexPattern) => {
    // add filters to the filter state
    // generate the filter
    const newFilter = getFilters(value, indexPattern);
    filterManager.addFilters(newFilter);
  };

  const expandedRow = (props: { doc: any; item: any; indexPattern: any }) => {
    return (
      <TechniqueRowDetails
        {...props}
        onRuleItemClick={onItemClick}
        filters={[]}
        setFilters={setFilters(filterManager)}
      />
    );
  };

  const addRenderColumn = columns => {
    return columns.map(column => {
      const renderColumn = wzDiscoverRenderColumns.find(
        columnRender => columnRender.id === column.id,
      );
      if (renderColumn) {
        return { ...column, render: renderColumn.render };
      }
      return column;
    });
  };

  const getDiscoverColumns = () => {
    // when the agent is pinned
    const agentId = store.getState().appStateReducers?.currentAgentData?.id;
    return agentId
      ? addRenderColumn(agentTechniquesColumns)
      : addRenderColumn(techniquesColumns);
  };

  const onResults = (response?: Parameters<typeof parseStats>[0]) =>
    setStats({
      data: response ? parseStats(response) : undefined,
      isLoading: false,
    });

  return (
    <WzFlyout
      onClose={() => onChangeFlyout(false)}
      flyoutProps={{
        size: 'l',
        className: 'flyout-no-overlap wz-inventory wzApp',
        'aria-labelledby': 'flyoutSmallTitle',
      }}
    >
      <TechniqueHeader
        techniqueId={currentTechnique}
        technique={technique.data ?? undefined}
        tactics={tactics.data ?? []}
        isLoading={technique.running}
      />
      <EuiFlyoutBody>
        {/* One inset for every section, so they share a left edge */}
        <div style={{ padding: '16px 16px 0' }}>
          <TechniqueStats stats={stats.data} isLoading={stats.isLoading} />
          <EuiSpacer size='m' />
          <EuiAccordion
            id='details'
            initialIsOpen={true}
            buttonContent={
              <EuiTitle size='s'>
                <h3>
                  {i18n.translate(
                    'wazuh.mitreAttack.techniqueFlyout.details.title',
                    { defaultMessage: 'Technique details' },
                  )}
                </h3>
              </EuiTitle>
            }
            paddingSize='none'
          >
            <EuiSpacer size='m' />
            <TechniqueDetails
              techniqueId={currentTechnique}
              technique={technique.data ?? undefined}
              isLoading={technique.running}
              error={technique.error}
            />
          </EuiAccordion>
          <EuiSpacer size='l' />
          <EuiAccordion
            id='recent_events'
            className='events-accordion'
            buttonContent={
              <EuiTitle size='s'>
                <h3>
                  {i18n.translate(
                    'wazuh.mitreAttack.techniqueFlyout.recentFindings.title',
                    { defaultMessage: 'Recent findings' },
                  )}
                </h3>
              </EuiTitle>
            }
            extraAction={
              <EuiFlexGroup
                gutterSize='m'
                alignItems='center'
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiBadge color='hollow' iconType='filter'>
                    {i18n.translate(
                      'wazuh.mitreAttack.techniqueFlyout.recentFindings.filteredTo',
                      {
                        defaultMessage: 'Filtered to {id}',
                        values: { id: currentTechnique },
                      },
                    )}
                  </EuiBadge>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size='s'>
                    <EuiLink onClick={e => openDiscover(e, currentTechnique)}>
                      {i18n.translate(
                        'wazuh.mitreAttack.techniqueFlyout.recentFindings.openInFindings',
                        { defaultMessage: 'Open in Findings' },
                      )}
                    </EuiLink>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
            paddingSize='none'
            initialIsOpen={true}
          >
            <WazuhFlyoutDiscover
              DataSource={PatternDataSource}
              tableColumns={getDiscoverColumns()}
              filterManager={filterManager}
              initialFetchFilters={filterParams?.filters || []}
              expandedRowComponent={expandedRow}
              aggs={STATS_AGGS}
              onResults={onResults}
            />
          </EuiAccordion>
        </div>
      </EuiFlyoutBody>
    </WzFlyout>
  );
};
