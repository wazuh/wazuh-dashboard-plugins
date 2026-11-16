import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { getWzCurrentAppID } from '../../../kibana-services';
import { DiscoverNoResults } from './no-results';
import {
  getModuleEmptyStateTexts,
  getSearchHint,
  getSearchOrTimeRangeHint,
} from './module-empty-state-texts';

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

  it('renders the hint and each explanation of the module as its own paragraph', () => {
    (getWzCurrentAppID as jest.Mock).mockReturnValue('mitre-attack');
    render(<DiscoverNoResults />);

    const hint = screen.getByText('Try changing the search or time range.');
    const explanation = screen.getByText(
      'Only findings that match a rule mapped to a MITRE technique appear here.',
    );
    expect(hint.tagName).toBe('P');
    expect(explanation.tagName).toBe('P');
    expect(hint.compareDocumentPosition(explanation)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
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

  it('renders the message and the description of the caller instead of the module text', () => {
    (getWzCurrentAppID as jest.Mock).mockReturnValue('mitre-attack');
    render(
      <DiscoverNoResults
        message='No techniques'
        description='Try another term.'
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'No techniques' }),
    ).toBeVisible();
    expect(screen.getByText('Try another term.')).toBeVisible();
    expect(screen.queryByText(/findings/i)).not.toBeInTheDocument();
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
    expect(texts?.description.length).toBeGreaterThan(0);
    texts?.description.forEach(paragraph => expect(paragraph).toBeTruthy());
  });

  it.each([
    'vulnerability-detection',
    'configuration-assessment',
    'it-hygiene',
    'incident-response-dashboard',
    'case-management',
    'mitre-attack',
    'regulatory-compliance',
    'amazon-web-services',
    'statistics',
  ])('keeps each paragraph of %s short enough to scan', appId => {
    getModuleEmptyStateTexts(appId)!.description.forEach(paragraph =>
      expect(paragraph.length).toBeLessThanOrEqual(160),
    );
  });

  it.each([
    'vulnerability-detection',
    'configuration-assessment',
    'it-hygiene',
    'incident-response-dashboard',
    'case-management',
    'mitre-attack',
    'regulatory-compliance',
    'amazon-web-services',
    'statistics',
  ])('leads %s with what to try', appId => {
    expect([getSearchHint(), getSearchOrTimeRangeHint()]).toContain(
      getModuleEmptyStateTexts(appId)!.description[0],
    );
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
    const text = [title, ...description].join(' ');

    expect(text).toMatch(/findings/i);
    expect(text).not.toMatch(/events/i);
  });
});
