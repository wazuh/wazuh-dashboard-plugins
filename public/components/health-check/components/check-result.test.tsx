/*
 * Wazuh app - Check Result Component - Test
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
import React from 'react';
import { mount } from 'enzyme';
import { CheckResult } from './check-result';
import { waitFor, render } from '@testing-library/react';

describe('Check result component', () => {
  const validationService = jest.fn();
  const handleErrors = jest.fn();
  const handleCheckReady = jest.fn();
  const cleanErrors = jest.fn();

  test('should render a Check result screen', () => {
    validationService.mockImplementation(() => ({ errors: [] }));
    const component = mount(
      <CheckResult
        name={'test'}
        title={'Check Test'}
        awaitFor={[]}
        check={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
        cleanErrors={cleanErrors}
        canRetry={true}
      />
    );

    expect(component).toMatchSnapshot();
  });

  test('should print ready', async () => {
    validationService.mockImplementation(() => ({ errors: [] }));
    const {queryByLabelText} = render(
      <CheckResult
        name={'test'}
        title={'Check Test'}
        awaitFor={[]}
        check={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
        cleanErrors={cleanErrors}
        canRetry={true}
      />
    );
    await waitFor(()=>{
      expect(queryByLabelText('ready').tagName).toEqual('svg')
    });
  });

  test('should print error', async () => {
    validationService.mockImplementation(() => {throw 'error'});
      const {queryByLabelText} = render(
      <CheckResult
        name={'test'}
        title={'Check Test'}
        awaitFor={[]}
        check={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
        cleanErrors={cleanErrors}
        canRetry={true}
      />
    );
      await waitFor(()=>{
        expect(queryByLabelText('error_retry').tagName).toEqual('svg')
    });
  });
});
