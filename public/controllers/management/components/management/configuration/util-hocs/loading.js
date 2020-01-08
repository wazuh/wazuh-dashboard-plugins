/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiProgress,
  EuiSpacer
} from "@elastic/eui";

const Loading = () => (
  <Fragment>
    <EuiSpacer size='m'/>
    <EuiProgress size="xs" color="primary"/>
    <EuiSpacer size='m'/>
  </Fragment>
);

const withLoading = (load, LoadingComponent, ErrorComponent) => (WrappedComponent) => {
  LoadingComponent = LoadingComponent || Loading;
  class WithLoading extends Component{
    constructor(props){
      super(props);
      this.state = {
        isLoading: true,
        error: false,
        wrappedProps: undefined
      };
    }
    async componentDidMount(){
      try{
        const wrappedProps = await load(this.props);
        this.setState({ isLoading: false, wrappedProps});
      }catch(error){
        this.setState({ error });
      }
    }
    render(){
      const { error, isLoading, wrappedProps } = this.state;
      return (
        <Fragment>
          {(!error && (isLoading ? (<LoadingComponent />) : <WrappedComponent {...wrappedProps} {...this.props}/>)) ||
            (error && ErrorComponent && <ErrorComponent error={error} {...wrappedProps} {...this.props}/>)}
        </Fragment>
      )
    }
  }
  return WithLoading
} 

export default withLoading;