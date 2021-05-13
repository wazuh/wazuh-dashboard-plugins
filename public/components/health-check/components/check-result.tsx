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
import React, { useEffect, useState } from 'react';
import {
  EuiButtonIcon,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiIcon,
  EuiLoadingSpinner,
  EuiToolTip
} from '@elastic/eui';

type Result = 'loading' | 'ready' | 'error' | 'error_retry' | 'disabled' | 'waiting';

export function CheckResult(props) {
  const [result, setResult] = useState<Result>('waiting');
  const [isCheckStarted, setIsCheckStarted] = useState<boolean>(false);

  useEffect(() => {
    if (props.check && !props.isLoading && awaitForIsReady()){
      initCheck();
    } else if (props.check === false && !props.checksReady[props.name]) {
      setResult('disabled');
      setAsReady();
    }
  }, [props.check, props.isLoading, props.checksReady]);

  const setAsReady = () => {
    props.handleCheckReady(props.name, true);
  };

  const handleErrors = (errors, parsed?) => {
    props.handleErrors(props.name, errors, parsed);
  };

  /**
   * validate if the current check is not started and if the dependentes checks are ready
   */
  const awaitForIsReady = () => {
    return !isCheckStarted && (props.awaitFor.length === 0 || props.awaitFor.every((check) => {
      return props.checksReady[check];
    }))
  }

  const initCheck = async () => {
    setIsCheckStarted(true);
    setResult('loading');
    props.cleanErrors(props.name);
    try {
      const { errors } = await props.validationService();
      if (errors.length) {
        handleErrors(errors);
        setResult('error');
        props.canRetry ? setResult('error_retry') : setResult('error');
      } else {
        setResult('ready');
        setAsReady();
      }      
    } catch (error) {
      handleErrors([error], true);
      props.canRetry ? setResult('error_retry') : setResult('error');
    }
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

  return (
    <>
      <EuiDescriptionListTitle>{props.title}</EuiDescriptionListTitle>
      <EuiDescriptionListDescription>{renderResult()}</EuiDescriptionListDescription>
    </>
  );
}
