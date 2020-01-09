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

class WzBadge extends Component{
  constructor(props){
    super(props);
    if( typeof this.props.enabled !== 'undefined' ){
      if(this.props.enabled){
        this.color = 'secondary';
        this.content = 'ENABLED';
      }else{
        this.color = 'danger';
        this.content = 'DISABLED';
      }
    }else if(typeof this.props.synchronized !== 'undefined'){
      if(this.props.synchronized){
        this.color = 'secondary';
        this.content = 'SYNCHRONIZED'
      }else{
        this.color = 'danger';
        this.content = 'NOT SYNCHRONIZED'
      }
    }else{
      this.color = this.props.color;
      this.content = this.props.content;
    }
  }
  render(){
    return (
      <EuiBadge color={this.color}>{this.content}</EuiBadge>
    )
  }
}

export default WzBadge;