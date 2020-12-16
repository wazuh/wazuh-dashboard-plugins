/*
 * Wazuh app - React component for building the management welcome screen.
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
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPage,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { switchTab } from '../service/management-tabs.service';

export const ManagementWelcome = () => {
  const switchSection = (section) => {
    switchTab(section, true);
    //this.props.updateManagementSection(section);
  };

  return (
    <WzReduxProvider>
      <EuiPage className="wz-welcome-page">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Administration">
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="indexRollupApp" color="primary" />}
                    title="Rules"
                    onClick={() => switchSection('rules')}
                    description="Manage your Wazuh cluster rules."
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="indexRollupApp" color="primary" />}
                    title="Decoders"
                    onClick={() => switchSection('decoders')}
                    description="Manage your Wazuh cluster decoders."
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="indexRollupApp" color="primary" />}
                    title="CDB lists"
                    onClick={() => switchSection('lists')}
                    description="Manage your Wazuh cluster CDB lists."
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="usersRolesApp" color="primary" />}
                    title="Groups"
                    onClick={() => switchSection('groups')}
                    description="Manage your agent groups."
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="devToolsApp" color="primary" />}
                    title="Configuration"
                    onClick={() => switchSection('configuration')}
                    description="Manage your Wazuh cluster configuration."
                  />
                </EuiFlexItem>
                <EuiFlexItem />
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel betaBadgeLabel="Status and reports">
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="uptimeApp" color="primary" />}
                    title="Status"
                    onClick={() => switchSection('status')}
                    description="Manage your Wazuh cluster status."
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="indexPatternApp" color="primary" />}
                    title="Cluster"
                    onClick={() => switchSection('monitoring')}
                    description="Visualize your Wazuh cluster."
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="filebeatApp" color="primary" />}
                    title="Logs"
                    onClick={() => switchSection('logs')}
                    description="Logs from your Wazuh cluster."
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="reportingApp" color="primary" />}
                    title="Reporting"
                    onClick={() => switchSection('reporting')}
                    description="Check your stored Wazuh reports."
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiCard
                    layout="horizontal"
                    className="homSynopsis__card"
                    icon={<EuiIcon size="xl" type="visualizeApp" color="primary" />}
                    title="Statistics"
                    onClick={() => switchSection('statistics')}
                    description="Information about the Wazuh environment"
                  />
                </EuiFlexItem>
                <EuiFlexItem />
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
    </WzReduxProvider>
  );
};
