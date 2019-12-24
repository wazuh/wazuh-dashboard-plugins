import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

const withWodle = (wodle) => (WrappedComponent) => {
  class WithWodle extends Component{
    constructor(props){
      super(props);
    }
    render(){
      return (
        <WrappedComponent {...this.props}/>
      )
    }
  }
  return WithWodle
}

export default Wodle;