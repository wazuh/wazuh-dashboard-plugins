/*
 * Wazuh app - React HOC to show loading while is executing a async function.
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

import WzLoading from '../util-components/loading';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

const withLoading = (
  load,
  didUpdateConditionRecharge,
  LoadingComponent,
  ErrorComponent
) => WrappedComponent => {
  LoadingComponent = LoadingComponent || WzLoading;
  class WithLoading extends Component {
    constructor(props) {
      super(props);
      this.state = {
        isLoading: true,
        error: false,
        wrappedProps: undefined
      };
    }
    async componentDidMount() {
      try {
        const wrappedProps = await load(this.props);
        this.setState({ isLoading: false, error: false, wrappedProps });
      } catch (error) {
        this.setState({ isLoading: false, error, wrappedProps: undefined });
        const options = {
          context: `${WithLoading.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }
    async componentDidUpdate(prevProps){
      // if(this.props.agent.id === '000' && this.props.clusterNodeSelected && prevProps.clusterNodeSelected && this.props.clusterNodeSelected !== prevProps.clusterNodeSelected){
      if(didUpdateConditionRecharge && didUpdateConditionRecharge(this.props, prevProps)){
        try {
          this.setState({isLoading: true, error: false, wrappedProps: undefined })
          const wrappedProps = await load(this.props);
          this.setState({ isLoading: false, wrappedProps });
        } catch (error) {
          this.setState({ isLoading: false, error, wrappedProps: undefined });
          const options = {
            context: `${WithLoading.name}.componentDidUpdate`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            error: {
              error: error,
              message: error.message || error,
              title: error.name || error
            },
          };
          getErrorOrchestrator().handleError(options);
        }
      }
    }
    render() {
      const { error, isLoading, wrappedProps } = this.state;
      return (
        <Fragment>
          {(!error &&
            (isLoading ? (
              <LoadingComponent />
            ) : (
              <WrappedComponent {...wrappedProps} {...this.props} />
            ))) ||
            (error && ErrorComponent && (
              <ErrorComponent error={error} {...wrappedProps} {...this.props} />
            ))}
        </Fragment>
      );
    }
  }
  WithLoading.displayName = `WithLoading(${WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'})`;
  return WithLoading;
};

export default withLoading;
