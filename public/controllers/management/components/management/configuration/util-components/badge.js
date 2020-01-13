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
  EuiBadge
} from "@elastic/eui";
import { timeHours } from "d3";

class WzBadge extends Component{
  constructor(props){
    super(props);
    this.state = {};
    // if(typeof this.props.enabled !== 'undefined' ){
    //   if(this.props.enabled){
    //     this.state.color = 'secondary';
    //     this.state.content = 'ENABLED';
    //   }else{
    //     this.state.color = 'danger';
    //     this.state.content = 'DISABLED';
    //   }
    // }else if(typeof this.props.synchronized !== 'undefined'){
    //   if(this.props.synchronized){
    //     this.state.color = 'secondary';
    //     this.state.content = 'SYNCHRONIZED'
    //   }else{
    //     this.state.color = 'danger';
    //     this.state.content = 'NOT SYNCHRONIZED'
    //   }
    // }else if(this.props.color && this.props.content){
    //   this.state.color = this.props.color;
    //   this.state.content = this.props.content;
    // }
  }
  static getDerivedStateFromProps(nextProps, prevState){
    if(typeof nextProps === 'object'){
      if(typeof nextProps.enabled !== 'undefined' ){
        if(nextProps.enabled){
          return { color: 'secondary', content: 'ENABLED'};
        }else{
          return { color: 'danger', content: 'DISABLED'};
        }
      }else if(typeof nextProps.synchronized !== 'undefined'){
        if(nextProps.synchronized){
          return { color: 'secondary', content: 'SYNCHRONIZED'};
        }else{
          return { color: 'secondary', content: 'NOT SYNCHRONIZED'};
        }
      }else if(nextProps.color && nextProps.content){
        return { color: nextProps.color, content: nextProps.content };
      }
    }
    return null
  }
  render(){
    const { color, content } = this.state;
    return color && content ? (
      <EuiBadge color={color}>{content}</EuiBadge>
    ) : null
  }
}

export default WzBadge;