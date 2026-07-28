import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

// This repo doesn't use data-testid; look up elements by data-test-subj
// against the whole document, since the popover panel is portaled to
// document.body, outside RTL's local render container.
const bySubj = (testSubj: string) =>
  document.body.querySelector(`[data-test-subj="${testSubj}"]`);

const openMenu = () => {
  render(<QuickAccessMenu />);
  fireEvent.click(bySubj('quick-access-menu-button') as Element);
};

const getGroup = (groupId: string) =>
  within(bySubj(`quick-access-group-${groupId}`) as HTMLElement);

const pinItem = (groupId: string, title: string) =>
  fireEvent.click(
    getGroup(groupId).getByRole('button', { name: `Pin ${title}` }),
  );

beforeEach(() => {
  localStorage.clear();
});

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

  it('shows no standalone pinned buttons until an item is pinned', () => {
    render(<QuickAccessMenu />);
    expect(bySubj('quick-access-pinned-malware-detection')).toBeNull();
  });

  it('pinning an item promotes it to a standalone button next to the trigger', () => {
    openMenu();
    pinItem('wz-category-endpoint-security', 'Malware Detection');

    // The standalone button sits outside the popover and stays visible
    // even after the popover closes (clicking the trigger again).
    fireEvent.click(bySubj('quick-access-menu-button') as Element);
    const pinnedButton = bySubj('quick-access-pinned-malware-detection');
    expect(pinnedButton).toBeInTheDocument();
    expect(pinnedButton).toHaveTextContent('Malware Detection');
    expect(pinnedButton).toHaveAttribute('href', '/mock/malware-detection');
  });

  it('unpinning removes the standalone button', () => {
    openMenu();
    pinItem('wz-category-endpoint-security', 'Malware Detection');
    expect(bySubj('quick-access-pinned-malware-detection')).toBeInTheDocument();

    fireEvent.click(
      getGroup('wz-category-endpoint-security').getByRole('button', {
        name: 'Unpin Malware Detection',
      }),
    );
    expect(bySubj('quick-access-pinned-malware-detection')).toBeNull();
  });

  it('persists pinned items across remounts (e.g. a page reload)', () => {
    const { unmount } = render(<QuickAccessMenu />);
    fireEvent.click(bySubj('quick-access-menu-button') as Element);
    pinItem('wz-category-endpoint-security', 'Malware Detection');
    unmount();

    render(<QuickAccessMenu />);
    expect(bySubj('quick-access-pinned-malware-detection')).toBeInTheDocument();
  });

  it('caps pinned items at 6 and disables pinning further items', () => {
    openMenu();
    for (const title of [
      'Configuration Assessment',
      'Malware Detection',
      'File Integrity Monitoring',
    ]) {
      pinItem('wz-category-endpoint-security', title);
    }
    for (const title of [
      'Threat Hunting',
      'Vulnerability Detection',
      'MITRE ATT&CK',
    ]) {
      pinItem('wz-category-threat-intelligence', title);
    }

    expect(
      getGroup('wz-category-threat-intelligence').getByRole('button', {
        name: 'Pin Case Management',
      }),
    ).toBeDisabled();
  });
});
