/*
 * Wazuh app - React component for Logtest.
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Fragment, useState } from 'react';
import { DynamicHeight } from '../../../utils/dynamic-height';
import {
  EuiButton,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiOverlayMask,
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services';
import { withReduxProvider, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { compose } from 'redux';

type LogstestProps = {
  openCloseFlyout: () => {};
  showClose: boolean;
  onFlyout: boolean;
  isRuleset: string;
};

export const Logtest = compose(
  withReduxProvider,
  withUserAuthorizationPrompt([{ action: 'logtest:run', resource: `*:*:*` }])
)((props: LogstestProps) => {
  const [value, setValue] = useState([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const onChange = (e) => {
    setValue(e.target.value.split('\n').filter((item) => item));
  };

  const formatResult = (result) => {
    return (
      `**Phase 1: Completed pre-decoding. \n    ` +
      `full event:  ${result.full_log || '-'}  \n    ` +
      `timestamp: ${(result.predecoder || '').timestamp || '-'} \n    ` +
      `hostname: ${(result.predecoder || '').hostname || '-'} \n    ` +
      `program_name: ${(result.predecoder || '').program_name || '-'} \n\n` +
      `**Phase 2: Completed decoding. \n    ` +
      `name: ${(result.decoder || '').name || '-'} \n    ` +
      `parent: ${(result.decoder || '').parent || '-'} \n    ` +
      `srcip: ${(result.data || '').srcip || '-'}  \n    ` +
      `srcport: ${(result.data || '').srcport || '-'} \n    ` +
      `srcuser: ${(result.data || '').srcuser || '-'} \n\n` +
      `**Phase 3: Completed filtering (rules). \n    ` +
      `id: ${(result.rule || '').id || '-'} \n    ` +
      `level: ${(result.rule || '').level || '-'} \n    ` +
      `description: ${(result.rule || '').description || '-'} \n    ` +
      `groups: ${JSON.stringify((result.rule || '').groups || '-')} \n    ` +
      `firedtimes: ${(result.rule || '').firedtimes || '-'} \n    ` +
      `gdpr: ${JSON.stringify((result.rule || '').gdpr || '-')} \n    ` +
      `gpg13: ${JSON.stringify((result.rule || '').gpg13 || '-')} \n    ` +
      `hipaa: ${JSON.stringify((result.rule || '').hipaa || '-')} \n    ` +
      `mail: ${JSON.stringify((result.rule || '').mail || '-')} \n    ` +
      `mitre.id: ${JSON.stringify((result.rule || '').mitre || ''.id || '-')} \n    ` +
      `mitre.technique: ${JSON.stringify(
        (result.rule || '').mitre || ''.technique || '-'
      )} \n    ` +
      `nist_800_53: ${JSON.stringify((result.rule || '').nist_800_53 || '-')} \n    ` +
      `pci_dss: ${JSON.stringify((result.rule || '').pci_dss || '-')} \n    ` +
      `tsc: ${JSON.stringify((result.rule || '').tsc || '-')} \n` +
      `**Alert to be generated. \n\n\n`
    );
  };

  const runAllTests = async () => {
    setTestResult('');
    setTesting(true);
    try{
      const responsesLogtest = await Promise.all(value.map(async event => {
        const body = {
          log_format: 'syslog',
          location: 'logtest',
          event: event,
        };
        return await WzRequest.apiReq('PUT', '/logtest', body);
      }));
      const testResults = responsesLogtest.map(response => 
        response.data.data.alert
          ? formatResult(response.data.data.output)
          : `No result found for:  ${response.data.data.output.full_log} \n\n\n`
      );
      setTestResult(testResults);
    }finally{
      setTesting(false);
    }
  };

  const buildLogtest = () => {
    return (
      <Fragment>
        <EuiTextArea
          placeholder="Type one log per line..."
          fullWidth={true}
          aria-label=""
          rows={props.showClose ? 10 : 4}
          onChange={onChange}
        />
        <EuiSpacer size="m" />
        <EuiFlexItem grow={false}>
          <EuiButton
            style={{ maxWidth: '100px' }}
            isLoading={testing}
            isDisabled={testing || value.length === 0}
            iconType="play"
            fill
            onClick={runAllTests}
          >
            Test
          </EuiButton>
        </EuiFlexItem>
        <EuiSpacer size="m" />
        <EuiCodeBlock
          language="json"
          fontSize="s"
          style={
            (!props.onFlyout && { height: 'calc(100vh - 400px)' }) || {
              height: 'calc(100vh - 355px)',
            }
          }
          isCopyable={!!testResult}
        >
          {testResult || 'The test result will appear here.'}
        </EuiCodeBlock>
      </Fragment>
    );
  };

  const dynamicHeight = () =>
    DynamicHeight.dynamicHeightStatic('.euiCodeBlock', props.showClose ? 70 : 100);

  dynamicHeight();

  return (
    <Fragment>
      {(!props.onFlyout && (
        <EuiPage>
          <EuiPanel paddingSize="l">
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFlexGroup gutterSize="m">
                  <Fragment>
                    <EuiFlexItem grow={false}>
                      <EuiTitle size="m">
                        <h2>Ruleset Test</h2>
                      </EuiTitle>
                    </EuiFlexItem>
                  </Fragment>
                  <EuiFlexItem />
                </EuiFlexGroup>
                <EuiSpacer size="s" />
                {buildLogtest()}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPage>
      )) || (
        <EuiOverlayMask
          headerZindexLocation="below"
          onClick={() => {
            props.openCloseFlyout();
          }}
        >
          <EuiFlyout className="wzApp" onClose={() => props.openCloseFlyout()}>
            <EuiFlyoutHeader hasBorder={false}>
              <EuiTitle size="m">
                {props.isRuleset.includes('rules') ? <h2>Ruleset Test</h2> : <h2>Decoders Test</h2>}
              </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody style={{ margin: '20px' }}>
              <EuiFlexGroup gutterSize="m">
                <EuiFlexItem />
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              {buildLogtest()}
            </EuiFlyoutBody>
          </EuiFlyout>
        </EuiOverlayMask>
      )}
    </Fragment>
  );
});
