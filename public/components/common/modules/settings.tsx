/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import { EuiSpacer, EuiTitle, EuiPanel, EuiPage } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import WzBadge from '../../../controllers/management/components/management/configuration/util-components/badge'
import WzReduxProvider from '../../../redux/wz-redux-provider';
import WzConfigurationIntegrityMonitoring from '../../../controllers/management/components/management/configuration/integrity-monitoring/integrity-monitoring';
import WzConfigurationPolicyMonitoring from '../../../controllers/management/components/management/configuration/policy-monitoring/policy-monitoring';
import WzConfigurationOpenSCAP from '../../../controllers/management/components/management/configuration/open-scap/open-scap';
import WzConfigurationCisCat from '../../../controllers/management/components/management/configuration/cis-cat/cis-cat';
import WzConfigurationVulnerabilities from '../../../controllers/management/components/management/configuration/vulnerabilities/vulnerabilities';
import WzConfigurationOsquery from '../../../controllers/management/components/management/configuration/osquery/osquery';
import WzConfigurationDockerListener from '../../../controllers/management/components/management/configuration/docker-listener/docker-listener';

type SettingsPropTypes = {
  agent: { id: string },
  clusterNodeSelected?: string
}

type SettingsState = {
  badge: boolean | null
}
export class Settings extends Component<SettingsPropTypes, SettingsState> {
  constructor(props) {
    super(props);
    this.state = {
      badge: null
    }
  }
  updateBadge(badge) {
    this.setState({ badge })
  }
  render() {
    const { badge } = this.state;
    const { section } = this.props;
    return (
      <WzReduxProvider>
        <EuiPage>
          <EuiPanel>
            <EuiTitle>
              <span>{i18n.translate('wazuh.configuration', { defaultMessage: 'Configuration' })} {typeof badge === 'boolean' ?
                <WzBadge enabled={badge} /> : null}
              </span>
            </EuiTitle>
            <EuiSpacer size='m' />
            {section === 'fim' && <WzConfigurationIntegrityMonitoring {...this.props} updateBadge={(e) => this.updateBadge(e)} />}
            {(section === 'pm' || section === 'sca' || section === 'audit') &&
              <WzConfigurationPolicyMonitoring {...this.props} updateBadge={(e) => this.updateBadge(e)} onlyShowTab={section === 'pm' ? 'Policy Monitoring' : section === 'audit' ? 'System audit' : section === 'sca' ? 'SCA': undefined}/>}
            {section === 'oscap' && <WzConfigurationOpenSCAP {...this.props} updateBadge={(e) => this.updateBadge(e)} />}
            {section === 'ciscat' && <WzConfigurationCisCat {...this.props} updateBadge={(e) => this.updateBadge(e)} />}
            {section === 'vuls' && <WzConfigurationVulnerabilities {...this.props} updateBadge={(e) => this.updateBadge(e)} />}
            {section === 'osquery' && <WzConfigurationOsquery {...this.props} updateBadge={(e) => this.updateBadge(e)} />}
            {section === 'docker' && <WzConfigurationDockerListener {...this.props} updateBadge={(e) => this.updateBadge(e)} />}
          </EuiPanel>
        </EuiPage>
      </WzReduxProvider>
    )
  }
}
