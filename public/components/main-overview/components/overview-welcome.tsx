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

import React from 'react';
import StringTools from '../../../utils/strings-tools';
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
  EuiButton,
} from '@elastic/eui';
import { updateCurrentTab } from '../../../redux/actions/appStateActions';
import store from '../../../redux/store';
import './welcome.scss';
import { TabDescription } from '../../../../server/reporting/tab-description';

export const OverviewWelcome = (props) => {
  const buildTabCard = (tab, icon) => {
    return (
      <EuiFlexItem>
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="xl" type={icon} color="primary" />}
          className="homSynopsis__card"
          title={TabDescription[tab].title}
          onClick={() => store.dispatch(updateCurrentTab(tab))}
          data-test-subj={`overviewWelcome${StringTools.capitalize(tab)}`}
          description={TabDescription[tab].description}
        />
      </EuiFlexItem>
    );
  };

  const addAgent = () => {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCallOut
            style={{ height: '65%' }}
            title="No agents were added to this manager. "
            color="warning"
            iconType="alert"
          >
            <EuiButton style={{ margin: '-58px 286px' }} color="warning" href="#/agents-preview?">
              Add agent
            </EuiButton>
          </EuiCallOut>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  return (
    <EuiPage className="wz-welcome-page">
      <EuiFlexGroup>
        <EuiFlexItem>
          {props.agentsCountTotal == 0 && addAgent()}
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel betaBadgeLabel="Security Information Management">
                <EuiSpacer size="s" />
                <EuiFlexGrid columns={2}>
                  {buildTabCard('general', 'dashboardApp')}
                  {buildTabCard('fim', 'filebeatApp')}
                  {props.extensions.aws && buildTabCard('aws', 'logoAWSMono')}
                  {props.extensions.gcp && buildTabCard('gcp', 'logoGCPMono')}
                </EuiFlexGrid>
              </EuiPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPanel betaBadgeLabel="Auditing and Policy Monitoring">
                <EuiSpacer size="s" />
                <EuiFlexGrid columns={2}>
                  {buildTabCard('pm', 'advancedSettingsApp')}
                  {props.extensions.audit && buildTabCard('audit', 'monitoringApp')}
                  {props.extensions.oscap && buildTabCard('oscap', 'codeApp')}
                  {props.extensions.ciscat && buildTabCard('ciscat', 'auditbeatApp')}
                  {buildTabCard('sca', 'securityAnalyticsApp')}
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
                  {buildTabCard('vuls', 'securityApp')}
                  {props.extensions.virustotal && buildTabCard('virustotal', 'savedObjectsApp')}
                  {props.extensions.osquery && buildTabCard('osquery', 'searchProfilerApp')}
                  {props.extensions.docker && buildTabCard('docker', 'logoDocker')}
                  {buildTabCard('mitre', 'spacesApp')}
                  {/* TODO- Change "spacesApp" icon*/}
                </EuiFlexGrid>
              </EuiPanel>
            </EuiFlexItem>

            <EuiFlexItem>
              <EuiPanel betaBadgeLabel="Regulatory Compliance">
                <EuiSpacer size="s" />
                {!props.extensions.pci &&
                  !props.extensions.gdpr &&
                  !props.extensions.hipaa &&
                  !props.extensions.tsc &&
                  !props.extensions.nist && (
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiCallOut
                          title={
                            <p>
                              Click the <EuiIcon type="eye" /> icon to show regulatory compliance
                              extensions.
                            </p>
                          }
                          color="success"
                          iconType="help"
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                {(props.extensions.pci ||
                  props.extensions.gdpr ||
                  props.extensions.hipaa ||
                  props.extensions.tsc ||
                  props.extensions.nist) && (
                  <EuiFlexGrid columns={2}>
                    {props.extensions.pci && buildTabCard('pci', 'visTagCloud')}
                    {props.extensions.nist && buildTabCard('nist', 'apmApp')}
                    {props.extensions.tsc && buildTabCard('tsc', 'apmApp')}
                    {props.extensions.gdpr && buildTabCard('gdpr', 'visBarVertical')}
                    {props.extensions.hipaa && buildTabCard('hipaa', 'emsApp')}
                  </EuiFlexGrid>
                )}
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>
  );
};
