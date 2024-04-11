/*
 * Wazuh app - React component for show configuration of log collection - commands tab.
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

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import { renderValueOrNoValue, isString } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';
import { LOGCOLLECTOR_LOCALFILE_PROP, LOCALFILE_JOURNALDT_PROP } from './types';

/**
 * Returns targets array parsed in one string
 * @param {*} item
 * @returns string => target
 */
const renderTargetField = item =>
  Array.isArray(item) ? item.join(', ') : 'agent';

/**
 * Return panels title
 * @param {*} item => log data
 * @returns
 */
const panelsLabel = item =>
  `${item.logformat} - ${renderTargetField(item.target)}`;

const mainSettings = [
  { field: 'logformat', label: 'Log format' },
  {
    field: 'ignore_binaries',
    label: 'Ignore binaries',
    render: renderValueOrNoValue,
  },
  {
    field: 'only-future-events',
    label: 'Only future events',
    render: renderValueOrNoValue,
  },
  { field: 'filters_disabled', label: 'Filters Disabled' },
  {
    field: 'filters',
  },
];

class WzConfigurationLogCollectionJournald extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const items = currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[
      LOCALFILE_JOURNALDT_PROP
    ]
      ? settingsListBuilder(
          currentConfig[LOGCOLLECTOR_LOCALFILE_PROP][LOCALFILE_JOURNALDT_PROP],
          panelsLabel,
        )
      : [];

    return (
      <Fragment>
        {isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) && (
          <WzNoConfig
            error={currentConfig[LOGCOLLECTOR_LOCALFILE_PROP]}
            help={helpLinks}
          />
        )}
        {!currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[
          LOCALFILE_JOURNALDT_PROP
        ]?.length ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[
          LOCALFILE_JOURNALDT_PROP
        ]?.length > 1 ? (
          <WzConfigurationSettingsHeader
            title='Journald events logs'
            description='List of journald logs that will be processed'
            help={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsHeader>
        ) : null}
        {currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[
          LOCALFILE_JOURNALDT_PROP
        ]?.length === 1 ? (
          <WzConfigurationSettingsGroup
            config={items[0].data}
            items={mainSettings}
          />
        ) : null}
      </Fragment>
    );
  }
}

export default WzConfigurationLogCollectionJournald;
