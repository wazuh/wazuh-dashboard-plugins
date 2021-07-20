import React from 'react';
import { withErrorBoundary } from './with-error-boundary';
import { mount } from 'enzyme';

jest.mock('loglevel');
jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: (options) => {},
  }),
}));

describe('withErrorBoundary hoc implementation', () => {
  const ComponentWithError = () => {
    throw new Error('I crashed! I crash very hard');
    return <></>;
  };

  it('renders correctly to match the snapshot', () => {
    const ErrorComponentWithHoc = withErrorBoundary(() => <ComponentWithError />);
    const wrapper = mount(<ErrorComponentWithHoc />);

    expect(wrapper).toMatchSnapshot();
  });

  it('should display an ErrorMessage if wrapped HOC throws', () => {
    const ErrorComponentWithHoc = withErrorBoundary(() => <ComponentWithError />);
    const wrapper = mount(<ErrorComponentWithHoc />);

    expect(wrapper.find('EuiTitle').exists()).toBeTruthy();
    expect(wrapper.find('EuiText').exists('details')).toBeTruthy();
    expect(wrapper.find('EuiTitle').find('h2').text().trim()).toBe('Something went wrong.');
    expect(wrapper.find('EuiText').find('details').find('span').at(0).text()).toBe(
      'Error: I crashed! I crash very hard'
    );
  });
});
