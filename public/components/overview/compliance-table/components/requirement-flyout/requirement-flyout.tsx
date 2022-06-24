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
  EuiFlyout,
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
  EuiLink,
  EuiStat,
  EuiDescriptionList,
  EuiSpacer,
} from '@elastic/eui';
import { Discover } from '../../../../common/modules/discover';
import { AppState } from '../../../../../react-services/app-state';
import { requirementGoal } from '../../requirement-goal';
import { getUiSettings } from '../../../../../kibana-services';
import { FilterManager } from '../../../../../../../../src/plugins/data/public/';
import { WzFlyout } from '../../../../../components/common/flyouts';

export class RequirementFlyout extends Component {
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

  renderHeader() {
    const { currentRequirement } = this.props;
    return (
      <EuiFlyoutHeader hasBorder style={{ padding: '12px 16px' }}>
        {(!currentRequirement && (
          <div>
            <EuiLoadingContent lines={1} />
          </div>
        )) || (
          <EuiTitle size="m">
            <h2 id="flyoutSmallTitle">Requirement {currentRequirement}</h2>
          </EuiTitle>
        )}
      </EuiFlyoutHeader>
    );
  }

  updateTotalHits = (total) => {
    this.setState({ totalHits: total });
  };

  renderBody() {
    const { currentRequirement } = this.props;
    const requirementImplicitFilter = {};
    const isCluster = (AppState.getClusterInfo() || {}).status === 'enabled';
    const clusterFilter = isCluster
      ? { 'cluster.name': AppState.getClusterInfo().cluster }
      : { 'manager.name': AppState.getClusterInfo().manager };
    this.clusterFilter = clusterFilter;
    requirementImplicitFilter[this.props.getRequirementKey()] = currentRequirement;

    const implicitFilters = [requirementImplicitFilter, this.clusterFilter];
    if (this.props.implicitFilters) {
      this.props.implicitFilters.forEach((item) => implicitFilters.push(item));
    }
    //Goal for PCI
    const currentReq = this.props.currentRequirement.split('.')[0];

    return (
      <EuiFlyoutBody className="flyout-body">
        <EuiAccordion
          id={'details'}
          buttonContent={
            <EuiTitle size="s">
              <h3>Details</h3>
            </EuiTitle>
          }
          paddingSize="xs"
          initialIsOpen={true}
        >
          <div className="flyout-row details-row">
            <EuiSpacer size="xs" />
            {requirementGoal[currentReq] && (
              <EuiFlexGroup style={{ marginBottom: 10 }}>
                <EuiFlexItem grow={false}>
                  <EuiIcon size="l" type={'bullseye'} color="primary" style={{ marginTop: 8 }} />
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
                <EuiIcon size="l" type={'filebeatApp'} color="primary" style={{ marginTop: 8 }} />
              </EuiFlexItem>
              <EuiFlexItem style={{ marginLeft: 2 }} grow={true}>
                <EuiText style={{ marginLeft: 8, fontSize: 14 }}>
                  <p style={{ fontWeight: 500, marginBottom: 2 }}>Requirement description</p>

                  <p>{this.props.description}</p>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="xs" />
          </div>
        </EuiAccordion>

        <EuiSpacer size="s" />
        <EuiAccordion
          style={{ textDecoration: 'none' }}
          id={'recent_events'}
          className="events-accordion"
          extraAction={
            <div style={{ marginBottom: 5 }}>
              <strong>{this.state.totalHits || 0}</strong> hits
            </div>
          }
          buttonContent={
            <EuiTitle size="s">
              <h3>
                Recent events
                {this.props.view !== 'events' && (
                  <span style={{ marginLeft: 16 }}>
                    <span>
                      <EuiToolTip
                        position="top"
                        content={'Show ' + currentRequirement + ' in Dashboard'}
                      >
                        <EuiIcon
                          onMouseDown={(e) => {
                            this.props.openDashboard(e, currentRequirement);
                            e.stopPropagation();
                          }}
                          color="primary"
                          type="visualizeApp"
                          style={{ marginRight: '10px' }}
                        ></EuiIcon>
                      </EuiToolTip>
                      <EuiToolTip
                        position="top"
                        content={'Inspect ' + currentRequirement + ' in Events'}
                      >
                        <EuiIcon
                          onMouseDown={(e) => {
                            this.props.openDiscover(e, currentRequirement);
                            e.stopPropagation();
                          }}
                          color="primary"
                          type="discoverApp"
                        ></EuiIcon>
                      </EuiToolTip>
                    </span>
                  </span>
                )}
              </h3>
            </EuiTitle>
          }
          paddingSize="none"
          initialIsOpen={true}
        >
          <EuiFlexGroup className="flyout-row">
            <EuiFlexItem>
              <Discover
                kbnSearchBar
                shareFilterManager={this.filterManager}
                initialColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: 'agent.id', label: 'Agent' },
                  { field: 'agent.name', label: 'Agent name' },
                  { field: this.props.getRequirementKey() },
                  { field: 'rule.description', label: 'Description' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                ]}
                initialAgentColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: this.props.getRequirementKey() },
                  { field: 'rule.description', label: 'Description' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                ]}
                implicitFilters={implicitFilters}
                initialFilters={[]}
                updateTotalHits={(total) => this.updateTotalHits(total)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
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
}
