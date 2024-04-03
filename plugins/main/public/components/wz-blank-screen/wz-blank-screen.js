/*
 * Wazuh app - React component for build q queries.
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
import { EuiButton, EuiSpacer, EuiLink } from '@elastic/eui';
import { ErrorComponentPrompt } from '../common/error-boundary-prompt/error-boundary-prompt';
import {
  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
  PLUGIN_PLATFORM_URL_GUIDE,
  PLUGIN_PLATFORM_URL_GUIDE_TITLE,
} from '../../../common/constants';
import { webDocumentationLink } from '../../../common/services/web_documentation';

export class WzBlankScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <ErrorComponentPrompt
        errorTitle={this.props.errorToShow}
        errorInfo={''}
        action={
          <>
            <p>
              <EuiLink
                href={PLUGIN_PLATFORM_URL_GUIDE}
                target='_blank'
                external
                rel='noopener noreferrer'
              >
                {PLUGIN_PLATFORM_URL_GUIDE_TITLE}
              </EuiLink>
              <br />
              <br />
              <EuiLink
                href={webDocumentationLink(
                  PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_TROUBLESHOOTING,
                )}
                target='_blank'
                rel='noopener noreferrer'
                external
              >
                Installation guide
              </EuiLink>
            </p>
            <EuiSpacer />

            <EuiButton onClick={this.props.goToOverview} color='primary' fill>
              Refresh
            </EuiButton>
          </>
        }
      />
    );
  }
}
