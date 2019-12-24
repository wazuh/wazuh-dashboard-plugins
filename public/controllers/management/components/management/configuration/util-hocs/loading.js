import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiProgress
} from "@elastic/eui";

const withLoading = (load, LoadingComponent, ErrorComponent) => (WrappedComponent) => {
  LoadingComponent = LoadingComponent || (() => (<EuiProgress size="xs" color="primary" />));
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
        const wrappedProps = await load();
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