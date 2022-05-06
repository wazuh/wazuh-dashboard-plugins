/*
 * Wazuh app - React component for building the Sample Data Wrapper
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import React, { Component } from 'react';
import {
    EuiPage,
    EuiPageBody,
    EuiPanel,
    EuiFlexGroup,
    EuiFlexItem,
    EuiTitle,
    EuiText,
    EuiSpacer
} from '@elastic/eui';
import WzSampleData from './sample-data'
import WzReduxProvider from '../../redux/wz-redux-provider';
import { withUserAuthorizationPrompt, withErrorBoundary, withReduxProvider } from '../../components/common/hocs';
import store from '../../redux/store';
import { compose } from 'redux';
import { updateSelectedSettingsSection } from '../../redux/actions/appStateActions';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../common/constants';

export class WzSampleDataProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount(){
    store.dispatch(updateSelectedSettingsSection('sample_data'));
  }

  render() {
    return (
    <EuiPage>
      <EuiPanel paddingSize="l">
        <EuiPageBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <h2>Sample data</h2>
              </EuiTitle>
              <EuiText color="subdued">
                Add sample data with events to the modules
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer />
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzSampleData {...this.props} />  
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageBody>
      </EuiPanel>
    </EuiPage>
    );
  }
}

export const WzSampleDataWrapper = compose(
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(WzSampleDataProvider);
