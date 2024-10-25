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
import { getMitreCount } from './lib';
import { useAsyncActionRunOnStart, useTimeFilter } from '../../../hooks';
import NavigationService from '../../../../../react-services/navigation-service';
import { getWzCurrentAppID } from '../../../../../kibana-services';
import {
  mitreAttack,
  endpointSummary,
} from '../../../../../utils/applications';

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
        <EuiText size='xs'>
          <EuiFlexGroup>
            <EuiFlexItem style={{ margin: 0, padding: '12px 0px 0px 10px' }}>
              <h3>Top Tactics</h3>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
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

  if (showTechniqueDetails) {
    const onChangeFlyout = () => {
      setShowTechniqueDetails('');
    };
    const openDiscover = (e, techniqueID) => {
      if (getWzCurrentAppID() === endpointSummary.id) {
        NavigationService.getInstance().navigateToApp(mitreAttack.id, {
          path: `#/overview?tab=mitre&tabView=dashboard&agentId=${agentId}`,
          filters: { 'rule.mitre.id': techniqueID },
        });
      }
    };
    console.log(getWzCurrentAppID(), 'getWzCurrentAppID');
    const openDashboard = (e, techniqueID) => {
      if (getWzCurrentAppID() === endpointSummary.id) {
        console.log('entre');
        NavigationService.getInstance().navigateToApp(mitreAttack.id, {
          path: `#/overview?tab=mitre&tabView=dashboard&agentId=${agentId}`,
          filters: { 'rule.mitre.id': techniqueID },
        });
      } else {
        NavigationService.getInstance().navigateToModule(e, 'overview', {
          tab: 'mitre',
          tabView: 'dashboard',
          filters: { 'rule.mitre.id': techniqueID },
        });
      }
    };
    return (
      <FlyoutTechnique
        openDashboard={(e, itemId) => openDashboard(e, itemId)}
        openDiscover={(e, itemId) => openDiscover(e, itemId)}
        implicitFilters={[{ 'agent.id': agentId }]}
        agentId={agentId}
        onChangeFlyout={onChangeFlyout}
        currentTechnique={showTechniqueDetails}
      />
    );
  }

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
      <EuiText size='xs'>
        <EuiFlexGroup>
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
      title={<h4>No results</h4>}
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
