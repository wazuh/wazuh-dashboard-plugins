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
import React, { Component } from 'react';
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
  EuiIcon
} from '@elastic/eui'
import { IFilterParams, getElasticAlerts } from '../../lib';
import { getToasts }  from '../../../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';

export class Tactics extends Component {
  _isMount = false;
  state: {
    tacticsList: Array<any>;
    tacticsCount: { key: string; doc_count: number }[];
    allSelected: boolean;
    loadingAlerts: boolean;
    isPopoverOpen: boolean;
    firstTime: boolean;
  };

  props!: {
    tacticsObject: object;
    selectedTactics: Array<any>;
    filterParams: IFilterParams;
    indexPattern: any;
    onChangeSelectedTactics(selectedTactics): void;
  };

  constructor(props) {
    super(props);
    this.state = {
      tacticsList: [],
      tacticsCount: [],
      allSelected: false,
      loadingAlerts: true,
      isPopoverOpen: false,
      firstTime: true,
    };
  }

  async componentDidMount() {
    this._isMount = true;
  }

  initTactics() {
    const tacticsIds = Object.keys(this.props.tacticsObject);
    const selectedTactics = {};

    tacticsIds.forEach((item, id) => {
      selectedTactics[item] = true;
    });

    this.props.onChangeSelectedTactics(selectedTactics);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { filterParams, indexPattern, selectedTactics, isLoading } = this.props;
    const { tacticsCount, loadingAlerts } = this.state;
    if (nextState.loadingAlerts !== loadingAlerts) return true;
    if (nextProps.isLoading !== isLoading) return true;
    if (JSON.stringify(nextProps.filterParams) !== JSON.stringify(filterParams)) return true;
    if (JSON.stringify(nextProps.indexPattern) !== JSON.stringify(indexPattern)) return true;
    if (JSON.stringify(nextState.tacticsCount) !== JSON.stringify(tacticsCount)) return true;
    if (JSON.stringify(nextState.selectedTactics) !== JSON.stringify(selectedTactics)) return true;
    return false;
  }

  async componentDidUpdate(prevProps) {
    const { isLoading, tacticsObject } = this.props;
    if (
      JSON.stringify(prevProps.tacticsObject) !== JSON.stringify(tacticsObject) ||
      isLoading !== prevProps.isLoading
    ) {
      this.getTacticsCount(this.state.firstTime);
    }
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  async getTacticsCount() {
    this.setState({ loadingAlerts: true });
    const { firstTime } = this.state;
    try {
      const { indexPattern, filterParams } = this.props;
      if (!indexPattern) {
        return;
      }
      const aggs = {
        tactics: {
          terms: {
            field: 'rule.mitre.tactic',
            size: 1000,
          },
        },
      };

      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const { data } = await getElasticAlerts(indexPattern, filterParams, aggs);
      const { buckets } = data.aggregations.tactics;
      if (firstTime) {
        this.initTactics(buckets); // top tactics are checked on component mount
      }
      this._isMount &&
        this.setState({ tacticsCount: buckets, loadingAlerts: false, firstTime: false });
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
      this.setState({ loadingAlerts: false });
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  facetClicked(id) {
    const { selectedTactics: oldSelected, onChangeSelectedTactics } = this.props;
    const selectedTactics = {
      ...oldSelected,
      [id]: !oldSelected[id],
    };
    onChangeSelectedTactics(selectedTactics);
  }

  getTacticsList() {
    const { tacticsCount } = this.state;
    const { selectedTactics } = this.props;
    const tacticsIds = Object.keys(this.props.tacticsObject);
    const tacticsList: Array<any> = tacticsIds.map((item) => {
      const quantity = (tacticsCount.find((tactic) => tactic.key === item) || {}).doc_count || 0;
      return {
        id: item,
        label: item,
        quantity,
        onClick: (id) => this.facetClicked(id),
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
                isLoading={this.state.loadingAlerts}
                icon={iconNode}
                onClick={facet.onClick ? () => facet.onClick(facet.id) : undefined}
              >
                {facet.label}
              </EuiFacetButton>
            );
          })}
      </>
    );
  }

  checkAllChecked(tacticList: any[]) {
    const { selectedTactics } = this.props;
    let allSelected = true;
    tacticList.forEach((item) => {
      if (!selectedTactics[item.id]) allSelected = false;
    });

    if (allSelected !== this.state.allSelected) {
      this.setState({ allSelected });
    }
  }

  onCheckAllClick() {
    const allSelected = !this.state.allSelected;
    const { selectedTactics, onChangeSelectedTactics } = this.props;
    Object.keys(selectedTactics).map((item) => {
      selectedTactics[item] = allSelected;
    });

    this.setState({ allSelected });
    onChangeSelectedTactics(selectedTactics);
  }

  onGearButtonClick() {
    this.setState({ isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ isPopoverOpen: false });
  }

  selectAll(status) {
    const { selectedTactics, onChangeSelectedTactics } = this.props;
    Object.keys(selectedTactics).map((item) => {
      selectedTactics[item] = status;
    });
    onChangeSelectedTactics(selectedTactics);
  }

  render() {
    const panels = [
      {
        id: 0,
        title: 'Options',
        items: [
          {
            name: 'Select all',
            icon: <EuiIcon type="check" size="m" />,
            onClick: () => {
              this.closePopover();
              this.selectAll(true);
            },
          },
          {
            name: 'Unselect all',
            icon: <EuiIcon type="cross" size="m" />,
            onClick: () => {
              this.closePopover();
              this.selectAll(false);
            },
          },
        ],
      },
    ];
    return (
      <div style={{ backgroundColor: '#80808014', padding: '10px 10px 0 10px', height: '100%' }}>
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
                  onClick={() => this.onGearButtonClick()}
                  aria-label={'tactics options'}
                ></EuiButtonIcon>
              }
              isOpen={this.state.isPopoverOpen}
              panelPaddingSize="none"
              closePopover={() => this.closePopover()}
            >
              <EuiContextMenu initialPanelId={0} panels={panels} />
            </EuiPopover>
          </EuiFlexItem>
        </EuiFlexGroup>
        {this.props.isLoading ? (
          <EuiFlexItem style={{ alignItems: 'center', marginTop: 50 }}>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
        ) : (
          <EuiFacetGroup style={{}}>{this.getTacticsList()}</EuiFacetGroup>
        )}
      </div>
    );
  }
}
