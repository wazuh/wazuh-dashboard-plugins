/*
 * Wazuh app - React component for building the Overview welcome screen.
 *
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
import { StringsTools } from '../../../utils/strings-tools';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiFlexGrid,
  EuiCallOut,
  EuiPage,
  EuiButton
} from '@elastic/eui';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import { updateCurrentTab } from '../../../redux/actions/appStateActions';
import store from '../../../redux/store';

import { TabDescription } from '../../../../server/reporting/tab-description';

export class WelcomeScreen extends Component {
  constructor(props) {
    super(props);
    this.strtools = new StringsTools();

    this.state = {
      extensions: this.props.extensions
    };
  }

  setGlobalBreadcrumb() {
    const breadcrumb = [{ text: '' }, { text: 'Overview' }];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  componentDidMount() {
    this.setGlobalBreadcrumb();
  }

  buildTabCard(tab, icon) {
    return (
      <EuiFlexItem>
        <EuiCard
          size="xs"
          layout="horizontal"
          icon={<EuiIcon size="xl" type={icon} color="primary" />}
          className="homSynopsis__card"
          title={TabDescription[tab].title}
          onClick={() => store.dispatch(updateCurrentTab(tab))}
          data-test-subj={`overviewWelcome${this.strtools.capitalize(tab)}`}
          description={TabDescription[tab].description}
        />
      </EuiFlexItem>
    );
  }

  render() {
    return (
      <Fragment>
        <EuiPage>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiPanel betaBadgeLabel="Security Information Management">
                    <EuiSpacer size="s" />
                    <EuiFlexGrid columns={2}>
                      {this.buildTabCard('general', 'dashboardApp')}
                      {this.buildTabCard('fim', 'filebeatApp')}
                      {this.props.extensions.aws &&
                        this.buildTabCard('aws', 'logoAWSMono')}
                    </EuiFlexGrid>
                  </EuiPanel>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiPanel betaBadgeLabel="Auditing and Policy Monitoring">
                    <EuiSpacer size="s" />
                    <EuiFlexGrid columns={2}>
                      {this.buildTabCard('pm', 'advancedSettingsApp')}
                      {this.props.extensions.audit &&
                        this.buildTabCard('audit', 'monitoringApp')}
                      {this.props.extensions.oscap &&
                        this.buildTabCard('oscap', 'codeApp')}
                      {this.props.extensions.ciscat &&
                        this.buildTabCard('ciscat', 'auditbeatApp')}
                    </EuiFlexGrid>
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>

              <EuiSpacer size="xl" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiPanel betaBadgeLabel="Threat Detection and Response">
                    <EuiSpacer size="s" />
                    <EuiFlexGrid columns={2}>
                      {this.buildTabCard('vuls', 'securityApp')}
                      {this.props.extensions.virustotal &&
                        this.buildTabCard('virustotal', 'savedObjectsApp')}
                      {this.props.extensions.osquery &&
                        this.buildTabCard('osquery', 'searchProfilerApp')}
                      {this.props.extensions.docker &&
                        this.buildTabCard('docker', 'logoDocker')}
                      {this.props.extensions.mitre &&
                        this.buildTabCard('mitre', 'spacesApp')}{' '}
                      {/* TODO- Change "spacesApp" icon*/}
                    </EuiFlexGrid>
                  </EuiPanel>
                </EuiFlexItem>

                <EuiFlexItem>
                  <EuiPanel betaBadgeLabel="Regulatory Compliance">
                    <EuiSpacer size="s" />
                    {!this.props.extensions.pci &&
                      !this.props.extensions.gdpr &&
                      !this.props.extensions.hipaa &&
                      !this.props.extensions.tsc &&
                      !this.props.extensions.nist && (
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiCallOut
                              title={
                                <p>
                                  Click the <EuiIcon type="eye" /> icon to show
                                  regulatory compliance extensions.
                                </p>
                              }
                              color="success"
                              iconType="help"
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      )}
                    {(this.props.extensions.pci ||
                      this.props.extensions.gdpr ||
                      this.props.extensions.hipaa ||
                      this.props.extensions.tsc ||
                      this.props.extensions.nist) && (
                      <EuiFlexGrid columns={2}>
                        {this.props.extensions.pci &&
                          this.buildTabCard('pci', 'visTagCloud')}
                        {this.props.extensions.nist &&
                          this.buildTabCard('nist', 'apmApp')}
                        {this.props.extensions.tsc &&
                          this.buildTabCard('tsc', 'apmApp')}
                        {this.props.extensions.gdpr &&
                          this.buildTabCard('gdpr', 'visBarVertical')}
                        {this.props.extensions.hipaa &&
                          this.buildTabCard('hipaa', 'emsApp')}
                      </EuiFlexGrid>
                    )}
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPage>
        <EuiPage>
          <EuiFlexGroup justifyContent="spaceAround">
            <EuiFlexItem grow={false}>
              <EuiButton
                onClick={() =>
                  (window.location.href = '#/settings?tab=modules')
                }
                iconType="eye"
              >
                Configure the modules
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPage>
      </Fragment>
    );
  }
}
