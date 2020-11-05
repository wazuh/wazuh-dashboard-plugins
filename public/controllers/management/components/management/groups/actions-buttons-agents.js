/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
// Eui components
import { EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';

import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateIsProcessing,
  updateShowAddAgents
} from '../../../../../redux/actions/groupsActions';

import exportCsv from '../../../../../react-services/wz-csv';
import GroupsHandler from './utils/groups-handler';
import { toastNotifications } from 'ui/notify';
import { ExportConfiguration } from '../../../../agent/components/export-configuration';

class WzGroupsActionButtonsAgents extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      generatingCsv: false,
      isPopoverOpen: false,
      newGroupName: ''
    };
    this.exportCsv = exportCsv;

    this.groupsHandler = GroupsHandler;
    this.refreshTimeoutId = null;
  }

  componentDidMount() {
    this._isMounted = true;
    if (this._isMounted) this.bindEnterToInput();
  }

  componentDidUpdate() {
    this.bindEnterToInput();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   console.log(nextProps);
  // }

  /**
   * Refresh the items
   */
  async refresh() {
    try {
      this.props.updateIsProcessing(true);
      this.onRefreshLoading();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  onRefreshLoading() {
    clearInterval(this.refreshTimeoutId);

    this.props.updateLoadingStatus(true);
    this.refreshTimeoutId = setInterval(() => {
      if (!this.props.state.isProcessing) {
        this.props.updateLoadingStatus(false);
        clearInterval(this.refreshTimeoutId);
      }
    }, 100);
  }

  showManageAgents() {
    const { itemDetail } = this.props.state;

    this.props.updateShowAddAgents(true);
    this.props.groupsProps.showAddingAgents(true, itemDetail);
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
      msg: false,
      newGroupName: ''
    });
  }

  clearGroupName() {
    this.setState({
      newGroupName: ''
    });
  }

  onChangeNewGroupName = e => {
    this.setState({
      newGroupName: e.target.value
    });
  };

  /**
   * Looking for the input element to bind the keypress event, once the input is found the interval is clear
   */
  bindEnterToInput() {
    try {
      const interval = setInterval(async () => {
        const input = document.getElementsByClassName('groupNameInput');
        if (input.length) {
          const i = input[0];
          if (!i.onkeypress) {
            i.onkeypress = async e => {
              if (e.which === 13) {
                await this.createGroup();
              }
            };
          }
          clearInterval(interval);
        }
      }, 150);
    } catch (error) {}
  }

  async createGroup() {
    try {
      this.props.updateLoadingStatus(true);
      await this.groupsHandler.saveGroup(this.state.newGroupName);
      this.showToast(
        'success',
        'Success',
        'The group has been created successfully',
        2000
      );
      this.clearGroupName();

      this.props.updateIsProcessing(true);
      this.props.updateLoadingStatus(false);
      this.closePopover();
    } catch (error) {
      this.props.updateLoadingStatus(false);
      this.showToast(
        'danger',
        'Error',
        `An error occurred when creating the group: ${error}`,
        2000
      );
    }
  }

  /**
   * Generates a CSV
   */
  async generateCsv() {
    try {
      this.setState({ generatingCsv: true });
      const { section, filters } = this.props.state; //TODO get filters from the search bar from the REDUX store
      await this.exportCsv(`/groups/${this.props.state.itemDetail.name}/agents`, filters, 'Groups');
      this.showToast(
        'success',
        'Success',
        'CSV. Your download should begin automatically...',
        2000
      );
    } catch (error) {
      this.showToast(
        'danger',
        'Error',
        `Error when exporting the CSV file: ${error}`,
        2000
      );
    }
    this.setState({ generatingCsv: false });
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  render() {

    // Add new group button
    const manageAgentsButton = (
      <EuiButtonEmpty
        iconSide="left"
        iconType="folderOpen"
        onClick={() => this.showManageAgents()}
      >
        Manage agents
      </EuiButtonEmpty>
    );

    // Export PDF button
    const exportPDFButton = (
      <ExportConfiguration
        exportConfiguration={enabledComponents =>
          this.props.groupsProps.exportConfigurationProps.exportConfiguration(
            enabledComponents,
            this.props.state.itemDetail
          )
        }
        type={this.props.groupsProps.exportConfigurationProps.type}
      />
    );
    // Export button
    const exportCSVButton = (
      <EuiButtonEmpty
        iconType="exportAction"
        onClick={async () => await this.generateCsv()}
        isLoading={this.state.generatingCsv}
      >
        Export formatted
      </EuiButtonEmpty>
    );

    // Refresh
    const refreshButton = (
      <EuiButtonEmpty
        iconType="refresh"
        onClick={async () => await this.refresh()}
      >
        Refresh
      </EuiButtonEmpty>
    );

    return (
      <Fragment>
        <EuiFlexItem grow={false}>{manageAgentsButton}</EuiFlexItem>
        <EuiFlexItem grow={false}>{exportPDFButton}</EuiFlexItem>
        <EuiFlexItem grow={false}>{exportCSVButton}</EuiFlexItem>
        <EuiFlexItem grow={false}>{refreshButton}</EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updateShowAddAgents: showAddAgents =>
      dispatch(updateShowAddAgents(showAddAgents))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzGroupsActionButtonsAgents);
