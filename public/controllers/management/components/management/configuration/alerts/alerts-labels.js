/*
 * Wazuh app - React component for show configuration of alerts - labels tab.
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

import { EuiBasicTable } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import { isString, hasSize } from '../utils/utils';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const columns = [
  { field: 'key', name: 'Label key' },
  { field: 'value', name: 'Label value' },
  { field: 'hidden', name: 'Hidden' },
];

const helpLinks = [
  {
    text: 'Agent labels',
    href: webDocumentationLink('user-manual/agents/labels.html'),
  },
  {
    text: 'Labels reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/labels.html'),
  },
];

class WzConfigurationAlertsLabels extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig['agent-labels'] &&
          isString(currentConfig['agent-labels']) && (
            <WzNoConfig
              error={currentConfig['agent-labels']}
              help={helpLinks}
            />
          )}
        {currentConfig['agent-labels'] &&
          !isString(currentConfig['agent-labels']) &&
          !hasSize(currentConfig['agent-labels'].labels) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['agent-labels']) && (
            <WzNoConfig error='Wazuh not ready yet' />
          )}
        {currentConfig['agent-labels'] &&
        !isString(currentConfig['agent-labels']) &&
        hasSize(currentConfig['agent-labels'].labels) ? (
          <WzConfigurationSettingsTabSelector
            title='Defined labels'
            currentConfig={currentConfig}
            minusHeight={agent.id === '000' ? 320 : 355}
            helpLinks={helpLinks}
          >
            <EuiBasicTable
              columns={columns}
              items={currentConfig['agent-labels'].labels}
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

export default connect(mapStateToProps)(WzConfigurationAlertsLabels);

const sectionsAgent = [{ component: 'agent', configuration: 'labels' }];

export const WzConfigurationAlertsLabelsAgent = compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent),
)(WzConfigurationAlertsLabels);

WzConfigurationAlertsLabels.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

WzConfigurationAlertsLabelsAgent.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};
