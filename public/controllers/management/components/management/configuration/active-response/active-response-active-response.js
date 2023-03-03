/*
 * Wazuh app - React component for show configuration of active response - active response tab.
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

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import { connect } from 'react-redux';
import { compose } from 'redux';
import withWzConfig from '../util-hocs/wz-config';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
const name2 = i18n.translate(
  'wazuh.controller.manage.comp.confi.active.name2',
  {
    defaultMessage: 'Active response documentation',
  },
);
const name3 = i18n.translate(
  'wazuh.controller.manage.comp.confi.active.name3',
  {
    defaultMessage: 'Active response reference',
  },
);
const title1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.active.title1',
  {
    defaultMessage: 'Active response definitions',
  },
);
const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.active',
      {
        defaultMessage: 'Status of this active response',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'command',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.execute',
      {
        defaultMessage: 'Command to execute',
      },
    ),
  },
  {
    field: 'location',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.location',
      {
        defaultMessage: 'Execute the command on this location',
      },
    ),
  },
  {
    field: 'agent_id',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.command',
      {
        defaultMessage: 'Agent ID on which execute the command',
      },
    ),
  },
  {
    field: 'level',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.levelAbove',
      {
        defaultMessage: 'Match to this severity level or above',
      },
    ),
  },
  {
    field: 'rules_group',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.groups',
      {
        defaultMessage: 'Match to one of these groups',
      },
    ),
  },
  {
    field: 'rules_id',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.ruleID',
      {
        defaultMessage: 'Match to one of these rule IDs',
      },
    ),
  },
  {
    field: 'timeout',
    label: i18n.translate(
      'wazuh.public.controller.management.config.active.response.timeOut',
      {
        defaultMessage: 'Timeout (in seconds) before reverting',
      },
    ),
  },
];

const helpLinks = [
  {
    text: name2,
    href: webDocumentationLink(
      'user-manual/capabilities/active-response/index.html',
    ),
  },
  {
    text: name3,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/active-response.html',
    ),
  },
];

class WzConfigurationActiveResponseActiveResponse extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const items =
      !isString(currentConfig['analysis-active_response']) &&
      currentConfig['analysis-active_response']['active-response'] &&
      currentConfig['analysis-active_response']['active-response'].length
        ? settingsListBuilder(
            currentConfig['analysis-active_response']['active-response'],
            'command',
          )
        : [];
    return (
      <Fragment>
        {currentConfig['analysis-active_response'] &&
          isString(currentConfig['analysis-active_response']) && (
            <WzNoConfig
              error={currentConfig['analysis-active_response']}
              help={helpLinks}
            />
          )}
        {currentConfig['analysis-active_response'] &&
          !isString(currentConfig['analysis-active_response']) &&
          currentConfig['analysis-active_response']['active-response'] &&
          !currentConfig['analysis-active_response']['active-response']
            .length && <WzNoConfig error='not-present' help={helpLinks} />}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['analysis-active_response']) && (
            <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
          )}
        {currentConfig['analysis-active_response'] &&
        !isString(currentConfig['analysis-active_response']) &&
        currentConfig['analysis-active_response']['active-response'].length ? (
          <WzConfigurationSettingsTabSelector
            title={title1}
            description='Find here all the currently defined Active responses'
            currentConfig={currentConfig['analysis-active_response']}
            minusHeight={320}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

WzConfigurationActiveResponseActiveResponse.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

export default connect(mapStateToProps)(
  WzConfigurationActiveResponseActiveResponse,
);

const sectionsAgent = [{ component: 'com', configuration: 'active-response' }];

export const WzConfigurationActiveResponseActiveResponseAgent = compose(
  connect(mapStateToProps),
  withWzConfig(sectionsAgent),
)(WzConfigurationActiveResponseActiveResponse);

WzConfigurationActiveResponseActiveResponseAgent.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};
