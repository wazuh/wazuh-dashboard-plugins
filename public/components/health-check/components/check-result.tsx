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
import React, { Fragment, useEffect, useState } from 'react';
import {
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';

export function CheckResult(props) {
  const [result, setResult] = useState<any>('');
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    if (props.check) {
      setIsloading(true);
      initCheck();
    } else if (props.check === false) {
      setResult('Disabled');
    }
  }, [props.checkPatterns]);


  const initCheck = async () => {
    try {
      const { errors } = await props.validationService(props.showToast);
      if (errors.length) {
        props.handleError(errors);
        setResult(
          <span>
            <EuiIcon type="alert" color="danger"></EuiIcon> Error
          </span>
        );
      } else {
        setResult(
          <span>
            <EuiIcon type="check" color="secondary"></EuiIcon> Ready
          </span>
        );
      }
    } catch (error) {
      props.handleError(error);
      setResult(
        <span>
          <EuiIcon type="alert" color="danger"></EuiIcon> Error
        </span>
      );
    }
  };

  return (
    <Fragment>
      <EuiDescriptionListTitle>{props.title}</EuiDescriptionListTitle>
      <EuiDescriptionListDescription>
        {isLoading && (
          <span>
            <EuiLoadingSpinner size="m" /> Checking...
          </span>
        )}
        {!isLoading && <span>{result}</span>}
      </EuiDescriptionListDescription>
    </Fragment>
  );
}
