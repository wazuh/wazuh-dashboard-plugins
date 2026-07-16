import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegulatoryComplianceBadges } from './regulatory-compliance-badges';
import { goToRegulatoryCompliance } from '../services/navigation';

jest.mock('../services/navigation', () => ({
  goToRegulatoryCompliance: jest.fn(),
}));

describe('RegulatoryComplianceBadges', () => {
  it('renders all 10 supported frameworks as badges', () => {
    render(<RegulatoryComplianceBadges />);
    for (const label of [
      'PCI DSS',
      'GDPR',
      'HIPAA',
      'NIST 800-53',
      'NIST 800-171',
      'TSC',
      'CMMC',
      'FedRAMP',
      'ISO 27001',
      'NIS2',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('navigates to the clicked framework with its tabView', () => {
    render(<RegulatoryComplianceBadges />);
    fireEvent.click(screen.getByText('HIPAA'));
    expect(goToRegulatoryCompliance).toHaveBeenCalledWith('hipaa');
  });
});
