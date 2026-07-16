import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloudSecurityCards } from './cloud-security-cards';
import { goToCloudModule } from '../services/navigation';

jest.mock('../services/navigation', () => ({
  goToCloudModule: jest.fn(),
}));

describe('CloudSecurityCards', () => {
  it('renders a nav card for each cloud/SaaS module', () => {
    render(<CloudSecurityCards />);
    for (const title of [
      'Docker',
      'Amazon Web Services',
      'Google Cloud',
      'GitHub',
      'Office 365',
      'Microsoft Graph API',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('navigates to the clicked module app id', () => {
    render(<CloudSecurityCards />);
    fireEvent.click(screen.getByText('Docker'));
    expect(goToCloudModule).toHaveBeenCalledWith('docker');
  });
});
