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
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiTitle,
  EuiFieldSearch,
  EuiSpacer,
  EuiCallOut,
  EuiToolTip,
  EuiSwitch,
  EuiPopover,
  EuiText,
  EuiIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { AppNavigate } from '../../../../../react-services/app-navigate';
import { AppState } from '../../../../../react-services/app-state';
import { RequirementFlyout } from '../requirement-flyout/requirement-flyout';
import { getDataPlugin } from '../../../../../kibana-services';
import { getSettingDefaultValue } from '../../../../../../common/services/settings';

export class ComplianceSubrequirements extends Component {
  _isMount = false;
  state: {};

  props!: {};

  constructor(props) {
    super(props);
    this.state = {
      hideAlerts: false,
      searchValue: '',
    };
  }

  hideAlerts() {
    this.setState({ hideAlerts: !this.state.hideAlerts });
  }

  onSearchValueChange = (e) => {
    this.setState({ searchValue: e.target.value });
  };

  /**
   * Adds a new filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
   * @param filter
   */
  addFilter(filter) {
    const { filterManager } = getDataPlugin().query;
    const matchPhrase = {};
    matchPhrase[filter.key] = filter.value;
    const newFilter = {
      meta: {
        disabled: false,
        key: filter.key,
        params: { query: filter.value },
        type: 'phrase',
        negate: filter.negate || false,
        index: AppState.getCurrentPattern() || getSettingDefaultValue('pattern'),
      },
      query: { match_phrase: matchPhrase },
      $state: { store: 'appState' },
    };
    filterManager.addFilters([newFilter]);
  }

  getRequirementKey() {
    if (this.props.section === 'pci') {
      return 'rule.pci_dss';
    }
    if (this.props.section === 'gdpr') {
      return 'rule.gdpr';
    }
    if (this.props.section === 'nist') {
      return 'rule.nist_800_53';
    }
    if (this.props.section === 'hipaa') {
      return 'rule.hipaa';
    }
    if (this.props.section === 'tsc') {
      return 'rule.tsc';
    }
    return 'pci_dss';
  }

  openDashboardCurrentWindow(requirementId) {
    this.addFilter({ key: this.getRequirementKey(), value: requirementId, negate: false });
    this.props.onSelectedTabChanged('dashboard');
  }

  openDiscoverCurrentWindow(requirementId) {
    this.addFilter({ key: this.getRequirementKey(), value: requirementId, negate: false });
    this.props.onSelectedTabChanged('events');
  }

  openDiscover(e, requirementId) {
    const filters = {};
    filters[this.getRequirementKey()] = requirementId;
    AppNavigate.navigateToModule(
      e,
      'overview',
      { tab: this.props.section, tabView: 'discover', filters },
      () => this.openDiscoverCurrentWindow(requirementId)
    );
  }

  openDashboard(e, requirementId) {
    const filters = {};
    filters[this.getRequirementKey()] = requirementId;
    AppNavigate.navigateToModule(
      e,
      'overview',
      { tab: this.props.section, tabView: 'panels', filters },
      () => this.openDashboardCurrentWindow(requirementId)
    );
  }

  renderFacet() {
    const { complianceObject } = this.props;
    const { requirementsCount } = this.props;
    const tacticsToRender: Array<any> = [];
    const showTechniques = {};

    Object.keys(complianceObject).forEach((key, inx) => {
      const currentTechniques = complianceObject[key];
      if (this.props.selectedRequirements[key]) {
        currentTechniques.forEach((technique, idx) => {
          if (
            !showTechniques[technique] &&
            (technique.toLowerCase().includes(this.state.searchValue.toLowerCase()) ||
              this.props.descriptions[technique]
                .toLowerCase()
                .includes(this.state.searchValue.toLowerCase()))
          ) {
            const quantity =
              (requirementsCount.find((item) => item.key === technique) || {}).doc_count || 0;
            if (!this.state.hideAlerts || (this.state.hideAlerts && quantity > 0)) {
              showTechniques[technique] = true;
              tacticsToRender.push({
                id: technique,
                label: `${technique} - ${this.props.descriptions[technique]}`,
                quantity,
              });
            }
          }
        });
      }
    });

    const tacticsToRenderOrdered = tacticsToRender
      .sort((a, b) => b.quantity - a.quantity)
      .map((item, idx) => {
        const tooltipContent = `View details of ${item.id}`;
        const toolTipAnchorClass =
          'wz-display-inline-grid' + (this.state.hover === item.id ? ' wz-mitre-width' : ' ');
        return (
          <EuiFlexItem
            onMouseEnter={() => this.setState({ hover: item.id })}
            onMouseLeave={() => this.setState({ hover: '' })}
            key={idx}
            style={{ border: '1px solid #8080804a', maxWidth: 'calc(25% - 8px)', maxHeight: 41 }}
          >
            <EuiPopover
              id="techniqueActionsContextMenu"
              anchorClassName="wz-width-100"
              button={
                <EuiFacetButton
                  style={{
                    width: '100%',
                    padding: '0 5px 0 5px',
                    lineHeight: '40px',
                    maxHeight: '40px',
                  }}
                  quantity={item.quantity}
                  className={'module-table'}
                  onClick={() => {
                    this.showFlyout(item.id);
                  }}
                >
                  <EuiToolTip
                    position="top"
                    content={tooltipContent}
                    anchorClassName={toolTipAnchorClass}
                  >
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.id} - {this.props.descriptions[item.id]}
                    </span>
                  </EuiToolTip>

                  {this.state.hover === item.id && (
                    <span style={{ float: 'right', position: 'fixed' }}>
                      <EuiToolTip position="top" content={'Show ' + item.id + ' in Dashboard'}>
                        <EuiIcon
                          onMouseDown={(e) => {
                            this.openDashboard(e, item.id);
                            e.stopPropagation();
                          }}
                          color="primary"
                          type="visualizeApp"
                        ></EuiIcon>
                      </EuiToolTip>{' '}
                      &nbsp;
                      <EuiToolTip position="top" content={'Inspect ' + item.id + ' in Events'}>
                        <EuiIcon
                          onMouseDown={(e) => {
                            this.openDiscover(e, item.id);
                            e.stopPropagation();
                          }}
                          color="primary"
                          type="discoverApp"
                        ></EuiIcon>
                      </EuiToolTip>
                    </span>
                  )}
                </EuiFacetButton>
              }
              isOpen={this.state.actionsOpen === item.id}
              closePopover={() => {}}
              panelPaddingSize="none"
              style={{ width: '100%' }}
              anchorPosition="downLeft"
            >
              xxx
            </EuiPopover>
          </EuiFlexItem>
        );
      });
    if (tacticsToRender.length) {
      return (
        <EuiFlexGrid
          columns={4}
          gutterSize="s"
          style={{
            maxHeight: 'calc(100vh - 420px)',
            overflow: 'overlay',
            overflowX: 'hidden',
            maxWidth: '82vw',
            paddingRight: 10,
          }}
        >
          {tacticsToRenderOrdered}
        </EuiFlexGrid>
      );
    } else {
      return (
        <EuiCallOut title="There are no results." iconType="help" color="warning"></EuiCallOut>
      );
    }
  }

  onChangeFlyout = (flyoutOn) => {
    this.setState({ flyoutOn });
  };

  closeFlyout() {
    this.setState({ flyoutOn: false });
  }

  showFlyout(requirement) {
    this.setState({
      selectedRequirement: requirement,
      flyoutOn: true,
    });
  }

  render() {
    return (
      <div style={{ padding: 10 }}>
        <EuiFlexGroup>
          <EuiFlexItem grow={true}>
            <EuiTitle size="m">
              <h1>Requirements</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiText grow={false}>
                  <span>Hide requirements with no alerts </span> &nbsp;
                  <EuiSwitch
                    label=""
                    checked={this.state.hideAlerts}
                    onChange={(e) => this.hideAlerts()}
                  />
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />

        <EuiFieldSearch
          fullWidth={true}
          placeholder="Filter requirements"
          value={this.state.searchValue}
          onChange={(e) => this.onSearchValueChange(e)}
          isClearable={true}
          aria-label="Use aria labels when no actual label is in use"
        />
        <EuiSpacer size="s" />

        <div>
          {this.props.loadingAlerts ? (
            <EuiFlexItem style={{ height: 'calc(100vh - 410px)', alignItems: 'center' }}>
              <EuiLoadingSpinner
                size="xl"
                style={{
                  margin: 0,
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </EuiFlexItem>
          ) : (
            this.props.requirementsCount && this.renderFacet()
          )}
        </div>

        {this.state.flyoutOn && (
            <RequirementFlyout
              currentRequirement={this.state.selectedRequirement}
              onChangeFlyout={this.onChangeFlyout}
              description={this.props.descriptions[this.state.selectedRequirement]}
              getRequirementKey={() => {
                return this.getRequirementKey();
              }}
              openDashboard={(e, itemId) => this.openDashboard(e, itemId)}
              openDiscover={(e, itemId) => this.openDiscover(e, itemId)}
            />
        )}
      </div>
    );
  }
}
