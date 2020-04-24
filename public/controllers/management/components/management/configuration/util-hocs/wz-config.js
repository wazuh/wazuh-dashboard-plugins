/*
 * Wazuh app - React HOC to fecth configuration form API.
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
import withLoading from './loading';
import { getCurrentConfig } from '../utils/wz-fetch';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { updateLoadingStatus } from '../../../../../../redux/actions/configurationActions';
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
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected
});

const mapDispatchToProps = dispatch => ({
  updateWazuhNotReadyYet: value => dispatch(updateWazuhNotReadyYet(value)),
  updateLoadingStatus: loadingStatus =>
    dispatch(updateLoadingStatus(loadingStatus))
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
        props.updateLoadingStatus(false);
        return { ...props, currentConfig };
      } catch (error) {
        props.updateLoadingStatus(false);
        return { ...props, currentConfig: {}, error };
      }
    })
  )(WrappedComponent);

export default withWzConfig;
