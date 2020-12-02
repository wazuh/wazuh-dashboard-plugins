/*
 * Wazuh app - Check Result Component
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';

type Result = 'loading' | 'ready' | 'error' | 'disabled';

export function CheckResult(props) {
  const [result, setResult] = useState<Result>('loading');

  useEffect(() => {
    if (props.check) {
      initCheck();
    } else if (props.check === false) {
      setResult('disabled');
    }
  }, [props.checkPatterns]);

  const initCheck = async () => {
    try {
      const { errors } = await props.validationService();
      if (errors.length) {
        props.handleError(errors);
        setResult('error');
      } else {
        setResult('ready');
      }
    } catch (error) {
      props.handleError(error, true);
      setResult('error');
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
    }
  };

  return (
    <>
      <EuiDescriptionListTitle>{props.title}</EuiDescriptionListTitle>
      <EuiDescriptionListDescription>{renderResult()}</EuiDescriptionListDescription>
    </>
  );
}
