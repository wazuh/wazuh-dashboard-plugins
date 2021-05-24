/*
 * Wazuh app - Check Result Component
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  EuiButtonIcon,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiIcon,
  EuiLoadingSpinner,
  EuiToolTip,
  EuiCodeBlock,
  EuiButtonEmpty,
} from '@elastic/eui';


type Result = 'loading' | 'ready' | 'error' | 'error_retry' | 'disabled' | 'waiting';

export function CheckResult(props) {
  const [result, setResult] = useState<Result>('waiting');
  const [isCheckStarted, setIsCheckStarted] = useState<boolean>(false);
  const [verboseInfo, setVerboseInfo] = useState<string[]>([]);
  const [verboseIsOpen, setVerboseIsOpen] = useState<boolean>(false);
  const [isCheckFinished, setIsCheckFinished] = useState<boolean>(false);
  const verboseInfoWithNotificationWasOpened = useRef(false);

  useEffect(() => {
    if (props.check && !props.isLoading && awaitForIsReady()){
      initCheck();
    } else if (props.check === false && !props.checksReady[props.name]) {
      setResult('disabled');
      setAsReady();
    }
  }, [props.check, props.isLoading, props.checksReady]);

  useEffect(() => {
    if (isCheckFinished){
      const errors = verboseInfo.filter(log => log.type === 'error');
      if(errors.length){
        props.canRetry ? setResult('error_retry') : setResult('error');
        props.handleErrors(props.name, errors.map(({message}) => message));
      }else{
        setResult('ready');
        setAsReady();
      }
    }
  }, [isCheckFinished])

  const setAsReady = () => {
    props.handleCheckReady(props.name, true);
  };

  /**
   * validate if the current check is not started and if the dependentes checks are ready
   */
  const awaitForIsReady = () => {
    return !isCheckStarted && (props.awaitFor.length === 0 || props.awaitFor.every((check) => {
      return props.checksReady[check];
    }))
  }

  const checkLogger = useMemo(() => ({
    _log: (message: string, type: 'info' | 'error' | 'action' ) => {
      setVerboseInfo(state => [...state, {message, type}]);
    },
    info: (message: string) => checkLogger._log(message, 'info'),
    error: (message: string) => checkLogger._log(message, 'error'),
    action: (message: string) => checkLogger._log(message, 'action')
  }), []);

  const initCheck = async () => {
    setIsCheckStarted(true);
    setResult('loading');
    setVerboseInfo([]);
    props.cleanErrors(props.name);
    setIsCheckFinished(false);
    try {
      await props.validationService(checkLogger);  
    } catch (error) {
      checkLogger.error(error.message || error);
    }
    setIsCheckFinished(true);
  };

  const renderResult = () => {
    switch (result) {
      case 'loading':
        return (
          <span>
            <EuiLoadingSpinner size="m" /> Checking...
          </span>
        );
      case 'disabled':
        return <span>Disabled</span>;
      case 'ready':
        return (
          <span>
            <EuiIcon type="check" color="secondary"></EuiIcon> Ready
          </span>
        );
      case 'error':
        return (
          <span>
            <EuiIcon type="alert" color="danger"></EuiIcon> Error
          </span>
        );
      case 'error_retry':
        return (
          <span>
            <EuiIcon type="alert" color="danger"></EuiIcon> Error
            <EuiToolTip
              position='top'
              content='Retry'
            >
              <EuiButtonIcon
                display="base"
                iconType="refresh"
                iconSize="m"
                onClick={initCheck}
                size="m"
                aria-label="Next"
              />
            </EuiToolTip>
          </span>
        );
      case 'waiting':
        return (
          <span>
            Waiting...
          </span>
        );
    }
  };

  const tooltipVerboseButton = `${verboseIsOpen ? 'Close' : 'Open'} details`;
  const checkDidSomeAction = useMemo(() => verboseInfo.some(log => log.type === 'action'), [verboseInfo]);
  const shouldShowNotification = checkDidSomeAction && !verboseInfoWithNotificationWasOpened.current;
  const haveLogs = verboseInfo.length > 0;
  
  const switchVerboseDetails = useCallback(() => {
    if(checkDidSomeAction && !verboseInfoWithNotificationWasOpened.current){
      verboseInfoWithNotificationWasOpened.current = true;
    };
    setVerboseIsOpen(state => !state);
  },[checkDidSomeAction]);

  const inspectLogsButton = isCheckStarted && haveLogs ? 
    <EuiToolTip
      position='top'
      content={tooltipVerboseButton}
      >
      <EuiButtonEmpty size='xs' onClick={switchVerboseDetails} isDisabled={!haveLogs} textProps={{ style:{overflow: 'visible' }}}>
        <EuiButtonIcon
          ariaLabel={tooltipVerboseButton}
          iconType='inspect'
          color='primary'
        />
        {shouldShowNotification && (
          <EuiIcon
            style={{position: 'relative', top: '-10px', left: '-10px'}}
            color='accent'
            type="dot"
            size='s'
          />
        )}
      </EuiButtonEmpty>
    </EuiToolTip>
    : null;

  return (
    <>
      <EuiDescriptionListTitle>
        {props.title}
      </EuiDescriptionListTitle>
      <EuiDescriptionListDescription>
        {renderResult()}
        {' '}
        {inspectLogsButton}
      </EuiDescriptionListDescription>
      {verboseIsOpen && verboseInfo.length > 0 && (
        <EuiCodeBlock
          paddingSize='s'
          fontSize='s'
          isCopyable
          style={{textAlign: 'left'}}
        >
          {verboseInfo.map(log => `${log.type.toUpperCase()}: ${log.message}`).join('\n')}
        </EuiCodeBlock>
      )}
    </>
  );
}
