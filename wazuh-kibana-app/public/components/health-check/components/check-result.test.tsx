/*
 * Wazuh app - Check Result Component - Test
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
import React from 'react';
import { mount } from 'enzyme';
import { CheckResult } from './check-result';
import { act } from 'react-dom/test-utils';

describe('Check result component', () => {
  const validationService = jest.fn();
  const handleErrors = jest.fn();
  const handleCheckReady = jest.fn();
  const cleanErrors = jest.fn();

  const awaitForMyComponent = async (wrapper: any) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      wrapper.update();
    });
  };

  it('should render a Check result screen', async () => {
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

  it('should print ready', async () => {
    validationService.mockImplementation(() => ({ errors: [] }));
    const wrapper = await mount(
      <CheckResult
        name={'test'}
        title={'Check Test'}
        awaitFor={[]}
        shouldCheck={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
        cleanErrors={cleanErrors}
        canRetry={true}
      />
    );

    await awaitForMyComponent(wrapper);

    expect(wrapper.find('ResultIcons').exists()).toBeTruthy();
    expect(wrapper.find('ResultIcons').prop('result')).toBe('ready');
  });

  it('should print error_retry', async () => {
    validationService.mockImplementation(() => {
      throw 'error_retry';
    });
    const wrapper = await mount(
      <CheckResult
        name={'test'}
        title={'Check Test'}
        awaitFor={[]}
        shouldCheck={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
        cleanErrors={cleanErrors}
        canRetry={true}
      />
    );

    await awaitForMyComponent(wrapper);

    expect(wrapper.find('ResultIcons').exists()).toBeTruthy();
    expect(wrapper.find('ResultIcons').prop('result')).toBe('error_retry');
  });

  it('should print error', async () => {
    validationService.mockImplementation(() => {
      throw 'error';
    });
    const wrapper = await mount(
      <CheckResult
        name={'test'}
        title={'Check Test'}
        awaitFor={[]}
        shouldCheck={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
        cleanErrors={cleanErrors}
        canRetry={false}
      />
    );

    expect(wrapper.find('ResultIcons').exists()).toBeTruthy();
    expect(wrapper.find('ResultIcons').prop('result')).toBe('error');
  });
});
