/*
 * Wazuh app - React component for build q queries.
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
import {
  EuiCard,
  EuiTitle,
  EuiIcon,
  EuiHorizontalRule,
  EuiFlexGroup,
  EuiText,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiSpacer,
  EuiSwitch,
  EuiPanel,
  EuiProgress,
  EuiCode,
  EuiStat
} from '@elastic/eui';

import { Pie } from "../d3/pie";
import {
  Chart,
  Settings,
  Axis,
  LineSeries,
  BarSeries,
  DataGenerator,
} from '@elastic/charts';
import {
  euiPaletteColorBlind,
  euiPaletteComplimentary,
  euiPaletteForStatus,
  euiPaletteForTemperature,
  euiPaletteCool,
  euiPaletteWarm,
  euiPaletteNegative,
  euiPalettePositive,
  euiPaletteGray,
} from '@elastic/eui/lib/services';
const paletteData = {
  euiPaletteColorBlind,
  euiPaletteForStatus,
  euiPaletteForTemperature,
  euiPaletteComplimentary,
  euiPaletteNegative,
  euiPalettePositive,
  euiPaletteCool,
  euiPaletteWarm,
  euiPaletteGray,
};
const paletteNames = Object.keys(paletteData);


export class WelcomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  buildPinnedDashboards() {

    return (
      <EuiFlexGroup style={{ marginBottom: 8 }}>
        <EuiFlexItem grow={true}>
          <EuiTitle size="xs">
            <h1>Pinned dashboards</h1>
          </EuiTitle>
          <EuiHorizontalRule margin="s" />
          <EuiListGroup flush={true} maxWidth={288}>
            <EuiListGroupItem
              id="link1"
              iconType="logoAWS"
              label="Amazon AWS"
              onClick={() => window.alert("click")}
              isActive
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
                'aria-label': 'Favorite link1',
              }}
            />

            <EuiListGroupItem
              id="link2"
              iconType="securityApp"
              onClick={() => window.alert("click")}
              label="Security Events"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
                'aria-label': 'Favorite link2',
              }}
            />

            <EuiListGroupItem
              id="link3"
              onClick={() => window.alert("click")}
              iconType="logoOsquery"
              label="Osquery"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
                'aria-label': 'Favorite link3',
              }}
            />

            <EuiListGroupItem
              id="link4"
              iconType="securityApp"
              onClick={() => window.alert("click")}
              label="MITRE ATT&CK"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
              }}
            />

            <EuiListGroupItem
              id="link5"
              iconType="securityApp"
              onClick={() => window.alert("click")}
              label="PCI DSS"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
              }}
            />
          </EuiListGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
  buildRecentDashboards() {

    return (
      <EuiFlexGroup>
        <EuiFlexItem grow={true}>
          <EuiTitle size="xs">
            <h1>Recent dashboards</h1>
          </EuiTitle>
          <EuiHorizontalRule margin="s" />
          <EuiListGroup flush={true} maxWidth={288}>

            <EuiListGroupItem
              id="link3"
              onClick={() => window.alert("click")}
              iconType="logoOsquery"
              label="Osquery"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
                'aria-label': 'Favorite link3',
              }}
            />

            <EuiListGroupItem
              id="link2"
              iconType="securityApp"
              onClick={() => window.alert("click")}
              label="Security Events"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
                'aria-label': 'Favorite link2',
              }}
            />

            <EuiListGroupItem
              id="link1"
              iconType="logoAWS"
              label="Amazon AWS"
              onClick={() => window.alert("click")}
              isActive
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
                'aria-label': 'Favorite link1',
              }}
            />

            <EuiListGroupItem
              id="link4"
              iconType="securityApp"
              onClick={() => window.alert("click")}
              label="MITRE ATT&CK"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
              }}
            />

            <EuiListGroupItem
              id="link5"
              iconType="securityApp"
              onClick={() => window.alert("click")}
              label="PCI DSS"
              extraAction={{
                color: 'subdued',
                onClick: () => window.alert('Action clicked'),
                iconType: 'pin',
                iconSize: 's',
              }}
            />
          </EuiListGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }


  buildChart() {
    return (
      <EuiPanel paddingSize="m">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="s" style={{ marginLeft: 15 }}>
              <h1>Alerts count by group</h1>
            </EuiTitle>
            <EuiSpacer size="xs"></EuiSpacer>
            <Chart size={{ height: 275 }}>
              <Settings
                showLegend={true}
                legendPosition="right"
                showLegendDisplayValue={false}
              />
              <BarSeries
                id="bars"
                name="0"
                data={[{ x: "01:00", y: 1205, g: 'aws' }, { x: "01:00", y: 3235, g: 'osquery' }, { x: "01:00", y: 5125, g: 'syscheck' }, { x: "01:00", y: 12305, g: 'pci_dss' }, { x: "10:00", y: 1235, g: 'audit' },
                { x: "02:00", y: 8205, g: 'aws' }, { x: "02:00", y: 6235, g: 'osquery' }, { x: "02:00", y: 5125, g: 'syscheck' }, { x: "02:00", y: 1305, g: 'pci_dss' }, { x: "02:00", y: 16235, g: 'audit' },
                { x: "03:00", y: 4205, g: 'aws' }, { x: "03:00", y: 4235, g: 'osquery' }, { x: "03:00", y: 5125, g: 'syscheck' }, { x: "03:00", y: 9305, g: 'pci_dss' }, { x: "03:00", y: 6235, g: 'audit' },
                { x: "04:00", y: 8205, g: 'aws' }, { x: "04:00", y: 6235, g: 'osquery' }, { x: "04:00", y: 5125, g: 'syscheck' }, { x: "04:00", y: 1305, g: 'pci_dss' }, { x: "04:00", y: 135, g: 'audit' },
                { x: "05:00", y: 4205, g: 'aws' }, { x: "05:00", y: 4235, g: 'osquery' }, { x: "05:00", y: 5125, g: 'syscheck' }, { x: "05:00", y: 9305, g: 'pci_dss' }, { x: "05:00", y: 6235, g: 'audit' },
                { x: "06:00", y: 8205, g: 'aws' }, { x: "06:00", y: 6235, g: 'osquery' }, { x: "06:00", y: 5125, g: 'syscheck' }, { x: "06:00", y: 1305, g: 'pci_dss' }, { x: "06:00", y: 12, g: 'audit' },
                { x: "07:00", y: 4205, g: 'aws' }, { x: "07:00", y: 4235, g: 'osquery' }, { x: "07:00", y: 5125, g: 'syscheck' }, { x: "07:00", y: 9305, g: 'pci_dss' }, { x: "07:00", y: 6235, g: 'audit' },
                { x: "08:00", y: 8205, g: 'aws' }, { x: "08:00", y: 6235, g: 'osquery' }, { x: "08:00", y: 5125, g: 'syscheck' }, { x: "08:00", y: 1305, g: 'pci_dss' }, { x: "08:00", y: 23, g: 'audit' },
                { x: "09:00", y: 4205, g: 'aws' }, { x: "09:00", y: 4235, g: 'osquery' }, { x: "09:00", y: 5125, g: 'syscheck' }, { x: "09:00", y: 9305, g: 'pci_dss' }, { x: "09:00", y: 6235, g: 'audit' },
                { x: "10:00", y: 8205, g: 'aws' }, { x: "10:00", y: 6235, g: 'osquery' }, { x: "10:00", y: 5125, g: 'syscheck' }, { x: "10:00", y: 1305, g: 'pci_dss' }, { x: "10:00", y: 12, g: 'audit' },
                { x: "11:00", y: 4205, g: 'aws' }, { x: "11:00", y: 4235, g: 'osquery' }, { x: "11:00", y: 5125, g: 'syscheck' }, { x: "11:00", y: 9305, g: 'pci_dss' }, { x: "11:00", y: 6235, g: 'audit' },
                { x: "12:00", y: 8205, g: 'aws' }, { x: "12:00", y: 6235, g: 'osquery' }, { x: "12:00", y: 5125, g: 'syscheck' }, { x: "12:00", y: 1305, g: 'pci_dss' }, { x: "12:00", y: 23, g: 'audit' },
                { x: "13:00", y: 4205, g: 'aws' }, { x: "13:00", y: 4235, g: 'osquery' }, { x: "13:00", y: 5125, g: 'syscheck' }, { x: "13:00", y: 9305, g: 'pci_dss' }, { x: "13:00", y: 6235, g: 'audit' },
                { x: "14:00", y: 8205, g: 'aws' }, { x: "14:00", y: 6235, g: 'osquery' }, { x: "14:00", y: 5125, g: 'syscheck' }, { x: "14:00", y: 1305, g: 'pci_dss' }, { x: "14:00", y: 12, g: 'audit' },
                { x: "15:00", y: 4205, g: 'aws' }, { x: "15:00", y: 4235, g: 'osquery' }, { x: "15:00", y: 5125, g: 'syscheck' }, { x: "15:00", y: 9305, g: 'pci_dss' }, { x: "15:00", y: 6235, g: 'audit' },
                { x: "16:00", y: 8205, g: 'aws' }, { x: "16:00", y: 6235, g: 'osquery' }, { x: "16:00", y: 5125, g: 'syscheck' }, { x: "16:00", y: 1305, g: 'pci_dss' }, { x: "16:00", y: 23, g: 'audit' },
                { x: "17:00", y: 4205, g: 'aws' }, { x: "17:00", y: 4235, g: 'osquery' }, { x: "17:00", y: 5125, g: 'syscheck' }, { x: "17:00", y: 9305, g: 'pci_dss' }, { x: "17:00", y: 6235, g: 'audit' },
                { x: "18:00", y: 8205, g: 'aws' }, { x: "18:00", y: 6235, g: 'osquery' }, { x: "18:00", y: 5125, g: 'syscheck' }, { x: "18:00", y: 1305, g: 'pci_dss' }, { x: "18:00", y: 12, g: 'audit' },
                { x: "19:00", y: 4205, g: 'aws' }, { x: "19:00", y: 4235, g: 'osquery' }, { x: "19:00", y: 5125, g: 'syscheck' }, { x: "19:00", y: 9305, g: 'pci_dss' }, { x: "19:00", y: 6235, g: 'audit' },
                { x: "20:00", y: 8205, g: 'aws' }, { x: "20:00", y: 62235, g: 'osquery' }, { x: "20:00", y: 5125, g: 'syscheck' }, { x: "20:00", y: 1305, g: 'pci_dss' }, { x: "20:00", y: 23, g: 'audit' },
                { x: "21:00", y: 4205, g: 'aws' }, { x: "21:00", y: 4235, g: 'osquery' }, { x: "21:00", y: 5125, g: 'syscheck' }, { x: "21:00", y: 9305, g: 'pci_dss' }, { x: "21:00", y: 6235, g: 'audit' },
                { x: "22:00", y: 8205, g: 'aws' }, { x: "22:00", y: 6235, g: 'osquery' }, { x: "22:00", y: 5125, g: 'syscheck' }, { x: "22:00", y: 1305, g: 'pci_dss' }, { x: "22:00", y: 12, g: 'audit' },
                { x: "23:00", y: 4205, g: 'aws' }, { x: "23:00", y: 4235, g: 'osquery' }, { x: "23:00", y: 5125, g: 'syscheck' }, { x: "23:00", y: 9305, g: 'pci_dss' }, { x: "23:00", y: 6235, g: 'audit' },
                { x: "00:00", y: 42035, g: 'aws' }, { x: "00:00", y: 6235, g: 'osquery' }, { x: "00:00", y: 5125, g: 'syscheck' }, { x: "00:00", y: 1305, g: 'pci_dss' }, { x: "00:00", y: 23, g: 'audit' }]}
                xAccessor={'x'}
                yAccessors={['y']}
                splitSeriesAccessors={['g']}
                stackAccessors={['g']}
              />

              <Axis
                id="bottom-axis"
                position="bottom"

              />
              <Axis
                id="left-axis"
                position="left"
                showGridLines
              />
            </Chart>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    )
  }


  buildExtraCharts() {

    const model = [
      { id: 'active', label: "Active", value: 414 },
      { id: 'disconnected', label: "Disconnected", value: 37 },
      { id: 'neverConnected', label: "Never connected", value: 11 }
    ];
    const colors = ["#017D73", "#bd271e", "#69707D"];
    return (
      <EuiFlexGroup style={{ marginTop: 10 }}>
        <EuiFlexItem>
          <EuiPanel>
            <EuiTitle size="s">
              <h1><EuiIcon type="usersRolesApp" size="l" /> &nbsp;Authentication attempts</h1>
            </EuiTitle>
            <EuiSpacer size="xl"></EuiSpacer>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiStat
                  title={23441}
                  textAlign="center"
                  description="Authentication failure"
                  titleColor="primary"
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiStat
                  title={332}
                  textAlign="center"
                  description="Authentication success"
                  titleColor="secondary"
                />

              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup style={{ minWidth: 350 }}>
              <Chart size={{ height: 200, marginLeft: 5 }}>
                <Settings
                  showLegend={false}
                  legendPosition="right"
                  showLegendDisplayValue={true}
                />
                <BarSeries
                  id="bars"
                  name="0"
                  data={[{ x: "Failure", y: 2341, g: 'Failure' }, { x: "Success", y: 332, g: 'Success' }]}
                  xAccessor={'x'}
                  yAccessors={['y']}
                  splitSeriesAccessors={['g']}
                  stackAccessors={['g']}
                />

                <Axis
                  id="bottom-axis"
                  position="bottom"

                />
                <Axis
                  id="left-axis"
                  position="left"
                  showGridLines
                />
              </Chart>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel>
            <EuiTitle size="s">
              <h1><EuiIcon type="securityAnalyticsApp" size="l" /> &nbsp; Alerts summary</h1>
            </EuiTitle>
            <EuiSpacer size="xl"></EuiSpacer>
            <EuiText size="s" style={{ marginTop: -10 }}>Showing: 521,423 alerts</EuiText>

            <EuiFlexGroup style={{ marginTop: 10 }}>
              <EuiFlexItem grow={false}>
                <EuiText>Agent01</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={true}>
                <EuiProgress style={{ marginTop: 10 }} value={80} max={100} color="primary" size="xs" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>332,021</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup style={{ marginTop: 10 }}>
              <EuiFlexItem grow={false}>
                <EuiText>CentOS</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={true}>
                <EuiProgress style={{ marginTop: 10 }} value={40} max={100} color="primary" size="xs" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>154,553</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup style={{ marginTop: 10 }}>
              <EuiFlexItem grow={false}>
                <EuiText>RHEL</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={true}>
                <EuiProgress style={{ marginTop: 10, marginLeft: 9 }} value={30} max={100} color="primary" size="xs" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>92,021</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup style={{ marginTop: 10 }}>
              <EuiFlexItem grow={false}>
                <EuiText>Windows</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={true}>
                <EuiProgress style={{ marginTop: 10 }} value={15} max={100} color="primary" size="xs" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>23,021</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup style={{ marginTop: 10 }}>
              <EuiFlexItem grow={false}>
                <EuiText>Agent05</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={true}>
                <EuiProgress style={{ marginTop: 10 }} value={5} max={100} color="primary" size="xs" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>3,221</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel>
            <EuiTitle size="s">
              <h1><EuiIcon type="monitoringApp" size="l" /> &nbsp;Agents summary</h1>
            </EuiTitle>
            <EuiSpacer size="xl"></EuiSpacer>
            <EuiFlexGroup>
              <Pie customStyle={{ margin: '0 auto' }} width={240} height={125} data={model} colors={colors} noLegend={true} />
            </EuiFlexGroup>

            <EuiFlexItem style={{ padding: '25px 0px 0px' }}>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiStat
                    title={462}
                    textAlign="center"
                    description="Total agents"
                    titleColor="primary"
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat
                    title={414}
                    textAlign="center"
                    description="Active"
                    titleColor="secondary"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiStat
                    title={37}
                    textAlign="center"
                    description="Disconnected"
                    titleColor="danger"
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat
                    title={11}
                    textAlign="center"
                    description="Never connected"
                    titleColor="subdued"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }


  render() {
    return (
      <div>
        {/*<EuiFlexGroup>
        <EuiFlexItem grow={true}>
        <EuiTitle size="l">
          <h1>Wazuh</h1>
        </EuiTitle>
        <EuiHorizontalRule margin="m"/>
        </EuiFlexItem>
      </EuiFlexGroup>
      */}
        <EuiFlexGroup>
          <EuiFlexItem style={{ maxWidth: 250, position: 'relative', top: '-32px' }}>
            {this.buildPinnedDashboards()}
            {this.buildRecentDashboards()}
          </EuiFlexItem>
          {/*  CARD
          <EuiFlexItem grow={false}>

            
        <EuiCard
          layout="horizontal"
          icon={<EuiIcon size="l" type={'savedObjectsApp'} />}
          title={'Elastic Cloud'}
          description={
            <span>
              Wrap a lists with to
              match the description text.
            </span>
          }
          onClick={() => window.alert('Card clicked')}
        >
          <EuiText size="s">
            <ul>
              <li>Bullet 1</li>
              <li>Bullet 2</li>
              <li>Bullet 3</li>
            </ul>
          </EuiText>
        </EuiCard>
            
          </EuiFlexItem>
        
        */}

          <EuiFlexItem>
            {this.buildChart()}
            {this.buildExtraCharts()}
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}
