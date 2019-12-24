import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBadge
} from "@elastic/eui";

class WzBadge extends Component{
  constructor(props){
    super(props);
    if( typeof this.props.enabled !== undefined ){
      if(this.props.enabled){
        this.color = 'secondary';
        this.content = 'ENABLED';
      }else{
        this.color = 'danger';
        this.content = 'DISABLED';
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