/*
 * Wazuh app - React component for reporting buttons
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

import { updateIsProcessing } from '../../../../../../redux/actions/reportingActions';

class WzReportingActionButtons extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Refresh the items
   */
  async refresh() {
    try {
      this.props.updateIsProcessing(true);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  render() {
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
        <EuiFlexItem grow={false}>{refreshButton}</EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.reportingReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzReportingActionButtons);
