

import React, { Component, Fragment } from 'react';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';

import withWzConfig from '../util-hocs/wz-config';

import { wodleBuilder } from '../utils/builders';

import {
  renderValueYesThenEnabled,
  isString
} from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Using Wazuh to monitor GCP services',
    href: webDocumentationLink('gcp/index.html')
  },
  {
    text: 'Google Cloud Pub/Sub module reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/gcp-pubsub.html')
  }
];

const mainSettings = [
  {
    field: 'enabled',
    label: 'Google Cloud Pub/Sub integration status',
    render: renderValueYesThenEnabled
  },
  { field: 'project_id', label: 'Project ID' },
  { field: 'subscription_name', label: 'Subscription to read from' },
  {
    field: 'credentials_file',
    label: 'Path of the credentials file'
  },
  { field: 'logging', label: 'Logging level' },
  { field: 'max_messages', label: 'Maximum messages pulled in each iteration' },
  { field: 'interval', label: 'Interval between module executions in seconds' },
  { field: 'pull_on_start', label: 'Pull on start' },
  { field: 'day', label: 'Day of the month to fetch logs' },
  { field: 'wday', label: 'Day of the week to fetch logs' },
  { field: 'time', label: 'Time of the day to fetch logs' },
];

class WzConfigurationGoogleCloudPubSub extends Component{
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'gcp-pubsub');
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.wodleConfig &&
      this.wodleConfig['gcp-pubsub'] &&
      this.wodleConfig['gcp-pubsub'].enabled === 'yes'
    );
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] &&
          isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig
              error={currentConfig['wmodules-wmodules']}
              help={helpLinks}
            />
          )}
        {currentConfig &&
          !this.wodleConfig['gcp-pubsub'] && 
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error="not-present" help={helpLinks} />
        )}
        {currentConfig && this.wodleConfig['gcp-pubsub'] && (
          <WzConfigurationSettingsTabSelector
            title="Main settings"
            description="Configuration for the Google Cloud Pub/Sub module"
            currentConfig={this.wodleConfig}
            minusHeight={320}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={this.wodleConfig['gcp-pubsub']}
              items={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig(sections)(WzConfigurationGoogleCloudPubSub);
