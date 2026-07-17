import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloudSecurityCards } from './cloud-security-cards';
import { goToCloudModule } from '../../navigation';

jest.mock('../../navigation', () => ({
  goToCloudModule: jest.fn(),
}));

describe('CloudSecurityCards', () => {
  it('navigates to the clicked module app id', () => {
    render(<CloudSecurityCards />);
    fireEvent.click(screen.getByText('Docker'));
    expect(goToCloudModule).toHaveBeenCalledWith('docker');
  });
});
