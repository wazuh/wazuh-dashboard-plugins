/*
 * Wazuh app - React component for Logtest.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import {
  EuiTitle,
  EuiButton,
  EuiButtonIcon,
  EuiTextArea,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiSpacer
} from '@elastic/eui';

export class Logtest extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      testing: false
    };
  }

  onChange = e => {
    this.setState({
      value: e.target.value
    });
  };

  test = () => {
    this.setState({
      testing: true
    });
    setTimeout(() => {
      var XMLContent = `**Phase 1: Completed pre-decoding.
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
        testResult: XMLContent
      });
    }, 2000);
  };

  render() {
    const codeBlock = {
      zIndex: '100'
    };
    return (
      <Fragment>
        <EuiFlexGroup gutterSize="xs">
          <EuiTitle size="s">
            <h2>Test your logs</h2>
          </EuiTitle>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              color={'text'}
              onClick={() => this.props.close()}
              iconType="cross"
              aria-label="Close"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <Fragment>
          <EuiTextArea
            placeholder="Introduce a log..."
            fullWidth={true}
            aria-label=""
            rows={8}
            onChange={this.onChange}
          />
          <EuiSpacer size="s" />
          <EuiFlexGroup gutterSize="xs">
            <EuiFlexItem />
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
                Test it
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          {this.state.testResult && !this.state.testing && (
            <EuiCodeBlock
              style={codeBlock}
              language="json"
              fontSize="s"
              overflowHeight={675}
            >
              {this.state.testResult}
            </EuiCodeBlock>
          )}
        </Fragment>
      </Fragment>
    );
  }
}

Logtest.propTypes = {
  clickAction: PropTypes.func,
  close: PropTypes.func
};
