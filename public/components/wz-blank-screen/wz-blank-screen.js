/*
 * Wazuh app - React component for build q queries.
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
import {
  EuiPage,
  EuiPageContent,
  EuiEmptyPrompt,
  EuiButton,
  EuiHorizontalRule
} from '@elastic/eui';

export class WzBlankScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <EuiPage>
        <EuiPageContent horizontalPosition="center">
          <EuiEmptyPrompt
            iconType="alert"
            title={<h2>{this.props.errorToShow || 'Something went wrong'}</h2>}
            body={
              <Fragment>
                <EuiHorizontalRule margin="s" />
                <p>
                  <a href="https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html">
                    https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
                  </a>
                  <br />
                  <a href="https://documentation.wazuh.com/current/installation-guide/">
                    https://documentation.wazuh.com/current/installation-guide/
                  </a>
                </p>
                <EuiHorizontalRule margin="s" />
                <p> </p>
              </Fragment>
            }
            actions={
              <EuiButton onClick={this.props.goToOverview} color="primary" fill>
                Refresh
              </EuiButton>
            }
          />
        </EuiPageContent>
      </EuiPage>
    );
  }
}
