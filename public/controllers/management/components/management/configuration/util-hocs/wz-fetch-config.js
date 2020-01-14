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
import PropTypes from "prop-types";

import {
  
} from "@elastic/eui";

export default withWzFetchConfig = (sections) => (WrappedComponent) => {
  return class WzFetchConfigWrapper extends Component{
    constructor(props){
      super(props);
      this.state = {
        currentConfig: false
      }
    }
    async componendDidMount(){
      const { agent } = this.props;
      try{
        const currentConfig = await getCurrentConfig(agent.id, sections);
        this.setState({ currentConfig });
      }catch(error){
        console.error(error);
      }
    }
    render(){
      return (
        <Fragment>
          {this.state.currentConfig && <WrappedComponent currentConfig={this.props.currentConfig}/>}
        </Fragment>
      )
    }
  }
}

export default WzFetchConfigWrapper;