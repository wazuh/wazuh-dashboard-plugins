/*
 * Wazuh app - React HOC to show loading while is executing a async function.
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

import WzLoading from '../util-components/loading';

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
