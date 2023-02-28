/*
 * Wazuh app - React test for ErrorBoundary component.
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
import ErrorBoundary from './error-boundary';

jest.mock('loglevel');
jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: (options) => {},
  }),
}));

describe('ErrorBoundary component', () => {
  const ComponentWithError = () => {
    throw new Error('I crashed! I crash very hard');
    return <></>;
  };

  it('renders correctly to match the snapshot', () => {
    const wrapper = mount(
      <ErrorBoundary>
        <ComponentWithError />
      </ErrorBoundary>
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('should display an ErrorMessage if wrapped component throws', () => {
    const wrapper = mount(
      <ErrorBoundary>
        <ComponentWithError />
      </ErrorBoundary>
    );

    expect(wrapper.find('EuiTitle').exists()).toBeTruthy();
    expect(wrapper.find('EuiText').exists('details')).toBeTruthy();
    expect(wrapper.find('EuiTitle').find('h2').text().trim()).toBe('Something went wrong.');
    expect(wrapper.find('EuiText').find('details').find('span').at(0).text()).toBe(
      'Error: I crashed! I crash very hard'
    );
  });
});
