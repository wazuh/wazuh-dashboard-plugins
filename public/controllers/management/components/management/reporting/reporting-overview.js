/*
 * Wazuh app - React component for building the reporting view
 *
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
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiTitle,
  EuiPage,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

// Wazuh components
import WzReportingTable from './reporting-table';
import WzReportingActionButtons from './utils/actions-buttons-main';

export class WzReportingOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>
                      {i18n.translate(
                        'wazuh.controllers..mnage.comp.confi.groups.reports.Reporting',
                        {
                          defaultMessage: ' Reporting',
                        },
                      )}
                    </h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <WzReportingActionButtons />
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color='subdued' style={{ paddingBottom: '15px' }}>
                {i18n.translate(
                  'wazuh.controllers..mnage.comp.confi.groups.reports.check',
                  {
                    defaultMessage: 'From here you can check all your reports.',
                  },
                )}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzReportingTable />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}

export default WzReportingOverview;
