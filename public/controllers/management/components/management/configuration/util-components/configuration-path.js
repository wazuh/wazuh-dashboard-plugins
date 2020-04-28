/*
 * Wazuh app - React component for title and description of configuration section.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiIcon
} from '@elastic/eui';

import WzBadge from '../util-components/badge';
import WzClusterSelect from './configuration-cluster-selector';

class WzConfigurationPath extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {
      title,
      description,
      icon,
      updateConfigurationSection,
      badge,
      children
    } = this.props;
    return (
      <Fragment>
        <EuiSpacer size="s" />
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center">
              <span style={{ margin: '0 6px' }}>
                <EuiToolTip content="Back to configuration" position="right">
                  <EuiButtonIcon
                    style={{ padding: 0 }}
                    iconType="arrowLeft"
                    iconSize="l"
                    onClick={() => updateConfigurationSection('')}
                    aria-label="back to configuration"
                  />
                </EuiToolTip>
              </span>
              <span style={{ marginLeft: '6px', marginRight: '6px' }}>
                {icon && <EuiIcon size="l" type={icon} />}
                <EuiTitle style={{ display: 'inline-block', margin: 0 }}>
                  <span>
                    {title}{' '}
                    {typeof badge === 'boolean' ? (
                      <WzBadge enabled={badge} />
                    ) : null}
                  </span>
                </EuiTitle>
                {description && (
                  <EuiText color="subdued">{description}</EuiText>
                )}
                <EuiSpacer size="xs" />
              </span>
            </EuiFlexGroup>
          </EuiFlexItem>
          {children ? <Fragment>{children}</Fragment> : null}
          {this.props.clusterNodes && this.props.clusterNodes.length && (
            <EuiFlexItem grow={false}>
              <WzClusterSelect />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="l" />
      </Fragment>
    );
  }
}

WzConfigurationPath.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  updateConfigurationSection: PropTypes.func,
  badge: PropTypes.bool
};

const mapStateToProps = state => ({
  clusterNodes: state.configurationReducers.clusterNodes
});

export default connect(mapStateToProps)(WzConfigurationPath);
