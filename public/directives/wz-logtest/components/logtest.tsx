/*
 * Wazuh app - React component for Logtest.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import {
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt,
} from '../../../components/common/hocs';
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
import { WzFlyout } from '../../../components/common/flyouts';
import _ from 'lodash';

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

  // Format the result of the Wazuh API response to an output similar one to the `wazuh-logtest` utility
  const formatResult = (result, alert, messages) => {
    // How to the `wazuh-logtest` utility logs the output:
    // https://github.com/wazuh/wazuh/blob/master/framework/scripts/wazuh-logtest.py#L359-L397


    const logging = [];
    
    const showFieldInfo = (item, path, label = '') => {
      _.has(item, path) && logging.push(
        `\t${label || path}: '${Array.isArray(_.get(item, path))
          ? JSON.stringify(_.get(item, path))
          : _.get(item, path)}'`
        );
    };

    const showPhaseInfo = (item, showFirst = [], prefix = '') => {
      showFirst && showFirst.forEach(field => {
        showFieldInfo(item, field, prefix+field);
        _.unset(item, field);
      });
      typeof item === 'object' && Object.keys(item).sort().forEach((field) => {
        if(typeof item[field] === 'object' && !Array.isArray(item[field])){
          showPhaseInfo(item[field],[], prefix + field + '.');
        }else{
          showFieldInfo(item, field, prefix+field);
        };
      });
    }

    // Output messages
    if (messages) {
      logging.push('**Messages:');
      messages.forEach(message => logging.push(`\t${message}`));
      logging.push('');
    }

    // Pre-decoding phase
    logging.push('**Phase 1: Completed pre-decoding.');
    // Check in case rule has no_full_log attribute
    if(result.full_log){
      showFieldInfo(result, 'full_log', 'full event');
    };

    if(result.predecoder){
      showPhaseInfo(result.predecoder, ['timestamp', 'hostname', 'program_name']);
    }

    // Decoding phase
    logging.push('');
    logging.push('**Phase 2: Completed decoding.');

    if(result.decoder && Object.keys(result.decoder).length > 0){
      showPhaseInfo(result.decoder, ['name', 'parent']);
      if(result.data){
        showPhaseInfo(result.data, []);
      };
    }else{
      logging.push('\tNo decoder matched.')
    }

    // Rule phase

    // Rule debugging
    // The output has data if the utility is ran in verbose mode: `wazuh-logtest -v`.
    // At this moment, the Wazuh API doesn't let run in verbose mode.
    if(result.rules_debug){
      logging.push('');
      logging.push('**Rule debugging:');
      result.rules_debug.forEach(debugMessage => logging.push(`${debugMessage[0] === '*' ? '\t\t' : '\t'}${debugMessage}`));
    };
    
    if(result.rule){
      logging.push('');
      logging.push('**Phase 3: Completed filtering (rules).');
      showPhaseInfo(result.rule, ['id', 'level', 'description', 'groups', 'firedtimes']);
    };

    if(alert){
      logging.push('**Alert to be generated.');
    };

    return logging.join('\n');
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
      }
      const testResults = responses.map((response) => {
        return response.data.data.output || ''
          ? formatResult(response.data.data.output, response.data.data.alert, response.data.data.messages)
          : `No result found for: ${response.data.data.output.full_log}`;
      }).join('\n\n');
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
        <WzFlyout flyoutProps={{ className: 'wzApp' }} onClose={() => props.openCloseFlyout()}>
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
        </WzFlyout>
      )}
    </Fragment>
  );
});
