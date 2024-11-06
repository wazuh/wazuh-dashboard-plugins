import React from 'react';
import { render } from '@testing-library/react';
import { WindowsUpdatesTable } from './components';
import SoftwareTab from './software';

let WindowsUpdatesTableMock = WindowsUpdatesTable as jest.Mock;

jest.mock('./components', () => ({
  WindowsUpdatesTable: jest.fn(() => <></>),
  PackagesTable: jest.fn(() => <></>),
}));

describe('Software', () => {
  it('should render WindowsUpdatesTable when platform is windows', () => {
    render(<SoftwareTab agent={{ os: { platform: 'windows' } }} />);

    expect(WindowsUpdatesTableMock).toHaveBeenCalled();
  });
});
