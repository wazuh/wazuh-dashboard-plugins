/*
 * Wazuh app - React component for show configuration of alerts - labels tab.
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

import { EuiBasicTable } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import { isString, hasSize } from '../utils/utils';

import { compose } from 'redux';
import { connect } from 'react-redux';

const columns = [
  { field: 'key', name: 'Label key' },
  { field: 'value', name: 'Label value' },
  { field: 'hidden', name: 'Hidden' }
];

const helpLinks = [
  {
    text: 'Labels documentation',
    href:
      'https://documentation.wazuh.com/current/user-manual/capabilities/labels.html'
  },
  {
    text: 'Labels reference',
    href:
      'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/labels.html'
  }
];

class WzConfigurationAlertsLabels extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig[
          agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
        ] &&
          isString(
            currentConfig[
              agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
            ]
          ) && (
            <WzNoConfig
              error={
                currentConfig[
                  agent && agent.id !== '000'
                    ? 'agent-labels'
                    : 'analysis-labels'
                ]
              }
              help={helpLinks}
            />
          )}
        {currentConfig[
          agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
        ] &&
          !isString(
            currentConfig[
              agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
            ]
          ) &&
          !hasSize(
            currentConfig[
              agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
            ].labels
          ) && <WzNoConfig error="not-present" help={helpLinks} />}
        {wazuhNotReadyYet &&
          (!currentConfig ||
            !currentConfig[
              agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
            ]) && <WzNoConfig error="Wazuh not ready yet" />}
        {currentConfig[
          agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
        ] &&
        !isString(
          currentConfig[
            agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
          ]
        ) &&
        hasSize(
          currentConfig[
            agent && agent.id !== '000' ? 'agent-labels' : 'analysis-labels'
          ].labels
        ) ? (
          <WzConfigurationSettingsTabSelector
            title="Defined labels"
            currentConfig={currentConfig}
            minusHeight={agent.id === '000' ? 320 : 355}
            helpLinks={helpLinks}
          >
            <EuiBasicTable
              columns={columns}
              items={
                currentConfig[
                  agent && agent.id !== '000'
                    ? 'agent-labels'
                    : 'analysis-labels'
                ].labels
              }
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

export default connect(mapStateToProps)(WzConfigurationAlertsLabels);

const sectionsAgent = [{ component: 'agent', configuration: 'labels' }];

export const WzConfigurationAlertsLabelsAgent = compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent)
)(WzConfigurationAlertsLabels);

WzConfigurationAlertsLabels.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};

WzConfigurationAlertsLabelsAgent.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};
