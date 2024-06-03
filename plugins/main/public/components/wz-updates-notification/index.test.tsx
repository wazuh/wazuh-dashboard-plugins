import React from 'react';
import '@testing-library/jest-dom';
import { WzUpdatesNotification } from '.';
import { renderWithProviders } from '../../redux/render-with-redux-provider';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn().mockReturnValue({
    UpdatesNotification: () => <div>Updates notification</div>,
  }),
  getAngularModule: () => {},
}));

describe('WzUpdatesNotification tests', () => {
  test('should render a WzUpdatesNotification', () => {
    const { container } = renderWithProviders(<WzUpdatesNotification />);

    expect(container).toMatchSnapshot();
  });
});
