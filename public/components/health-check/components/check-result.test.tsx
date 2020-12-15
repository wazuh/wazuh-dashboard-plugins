/*
 * Wazuh app - Check Result Component - Test
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
import React from 'react';
import { mount, shallow } from 'enzyme';
import { CheckResult } from './check-result';

describe('Check result component', () => {
  const validationService = jest.fn();
  const handleErrors = jest.fn();
  const handleCheckReady = jest.fn();

  test('should render a Check result screen', () => {
    validationService.mockImplementation(() => ({ errors: [] }));
    const component = mount(
      <CheckResult
        name={'test'}
        title={'test chest'}
        awaitFor={[]}
        check={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
      />
    );

    expect(component).toMatchSnapshot();
  });

  test('should print ready', () => {
    validationService.mockImplementation(() => ({ errors: [] }));
    const component = mount(
      <CheckResult
        name={'test'}
        title={'test chest'}
        awaitFor={[]}
        check={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
      />
    );
    setImmediate(() => {
      expect(component.find('EuiDescriptionListDescription').find('span').at(0).text().trim()).toBe('Ready');
    });
  });

  test('should print error', () => {
    validationService.mockImplementation(() => ({ errors: ['error'] }));
    const component = mount(
      <CheckResult
        name={'test'}
        title={'test chest'}
        awaitFor={[]}
        check={true}
        validationService={validationService}
        handleErrors={handleErrors}
        isLoading={false}
        handleCheckReady={handleCheckReady}
        checksReady={{}}
      />
    );
    setImmediate(() => {
      expect(component.find('EuiDescriptionListDescription').find('span').at(0).text().trim()).toBe('Error');
    });
  });
});
