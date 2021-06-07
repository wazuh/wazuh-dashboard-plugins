import React from 'react';
import { withErrorBoundary } from './with-error-boundary';
import { mount } from 'enzyme';

jest.mock('loglevel');

describe('withErrorBoundary hoc implementation', () => {
  const ComponentWithError = () => {
    throw new Error('I crashed!');
    return <></>;
  }

  it('renders correctly and check snapshot', () => {
    const ErrorComponentWithHoc = withErrorBoundary(() => <ComponentWithError />);
    const wrapper = mount(<ErrorComponentWithHoc />);

    expect(wrapper).toMatchSnapshot();
  });

  it('should display an ErrorMessage if wrapped HOC throws', () => {
    const ErrorComponentWithHoc = withErrorBoundary(() => <ComponentWithError />);
    const wrapper = mount(<ErrorComponentWithHoc />);

    expect(wrapper.find('EuiTitle').find('h2').text().trim()).toBe('Something went wrong.');
  });
});
