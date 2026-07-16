import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TopOsTable } from './top-os-table';
import { TopNetworkServicesTable } from './top-network-services-table';
import { MitreTopTactics } from './mitre-top-tactics';

describe('OVERVIEW inventory / tactics widgets', () => {
  it('TopOsTable uses the "Operating system" column and renders rows', () => {
    render(<TopOsTable items={[{ key: 'Ubuntu 24.04.2 LTS', count: 2 }]} />);
    expect(screen.getAllByText('Operating system').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ubuntu 24.04.2 LTS').length).toBeGreaterThan(0);
  });

  it('TopNetworkServicesTable uses the "Process name" column', () => {
    render(
      <TopNetworkServicesTable items={[{ key: 'svchost.exe', count: 13 }]} />,
    );
    expect(screen.getAllByText('Process name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('svchost.exe').length).toBeGreaterThan(0);
  });

  it('MitreTopTactics renders its tactics as a bar list', () => {
    const { container } = render(
      <MitreTopTactics items={[{ key: 'Initial Access', count: 36231 }]} />,
    );
    expect(
      container.querySelector('[data-test-subj="mitre-top-tactics"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('Initial Access')).toBeInTheDocument();
  });
});
