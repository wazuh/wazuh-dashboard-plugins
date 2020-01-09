import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";
import WzNoConfig from "../util-components/no-config";

class WzConfigurationLabels extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig, agent } = this.props;
    return (
      <Fragment>
        {currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels'] && isString(currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']) && (
          <WzNoConfig error={currentConfig[(agent && agent.id !== '000') ? 'agent-labels' : 'analysis-labels']} help={}/>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationLabels;