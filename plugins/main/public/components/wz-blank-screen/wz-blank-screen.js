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
  UI_LOGGER_LEVELS,
} from '../../../common/constants';
import { webDocumentationLink } from '../../../common/services/web_documentation';
import { AppState } from '../../react-services/app-state';
import { WzMisc } from '../../factories/misc';
import { getCore } from '../../kibana-services';
import { ErrorHandler } from '../../react-services/error-handler';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { overview } from '../../utils/applications';

export class WzBlankScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorToShow: null,
    };

    // Create instance of WzMisc that stores the error
    this.wzMisc = new WzMisc();
  }

  componentDidMount() {
    AppState.setWzMenu();
    const catchedError = this.wzMisc.getBlankScr();
    if (catchedError) {
      let parsed = null;
      try {
        parsed = ErrorHandler.handle(catchedError, '', { silent: true });
      } catch (error) {
        const options = {
          context: `${WzBlankScreen.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.UI,
          error: {
            error: error,
            message: error.message || error,
            title: error.name,
          },
        };
        getErrorOrchestrator().handleError(options);
      }

      this.setState({ errorToShow: parsed || catchedError });
      this.wzMisc.setBlankScr(false);
    } else {
      this.goOverview();
    }
  }

  /**
   * This navigate to overview
   */
  goOverview() {
    getCore().application.navigateToApp(overview.id);
  }

  render() {
    if (!this.state.errorToShow) {
      return null;
    }
    return (
      <ErrorComponentPrompt
        errorTitle={this.state.errorToShow}
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

            <EuiButton onClick={() => this.goOverview()} color='primary' fill>
              Refresh
            </EuiButton>
          </>
        }
      />
    );
  }
}
