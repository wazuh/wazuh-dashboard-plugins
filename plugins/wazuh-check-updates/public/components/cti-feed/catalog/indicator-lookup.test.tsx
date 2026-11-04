jest.mock('../../../services/cti-catalog', () => ({
  ...jest.requireActual('../../../services/cti-catalog'),
  lookupIndicator: jest.fn(),
}));

jest.mock('../../../plugin-services', () => ({
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { lookupIndicator } from '../../../services/cti-catalog';
import { IndicatorLookup } from './indicator-lookup';

configure({ testIdAttribute: 'data-test-subj' });

const mockLookup = lookupIndicator as jest.Mock;

const check = (value: string) => {
  fireEvent.change(screen.getByTestId('ctiCatalogIndicatorLookupInput'), {
    target: { value },
  });
  fireEvent.click(screen.getByTestId('ctiCatalogIndicatorLookupSubmit'));
};

const renderLookup = () => {
  const onOpen = jest.fn();
  const onOpenVulnerability = jest.fn();
  render(
    <IndicatorLookup
      onOpen={onOpen}
      onOpenVulnerability={onOpenVulnerability}
    />,
  );
  return { onOpen, onOpenVulnerability };
};

describe('IndicatorLookup', () => {
  beforeEach(() => mockLookup.mockReset());

  test('shows each matching record with its feed fields', async () => {
    mockLookup.mockResolvedValue({
      total: 1,
      items: [
        {
          id: '1734927',
          name: '124.198.132.174:8080',
          type: 'connection',
          provider: 'threat-fox',
          feedName: 'abuse_ch',
          confidence: 100,
          software: { name: 'win.asyncrat', type: 'botnet_cc', alias: [] },
          tags: ['RAT'],
        },
      ],
    });
    const { onOpen } = renderLookup();

    check(' 124.198.132.174 ');

    expect(
      await screen.findByTestId('ctiCatalogIndicatorLookupFound'),
    ).toHaveTextContent('1 record in the indicator catalog');
    expect(mockLookup).toHaveBeenCalledWith(
      '124.198.132.174',
      expect.anything(),
    );
    const hit = screen.getByTestId('ctiCatalogIndicatorLookupHit');
    expect(hit).toHaveTextContent('124.198.132.174:8080');
    expect(hit).toHaveTextContent('Host:port');
    expect(hit).toHaveTextContent('ThreatFox');
    expect(hit).toHaveTextContent('Botnet C2');
    // The malicious value is shown as text, never as a link.
    expect(hit.querySelector('a[href*="124.198.132.174"]')).toBeNull();

    fireEvent.click(screen.getByText('View the full record'));
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1734927' }),
    );
  });

  test('describes a miss as absent from the catalog, not as safe', async () => {
    mockLookup.mockResolvedValue({ total: 0, items: [] });
    renderLookup();

    check('this-is-not-a-real-indicator.example');

    const notFound = await screen.findByTestId(
      'ctiCatalogIndicatorLookupNotFound',
    );
    expect(notFound).toHaveTextContent('Not in this catalog');
    expect(notFound).toHaveTextContent('not a verdict that the value is safe');
  });

  test('sends a vulnerability id to the vulnerability catalog', () => {
    const { onOpenVulnerability } = renderLookup();

    check('cve-2021-44228');

    expect(mockLookup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Open it in Vulnerabilities'));
    expect(onOpenVulnerability).toHaveBeenCalledWith('CVE-2021-44228');
  });

  test('says which index failed', async () => {
    mockLookup.mockRejectedValue({
      message: 'Forbidden',
      response: { status: 403 },
      body: {
        message: 'Could not read wazuh-threatintel-enrichments: no permissions',
        attributes: { index: 'wazuh-threatintel-enrichments' },
      },
    });
    renderLookup();

    check('evil.example');

    await waitFor(() =>
      expect(
        screen.getByText(
          'Your user cannot read the wazuh-threatintel-enrichments index',
        ),
      ).toBeInTheDocument(),
    );
  });
});
