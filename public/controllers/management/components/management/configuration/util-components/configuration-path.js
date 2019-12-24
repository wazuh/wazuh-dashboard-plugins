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
          <span> / {path}</span>
        </EuiFlexGroup>
        <EuiSpacer size='s'/>
        <EuiFlexGroup>
          <EuiFlexItem>
            {icon && <EuiIcon size='l' type={icon}/> }
            <EuiTitle style={{display: 'inline-block'}}>
              <span>{title} {badge !== undefined ? <WzBadge enabled={badge}/> : null}</span>
            </EuiTitle>
            {description && (<EuiText color='subdued'>{description}</EuiText>)}
            <EuiSpacer size='xs'/>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }
}

WzConfigurationPath.propTypes = {
  title: Proptypes.string.isRequired,
  path: Proptypes.string.isRequired,
  icon: Proptypes.string
};

export default WzConfigurationPath;