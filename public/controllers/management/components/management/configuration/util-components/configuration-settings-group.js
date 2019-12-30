import React, { Component, Fragment } from "react";
import  PropTypes from 'prop-types';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiButtonEmpty
} from "@elastic/eui";

import WzConfigurationSetting from './configuration-setting';
import WzConfigurationSettingsHeader from "./configuration-settings-header";

class WzSettingsGroup extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { config, description, items, json, help, title, settings, viewSelected, xml } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsHeader title={title} description={description} settings={settings} json={json} xml={xml} help={help} viewSelected={viewSelected}/>
        <EuiSpacer size='s'/>
        <EuiFlexGroup>
          <EuiFlexItem>
            {items.map((item, key) => {
              const keyItem = `${title || ''}-${item.label}-${item.value}-${key}`
              console.log('configurationSetting', keyItem);
              return (
                <WzConfigurationSetting keyItem={keyItem} label={item.label} value={item.render ? item.render(config[item.field]) : config[item.field]}/>
              )
            }
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }
}

WzSettingsGroup.propTypes = {
  ...WzConfigurationSettingsHeader.propTypes,
  items: PropTypes.array.isRequired
}

export default WzSettingsGroup;