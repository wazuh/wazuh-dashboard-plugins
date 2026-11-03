import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getWzCurrentAppID } from '../../../kibana-services';
import { DiscoverNoResults } from './no-results';
import { getModuleEmptyStateTexts } from './module-empty-state-texts';

jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getWzCurrentAppID: jest.fn(),
}));
jest.mock('../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn(),
}));

describe('DiscoverNoResults', () => {
  it('renders the text of the current module', () => {
    (getWzCurrentAppID as jest.Mock).mockReturnValue('case-management');
    render(<DiscoverNoResults />);

    expect(
      screen.getByRole('heading', { name: 'No cases found' }),
    ).toBeVisible();
  });

  it('renders the generic text outside a module', () => {
    (getWzCurrentAppID as jest.Mock).mockImplementation(() => {
      throw new Error('WzCurrentAppID was not set.');
    });
    render(<DiscoverNoResults />);

    expect(
      screen.getByRole('heading', {
        name: 'No results match your search criteria',
      }),
    ).toBeVisible();
  });

  it('keeps the message of the caller over the module text', () => {
    (getWzCurrentAppID as jest.Mock).mockReturnValue('case-management');
    render(<DiscoverNoResults message='Custom message' />);

    expect(
      screen.getByRole('heading', { name: 'Custom message' }),
    ).toBeVisible();
  });
});

describe('getModuleEmptyStateTexts', () => {
  it.each([
    'vulnerability-detection',
    'configuration-assessment',
    'it-hygiene',
    'incident-response-dashboard',
    'case-management',
    'mitre-attack',
    'regulatory-compliance',
    'amazon-web-services',
    'google-cloud',
    'github',
    'office365',
    'microsoft-graph-api',
    'statistics',
  ])('has a title and a description for %s', appId => {
    const texts = getModuleEmptyStateTexts(appId);

    expect(texts?.title).toBeTruthy();
    expect(texts?.description).toBeTruthy();
  });

  it('has none for a module with its own empty state or an unknown id', () => {
    expect(
      getModuleEmptyStateTexts('file-integrity-monitoring'),
    ).toBeUndefined();
    expect(getModuleEmptyStateTexts(undefined)).toBeUndefined();
  });

  it.each([
    'amazon-web-services',
    'google-cloud',
    'github',
    'office365',
    'microsoft-graph-api',
    'mitre-attack',
    'regulatory-compliance',
  ])('calls the data of %s findings, not events', appId => {
    const { title, description } = getModuleEmptyStateTexts(appId)!;

    expect(`${title} ${description}`).toMatch(/findings/i);
    expect(`${title} ${description}`).not.toMatch(/events/i);
  });
});
