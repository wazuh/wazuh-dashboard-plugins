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
import { connect } from "react-redux";

import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiSpacer,
  EuiTitle,
  EuiText
} from "@elastic/eui";

import WzBadge from '../util-components/badge';

class WzConfigurationPath extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { title, description, icon, path, updateConfigurationSection, badge } = this.props;
    return (
      <Fragment>
        <EuiFlexGroup alignItems='center'>
          <EuiButtonEmpty onClick={() => updateConfigurationSection('')}>Configuration</EuiButtonEmpty>
          <span> / {path ? path : title}</span>
        </EuiFlexGroup>
        <EuiSpacer size='s'/>
        <EuiFlexGroup>
          <EuiFlexItem>
            {icon && <EuiIcon size='l' type={icon}/> }
            <EuiTitle style={{display: 'inline-block'}}>
              <span>{title} {typeof badge === 'boolean' ? <WzBadge enabled={badge}/> : null}</span>
            </EuiTitle>
            {description && (<EuiText color='subdued'>{description}</EuiText>)}
            <EuiSpacer size='xs'/>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s'/>
      </Fragment>
    )
  }
}

WzConfigurationPath.propTypes = {
  title: Proptypes.string.isRequired,
  description: Proptypes.string,
  path: Proptypes.string,
  icon: Proptypes.string
};

export default WzConfigurationPath;