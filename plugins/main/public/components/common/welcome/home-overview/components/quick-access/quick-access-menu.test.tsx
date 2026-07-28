import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { QuickAccessMenu } from './quick-access-menu';
import {
  getModuleUrl,
  getRulesUrl,
  getDecodersUrl,
  getIntegrationsUrl,
  getDetectorsUrl,
} from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getModuleUrl: jest.fn((appId: string) => `/mock/${appId}`),
  getRulesUrl: jest.fn(() => '/mock/rules'),
  getDecodersUrl: jest.fn(() => '/mock/decoders'),
  getIntegrationsUrl: jest.fn(() => '/mock/sa-integrations'),
  getDetectorsUrl: jest.fn(() => '/mock/detectors'),
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

  it('links the Security analytics group to Rules/Decoders/Integrations/Detectors', () => {
    openMenu();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.getByText('Decoders')).toBeInTheDocument();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
    expect(screen.getByText('Detectors')).toBeInTheDocument();
    expect(getRulesUrl).toHaveBeenCalled();
    expect(getDecodersUrl).toHaveBeenCalled();
    expect(getIntegrationsUrl).toHaveBeenCalled();
    expect(getDetectorsUrl).toHaveBeenCalled();
  });

  it('never shows apps outside the quick access categories', () => {
    openMenu();
    expect(screen.queryByText('Cluster')).not.toBeInTheDocument();
    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument();
  });
});
