import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzUpdatesNotification } from '.';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn().mockReturnValue({
    UpdatesNotification: () => <div>Updates notification</div>,
  }),
  getAngularModule: () => { }
}));

describe('WzUpdatesNotification tests', () => {
  test('should render a WzUpdatesNotification', () => {
    const { container } = render(<WzUpdatesNotification />);

    expect(container).toMatchSnapshot();
  });
});
