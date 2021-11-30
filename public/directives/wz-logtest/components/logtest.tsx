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
  EuiOutsideClickDetector,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services';
import { withErrorBoundary, withReduxProvider, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { compose } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { updateLogtestToken } from '../../../redux/actions/appStateActions';
import { WzButtonPermissionsModalConfirm } from '../../../components/common/buttons';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

type LogstestProps = {
  openCloseFlyout: () => {};
  showClose: boolean;
  onFlyout: boolean;
  isRuleset: string;
};

export const Logtest = compose(
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt([{ action: 'logtest:run', resource: `*:*:*` }])
)((props: LogstestProps) => {
  const [events, setEvents] = useState([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const dispatch = useDispatch();
  const sessionToken = useSelector((state) => state.appStateReducers.logtestToken);

  const onChange = (e) => {
    setEvents(e.target.value.split('\n').filter((item) => item));
  };

  const formatResult = (result, alert) => {
    let returnedDataFormatted =`**Phase 1: Completed pre-decoding. \n    ` +
    `full event:  ${result.full_log || '-'}  \n    ` +
    `timestamp: ${(result.predecoder || '').timestamp || '-'} \n    ` +
    `hostname: ${(result.predecoder || '').hostname || '-'} \n    ` +
    `program_name: ${(result.predecoder || '').program_name || '-'} \n\n` +
    `**Phase 2: Completed decoding. \n    ` +
    `name: ${(result.decoder || '').name || '-'} \n    ` +
    `${(result.decoder || '').parent ? `parent: ${(result.decoder || '').parent} \n    ` : ''}` +
    `data: ${JSON.stringify(result.data || '-', null, 6).replace('}', '    }')} \n\n` ;
    
    result.rule && (
        returnedDataFormatted += `**Phase 3: Completed filtering (rules). \n    ` +
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
        `mitre.technique: ${JSON.stringify((result.rule || '').mitre || ''.technique || '-')} \n    ` +
        `nist_800_53: ${JSON.stringify((result.rule || '').nist_800_53 || '-')} \n    ` +
        `pci_dss: ${JSON.stringify((result.rule || '').pci_dss || '-')} \n    ` +
        `tsc: ${JSON.stringify((result.rule || '').tsc || '-')} \n` 
      );

      returnedDataFormatted += `${alert ? `**Alert to be generated. \n\n\n` : '\n\n'}`      
    return (
      returnedDataFormatted
    );
  };

  const runAllTests = async () => {
    setTestResult('');
    setTesting(true);
    let token = sessionToken;
    const responses = [];
    let gotToken = Boolean(token);

    try {
      for (let event of events) {        
        const response = await WzRequest.apiReq('PUT', '/logtest', {
          log_format: 'syslog',
          location: 'logtest',
          event,
          ...(token ? { token } : {}),
        });
        
        token = response.data.data.token;
        !sessionToken && !gotToken && token && dispatch(updateLogtestToken(token));
        token && (gotToken = true);
        responses.push(response);
      };
      const testResults = responses.map((response) => {
        return response.data.data.output || '' 
        ? formatResult(response.data.data.output, response.data.data.alert)
        : `No result found for: ${response.data.data.output.full_log} \n\n\n`
      });
      setTestResult(testResults);
    } finally {
      setTesting(false);
    }
  };

  const handleKeyPress = async (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      await runAllTests();
    }
  };

  const deleteToken = async () => {
    try {
      await WzRequest.apiReq('DELETE', `/logtest/sessions/${sessionToken}`, {});
      dispatch(updateLogtestToken(''));
      setTestResult('');
    } catch (error) {
      const options: UIErrorLog = {
        context: `${Logtest.name}.deleteToken`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: `Error trying to delete logtest token due to: ${error.message || error}`,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
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
          onKeyPress={handleKeyPress}
        />
        <EuiSpacer size="m" />
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButton
              style={{ maxWidth: '100px' }}
              isLoading={testing}
              isDisabled={testing || events.length === 0}
              iconType="play"
              fill
              onClick={runAllTests}
            >
              Test
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <WzButtonPermissionsModalConfirm
              style={{ maxWidth: '150px' }}
              tooltip={{ position: 'top', content: 'Clear current session' }}
              fill
              isDisabled={sessionToken === '' ? true : false}
              aria-label="Clear current session"
              iconType="broom"
              onConfirm={async () => {
                deleteToken();
              }}
              color="danger"
              modalTitle={`Do you want to clear current session?`}
              modalProps={{
                buttonColor: 'danger',
                children:
                  'Clearing the session means the logs execution history is removed. This affects to rules that fire an alert when similar logs are executed in a specific range of time.',
              }}
            >
              Clear session
            </WzButtonPermissionsModalConfirm>
          </EuiFlexItem>
        </EuiFlexGroup>
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
        <EuiOverlayMask headerZindexLocation="below">
          <EuiOutsideClickDetector onOutsideClick={() => {
            props.openCloseFlyout();
          }}>
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
          </EuiOutsideClickDetector>
        </EuiOverlayMask>
      )}
    </Fragment>
  );
});
