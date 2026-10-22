/*
 * Wazuh app - React component for render api isn't reachable.
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
import PropTypes from 'prop-types';
import { i18n } from '@osd/i18n';

import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiHorizontalRule,
  EuiSpacer,
  EuiButton,
} from '@elastic/eui';

import { updateRefreshTime } from '../../../../../../redux/actions/configurationActions';
import { getToasts } from '../../../../../../kibana-services';
import { WzEmptyPromptNoPermissions } from '../../../../../../components/common/permissions/prompt';
import { connect } from 'react-redux';

class WzWazuhAPINotReachable extends Component {
  constructor(props) {
    super(props);
  }
  onClickRefresh = () => {
    this.props.updateRefreshTime();
  };
  addToast(toast) {
    getToasts().add(toast);
  }
  isPermissionDenied() {
    return this.props.error?.response?.status === 403;
  }
  componentDidMount() {
    if (this.props.error && !this.isPermissionDenied()) {
      this.addToast({
        title: (
          <Fragment>
            <EuiIcon type='alert' />
            &nbsp;
            <span>{this.props.error}</span>
          </Fragment>
        ),
        color: 'danger',
      });
    }
  }
  render() {
    if (this.isPermissionDenied()) {
      // The API answered, so the problem is the user's role, not the connection.
      return (
        <WzEmptyPromptNoPermissions
          permissions={[
            {
              action: 'cluster:read',
              resource: `node:id:${this.props.clusterNodeSelected}`,
            },
          ]}
        />
      );
    }
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type='alert' style={{ marginRight: '4px' }} />
              <span>
                {i18n.translate('wazuh.configuration.apiNotReachable.title', {
                  defaultMessage: 'API not reachable',
                })}
              </span>
              <EuiHorizontalRule margin='s' />
              <EuiButton iconType='refresh' onClick={this.onClickRefresh}>
                {i18n.translate(
                  'wazuh.configuration.apiNotReachable.refreshButton',
                  { defaultMessage: 'Refresh' },
                )}
              </EuiButton>
              <EuiSpacer size='s' />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

WzWazuhAPINotReachable.propTypes = {
  error: PropTypes.any,
  clusterNodeSelected: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  updateRefreshTime: PropTypes.func,
};

const mapStateToProps = state => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
});

const mapDispatchToProps = dispatch => ({
  updateRefreshTime: () => dispatch(updateRefreshTime()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WzWazuhAPINotReachable);
