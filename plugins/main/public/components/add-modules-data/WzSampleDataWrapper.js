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
import { i18n } from '@osd/i18n';
import React, { Component } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import WzSampleData from './sample-data';
import {
  withUserAuthorizationPrompt,
  withErrorBoundary,
} from '../../components/common/hocs';
import { compose } from 'redux';

export class WzSampleDataProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <EuiPage>
        <EuiPanel paddingSize='l'>
          <EuiPageBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>
                    {i18n.translate('wazuh.sampleData.page.title', {
                      defaultMessage: 'Sample data',
                    })}
                  </h2>
                </EuiTitle>
                <EuiText color='subdued'>
                  {i18n.translate('wazuh.sampleData.page.description', {
                    defaultMessage:
                      'Add sample data with events to the modules',
                  })}
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
  withUserAuthorizationPrompt(null, { isAdministrator: true }),
)(WzSampleDataProvider);
