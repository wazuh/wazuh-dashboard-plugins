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

import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

import WzConfigurationOverviewTable from './util-components/configuration-overview-table';
import WzHelpButtonPopover from './util-components/help-button-popover';
import WzBadge from './util-components/badge';
import WzClusterSelect from './util-components/configuration-cluster-selector';
import WzRefreshClusterInfoButton from './util-components/refresh-cluster-info-button';
import { ExportConfiguration } from '../../../../agent/components/export-configuration';
import { ReportingService } from '../../../../../react-services/reporting';

import configurationSettingsGroup from './configuration-settings';

import { connect } from 'react-redux';
import { isString, isFunction } from './utils/utils';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { API_NAME_AGENT_STATUS } from '../../../../../../common/constants';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
const name1 = i18n.translate('wazuh.controllers.manage.confi.overview.name1', {
  defaultMessage: 'Name',
});
const name2 = i18n.translate('wazuh.controllers.manage.confi.overview.name2', {
  defaultMessage: 'Description',
});
const text1 = i18n.translate('wazuh.controllers.manage.confi.overview.text1', {
  defaultMessage: 'Wazuh server administration',
});
const text2 = i18n.translate('wazuh.controllers.manage.confi.overview.text2', {
  defaultMessage: 'Wazuh capabilities',
});
const text3 = i18n.translate('wazuh.controllers.manage.confi.overview.text3', {
  defaultMessage: 'Local configuration reference',
});
const action1 = i18n.translate('wazuh.controllers.manage.confi.overview.action1', {
  defaultMessage: 'cluster:status',
});
const action2 = i18n.translate('wazuh.controllers.manage.confi.overview.action2', {
  defaultMessage: 'cluster:update_config',
});
const action3 = i18n.translate('wazuh.controllers.manage.confi.overview.action3', {
  defaultMessage: 'manager:update_config',
});
const action4 = i18n.translate('wazuh.controllers.manage.confi.overview.action4', {
  defaultMessage: 'edit-configuration',
});
const action5 = i18n.translate('wazuh.controllers.manage.confi.overview.action5', {
  defaultMessage: ' Cluster',
});
const action6 = i18n.translate('wazuh.controllers.manage.confi.overview.action6', {
  defaultMessage: 'Manager',
});
const action7 = i18n.translate('wazuh.controllers.manage.confi.overview.action7', {
  defaultMessage: 'Cron prefix',
});
const action8 = i18n.translate('wazuh.controllers.manage.confi.overview.action8', {
  defaultMessage: 'configuration',
});
const columns = [
  {
    field: 'name',
    name: name1,
  },
  {
    field: 'description',
    name: name2,
  },
];

const helpLinks = [
  {
    text: text1,
    href: webDocumentationLink('user-manual/manager/index.html'),
  },
  {
    text: text2,
    href: webDocumentationLink('user-manual/capabilities/index.html'),
  },
  {
    text: text3,
    href: webDocumentationLink('user-manual/reference/ossec-conf/index.html'),
  },
];

class WzConfigurationOverview extends Component {
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();
  }
  updateConfigurationSection(section, title, description, path) {
    this.props.updateConfigurationSection(section, title, description, path);
  }
  filterSettingsIfAgentOrManager(settings) {
    return settings.filter(
      setting =>
        (this.props.agent.id !== '000' &&
          setting.when &&
          ((isString(setting.when) && setting.when === 'agent') ||
            (isFunction(setting.when) && setting.when(this.props.agent)))) ||
        (this.props.agent.id === '000' &&
          setting.when &&
          ((isString(setting.when) && setting.when === 'manager') ||
            (isFunction(setting.when) && setting.when(this.props.agent)))) ||
        (isFunction(setting.when) && setting.when(this.props.agent)) ||
        (!setting.when && true),
    );
  }
  filterSettings(groups) {
    return groups
      .map(group => {
        return {
          title: group.title,
          settings: this.filterSettingsIfAgentOrManager(group.settings),
        };
      })
      .filter(group => group.settings.length);
  }
  render() {
    const settings = this.filterSettings(configurationSettingsGroup);
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <span>
                {i18n.translate('wazuh.controllers.mnage.comp.confi.Configuration', {
                  defaultMessage: 'Configuration',
                })}{' '}
                {this.props.agent.id !== '000' && (
                  <WzBadge synchronized={this.props.agentSynchronized} />
                )}
              </span>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize='s'>
              {this.props.agent.id === '000' && (
                <EuiFlexItem grow={false}>
                  <WzRefreshClusterInfoButton />
                </EuiFlexItem>
              )}
              {this.props.agent.id === '000' && (
                <EuiFlexItem>
                  <WzButtonPermissions
                    buttonType='empty'
                    permissions={[
                      { action: action1, resource: '*:*:*' },
                      this.props.clusterNodeSelected
                        ? {
                            action: action2,
                            resource: `node:id:${this.props.clusterNodeSelected}`,
                          }
                        : {
                            action: action3,
                            resource: '*:*:*',
                          },
                    ]}
                    iconSide='left'
                    iconType='pencil'
                    onClick={() =>
                      this.updateConfigurationSection(
                        action4,
                        `${
                          this.props.clusterNodeSelected ? action5 : action6
                        } ${action7}`,
                        '',
                        action8,
                      )
                    }
                  >
                    {i18n.translate(
                      'wazuh.controllers..mnage.comp.confi.Editconfiguration',
                      {
                        defaultMessage: 'Edit configuration',
                      },
                    )}
                  </WzButtonPermissions>
                </EuiFlexItem>
              )}
              {this.props.agent.id !== '000' &&
                this.props.agent.status === API_NAME_AGENT_STATUS.ACTIVE && (
                  <EuiFlexItem>
                    <ExportConfiguration
                      agent={this.props.agent}
                      type='agent'
                      exportConfiguration={enabledComponents => {
                        this.reportingService.startConfigReport(
                          this.props.agent,
                          'agentConfig',
                          enabledComponents,
                        );
                      }}
                    />
                  </EuiFlexItem>
                )}
              <EuiFlexItem grow={false}>
                <WzHelpButtonPopover links={helpLinks} />
              </EuiFlexItem>
              {this.props.clusterNodes &&
              this.props.clusterNodes.length &&
              this.props.clusterNodeSelected ? (
                <EuiFlexItem>
                  <WzClusterSelect />
                </EuiFlexItem>
              ) : null}
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
