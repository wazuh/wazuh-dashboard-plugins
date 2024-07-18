/*
 * Wazuh app - Compliance flyout component
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
  EuiFlyoutHeader,
  EuiLoadingContent,
  EuiTitle,
  EuiToolTip,
  EuiIcon,
  EuiFlyoutBody,
  EuiAccordion,
  EuiFlexGroup,
  EuiText,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';
import { AppState } from '../../../../../react-services/app-state';
import { requirementGoal } from '../../requirement-goal';
import { getUiSettings } from '../../../../../kibana-services';
import {
  FilterManager,
  IndexPattern,
} from '../../../../../../../../src/plugins/data/public/';
import { WzFlyout } from '../../../../../components/common/flyouts';
import { WazuhFlyoutDiscover } from '../../../../common/wazuh-discover/wz-flyout-discover';
import { PatternDataSource } from '../../../../common/data-source';
import { formatUIDate } from '../../../../../react-services';
import TechniqueRowDetails from '../../../mitre/framework/components/techniques/components/flyout-technique/technique-row-details';
import { buildPhraseFilter } from '../../../../../../../../src/plugins/data/common';
import { connect } from 'react-redux';
import { wzDiscoverRenderColumns } from '../../../../common/wazuh-discover/render-columns';

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export const RequirementFlyout = connect(mapStateToProps)(
  class RequirementFlyout extends Component {
    _isMount = false;
    state: {};

    props!: {};

    filterManager: FilterManager;

    constructor(props) {
      super(props);
      this.state = {};
      this.filterManager = new FilterManager(getUiSettings());
    }

    componentDidMount() {
      this._isMount = true;
    }

    addRenderColumn(columns) {
      columns.map(column => {
        const renderColumn = wzDiscoverRenderColumns.find(
          columnRender => columnRender.id === column.id,
        );
        if (renderColumn) {
          column.render = renderColumn.render;
        }
        return column;
      });
      return columns;
    }

    getDiscoverColumns() {
      const columnsAgent = [
        {
          id: 'timestamp',
          displayAsText: 'Time',
          render: value => formatUIDate(value),
        },
        {
          id: this.props.getRequirementKey(),
          displayAsText: 'Requirement(s)',
        },
        { id: 'rule.description', displayAsText: 'Description' },
        { id: 'rule.level', displayAsText: 'Level' },
        {
          id: 'rule.id',
          displayAsText: 'Rule ID',
        },
      ];

      const columnsWithoutAgent = [
        {
          id: 'timestamp',
          displayAsText: 'Time',
          render: value => formatUIDate(value),
        },
        {
          id: 'agent.id',
          displayAsText: 'Agent',
        },
        {
          id: 'agent.name',
          displayAsText: 'Agent name',
        },
        {
          id: this.props.getRequirementKey(),
          displayAsText: 'Requirement',
        },
        { id: 'rule.description', displayAsText: 'Description' },
        { id: 'rule.level', displayAsText: 'Level' },
        {
          id: 'rule.id',
          displayAsText: 'Rule ID',
        },
      ];
      const agentId = this.props.currentAgentData?.id;
      return agentId
        ? this.addRenderColumn(columnsAgent)
        : this.addRenderColumn(columnsWithoutAgent);
    }

    renderHeader() {
      const { currentRequirement } = this.props;
      return (
        <EuiFlyoutHeader hasBorder style={{ padding: '12px 16px' }}>
          {(!currentRequirement && (
            <div>
              <EuiLoadingContent lines={1} />
            </div>
          )) || (
            <EuiTitle size='m'>
              <h2 id='flyoutSmallTitle'>Requirement {currentRequirement}</h2>
            </EuiTitle>
          )}
        </EuiFlyoutHeader>
      );
    }

    renderDiscoverExpandedRow(props: {
      doc: any;
      item: any;
      indexPattern: any;
    }) {
      return (
        <TechniqueRowDetails
          {...props}
          onRuleItemClick={(value: any, indexPattern: IndexPattern) => {
            // add filters to the filter state
            // generate the filter
            const key = Object.keys(value)[0];
            const filterValue = value[key];
            const valuesArray = Array.isArray(filterValue)
              ? [...filterValue]
              : [filterValue];
            const newFilter = valuesArray
              .map(item =>
                buildPhraseFilter(
                  { name: key, type: 'string' },
                  item,
                  indexPattern,
                ),
              )
              .filter(Boolean);

            this.filterManager.addFilters(newFilter);
          }}
        />
      );
    }

    renderBody() {
      const { currentRequirement } = this.props;
      const requirementImplicitFilter = {};
      const isCluster = (AppState.getClusterInfo() || {}).status === 'enabled';
      const clusterFilter = isCluster
        ? { 'cluster.name': AppState.getClusterInfo().cluster }
        : { 'manager.name': AppState.getClusterInfo().manager };
      this.clusterFilter = clusterFilter;
      requirementImplicitFilter[this.props.getRequirementKey()] =
        currentRequirement;

      const implicitFilters = [requirementImplicitFilter, this.clusterFilter];
      if (this.props.implicitFilters) {
        this.props.implicitFilters.forEach(item => implicitFilters.push(item));
      }
      //Goal for PCI
      const currentReq = this.props.currentRequirement.split('.')[0];

      return (
        <EuiFlyoutBody className='flyout-body'>
          <EuiAccordion
            id={'details'}
            buttonContent={
              <EuiTitle size='s'>
                <h3>Details</h3>
              </EuiTitle>
            }
            paddingSize='xs'
            initialIsOpen={true}
          >
            <div className='flyout-row details-row'>
              <EuiSpacer size='xs' />
              {requirementGoal[currentReq] && (
                <EuiFlexGroup style={{ marginBottom: 10 }}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon
                      size='l'
                      type={'bullseye'}
                      color='primary'
                      style={{ marginTop: 8 }}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem style={{ marginLeft: 2 }} grow={true}>
                    <EuiText style={{ marginLeft: 8, fontSize: 14 }}>
                      <p style={{ fontWeight: 500, marginBottom: 2 }}>Goals</p>

                      <p>{requirementGoal[currentReq]}</p>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}

              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiIcon
                    size='l'
                    type={'filebeatApp'}
                    color='primary'
                    style={{ marginTop: 8 }}
                  />
                </EuiFlexItem>
                <EuiFlexItem style={{ marginLeft: 2 }} grow={true}>
                  <EuiText style={{ marginLeft: 8, fontSize: 14 }}>
                    <p style={{ fontWeight: 500, marginBottom: 2 }}>
                      Requirement description
                    </p>

                    <p>{this.props.description}</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size='xs' />
            </div>
          </EuiAccordion>

          <EuiSpacer size='s' />
          <EuiAccordion
            style={{ textDecoration: 'none' }}
            id={'recent_events'}
            className='events-accordion'
            buttonContent={
              <EuiTitle size='s'>
                <h3>
                  Recent events
                  {this.props.view !== 'events' && (
                    <span style={{ marginLeft: 16 }}>
                      <span>
                        <EuiToolTip
                          position='top'
                          content={
                            'Show ' + currentRequirement + ' in Dashboard'
                          }
                        >
                          <EuiIcon
                            onMouseDown={e => {
                              this.props.openDashboard(e, currentRequirement);
                              e.stopPropagation();
                            }}
                            color='primary'
                            type='visualizeApp'
                            style={{ marginRight: '10px' }}
                          ></EuiIcon>
                        </EuiToolTip>
                        <EuiToolTip
                          position='top'
                          content={
                            'Inspect ' + currentRequirement + ' in Events'
                          }
                        >
                          <EuiIcon
                            onMouseDown={e => {
                              this.props.openDiscover(e, currentRequirement);
                              e.stopPropagation();
                            }}
                            color='primary'
                            type='discoverApp'
                          ></EuiIcon>
                        </EuiToolTip>
                      </span>
                    </span>
                  )}
                </h3>
              </EuiTitle>
            }
            paddingSize='none'
            initialIsOpen={true}
          >
            <div className='details-row'>
              <WazuhFlyoutDiscover
                DataSource={PatternDataSource}
                tableColumns={this.getDiscoverColumns()}
                filterManager={this.filterManager}
                initialFetchFilters={this.props.fetchFilters}
                expandedRowComponent={(...args) =>
                  this.renderDiscoverExpandedRow(...args)
                }
              />
            </div>
          </EuiAccordion>
        </EuiFlyoutBody>
      );
    }

    renderLoading() {
      return (
        <EuiFlyoutBody>
          <EuiLoadingContent lines={2} />
          <EuiLoadingContent lines={3} />
        </EuiFlyoutBody>
      );
    }

    render() {
      const { currentRequirement } = this.props;
      const { onChangeFlyout } = this.props;
      return (
        <WzFlyout
          onClose={() => onChangeFlyout(false)}
          flyoutProps={{
            maxWidth: '60%',
            size: 'l',
            className: 'flyout-no-overlap wz-inventory wzApp',
            'aria-labelledby': 'flyoutSmallTitle',
          }}
        >
          {currentRequirement && this.renderHeader()}
          {this.renderBody()}
          {this.state.loading && this.renderLoading()}
        </WzFlyout>
      );
    }
  },
);
