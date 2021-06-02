import React from 'react';
import ErrorBoundary, { withErrorBoundary } from './with-error-boundary';
import { mount } from 'enzyme';

jest.mock('loglevel');

describe('<ErrorBoundary> component', () => {
  const ComponentWithError = () => new Error('test');

  it('renders correctly and check snapshoot', () => {
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

  it('should display an ErrorMessage if wrapped HOC throws', () => {
    const ErrorComponentWithHoc = withErrorBoundary(() => <ComponentWithError />);
    const wrapper = mount(<ErrorComponentWithHoc />);

    expect(wrapper.find('EuiTitle').find('h2').text().trim()).toBe('Something went wrong.');
  });
});
