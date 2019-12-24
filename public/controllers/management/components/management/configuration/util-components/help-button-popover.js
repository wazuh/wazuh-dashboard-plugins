import React, { Component } from "react";
import Proptypes from "prop-types";

import {
  EuiButtonEmpty,
  EuiPopover,
  EuiText
} from "@elastic/eui";

class WzHelpButtonPopover extends Component{
  constructor(props){
    super(props);
    this.state = {
      showHelp: false
    };
  }
  toggleShowHelp(){
    this.setState({ showHelp: !this.state.showHelp });
  }
  render(){
    const { showHelp } = this.state;
    const { children, links } = this.props;
    return (
      <EuiPopover
        id="show-help"
        button={<EuiButtonEmpty iconSide='left' iconType="questionInCircle" onClick={() => this.toggleShowHelp()} /> }
        isOpen={showHelp}
        closePopover={() => this.toggleShowHelp()}>
          <div style={{ width: '300px' }}>
            <EuiText color='subdued'>More info about this section</EuiText>
            {links.map(link => (
              <div key={`show-help-${link.text}`}>
                <EuiButtonEmpty target='_blank' href={link.href}>{link.text}</EuiButtonEmpty>
              </div>
            ))}
          </div>
      </EuiPopover>
    )
  }
}

WzHelpButtonPopover.propTypes = {
  links: Proptypes.array
};

export default WzHelpButtonPopover;