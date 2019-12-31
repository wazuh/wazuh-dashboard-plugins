import React, { Component, Fragment } from "react";
import PropTypes from 'prop-types';

import {
  EuiTabs, EuiTab, EuiSpacer
} from "@elastic/eui";

class WzTabSelector extends Component{
  constructor(props){
    super(props);
    this.state = {
      selectedTab: this.props.children[0].props.label
    };
  }
  changeSelectedTab(tab){
    this.setState({ selectedTab: tab });
  }
  render(){
    const { selectedTab } = this.state;
    const { children, container, spacer } = this.props;
    const activeTabContent = children.find(child => child.props.label === selectedTab);
    return (
      <Fragment>
        <EuiTabs>
          {children.map(child => {
              const { label } = child.props;
              return (
                <EuiTab
                  onClick={() => this.changeSelectedTab(label)}
                  isSelected={label === selectedTab}
                  key={`tab-${label}`}
                >{label}
                </EuiTab>
              )
            })
          }
        </EuiTabs>
        {(container && container(activeTabContent)) || 
          (<div>
            <EuiSpacer size={spacer || 's'}/>
            {activeTabContent}
          </div>)
        }
      </Fragment>
    )
  }
}

WzTabSelector.propTypes = {
  children: PropTypes.array.isRequired,
  container: PropTypes.func,
  spacer: PropTypes.string
};

export default WzTabSelector;