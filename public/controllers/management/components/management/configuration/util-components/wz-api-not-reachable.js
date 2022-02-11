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

import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiHorizontalRule,
  EuiSpacer,
  EuiButton
} from '@elastic/eui';

import { updateRefreshTime } from '../../../../../../redux/actions/configurationActions';
import { getToasts }  from '../../../../../../kibana-services';
import { connect } from 'react-redux';

class WzWazuhAPINotReachable extends Component {
  constructor(props) {
    super(props);
  }
  onClickRefresh = () => {
    this.props.updateRefreshTime();
  };
  addToast(toast){
    getToasts().add(toast)
  }
  componentDidMount() {
    if (this.props.error) {
      this.addToast({
        title: (
          <Fragment>
            <EuiIcon type="alert" />
            &nbsp;
            <span>{this.props.error}</span>
          </Fragment>
        ),
        color: 'danger'
      });
    }
  }
  render() {
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type="alert" style={{ marginRight: '4px' }} />
              <span>Wazuh API not reachable</span>
              <EuiHorizontalRule margin="s" />
              <EuiButton iconType="refresh" onClick={this.onClickRefresh}>
                Refresh
              </EuiButton>
              <EuiSpacer size="s" />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  updateRefreshTime: () =>
    dispatch(updateRefreshTime())
});

export default connect(
    null,
    mapDispatchToProps
)(WzWazuhAPINotReachable);
