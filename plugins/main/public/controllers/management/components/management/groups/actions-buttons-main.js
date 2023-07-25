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
import React, { Component } from 'react';
// Eui components
import {
  EuiFlexItem,
  EuiPopover,
  EuiFormRow,
  EuiFieldText,
  EuiFlexGroup,
} from '@elastic/eui';

import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

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
      isPopoverOpen: false,
      newGroupName: '',
    };

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
        await GroupsHandler.saveGroup(this.state.newGroupName);
        this.showToast('success', 'Success', 'The group has been created successfully', 2000);
        this.clearGroupName();

        this.props.reloadTable();
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
      throw new Error(error);
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

    return (
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
    );
  }
}

export default WzGroupsActionButtons;
