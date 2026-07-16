import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FimPlatformsTable } from './fim-platforms-table';
import { IocFeedByTypeTable } from './ioc-feed-by-type-table';
import { TopRulesTable } from './top-rules-table';
import { TopTechniquesTable } from './top-techniques-table';
import { VulnerabilitiesByOsTable } from './vulnerabilities-by-os-table';

describe('Endpoint Security / Threat Hunting top-N table widgets', () => {
  it('FimPlatformsTable uses the "Top 5 by platform" column and renders rows', () => {
    render(<FimPlatformsTable items={[{ key: 'Ubuntu', count: 8435 }]} />);
    expect(screen.getAllByText('Top 5 by platform').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ubuntu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('8,435').length).toBeGreaterThan(0);
  });

  it('IocFeedByTypeTable uses the "IOC feed by type (top 5)" column', () => {
    render(<IocFeedByTypeTable items={[{ key: 'Domains', count: 92700 }]} />);
    expect(
      screen.getAllByText('IOC feed by type (top 5)').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Domains').length).toBeGreaterThan(0);
  });

  it('TopRulesTable uses the "Top 5 rules" column', () => {
    render(
      <TopRulesTable
        items={[{ key: 'Wazuh IT Hygiene – Item modified', count: 3899 }]}
      />,
    );
    expect(screen.getAllByText('Top 5 rules').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Wazuh IT Hygiene – Item modified').length,
    ).toBeGreaterThan(0);
  });

  it('VulnerabilitiesByOsTable uses the "Vulnerabilities by OS" column', () => {
    render(
      <VulnerabilitiesByOsTable
        items={[{ key: 'Red Hat Enterprise Linux 9.5', count: 29685 }]}
      />,
    );
    expect(
      screen.getAllByText('Vulnerabilities by OS').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Red Hat Enterprise Linux 9.5').length,
    ).toBeGreaterThan(0);
  });

  it('TopTechniquesTable renders clickable rows that call onSelect with the item', () => {
    const onSelect = jest.fn();
    render(
      <TopTechniquesTable
        items={[
          { key: 'Exploit Public-Facing Application', count: 35378 },
        ]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(
      screen.getAllByText('Exploit Public-Facing Application')[0],
    );
    expect(onSelect).toHaveBeenCalledWith({
      key: 'Exploit Public-Facing Application',
      count: 35378,
    });
  });

  it('shows specific empty-state messages instead of the OUI default', () => {
    render(<FimPlatformsTable items={[]} />);
    expect(
      screen.getAllByText('No files or registry objects baselined yet').length,
    ).toBeGreaterThan(0);

    render(<IocFeedByTypeTable items={[]} />);
    expect(
      screen.getAllByText('No IOC matches in the last 24 hours').length,
    ).toBeGreaterThan(0);

    render(<TopRulesTable items={[]} />);
    expect(
      screen.getAllByText('No rules triggered in the last 24 hours').length,
    ).toBeGreaterThan(0);

    render(<VulnerabilitiesByOsTable items={[]} />);
    expect(
      screen.getAllByText('No vulnerabilities found').length,
    ).toBeGreaterThan(0);

    render(<TopTechniquesTable items={[]} onSelect={jest.fn()} />);
    expect(
      screen.getAllByText('No techniques observed in the last 24 hours').length,
    ).toBeGreaterThan(0);
  });
});
