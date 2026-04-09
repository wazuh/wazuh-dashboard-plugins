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
import WzLoading from '../util-components/loading';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';

import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { WzRequest } from '../../../../../../react-services/wz-request';

const renderCertificateAuthorities = value => {
  if (!value || !Array.isArray(value)) return '-';
  const cas = value.flatMap(item => (item?.ca ? item.ca : []));
  return cas.length ? cas.join(', ') : '-';
};

const renderArrayValue = value => {
  if (!value || !Array.isArray(value)) return '-';
  return value.join(', ');
};

const connectionSettings = [
  { field: 'hosts', label: 'Hosts' },
];

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
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/indexer.html',
    ),
  },
];

export class WzIndexer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      indexerConfig: null,
      isLoading: true,
      errorFetching: null,
    };
  }

  async componentDidMount() {
    await this.fetchIndexerConfig();
  }

  async componentDidUpdate(prevProps) {
    if (
      prevProps.clusterNodeSelected !== this.props.clusterNodeSelected ||
      prevProps.refreshTime !== this.props.refreshTime
    ) {
      await this.fetchIndexerConfig();
    }
  }

  fetchIndexerConfig = async () => {
    try {
      this.setState({ isLoading: true, errorFetching: null });
      const node = this.props.clusterNodeSelected;
      if (!node) {
        this.setState({
          isLoading: false,
          errorFetching: 'No cluster node selected',
        });
        return;
      }
      const result = await WzRequest.apiReq(
        'GET',
        `/cluster/${node}/configuration`,
        {},
      );
      const indexerConfig =
        result?.data?.data?.affected_items?.[0]?.indexer || null;
      if (indexerConfig) {
        this.setState({ indexerConfig, isLoading: false });
      } else {
        this.setState({ isLoading: false, errorFetching: 'not-present' });
      }
    } catch (error) {
      this.setState({
        isLoading: false,
        errorFetching:
          error.message || 'Error fetching indexer configuration',
      });
    }
  };

  render() {
    const { indexerConfig, isLoading, errorFetching } = this.state;
    const { wazuhNotReadyYet } = this.props;

    if (isLoading) {
      return <WzLoading />;
    }

    if (errorFetching && isString(errorFetching)) {
      return <WzNoConfig error={errorFetching} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && !indexerConfig) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    if (!indexerConfig) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Main settings'
          help={helpLinks}
        >
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

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  refreshTime: state.configurationReducers.refreshTime,
});

WzIndexer.propTypes = {
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  clusterNodeSelected: PropTypes.string,
  refreshTime: PropTypes.number,
};

export default connect(mapStateToProps)(WzIndexer);
