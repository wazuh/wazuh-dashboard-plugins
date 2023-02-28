/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import {
  EuiFlexItem,
  EuiButtonEmpty,
  EuiPopover,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
  EuiFlexGroup,
  EuiButton,
} from '@elastic/eui';

import { connect } from 'react-redux';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

import {
  updateLoadingStatus,
  updateIsProcessing,
} from '../../../../../redux/actions/groupsActions';

import exportCsv from '../../../../../react-services/wz-csv';
import GroupsHandler from './utils/groups-handler';
import { getToasts } from '../../../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';


class WzGroupsActionButtons extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      generatingCsv: false,
      isPopoverOpen: false,
      newGroupName: '',
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

  /**
   * Refresh the items
   */
  async refresh() {
    try {
      this.props.updateIsProcessing(true);
      this.onRefreshLoading();
    } catch (error) {
      const options = {
        context: `${WzGroupsActionButtons.name}.refresh`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.message || error,
        },
      };
      getErrorOrchestrator().handleError(options);
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

  togglePopover() {
    if (this.state.isPopoverOpen) {
      this.closePopover();
    } else {
      this.setState({ isPopoverOpen: true });
    }
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
      msg: false,
      newGroupName: '',
    });
  }

  clearGroupName() {
    this.setState({
      newGroupName: '',
    });
  }

  onChangeNewGroupName = (e) => {
    this.setState({
      newGroupName: e.target.value.split(' ').join(''),
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
            i.onkeypress = async (e) => {
              if (e.which === 13) {
                await this.createGroup();
              }
            };
          }
          clearInterval(interval);
        }
      }, 150);
    } catch (error) {
      const options = {
        context: `${WzGroupsActionButtons.name}.bindEnterToInput`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.message || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async createGroup() {
    try {
      if (this.isOkNameGroup(this.state.newGroupName)) {
        this.props.updateLoadingStatus(true);
        await this.groupsHandler.saveGroup(this.state.newGroupName);
        this.showToast('success', 'Success', 'The group has been created successfully', 2000);
        this.clearGroupName();

        this.props.updateIsProcessing(true);
        this.props.updateLoadingStatus(false);
        this.closePopover();
      }
    } catch (error) {
      const options = {
        context: `${WzGroupsActionButtons.name}.createGroup`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: false,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error creating a new group`,
        },
      };
      getErrorOrchestrator().handleError(options);
      this.props.updateLoadingStatus(false);
      throw new Error(error);
    }
  }

  /**
   * Generates a CSV
   */
  async generateCsv() {
    try {
      this.setState({ generatingCsv: true });
      const { section, filters } = this.props.state; //TODO get filters from the search bar from the REDUX store
      await this.exportCsv('/groups', filters, 'Groups');
      this.showToast(
        'success',
        'Success',
        'CSV. Your download should begin automatically...',
        2000
      );
    } catch (error) {
      const options = {
        context: `${WzGroupsActionButtons.name}.generateCsv`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error when exporting the CSV file: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    this.setState({ generatingCsv: false });
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  isOkNameGroup = (name) => {
    return name !== '' && name.trim().length > 0;
  };

  render() {
    // Add new group button
    const newGroupButton = (
      <WzButtonPermissions
        buttonType="empty"
        iconSide="left"
        iconType="plusInCircle"
        permissions={[{ action: 'group:create', resource: '*:*:*' }]}
        onClick={() => this.togglePopover()}
      >
        Add new group
      </WzButtonPermissions>
    );

    // Export button
    const exportButton = (
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
      <EuiButtonEmpty iconType="refresh" onClick={async () => await this.refresh()}>
        Refresh
      </EuiButtonEmpty>
    );

    return (
      <Fragment>
        <EuiFlexItem grow={false}>
          <EuiPopover
            id="popover"
            button={newGroupButton}
            isOpen={this.state.isPopoverOpen}
            closePopover={() => this.closePopover()}
          >
            <EuiFlexGroup direction={'column'}>
              <EuiFlexItem>
                <EuiFormRow label="Introduce the group name" id="">
                  <EuiFieldText
                    className="groupNameInput"
                    value={this.state.newGroupName}
                    onChange={this.onChangeNewGroupName}
                    aria-label=""
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <WzButtonPermissions
                  permissions={[{ action: 'group:create', resource: '*:*:*' }]}
                  iconType="save"
                  isDisabled={!this.isOkNameGroup(this.state.newGroupName)}
                  fill
                  onClick={async () => {
                    await this.createGroup();
                  }}
                >
                  Save new group
                </WzButtonPermissions>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{exportButton}</EuiFlexItem>
        <EuiFlexItem grow={false}>{refreshButton}</EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateLoadingStatus: (status) => dispatch(updateLoadingStatus(status)),
    updateIsProcessing: (isProcessing) => dispatch(updateIsProcessing(isProcessing)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzGroupsActionButtons);
