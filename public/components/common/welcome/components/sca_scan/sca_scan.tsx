/*
 * Wazuh app - React component information about last SCA scan.
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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiLink,
  EuiBadge,
  EuiStat,
  EuiSpacer,
  EuiLoadingChart,
  EuiButtonIcon,
  EuiToolTip,
  EuiEmptyPrompt,
  EuiIcon
} from '@elastic/eui';
import chrome from 'ui/chrome';
import { WzRequest } from '../../../../../react-services/wz-request';

export class ScaScan extends Component {
  _isMount = false;
  props!: {
    [key: string]: any
  }
  state: {
    lastScan: {
      [key: string]: any
    },
    isLoading: Boolean,
  }

  constructor(props) {
    super(props);
    this.state = {
      lastScan: {
        "fail": 34,
        "total_checks": 64,
        "pass": 30,
        "policy_id": "cis_rhel7",
        "references": "https://www.cisecurity.org/cis-benchmarks/",
        "invalid": 0,
        "start_scan": "2020-05-25 06:34:34",
        "hash_file": "7f9e47fed248837fb214611cba0995b7877c1e916127c1242cb18982447ffe32",
        "end_scan": "2020-05-25 01:34:34",
        "score": 46,
        "description": "This document provides prescriptive guidance for establishing a secure configuration posture for Red Hat Enterprise Linux 7 systems running on x86 and x64 platforms. This document was tested against Red Hat Enterprise Linux 7.4.",
        "name": "CIS Benchmark for Red Hat Enterprise Linux 7"
      },
      isLoading: true,
    };
  }

  async componentDidMount() {
    this._isMount = true;
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    this.getLastScan(this.props.agentId);
  }

  async getLastScan(agentId: Number) {
    const scans = await WzRequest.apiReq('GET', `/sca/${agentId}?sort=-end_scan`, { limit: 1 });
    this._isMount &&
      this.setState({
        /* lastScan: (((scans.data || {}).data || {}).items || {})[0], */
        isLoading: false,
      });
  }

  durationScan() {
    const { lastScan }  = this.state
    
    // asignar la fecha en milisegundos
    let startScan = new Date(lastScan.start_scan).getTime();
    let endScan = new Date(lastScan.end_scan).getTime();
    console.log({startScan, endScan})

    // asignar el valor de las unidades en milisegundos
    var msecPerMinute = 1000 * 60;
    var msecPerHour = msecPerMinute * 60;
    var msecPerDay = msecPerHour * 24;

    // Obtener la diferencia en milisegundos
    var interval = startScan - endScan;

    // Calcular cuentos días contiene el intervalo. Substraer cuantos días
    //tiene el intervalo para determinar el sobrante
    var days = Math.floor(interval / msecPerDay );
    interval = interval - (days * msecPerDay );

    // Calcular las horas , minutos y segundos
    var hours = Math.floor(interval / msecPerHour );
    interval = interval - (hours * msecPerHour );

    var minutes = Math.floor(interval / msecPerMinute );
    interval = interval - (minutes * msecPerMinute );

    var seconds = Math.floor(interval / 1000 );

    // Mostrar el resultado.
    /* return(days + " days, " + hours + " hours, " + minutes + " minutes, " + seconds + " seconds."); */
    return(`${hours}:${minutes}:${seconds}`)

    //Output: 164 días, 23 horas, 0 minutos, 0 segundos.
  }

  renderLoadingStatus() {
    const { isLoading } = this.state;
    if (!isLoading) {
      return;
    } else {
      return (
        <EuiFlexGroup justifyContent="center" alignItems="center">
          <EuiFlexItem grow={false}>
            <div style={{ display: 'block', textAlign: "center", paddingTop: 100 }}>
              <EuiLoadingChart size="xl" />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      )
    }
  }

  renderScanDetails() {
    const { isLoading, lastScan } = this.state;
    if (isLoading || lastScan === undefined) return;
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <EuiLink onClick={() => {
                window.location.href = `#/agents?agent=${this.props.agentId}&tab=sca&redirectPolicy=${lastScan.policy_id}`;
                this.router.reload();
                }
              }>
                <h3>{lastScan.name}</h3>
              </EuiLink>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 15 }}>
            <EuiBadge color="secondary">{lastScan.policy_id}</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={true}>
            <EuiText>
              <EuiIcon type="clock" /> Duration: {this.durationScan()}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'s'}>
              <p>{lastScan.description}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.pass}
              titleSize="m"
              textAlign="center"
              description="Pass"
              titleColor="secondary"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.fail}
              titleSize="m"
              textAlign="center"
              description="Fail"
              titleColor="danger"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={lastScan.total_checks}
              titleSize="m"
              textAlign="center"
              description="Total checks"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={`${lastScan.score}%`}
              titleSize="m"
              textAlign="center"
              description="Score"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText textAlign="center">
              <span>{`Start Scan: ${lastScan.start_scan} - End Scan: ${lastScan.end_scan}`}</span>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }


  renderEmptyPrompt() {
    const { isLoading } = this.state;
    if (isLoading) return;
    return (
      <Fragment>
        <EuiEmptyPrompt
          iconType="visVega"
          title={<h4>You dont have SCA scans in this agent.</h4>}
          body={
            <Fragment>
              <p>
                Check your agent settings to generate scans.
              </p>
            </Fragment>
          }
        />
      </Fragment>
    )
  }

  render() {
    const { lastScan } = this.state;
    const loading = this.renderLoadingStatus();
    const scaScan = this.renderScanDetails();
    const emptyPrompt = this.renderEmptyPrompt();
    return (
      <EuiFlexItem>
        <EuiPanel paddingSize="m">
          <EuiText size="xs">
            <EuiFlexGroup>
              <EuiFlexItem>
                <h2>SCA: Last scan</h2>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip position="top" content="Open SCA Scans">
                  <EuiButtonIcon
                    iconType="popout"
                    color="primary"
                    onClick={() => this.props.switchTab('sca')}
                    aria-label="Open SCA Scans" />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiText>
          {lastScan === undefined && emptyPrompt}
          {loading}
          {scaScan}
        </EuiPanel>
      </EuiFlexItem>
    )
  }
}