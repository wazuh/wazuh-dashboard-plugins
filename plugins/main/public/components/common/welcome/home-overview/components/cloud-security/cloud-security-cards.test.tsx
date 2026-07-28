import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { CloudSecurityCards } from './cloud-security-cards';
import { getModuleUrl } from '../../utils/navigation';
import { FindingsOverview } from '../../interfaces/types';
import { DataGroupResult } from '../../interfaces/data-group';

jest.mock('../../utils/navigation', () => ({
  getModuleUrl: jest.fn(),
}));

const available = (
  cloudSecurityByModule: Record<string, number | undefined>,
): DataGroupResult<FindingsOverview> => ({
  status: 'available',
  data: {
    severity: {},
    topTactics: [],
    topRules: [],
    topTechniques: [],
    cloudSecurityByModule,
  },
});

// This repo doesn't use data-testid; look up elements by data-test-subj.
const bySubj = (container: HTMLElement, testSubj: string) =>
  container.querySelector(`[data-test-subj="${testSubj}"]`);

describe('CloudSecurityCards', () => {
  it('navigates to the clicked module app id', () => {
    render(<CloudSecurityCards findings={{ status: 'loading' }} />);
    fireEvent.click(screen.getByText('Docker'));
    expect(getModuleUrl).toHaveBeenCalledWith('docker');
  });

  it('shows the last-24h findings count as a badge on each card', () => {
    const { container } = render(
      <CloudSecurityCards
        findings={available({ docker: 12, 'amazon-web-services': 0 })}
      />,
    );
    expect(
      bySubj(container, 'cloud-security-card-docker-findings'),
    ).toHaveTextContent('12');
    expect(
      bySubj(container, 'cloud-security-card-amazon-web-services-findings'),
    ).toHaveTextContent('0');
  });

  it('shows the placeholder while findings are loading or unavailable', () => {
    const { container } = render(
      <CloudSecurityCards findings={{ status: 'loading' }} />,
    );
    expect(
      bySubj(container, 'cloud-security-card-docker-findings'),
    ).toHaveTextContent('-');
  });

  it('shows the placeholder for a module with no bucket in the response', () => {
    const { container } = render(
      <CloudSecurityCards findings={available({ docker: 3 })} />,
    );
    expect(
      bySubj(container, 'cloud-security-card-github-findings'),
    ).toHaveTextContent('-');
  });
});
