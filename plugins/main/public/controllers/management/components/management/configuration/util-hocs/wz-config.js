/*
 * Wazuh app - React HOC to fecth configuration form API.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withLoading from './loading';
import WzNoConfig from '../util-components/no-config';
import { getCurrentConfig } from '../utils/wz-fetch';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { updateWazuhNotReadyYet } from '../../../../../../redux/actions/appStateActions';

/**
 * Rendered when the configuration could not be fetched at all, so a failure is
 * not reported as a section the user never configured. `WzNoConfig` shows the
 * generic "problem while fetching" message for any error other than
 * `not-present`; the error itself reaches the user through the error
 * orchestrator, which `withLoading` already notifies.
 */
const WzConfigurationError = ({ error }) => (
  <WzNoConfig error={typeof error === 'string' ? error : 'fetch-error'} />
);

WzConfigurationError.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

/**
 * Provides `currentConfig` to the wrapped component.
 *
 * In manager context it holds the requested sections keyed by
 * `component-configuration`. In agent context it holds the agent's last
 * reported configuration keyed by module name, and `sections` does not apply:
 * the whole report is read from the index in a single request.
 *
 * @param {[]} [sections] Sections to fetch. Manager context only
 */

const mapStateToProps = state => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  refreshTime: state.configurationReducers.refreshTime,
});

const mapDispatchToProps = dispatch => ({
  updateWazuhNotReadyYet: value => dispatch(updateWazuhNotReadyYet(value)),
});

const withWzConfig =
  (sections = []) =>
  WrappedComponent =>
    compose(
      connect(mapStateToProps, mapDispatchToProps),
      withLoading(
        async props => {
          // If no agent, use clusterNodeSelected as fallback
          const agentId = props.agent?.id || props.clusterNodeSelected;
          if (!agentId) {
            // If there's no agent or clusterNodeSelected, we can't get configuration
            return {
              ...props,
              currentConfig: {},
              error: 'No agent or cluster node available',
            };
          }

          // Use clusterNodeSelected only if there's no agent (manager context)
          const node = props.agent?.id ? false : props.clusterNodeSelected;
          /* Errors are deliberately not caught here. In manager context a
          section that fails is already resolved to its own error message, so
          only a total failure reaches this point, and swallowing it would make
          the views report a configuration the user never wrote instead of a
          fetch that did not work. */
          const currentConfig = await getCurrentConfig(
            agentId,
            sections,
            node,
            props.updateWazuhNotReadyYet,
          );
          return { ...props, currentConfig };
        },
        (props, prevProps) =>
          (props.clusterNodeSelected &&
            prevProps.clusterNodeSelected &&
            props.clusterNodeSelected !== prevProps.clusterNodeSelected) ||
          props.refreshTime !== prevProps.refreshTime,
        undefined,
        WzConfigurationError,
      ),
    )(WrappedComponent);

export default withWzConfig;
