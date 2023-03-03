/*
 * Wazuh app - React component for show configuration of cluster.
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
import PropTypes from 'prop-types';
import { i18n } from '@kbn/i18n';

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';

import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';
import { compose } from 'redux';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
const text1 = i18n.translate('wazuh.controller.manage.comp.cluster.text1', {
  defaultMessage: 'Configuring a Wazuh cluster',
});
const text2 = i18n.translate('wazuh.controller.manage.comp.cluster.text2', {
  defaultMessage: 'Wazuh cluster reference',
});
const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.status',
      {
        defaultMessage: 'Cluster status',
      },
    ),
  },
  {
    field: 'name',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.name',
      {
        defaultMessage: 'Cluster name',
      },
    ),
  },
  {
    field: 'node_name',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.NodeName',
      {
        defaultMessage: 'Node name',
      },
    ),
  },
  {
    field: 'node_type',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.node',
      {
        defaultMessage: 'Node type',
      },
    ),
  },
  {
    field: 'nodes',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.master',
      {
        defaultMessage: 'Master node IP address',
      },
    ),
  },
  {
    field: 'port',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.port',
      {
        defaultMessage: 'Port to listen to cluster communications',
      },
    ),
  },
  {
    field: 'bind_addr',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.ip',
      {
        defaultMessage: 'IP address to listen to cluster communications',
      },
    ),
  },
  {
    field: 'hidden',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.cluster.hide',
      {
        defaultMessage: 'Hide cluster information in alerts',
      },
    ),
  },
];

const helpLinks = [
  {
    text: text1,
    href: webDocumentationLink('user-manual/configuring-cluster/index.html'),
  },
  {
    text: text2,
    href: webDocumentationLink('user-manual/reference/ossec-conf/cluster.html'),
  },
];

class WzCluster extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    let mainSettingsConfig = {
      ...currentConfig['com-cluster'],
      disabled:
        currentConfig['com-cluster'].disabled === 'yes'
          ? 'disabled'
          : 'enabled',
    };
    return (
      <Fragment>
        {currentConfig['com-cluster'] &&
          isString(currentConfig['com-cluster']) && (
            <WzNoConfig error={currentConfig['com-cluster']} help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['com-cluster']) && (
            <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
          )}
        {currentConfig['com-cluster'] &&
          !isString(currentConfig['com-cluster']) && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.cilent.cluster.Mainsettings',
                {
                  defaultMessage: 'Main settings',
                },
              )}
              currentConfig={currentConfig}
              minusHeight={260}
              helpLinks={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={mainSettingsConfig}
                items={mainSettings}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'com', configuration: 'cluster' }];

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzCluster.propTypes = {
  // currentConfig: PropTypes.object.isRequired
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default compose(
  withWzConfig(sections),
  connect(mapStateToProps),
)(WzCluster);
