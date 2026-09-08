/*
 * Wazuh app - React component for render button to refresh an agent's reported configuration.
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
import PropTypes from 'prop-types';

import { EuiButtonEmpty } from '@elastic/eui';

import { connect } from 'react-redux';
import { updateRefreshTime } from '../../../../../../redux/actions/configurationActions';
import { clearAgentReportedConfigurationCache } from '../utils/agent-config-service';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

class WzRefreshAgentConfigButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
    };
  }

  refresh = async () => {
    this.setState({ isLoading: true });
    try {
      /* Drops the shared report cache before asking the parent to read it
      again, so the fresh read that repopulates it is the one every open
      section reuses. */
      clearAgentReportedConfigurationCache();
      await this.props.onRefresh();
    } catch (error) {
      const options = {
        context: `${WzRefreshAgentConfigButton.name}.refresh`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    this.setState({ isLoading: false });
    this.props.updateRefreshTime();
  };

  render() {
    return (
      <EuiButtonEmpty
        iconType='refresh'
        isLoading={this.state.isLoading}
        onClick={this.refresh}
        isDisabled={this.state.isLoading}
      >
        Refresh
      </EuiButtonEmpty>
    );
  }
}

WzRefreshAgentConfigButton.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  updateRefreshTime: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  updateRefreshTime: () => dispatch(updateRefreshTime()),
});

export default connect(null, mapDispatchToProps)(WzRefreshAgentConfigButton);
