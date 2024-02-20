/*
 * Wazuh app - Check Result Component
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiCodeBlock,
} from '@elastic/eui';
import InspectLogButton from './inspect-logs-button';
import ResultIcons from './result-icons';
import './check-result.scss';

type Result =
  | 'loading'
  | 'ready'
  | 'warning'
  | 'error'
  | 'error_retry'
  | 'disabled'
  | 'waiting';

export function CheckResult(props) {
  const [result, setResult] = useState<Result>('waiting');
  const [isCheckStarted, setIsCheckStarted] = useState<boolean>(false);
  const [verboseInfo, setVerboseInfo] = useState<string[]>([]);
  const [verboseIsOpen, setVerboseIsOpen] = useState<boolean>(false);
  const [isCheckFinished, setIsCheckFinished] = useState<boolean>(false);
  const verboseInfoWithNotificationWasOpened = useRef(false);

  useEffect(() => {
    if (props.shouldCheck && !props.isLoading && awaitForIsReady()) {
      initCheck();
    } else if (props.shouldCheck === false && !props.checksReady[props.name]) {
      setResult('disabled');
      setAsReady();
    }
  }, [props.shouldCheck, props.isLoading, props.checksReady]);

  useEffect(() => {
    if (isCheckFinished) {
      const warnings = verboseInfo.filter(log => log.type === 'warning');
      const errors = verboseInfo.filter(log => log.type === 'error');
      if (errors.length > 0) {
        props.canRetry ? setResult('error_retry') : setResult('error');
        props.handleErrors(
          props.name,
          errors.map(({ message }) => message),
        );
      } else {
        if (warnings.length > 0) {
          props.handleWarnings(
            props.name,
            warnings.map(({ message }) => message),
          );
          setResult('warning');
          setAsReady();
        } else {
          setResult('ready');
          setAsReady();
        }
      }
    }
  }, [isCheckFinished]);

  const setAsReady = () => {
    props.handleCheckReady(props.name, true);
  };

  /**
   * validate if the current check is not started and if the depending checks are ready
   */
  const awaitForIsReady = () => {
    return (
      !isCheckStarted &&
      (props.awaitFor.length === 0 ||
        props.awaitFor.every(check => {
          return props.checksReady[check];
        }))
    );
  };

  const checkLogger = useMemo(
    () => ({
      _log: (
        message: string,
        type: 'info' | 'warning' | 'error' | 'action',
      ) => {
        setVerboseInfo(state => [...state, { message, type }]);
      },
      info: (message: string) => checkLogger._log(message, 'info'),
      warning: (message: string) => checkLogger._log(message, 'warning'),
      error: (message: string) => checkLogger._log(message, 'error'),
      action: (message: string) => checkLogger._log(message, 'action'),
    }),
    [],
  );

  const initCheck = async () => {
    setIsCheckStarted(true);
    setResult('loading');
    setVerboseInfo([]);
    props.cleanWarnings(props.name);
    props.cleanErrors(props.name);
    setIsCheckFinished(false);
    try {
      await props.validationService(checkLogger);
    } catch (error) {
      checkLogger.error(error.message || error);
    }
    setIsCheckFinished(true);
  };

  const checkDidSomeAction = useMemo(
    () => verboseInfo.some(log => log.type === 'action'),
    [verboseInfo],
  );
  const shouldShowNotification =
    checkDidSomeAction && !verboseInfoWithNotificationWasOpened.current;
  const haveLogs = verboseInfo.length > 0;

  const switchVerboseDetails = useCallback(() => {
    if (checkDidSomeAction && !verboseInfoWithNotificationWasOpened.current) {
      verboseInfoWithNotificationWasOpened.current = true;
    }
    setVerboseIsOpen(state => !state);
  }, [checkDidSomeAction]);

  const showLogButton = props.showLogButton && isCheckStarted && haveLogs;

  return (
    <>
      <EuiDescriptionListTitle className={`wz-health-check-result-${result}`}>
        {props.title}
      </EuiDescriptionListTitle>
      <EuiDescriptionListDescription>
        <p className={`wz-health-check-result-${result}`}>
          <ResultIcons result={result} initCheck={initCheck}>
            {showLogButton ? (
              <InspectLogButton
                verboseIsOpen={verboseIsOpen}
                haveLogs={haveLogs}
                switchVerboseDetails={switchVerboseDetails}
                shouldShowNotification={shouldShowNotification}
              />
            ) : (
              <></>
            )}
          </ResultIcons>
        </p>
      </EuiDescriptionListDescription>
      {verboseInfo.length > 0 && (
        <EuiCodeBlock
          className={`wz-width-100 ${verboseIsOpen ? 'visible' : ''}`}
          paddingSize='s'
          fontSize='s'
          isCopyable
          style={{ textAlign: 'left' }}
        >
          {verboseInfo
            .map(log => `${log.type.toUpperCase()}: ${log.message}`)
            .join('\n')}
        </EuiCodeBlock>
      )}
    </>
  );
}
