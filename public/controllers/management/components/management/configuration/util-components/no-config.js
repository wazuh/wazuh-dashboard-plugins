import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiIcon,
  EuiHorizontalRule,
  EuiSpacer,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem
} from "@elastic/eui";

import WzHelpButtonPopover from './help-button-popover';

class WzNoConfig extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { error, help } = this.props;
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div style={{textAlign: 'center'}}>
              <EuiIcon type='help' style={{marginRight: '4px'}}/>
              {(error === 'not-present' && <span>Configuration not available</span>) || <span>Error fetching configuration</span>}
              {help && (<WzHelpButtonPopover links={help} />)}
              <EuiHorizontalRule margin='s'/>
              {(error === 'not-present' && <p>This section is not present on the configuration file.</p>) || <span>There was a problem while fetching the configuration for this section.</span>}
              <EuiSpacer size='s'/>
              <div>
                <p>Click on the <EuiIcon type='questionInCircle' /> icon for help. Check the documentation links to learn more about how to configure it.</p>
              </div>
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    )
  }
}

WzNoConfig.propTypes = {
  error: Proptypes.string.isRequired,
  links: Proptypes.array
};

export default WzNoConfig;