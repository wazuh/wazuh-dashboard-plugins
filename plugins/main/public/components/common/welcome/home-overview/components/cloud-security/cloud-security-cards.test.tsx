import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { CloudSecurityCards } from './cloud-security-cards';
import { getCloudModuleUrl } from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getCloudModuleUrl: jest.fn(),
}));
describe('CloudSecurityCards', () => {
  it('navigates to the clicked module app id', () => {
    render(<CloudSecurityCards />);
    fireEvent.click(screen.getByText('Docker'));
    expect(getCloudModuleUrl).toHaveBeenCalledWith('docker');
  });
});
