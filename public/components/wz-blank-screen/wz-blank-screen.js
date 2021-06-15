/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiButton, EuiHorizontalRule, EuiPage, EuiPageContent } from '@elastic/eui';
import { ErrorComponentPrompt } from '../common/error-boundary-prompt/error-boundary-prompt';

export class WzBlankScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const elasticGuideUrl =
      'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html';
    const wazuhTroubleshootingUrl =
      'https://documentation.wazuh.com/current/user-manual/kibana-app/troubleshooting.html';

    return (
      <EuiPage>
        <EuiPageContent horizontalPosition="center">
          <ErrorComponentPrompt
            errorTitle={this.props.errorToShow}
            errorInfo={''}
            action={
              <>
                <p>
                  <a href={elasticGuideUrl}>Elastic guide</a>
                  <br />
                  <br />
                  <a href={wazuhTroubleshootingUrl}>Wazuh installation guide</a>
                </p>
                <EuiHorizontalRule margin="s" />
                <p> </p>

                <EuiButton onClick={this.props.goToOverview} color="primary" fill>
                  Refresh
                </EuiButton>
              </>
            }
          />
        </EuiPageContent>
      </EuiPage>
    );
  }
}
