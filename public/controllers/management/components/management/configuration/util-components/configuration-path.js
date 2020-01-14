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
import { connect } from "react-redux";

import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiToolTip,
  EuiButtonIcon,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiIcon
} from "@elastic/eui";

import WzBadge from '../util-components/badge';

class WzConfigurationPath extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { title, description, icon, updateConfigurationSection, badge } = this.props;
    return (
      <Fragment>
        <EuiFlexGroup alignItems='center'>
          <EuiFlexItem grow={false} style={{margin: "0 6px"}}>
            <EuiToolTip content='Back to configuration' position='right'>
              <EuiButtonIcon  style={{padding: 0}} iconType='arrowLeft' iconSize='l' onClick={() => updateConfigurationSection('')} aria-label='back to configuration'/>
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem style={{marginLeft: '6px', marginRight: '6px'}}>
            {icon && <EuiIcon size='l' type={icon}/> }
            <EuiTitle style={{display: 'inline-block', margin: 0}}>
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
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  updateConfigurationSection: PropTypes.func,
  badge: PropTypes.bool
};

export default WzConfigurationPath;