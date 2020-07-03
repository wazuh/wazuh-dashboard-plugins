/*
 * Wazuh app - React component for Logtest.
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
import { DynamicHeight } from '../../../utils/dynamic-height';
import {
  EuiPage,
  EuiTitle,
  EuiButton,
  EuiTextArea,
  EuiFlexGroup,
  EuiFieldText,
  EuiSelect,
  EuiFlexItem,
  EuiCodeBlock,
  EuiSpacer,
  EuiPanel,
  EuiBadge
} from '@elastic/eui';

export class Logtest extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      testing: false,
      logTypeSelect: 'log',
    };
  }

  onChange = e => {
    this.setState({
      value: e.target.value
    });
  };

  test = async () => {
    this.setState({
      testing: true
    });
    //const result = await this.props.clickAction(this.state.value);
    const result =
      `**Phase 1: Completed pre-decoding.
          full event: 'timestamp:2019-09-03T13:22:27.950+0000 rule:level:7 rule:description:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms rule:id:23504 rule:firedtimes:33 rule:mail:false rule:groups:[vulnerability-detector] rule:gdpr:[IV_35.7.d] agent:id:000 agent:name:a205e5b2a1aa manager:{name:a205e5b2a1aa} id:1567516947.252273 cluster:name:wazuh cluster:node:master decoder:{name:json} data:{vulnerability:cve:CVE-2019-9948} data:{vulnerability:title:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms} data:{vulnerability:severity:Medium} data:{vulnerability:published:2019-03-23T00:00:00+00:00} data:{vulnerability:state:Fixed} data:{vulnerability:cvss:{cvss3_score:7.400000}} data:{vulnerability:package:name:python} data:{vulnerability:package:version:2.7.5-80.el7_6} data:{vulnerability:package:condition:less than 2.7.5-86.el7} data:{vulnerability:advisories:RHSA-2019:2030,RHSA-2019:1700} data:{vulnerability:cwe_reference:CWE-749} data:{vulnerability:bugzilla_reference:https://bugzilla.redhat.com/show_bug.cgi?id=1695570} data:{vulnerability:reference:https://access.redhat.com/security/cve/CVE-2019-9948} location:vulnerability-detector'
          timestamp: '(null)'
          hostname: 'a205e5b2a1aa'
          program_name: '(null)'
          log: 'timestamp:2019-09-03T13:22:27.950+0000 rule:level:7 rule:description:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms rule:id:23504 rule:firedtimes:33 rule:mail:false rule:groups:[vulnerability-detector] rule:gdpr:[IV_35.7.d] agent:id:000 agent:name:a205e5b2a1aa manager:{name:a205e5b2a1aa} id:1567516947.252273 cluster:name:wazuh cluster:node:master decoder:{name:json} data:{vulnerability:cve:CVE-2019-9948} data:{vulnerability:title:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms} data:{vulnerability:severity:Medium} data:{vulnerability:published:2019-03-23T00:00:00+00:00} data:{vulnerability:state:Fixed} data:{vulnerability:cvss:{cvss3_score:7.400000}} data:{vulnerability:package:name:python} data:{vulnerability:package:version:2.7.5-80.el7_6} data:{vulnerability:package:condition:less than 2.7.5-86.el7} data:{vulnerability:advisories:RHSA-2019:2030,RHSA-2019:1700} data:{vulnerability:cwe_reference:CWE-749} data:{vulnerability:bugzilla_reference:https://bugzilla.redhat.com/show_bug.cgi?id=1695570} data:{vulnerability:reference:https://access.redhat.com/security/cve/CVE-2019-9948} location:vulnerability-detector'
          **Phase 2: Completed decoding.
          No decoder matched.
          **Phase 3: Completed filtering (rules).
          Rule id: '1002'
          Level: '2'
          Description: 'Unknown problem somewhere in the system.'`;
    this.setState({
      testing: false,
      testResult: result
    });
  };

  getLogsTypeOptions() {
    return [
      { value: 'log', text: 'Log' }
    ];
  }

  buildControls() {
    const logsTypeOptions = this.getLogsTypeOptions();
    return (
      <Fragment>
        <EuiFlexItem grow={false}>
          <EuiSelect
            id="logsTypeOptions"
            options={logsTypeOptions}
            value={this.state.logTypeSelect}
            onChange={(e) => this.setState({ logTypeSelect: e.target.value })}
            aria-label="Logs type"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFieldText
            placeholder="Log location"
            value={this.state.logLocation}
            onChange={e => this.setState({ logLocation: e.target.value })}
            aria-label="Log location"
          />
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiButton
            isLoading={this.state.testing}
            isDisabled={this.state.testing || !this.state.value}
            iconType="play"
            fill
            onClick={() => {
              this.test();
            }}
          >
            Test
              </EuiButton>
        </EuiFlexItem>
      </Fragment>
    );
  }

  buildLogtest() {

    return (
      <Fragment>
        <EuiTextArea
          placeholder="Type one log per line..."
          fullWidth={true}
          aria-label=""
          rows={this.props.showClose ? 10 : 4}
          onChange={this.onChange}
        />        
        <EuiSpacer size='m'></EuiSpacer>
        <EuiCodeBlock
          language="json"
          fontSize="s"
          style={!this.props.onFlyout && {height: 'calc(100vh - 400px)'} || {height: 'calc(100vh - 355px)'}}
          isCopyable={this.state.testResult ? true : false}
        >
          {this.state.testResult || 'The test result will appear here.'}
        </EuiCodeBlock>
      </Fragment>
    );
  }

  render() {
    return (
      <Fragment>
        {!this.props.onFlyout &&
          <EuiPage>
            <EuiPanel paddingSize="l">
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup gutterSize="m">
                    <Fragment>
                      <EuiFlexItem grow={false}>
                        <EuiTitle size="m">
                          <h2>Test your logs</h2>
                        </EuiTitle>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ padding: '10px 0' }}>
                        <EuiBadge color='#BD271E' iconType="clock">Test session started at 2020/02/07 12:56:32</EuiBadge>
                      </EuiFlexItem>
                    </Fragment>
                    <EuiFlexItem />
                    {this.buildControls()}
                  </EuiFlexGroup>
                  <EuiSpacer size="s" />
                  {this.buildLogtest()}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiPage>
          ||
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup gutterSize="m">
                <EuiFlexItem />
                {this.buildControls()}
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              {this.buildLogtest()}
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      </Fragment>
    );
  }
}