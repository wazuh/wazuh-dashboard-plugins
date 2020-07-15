/*
 * Wazuh app - React component for Logtest.
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
import ReactDOM from 'react-dom';
import { Logtest } from '../logtest/logtest';
import './logtest.less';
import {
  EuiPage,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiBadge
} from '@elastic/eui';
import { showFlyoutLogtest  } from '../../../redux/actions/appStateActions';
import { updateDockedLogtest  } from '../../../redux/actions/appStateActions';
import { connect } from 'react-redux';
import { withRouter, Router } from 'react-router-dom';

class LogtestFlyout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      docked: false,
      testing: false,
      logTypeSelect: 'log',
    };
  }

  componentWillUnmount() {}

  componentDidUpdate() {
    if(!this.props.location.hash.includes('tab=rules') && !this.props.location.hash.includes('tab=decoders') && !this.props.location.hash.includes('tab=lists') && this.props.showFlyout) {
      this.props.updateDockedLogtest(false);
      $('body').removeClass('euiBody--logtestIsOpen');
      this.props.showFlyoutLogtest(false);
    }
  }

  dockLogtestFlyout() {
    const docked = !this.props.dockedFlyoutLogtest;
    if (docked) {
      $('body').addClass('euiBody--logtestIsOpen');
    } else {
      $('body').removeClass('euiBody--logtestIsOpen');
    }
    this.props.updateDockedLogtest(docked);
  }

  render() {
    const container = document.getElementById('kibana-body');
    const showFlyoutLogtest = this.props.showFlyout;

    return ReactDOM.createPortal(
        showFlyoutLogtest && 
        (<EuiFlyout
        className="logtest-flyout"
        aria-labelledby="flyoutSmallTitle"
        hideCloseButton
        onClose={() => $('body').removeClass('euiBody--logtestIsOpen')}
      >
        <EuiFlyoutHeader
          hasBorder
          style={{ padding: 8 }}>
          <EuiFlexGroup>
            <EuiFlexItem grow={false} style={{ padding: '6px 0' }}>
              <EuiBadge color='#BD271E' iconType="clock">Test session started at 2020/02/07 12:56:32</EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem />
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={() => this.dockLogtestFlyout()}
                iconType={this.props.dockedFlyoutLogtest && 'lockOpen' || 'lock'}>
                {this.props.dockedFlyoutLogtest && 'Undock Logtest' || 'Dock Logtest'}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={() => {
                  this.props.updateDockedLogtest(false);
                  $('body').removeClass('euiBody--logtestIsOpen');
                  this.props.showFlyoutLogtest(false);
                }}
                iconType={'cross'}>
                Close
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <div style={{ padding: 16 }}>
            <Logtest onFlyout={true}></Logtest>
          </div>
        </EuiFlyoutBody>
      </EuiFlyout>)
      ,
      container
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showFlyoutLogtest: showFlyout => dispatch(showFlyoutLogtest(showFlyout)),
    updateDockedLogtest: dockedFlyout => dispatch(updateDockedLogtest(dockedFlyout)),
  };
};

const mapStateToProps = state => {
  return {
    showFlyout: state.appStateReducers.showFlyoutLogtest,
    dockedFlyoutLogtest: state.appStateReducers.dockedFlyoutLogtest,
  };
};

const LogtestFlyoutWithRouter = withRouter(LogtestFlyout);

export const FlyoutComponentWithVariableControl =  connect(
  mapStateToProps,
  mapDispatchToProps
  )(LogtestFlyoutWithRouter);