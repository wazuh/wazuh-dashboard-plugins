/*
 * Wazuh app - React component for show overview configuration.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import { EuiTitle, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import WzConfigurationOverviewTable from './util-components/configuration-overview-table';
import WzHelpButtonPopover from './util-components/help-button-popover';
import WzBadge from './util-components/badge';
import WzClusterSelect from './util-components/configuration-cluster-selector';
import WzRefreshClusterInfoButton from './util-components/refresh-cluster-info-button';

import configurationSettingsGroup from './configuration-settings';

import { connect } from 'react-redux';
import { isString, isFunction } from './utils/utils';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { API_NAME_AGENT_STATUS } from '../../../../../../common/constants';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

const columns = [
  {
    field: 'name',
    name: 'Name',
  },
  {
    field: 'description',
    name: 'Description',
  },
];

const helpLinks = [
  {
    text: 'Server administration',
    href: webDocumentationLink('user-manual/manager/index.html'),
  },
  {
    text: 'Capabilities',
    href: webDocumentationLink('user-manual/capabilities/index.html'),
  },
  {
    text: 'Local configuration reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/index.html'),
  },
];

class WzConfigurationOverview extends Component {
  constructor(props) {
    super(props);
  }
  updateConfigurationSection(section, title, description, path) {
    this.props.updateConfigurationSection(section, title, description, path);
  }
  filterSettingsIfAgentOrManager(settings) {
    const isManager = !this.props.agent;
    return settings.filter(setting => {
      if (!setting.when) return true;

      if (isFunction(setting.when)) {
        return setting.when(this.props.agent);
      }

      if (isString(setting.when)) {
        return isManager
          ? setting.when === 'manager'
          : setting.when === 'agent';
      }

      return false;
    });
  }
  filterSettings(groups) {
    return groups
      .map(group => ({
        title: group.title,
        settings: this.filterSettingsIfAgentOrManager(group.settings),
      }))
      .filter(group => group.settings.length);
  }
  render() {
    const settings = this.filterSettings(configurationSettingsGroup);
    const isManager = !this.props.agent;
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <span>
                Configuration{' '}
                <WzBadge synchronized={this.props.agentSynchronized} />
              </span>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize='s'>
              <EuiFlexItem grow={false}>
                <WzHelpButtonPopover links={helpLinks} />
              </EuiFlexItem>
              {/* Only show manager-specific controls when no agent is pinned */}
              {isManager && (
                <>
                  <EuiFlexItem grow={false}>
                    <WzRefreshClusterInfoButton />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <WzButtonPermissions
                      buttonType='empty'
                      permissions={[
                        this.props.clusterNodeSelected && {
                          action: 'cluster:update_config',
                          resource: `node:id:${this.props.clusterNodeSelected}`,
                        },
                      ].filter(Boolean)} // Filter falsy values. clusterNodeSelected is initially false on mount
                      // before cluster data loads, causing [false] in permissions array and TypeError
                      iconSide='left'
                      iconType='pencil'
                      onClick={() =>
                        this.updateConfigurationSection(
                          'edit-configuration',
                          `Cluster configuration`,
                          '',
                          'Edit configuration',
                        )
                      }
                    >
                      Edit configuration
                    </WzButtonPermissions>
                  </EuiFlexItem>
                  {this.props.clusterNodes &&
                  this.props.clusterNodes.length &&
                  this.props.clusterNodeSelected ? (
                    <EuiFlexItem>
                      <WzClusterSelect />
                    </EuiFlexItem>
                  ) : null}
                </>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {settings.map(group => (
              <WzConfigurationOverviewTable
                key={`settings-${group.title}`}
                title={group.title}
                columns={columns}
                items={group.settings}
                onClick={this.props.updateConfigurationSection}
              />
            ))}
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
});

export default connect(mapStateToProps)(WzConfigurationOverview);
