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
  EuiFacetButton,
  EuiButtonIcon,
  EuiLoadingChart,
  EuiEmptyPrompt,
  EuiSpacer,
} from '@elastic/eui';
import { Typography } from '../../../typography/typography';
import { FlyoutTechnique } from '../../../../overview/mitre/framework/components/techniques/components/flyout-technique';
import { getMitreCount } from './lib';
import { useAsyncActionRunOnStart, useTimeFilter } from '../../../hooks';
import NavigationService from '../../../../../react-services/navigation-service';
import { AppState } from '../../../../../react-services';
import { mitreAttack } from '../../../../../utils/applications';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../data-source/pattern/pattern-data-source-filter-manager';

const getTacticsData = async (agentId, timeFilter) => {
  return await getMitreCount(agentId, timeFilter, undefined);
};

const getTechniques = async (agentId, timeFilter, tacticID) => {
  return await getMitreCount(agentId, timeFilter, tacticID);
};

const MitreTopTacticsTactics = ({
  agentId,
  renderEmpty,
  setView,
  setSelectedTactic,
  timeFilter,
}) => {
  const getData = useAsyncActionRunOnStart(getTacticsData, [
    agentId,
    timeFilter,
  ]);

  if (getData.running) {
    return (
      <div style={{ display: 'block', textAlign: 'center', paddingTop: 100 }}>
        <EuiLoadingChart size='xl' />
      </div>
    );
  }

  if (getData?.data?.length === 0) {
    return renderEmpty();
  }
  return (
    <>
      <div className='wz-agents-mitre'>
        <EuiFlexGroup>
          <EuiFlexItem>
            <Typography level='card'>Top Tactics</Typography>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {getData?.data?.map(tactic => (
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
};

const MitreTopTacticsTechniques = ({
  agentId,
  renderEmpty,
  selectedTactic,
  setView,
  timeFilter,
}) => {
  const getData = useAsyncActionRunOnStart(getTechniques, [
    agentId,
    timeFilter,
    selectedTactic,
  ]);

  const [showTechniqueDetails, setShowTechniqueDetails] = useState<string>('');

  const onChangeFlyout = () => {
    setShowTechniqueDetails('');
  };

  const goToDashboardWithFilter = async (e, techniqueID) => {
    const indexPatternId = AppState.getCurrentPattern();
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
    const indexPatternId = AppState.getCurrentPattern();
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

  if (getData.running) {
    return (
      <div style={{ display: 'block', textAlign: 'center', paddingTop: 100 }}>
        <EuiLoadingChart size='xl' />
      </div>
    );
  }

  if (getData?.data?.length === 0) {
    return renderEmpty();
  }
  return (
    <>
      <EuiFlexGroup alignItems='center' gutterSize='s'>
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
          <Typography level='card'>{selectedTactic}</Typography>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <EuiFlexGroup>
        <EuiFlexItem>
          {getData.data.map(tactic => (
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
};

export const MitreTopTactics = ({ agentId }) => {
  const [view, setView] = useState<'tactics' | 'techniques'>('tactics');
  const [selectedTactic, setSelectedTactic] = useState<string>('');
  const { timeFilter } = useTimeFilter();

  useEffect(() => {
    setView('tactics');
  }, [agentId]);

  const renderEmpty = () => (
    <EuiEmptyPrompt
      iconType='stats'
      title={<h4 style={{ fontWeight: 'normal' }}>No results</h4>}
      titleSize='xs'
      body={
        <p>No MITRE ATT&CK results were found in the selected time range.</p>
      }
    />
  );

  if (view === 'tactics') {
    return (
      <MitreTopTacticsTactics
        agentId={agentId}
        timeFilter={timeFilter}
        renderEmpty={renderEmpty}
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
        renderEmpty={renderEmpty}
        selectedTactic={selectedTactic}
        setSelectedTactic={setSelectedTactic}
        setView={setView}
      />
    );
  }
};
