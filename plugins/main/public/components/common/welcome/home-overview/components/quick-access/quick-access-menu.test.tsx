import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { QuickAccessMenu } from './quick-access-menu';
import {
  getModuleUrl,
  getRulesUrl,
  getDecodersUrl,
  getDetectorsUrl,
  getIntegrationsUrl,
  getKvdbsUrl,
  getFiltersUrl,
} from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getModuleUrl: jest.fn((appId: string) => `/mock/${appId}`),
  getRulesUrl: jest.fn(() => '/mock/rules'),
  getDecodersUrl: jest.fn(() => '/mock/decoders'),
  getDetectorsUrl: jest.fn(() => '/mock/detectors'),
  getIntegrationsUrl: jest.fn(() => '/mock/sa-integrations'),
  getKvdbsUrl: jest.fn(() => '/mock/kvdbs'),
  getFiltersUrl: jest.fn(() => '/mock/sa-integrations#/filters'),
}));

const openMenu = () => {
  render(<QuickAccessMenu />);
  fireEvent.click(screen.getByText('Quick access'));
};

describe('QuickAccessMenu', () => {
  it('keeps the groups hidden until the trigger is clicked', () => {
    render(<QuickAccessMenu />);
    expect(screen.getByText('Quick access')).toBeInTheDocument();
    expect(screen.queryByText('Endpoint security')).not.toBeInTheDocument();
  });

  it('shows all 5 category groups once opened', () => {
    openMenu();
    expect(screen.getByText('Endpoint security')).toBeInTheDocument();
    expect(screen.getByText('Threat intelligence')).toBeInTheDocument();
    expect(screen.getByText('Security operations')).toBeInTheDocument();
    expect(screen.getByText('Cloud security')).toBeInTheDocument();
    expect(screen.getByText('Security analytics')).toBeInTheDocument();
  });

  it('links a Wazuh app to its module url', () => {
    openMenu();
    expect(screen.getByText('Malware Detection')).toBeInTheDocument();
    expect(getModuleUrl).toHaveBeenCalledWith('malware-detection');
  });

  // Same content types as the Security analytics tiles on this page.
  it('links every Security analytics content type', () => {
    openMenu();
    for (const label of [
      'Rules',
      'Decoders',
      'Detectors',
      'Integrations',
      'KVDBs',
      'Filters',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(getRulesUrl).toHaveBeenCalled();
    expect(getDecodersUrl).toHaveBeenCalled();
    expect(getDetectorsUrl).toHaveBeenCalled();
    expect(getIntegrationsUrl).toHaveBeenCalled();
    expect(getKvdbsUrl).toHaveBeenCalled();
    expect(getFiltersUrl).toHaveBeenCalled();
  });

  it('picks up every app the registry marks for the overview', () => {
    openMenu();
    // One per category, including the one an id allow-list would have to be
    // edited for (Case management, registered under Threat intelligence).
    expect(screen.getByText('Configuration Assessment')).toBeInTheDocument();
    expect(screen.getByText('Case Management')).toBeInTheDocument();
    expect(screen.getByText('IT Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('leaves out apps and categories the registry does not mark for the overview', () => {
    openMenu();
    // `showInOverviewApp: false`, so neither the app nor its category shows.
    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Agents management')).not.toBeInTheDocument();
    expect(screen.queryByText('Server management')).not.toBeInTheDocument();
  });
});
