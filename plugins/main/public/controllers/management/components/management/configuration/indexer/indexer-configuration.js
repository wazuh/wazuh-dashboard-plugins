/*
 * Wazuh app - React component for show configuration of indexer.
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

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';
import { compose } from 'redux';

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const renderCertificateAuthorities = value => {
  if (!value || !Array.isArray(value)) return '-';
  const cas = value.flatMap(item => (item?.ca ? item.ca : []));
  return cas.length ? cas.join(', ') : '-';
};

const renderArrayValue = value => {
  if (!value || !Array.isArray(value)) return '-';
  return value.join(', ');
};

const connectionSettings = [{ field: 'hosts', label: 'Hosts' }];

const sslSettings = [
  {
    field: 'ssl.certificate_authorities',
    label: 'Certificate authorities',
    render: renderCertificateAuthorities,
  },
  {
    field: 'ssl.certificate',
    label: 'Certificate',
    render: renderArrayValue,
  },
  {
    field: 'ssl.key',
    label: 'Key',
    render: renderArrayValue,
  },
];

const helpLinks = [
  {
    text: 'Indexer configuration',
    href: webDocumentationLink('user-manual/reference/ossec-conf/indexer.html'),
  },
];

export class WzIndexer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const indexerConfig = currentConfig?.['indexer'];

    if (indexerConfig && isString(indexerConfig)) {
      return <WzNoConfig error={indexerConfig} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && (!currentConfig || !indexerConfig)) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    if (!indexerConfig || !Object.keys(indexerConfig).length) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader title='Main settings' help={helpLinks}>
          <WzConfigurationSettingsGroup
            config={indexerConfig}
            items={connectionSettings}
          />
          <WzConfigurationSettingsGroup
            title='SSL settings'
            config={indexerConfig}
            items={sslSettings}
          />
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

const sections = [{ useFullEndpoint: true, key: 'indexer' }];

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
});

WzIndexer.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default compose(
  withWzConfig(sections),
  connect(mapStateToProps),
)(WzIndexer);
