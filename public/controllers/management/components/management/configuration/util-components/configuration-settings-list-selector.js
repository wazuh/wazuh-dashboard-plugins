import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty
} from "@elastic/eui";

import WzConfigurationSettingsGroup from './configuration-settings-group';

class WzConfigurationSettingsListSelector extends Component{
  constructor(props){
    super(props);
    this.state = {
      selectedItem : 0
    }
  }
  selectItem(selectedItem){
    this.setState({ selectedItem })
  }
  render(){
    const { selectedItem } = this.state;
    const { items, settings, keyList } = this.props;
    return (
      <EuiFlexGroup alignItems='flexStart'>
        <EuiFlexItem grow={false}>
          <ul>
            {items.map((item, key) => (
              <li key={`${keyList}-${key}`}>
                <EuiButtonEmpty style={selectedItem === key ? {textDecoration: 'underline' } : {}} onClick={() => this.selectItem(key)}>{item.label}</EuiButtonEmpty>
              </li>
            ))}
          </ul>
        </EuiFlexItem>
        <EuiFlexItem>
          <WzConfigurationSettingsGroup 
            config={items[selectedItem].data}
            items={settings}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
}

WzConfigurationSettingsListSelector.propTypes = {
  items: Proptypes.array.isRequired,
  settings: Proptypes.array.isRequired,
  keyList: Proptypes.string,
}

export default WzConfigurationSettingsListSelector;