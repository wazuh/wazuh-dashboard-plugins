import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { RegulatoryComplianceBadges } from './regulatory-compliance-badges';
import { getRegulatoryComplianceUrl } from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getRegulatoryComplianceUrl: jest.fn(),
}));
describe('RegulatoryComplianceBadges', () => {
  it('navigates to the clicked framework with its tabView', () => {
    render(<RegulatoryComplianceBadges findings={{ status: 'loading' }} />);
    fireEvent.click(screen.getByText('HIPAA'));
    expect(getRegulatoryComplianceUrl).toHaveBeenCalledWith('hipaa');
  });
});
