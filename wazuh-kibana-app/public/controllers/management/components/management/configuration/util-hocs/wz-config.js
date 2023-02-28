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

import React, { Component, Fragment } from 'react';
import withLoading from './loading';
import { getCurrentConfig } from '../utils/wz-fetch';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { updateWazuhNotReadyYet } from '../../../../../../redux/actions/appStateActions';

/**
 *
 * @param {string} agentId
 * @param {[]} sections
 * @param {React Component} LoadingComponent
 * @param {React Component} ErrorComponent
 * @param {function} throwError
 */

const mapStateToProps = state => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  refreshTime: state.configurationReducers.refreshTime
});

const mapDispatchToProps = dispatch => ({
  updateWazuhNotReadyYet: value => dispatch(updateWazuhNotReadyYet(value))
});

const withWzConfig = sections => WrappedComponent =>
  compose(
    connect(
      mapStateToProps,
      mapDispatchToProps
    ),
    withLoading(async props => {
      try {
        const currentConfig = await getCurrentConfig(
          props.agent.id,
          sections,
          props.clusterNodeSelected,
          props.updateWazuhNotReadyYet
        );
        return { ...props, currentConfig };
      } catch (error) {
        return { ...props, currentConfig: {}, error };
      }
    },
    (props, prevProps) => (props.agent.id === '000' && props.clusterNodeSelected && prevProps.clusterNodeSelected && props.clusterNodeSelected !== prevProps.clusterNodeSelected) || (props.refreshTime !== prevProps.refreshTime)
    )
  )(WrappedComponent);

export default withWzConfig;
