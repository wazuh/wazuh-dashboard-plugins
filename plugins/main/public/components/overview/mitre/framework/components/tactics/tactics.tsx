/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFacetButton,
  EuiFacetGroup,
  EuiPopover,
  EuiButtonIcon,
  EuiLoadingSpinner,
  EuiContextMenu,
  EuiIcon,
} from '@elastic/eui';
import { IFilterParams } from '../../lib';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { tSearchParams } from '../../../../../common/data-source';
import { tFilterParams } from '../../mitre';

type tTacticsState = {
  tacticsList: Array<any>;
  tacticsCount: { key: string; doc_count: number }[];
  allSelected: boolean;
  isPopoverOpen: boolean;
  firstTime: boolean;
};

type tTacticsProps = {
  tacticsObject: object;
  selectedTactics: object;
  filterParams: tFilterParams;
  isLoading: boolean;
  onChangeSelectedTactics(selectedTactics): void;
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
};

export const Tactics = (props: tTacticsProps) => {
  const {
    filterParams,
    selectedTactics,
    isLoading,
    tacticsObject,
    onChangeSelectedTactics,
    fetchData,
  } = props;
  const [state, setState] = useState<tTacticsState>({
    tacticsList: [],
    tacticsCount: [],
    allSelected: false,
    isPopoverOpen: false,
    firstTime: true,
  });
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

  const { tacticsCount, isPopoverOpen } = state;
  const initTactics = () => {
    const tacticsIds = Object.keys(tacticsObject);
    const selectedTactics = {};
    tacticsIds.forEach((item, id) => {
      selectedTactics[item] = true;
    });
    onChangeSelectedTactics(selectedTactics);
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }
    getTacticsCount();
  }, [isLoading]);

  const getTacticsCount = async () => {
    setIsLoadingAlerts(true);
    const { firstTime } = state;
    try {
      const { filterParams } = props;
      const aggs = {
        tactics: {
          terms: {
            field: 'rule.mitre.tactic',
            size: 1000,
          },
        },
      };
      const results = await fetchData({
        query: filterParams.query,
        dateRange: {
          from: filterParams?.time?.from || '',
          to: filterParams?.time?.to || '',
        },
        aggs,
      });
      const buckets = results.aggregations?.tactics?.buckets || [];
      if (firstTime) {
        initTactics(); // top tactics are checked on component mount
      }
      setState({ ...state, tacticsCount: buckets, firstTime: false });
      setIsLoadingAlerts(false);
    } catch (error) {
      const options = {
        context: `${Tactics.name}.getTacticsCount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Mitre alerts could not be fetched`,
        },
      };
      getErrorOrchestrator().handleError(options);
      setIsLoadingAlerts(false);
    }
  };

  const facetClicked = (id) => {
    const { selectedTactics: oldSelected, onChangeSelectedTactics } = props;
    const selectedTactics = {
      ...oldSelected,
      [id]: !oldSelected[id],
    };
    onChangeSelectedTactics(selectedTactics);
  };

  const getTacticsList = () => {
    const tacticsIds = Object.keys(tacticsObject);
    const tacticsList: Array<any> = tacticsIds.map((item) => {
      const quantity = (tacticsCount.find((tactic) => tactic.key === item) || {}).doc_count || 0;
      return {
        id: item,
        label: item,
        quantity,
        onClick: (id) => facetClicked(id),
      };
    });

    return (
      <>
        {tacticsList
          .sort((a, b) => b.quantity - a.quantity)
          .map((facet) => {
            let iconNode;
            return (
              <EuiFacetButton
                key={facet.id}
                id={`${facet.id}`}
                quantity={facet.quantity}
                isSelected={selectedTactics[facet.id]}
                isLoading={isLoadingAlerts}
                icon={iconNode}
                onClick={facet.onClick ? () => facet.onClick(facet.id) : undefined}
              >
                {facet.label}
              </EuiFacetButton>
            );
          })}
      </>
    );
  };

  const onGearButtonClick = () => {
    setState({ ...state, isPopoverOpen: !state.isPopoverOpen });
  };

  const closePopover = () => {
    setState({ ...state, isPopoverOpen: false });
  };

  const selectAll = (status) => {
    Object.keys(selectedTactics).map((item) => {
      selectedTactics[item] = status;
    });
    onChangeSelectedTactics(selectedTactics);
  };

  const panels = [
    {
      id: 0,
      title: 'Options',
      items: [
        {
          name: 'Select all',
          icon: <EuiIcon type="check" size="m" />,
          onClick: () => {
            closePopover();
            selectAll(true);
          },
        },
        {
          name: 'Unselect all',
          icon: <EuiIcon type="cross" size="m" />,
          onClick: () => {
            closePopover();
            selectAll(false);
          },
        },
      ],
    },
  ];
  return (
    <div
      style={{
        backgroundColor: '#80808014',
        padding: '10px 10px 0 10px',
        height: '100%',
      }}
    >
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size="m">
            <h1>Tactics</h1>
          </EuiTitle>
        </EuiFlexItem>

        <EuiFlexItem grow={false} style={{ marginTop: '15px', marginRight: 8 }}>
          <EuiPopover
            button={
              <EuiButtonIcon
                iconType="gear"
                onClick={() => onGearButtonClick()}
                aria-label={'tactics options'}
              ></EuiButtonIcon>
            }
            isOpen={isPopoverOpen}
            panelPaddingSize="none"
            closePopover={() => closePopover()}
          >
            <EuiContextMenu initialPanelId={0} panels={panels} />
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
      {isLoading ? (
        <EuiFlexItem style={{ alignItems: 'center', marginTop: 50 }}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexItem>
      ) : (
        <EuiFacetGroup style={{}}>{getTacticsList()}</EuiFacetGroup>
      )}
    </div>
  );
};
