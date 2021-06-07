import React from 'react';
import { mount } from 'enzyme';
import ErrorBoundary from './error-boundary';

jest.mock('loglevel');

describe('ErrorBoundary component', () => {
  const ComponentWithError = () => {
    throw new Error('I crashed!');
    return <></>;
  };

  it('renders correctly and check snapshot', () => {
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
    expect(wrapper.find('EuiTitle').find('h2').text().trim()).toBe('Something went wrong.');
  });
});
