/*
 * Wazuh app - React component for building Remoted dashboard
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from "react";
import WzReduxProvider from "../../../../../redux/wz-redux-provider";
import KibanaVis from "../../../../../kibana-integrations/kibana-vis";
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from "@elastic/eui";
import { useBuildStatisticsVisualizations } from './hooks';

export function WzStatisticsRemoted({clusterNodeSelected,  refreshVisualizations}) {
  useBuildStatisticsVisualizations(clusterNodeSelected, refreshVisualizations);
  return (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiPanel style={{ height: "400px" }}>
            <EuiFlexGroup>
              <EuiFlexItem>Total number of bytes received</EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <div style={{ height: "365px" }}>
                  <WzReduxProvider>
                    <KibanaVis
                      visID={
                        "Wazuh-App-Statistics-remoted-Recv-bytes"
                      }
                      tab={"statistics"}
                    ></KibanaVis>
                  </WzReduxProvider>
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel style={{ height: "400px" }}>
            <EuiFlexGroup>
              <EuiFlexItem>Events sent to Analysisd</EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <div style={{ height: "365px" }}>
                  <WzReduxProvider>
                    <KibanaVis
                      visID={
                        "Wazuh-App-Statistics-remoted-event-count"
                      }
                      tab={"statistics"}
                    ></KibanaVis>
                  </WzReduxProvider>
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiPanel style={{ height: "400px" }}>
            <EuiFlexGroup>
              <EuiFlexItem>Messages statistics</EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <div style={{ height: "365px" }}>
                  <WzReduxProvider>
                    <KibanaVis
                      visID={
                        "Wazuh-App-Statistics-remoted-messages"
                      }
                      tab={"statistics"}
                    ></KibanaVis>
                  </WzReduxProvider>
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel style={{ height: "400px" }}>
            <EuiFlexGroup>
              <EuiFlexItem>TCP sessions</EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <div style={{ height: "365px" }}>
                  <WzReduxProvider>
                    <KibanaVis
                      visID={
                        "Wazuh-App-Statistics-remoted-tcp-sessions"
                      }
                      tab={"statistics"}
                    ></KibanaVis>
                  </WzReduxProvider>
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}
