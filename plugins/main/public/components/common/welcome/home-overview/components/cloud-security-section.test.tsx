import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloudSecuritySection } from './cloud-security-section';
import { goToCloudModule } from '../services/navigation';

jest.mock('../services/navigation', () => ({
  goToCloudModule: jest.fn(),
}));

describe('CloudSecuritySection', () => {
  it('renders immediately with every cloud module card (no loading state)', () => {
    render(<CloudSecuritySection />);
    expect(screen.getByText('Cloud security')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('navigates to the selected module', () => {
    render(<CloudSecuritySection />);
    fireEvent.click(screen.getByText('GitHub'));
    expect(goToCloudModule).toHaveBeenCalledWith('github');
  });
});
