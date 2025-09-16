/*
 * Wazuh app - React component information about MITRE ATT&CK top tactics.
 *
 * Copyright (C) 2015-2023 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiFacetButton,
  EuiButtonIcon,
  EuiLoadingChart,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { FlyoutTechnique } from '../../../../overview/mitre/framework/components/techniques/components/flyout-technique';
import { useTimeFilter } from '../../../hooks';
import NavigationService from '../../../../../react-services/navigation-service';
import { mitreAttack } from '../../../../../utils/applications';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../data-source/pattern/pattern-data-source-filter-manager';
import { compose } from 'redux';
import { withDataSourceFetch, withGuard } from '../../../hocs';
import {
  AlertsDataSourceRepository,
  MitreAttackDataSource,
} from '../../../data-source';

const PromptNoData = () => (
  <EuiEmptyPrompt
    iconType='stats'
    title={<h4>No results</h4>}
    body={<p>No MITRE ATT&CK results were found in the selected time range.</p>}
  />
);

const MitreTopTacticsTactics = compose(
  withDataSourceFetch({
    DataSource: MitreAttackDataSource,
    DataSourceRepositoryCreator: AlertsDataSourceRepository,
    mapRequestParams(props) {
      const [, , dateRange] = props.dependencies;
      return {
        aggs: {
          tactics: {
            terms: {
              field: 'rule.mitre.tactic',
              size: 5,
            },
          },
        },
        dateRange,
      };
    },
    mapFetchActionDependencies(props) {
      return [
        props.timeFilter,
        /* Changing the agent causes the fetchFilters change, and the HOC manage this case so it is not
    requried adding the agent to the dependencies */
        ,
      ];
    },
    mapResponse(response) {
      return response?.aggregations?.tactics?.buckets;
    },
    FetchingDataComponent: () => (
      <div style={{ display: 'block', textAlign: 'center', paddingTop: 100 }}>
        <EuiLoadingChart size='xl' />
      </div>
    ),
  }),
  withGuard(
    ({ dataSourceAction }) => dataSourceAction?.data?.length === 0,
    PromptNoData,
  ),
)(({ dataSourceAction, setView, setSelectedTactic }) => {
  return (
    <>
      <div className='wz-agents-mitre'>
        <EuiText size='xs'>
          <EuiFlexGroup>
            <EuiFlexItem style={{ margin: 0, padding: '12px 0px 0px 10px' }}>
              <h3>Top Tactics</h3>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
        <EuiFlexGroup>
          <EuiFlexItem>
            {dataSourceAction?.data?.map(tactic => (
              <EuiFacetButton
                key={tactic.key}
                quantity={tactic.doc_count}
                onClick={() => {
                  setView('techniques');
                  setSelectedTactic(tactic.key);
                }}
              >
                {tactic.key}
              </EuiFacetButton>
            ))}
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
});

const MitreTopTacticsTechniquesHeader = ({ selectedTactic, setView }) => (
  <EuiText size='xs'>
    <EuiFlexGroup>
      {/* TODO: this should be splitted separating the header, to allow go back */}
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          size={'s'}
          color={'primary'}
          onClick={() => {
            setView('tactics');
          }}
          iconType='sortLeft'
          aria-label='Back Top Tactics'
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <h3>{selectedTactic}</h3>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiText>
);

const MitreTopTacticsTechniquesBody = compose(
  withDataSourceFetch({
    DataSource: MitreAttackDataSource,
    DataSourceRepositoryCreator: AlertsDataSourceRepository,
    mapRequestParams(props) {
      const [, , dateRange, selectedTactic] = props.dependencies;
      return {
        filters: [
          ...props.dataSource.fetchFilters,
          PatternDataSourceFilterManager.createFilter(
            FILTER_OPERATOR.IS,
            'rule.mitre.tactic',
            selectedTactic,
            props.dataSource.dataSource.indexPattern.id,
          ),
        ],
        aggs: {
          tactics: {
            terms: {
              field: 'rule.mitre.id',
              size: 5,
            },
          },
        },
        dateRange,
      };
    },
    mapFetchActionDependencies(props) {
      return [
        props.timeFilter,
        props.selectedTactic,
        /* Changing the agent causes the fetchFilters change, and the HOC manage this case so it is not
    requried adding the agent to the dependencies */
      ];
    },
    mapResponse(response, props) {
      return [];
      return response?.aggregations?.tactics?.buckets;
    },
    FetchingDataComponent: () => (
      <div style={{ display: 'block', textAlign: 'center', paddingTop: 100 }}>
        <EuiLoadingChart size='xl' />
      </div>
    ),
  }),
  withGuard(
    ({ dataSourceAction }) => dataSourceAction?.data?.length === 0,
    PromptNoData,
  ),
)(({ agentId, dataSource, dataSourceAction }) => {
  console.log('dataSourceAction', dataSourceAction);
  const [showTechniqueDetails, setShowTechniqueDetails] = useState<string>('');

  const onChangeFlyout = () => {
    setShowTechniqueDetails('');
  };

  const goToDashboardWithFilter = async (e, techniqueID) => {
    const indexPatternId = dataSource.dataSourece.indexPattern.id;
    const filters = [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        `rule.mitre.id`,
        techniqueID,
        indexPatternId,
      ),
    ];

    const params = `tab=mitre&tabView=dashboard&agentId=${agentId}&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
      filters,
    )}`;
    NavigationService.getInstance().navigateToApp(mitreAttack.id, {
      path: `#/overview?${params}`,
    });
  };

  const goToEventsWithFilter = async (e, techniqueID) => {
    const indexPatternId = dataSource.dataSourece.indexPattern.id;
    const filters = [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        `rule.mitre.id`,
        techniqueID,
        indexPatternId,
      ),
    ];

    const params = `tab=mitre&tabView=events&agentId=${agentId}&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
      filters,
    )}`;
    NavigationService.getInstance().navigateToApp(mitreAttack.id, {
      path: `#/overview?${params}`,
    });
  };

  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem>
          {dataSourceAction.data?.map(tactic => (
            <EuiFacetButton
              key={tactic.key}
              quantity={tactic.doc_count}
              onClick={() => {
                setShowTechniqueDetails(tactic.key);
              }}
            >
              {tactic.key}
            </EuiFacetButton>
          ))}
        </EuiFlexItem>
        {showTechniqueDetails && (
          <FlyoutTechnique
            openDashboard={(e, itemId) => goToDashboardWithFilter(e, itemId)}
            openDiscover={(e, itemId) => goToEventsWithFilter(e, itemId)}
            implicitFilters={[{ 'agent.id': agentId }]}
            agentId={agentId}
            onChangeFlyout={onChangeFlyout}
            currentTechnique={showTechniqueDetails}
          />
        )}
      </EuiFlexGroup>
    </>
  );
});

const MitreTopTacticsTechniques = props => (
  <>
    <MitreTopTacticsTechniquesHeader
      selectedTactic={props.selectedTactic}
      setView={props.setView}
    />
    <MitreTopTacticsTechniquesBody {...props} />
  </>
);

export const MitreTopTactics = ({ agentId }) => {
  const [view, setView] = useState<'tactics' | 'techniques'>('tactics');
  const [selectedTactic, setSelectedTactic] = useState<string>('');
  const { timeFilter } = useTimeFilter();

  useEffect(() => {
    setView('tactics');
  }, [agentId]);

  if (view === 'tactics') {
    return (
      <MitreTopTacticsTactics
        agentId={agentId}
        timeFilter={timeFilter}
        setSelectedTactic={setSelectedTactic}
        setView={setView}
      />
    );
  }

  if (view === 'techniques') {
    return (
      <MitreTopTacticsTechniques
        agentId={agentId}
        timeFilter={timeFilter}
        selectedTactic={selectedTactic}
        setSelectedTactic={setSelectedTactic}
        setView={setView}
      />
    );
  }
};
