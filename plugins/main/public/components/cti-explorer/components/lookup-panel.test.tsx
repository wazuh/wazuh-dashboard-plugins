import '@testing-library/jest-dom';
import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { LookupPanel } from './lookup-panel';
import { lookupValue } from '../services/cti-explorer-api';
import type { IocRecord } from '../../../../common/cti-explorer/types';

configure({ testIdAttribute: 'data-test-subj' });

jest.mock('../services/cti-explorer-api', () => ({
  ...jest.requireActual('../services/cti-explorer-api'),
  lookupValue: jest.fn(),
}));
jest.mock('../utils/navigation', () => ({
  getThreatHuntingIocUrl: (value: string) => `/app/threat-hunting#${value}`,
}));

const mockLookup = lookupValue as jest.Mock;

const record = (
  id: string,
  provider: string,
  confidence: number,
): IocRecord => ({
  id,
  name: '192.0.2.100:31337',
  type: 'connection',
  provider,
  confidence,
  firstSeen: null,
  lastSeen: null,
  reference: null,
  tags: [],
  feedName: null,
  software: null,
  offset: null,
});

const renderPanel = () => {
  const onOpenIoc = jest.fn();
  const onOpenVulnerability = jest.fn();
  render(
    <LookupPanel
      onOpenIoc={onOpenIoc}
      onOpenVulnerability={onOpenVulnerability}
    />,
  );
  return { onOpenIoc, onOpenVulnerability };
};

const check = (value: string) => {
  fireEvent.change(screen.getByTestId('ctiExplorerLookupInput'), {
    target: { value },
  });
  fireEvent.click(screen.getByTestId('ctiExplorerLookupButton'));
};

describe('LookupPanel', () => {
  beforeEach(() => mockLookup.mockReset());

  it('lists a value once with every provider that reported it', async () => {
    mockLookup.mockResolvedValue({
      kind: 'ioc',
      category: 'ip',
      records: [
        record('a', 'threat-fox', 75),
        record('b', 'cisco-talos', 100),
        record('c', 'threat-fox', 75),
      ],
    });
    const { onOpenIoc } = renderPanel();

    check('192.0.2[.]100');

    const listed = await screen.findByTestId('ctiExplorerLookupListed');
    expect(mockLookup).toHaveBeenCalledWith('192.0.2[.]100');
    expect(listed).toHaveTextContent(
      'Listed by 2 providers: ThreatFox, Cisco Talos',
    );
    expect(screen.getAllByTestId('ctiExplorerLookupOpenIoc')).toHaveLength(1);
    expect(screen.getByTestId('ctiExplorerLookupHunt')).toHaveAttribute(
      'href',
      '/app/threat-hunting#192.0.2.100:31337',
    );

    fireEvent.click(screen.getByTestId('ctiExplorerLookupOpenIoc'));
    expect(onOpenIoc).toHaveBeenCalledWith('a');
  });

  it('says a value not found is not a verdict', async () => {
    mockLookup.mockResolvedValue({
      kind: 'ioc',
      category: 'domain',
      records: [],
    });
    renderPanel();

    check('example.com');

    expect(
      await screen.findByTestId('ctiExplorerLookupNotListed'),
    ).toHaveTextContent('This is not a verdict that the value is safe');
  });

  it('opens a vulnerability record that exists', async () => {
    mockLookup.mockResolvedValue({
      kind: 'vulnerability',
      id: 'CVE-2024-6387',
      found: true,
    });
    const { onOpenVulnerability } = renderPanel();

    check('cve-2024-6387');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open the record' }),
    );

    expect(onOpenVulnerability).toHaveBeenCalledWith('CVE-2024-6387');
  });

  it('names the index the user cannot read', async () => {
    mockLookup.mockRejectedValue({
      body: {
        statusCode: 403,
        attributes: {
          code: 'forbidden',
          index: 'wazuh-threatintel-enrichments*',
        },
      },
    });
    renderPanel();

    check('example.com');

    await waitFor(() =>
      expect(screen.getByTestId('ctiExplorerRequestError')).toHaveTextContent(
        'Your user cannot read wazuh-threatintel-enrichments*',
      ),
    );
  });

  it('checks an example value', async () => {
    mockLookup.mockResolvedValue({ kind: 'ioc', category: 'ip', records: [] });
    renderPanel();

    fireEvent.click(screen.getByTestId('ctiExplorerLookupExample-192.0.2.100'));

    await screen.findByTestId('ctiExplorerLookupNotListed');
    expect(mockLookup).toHaveBeenCalledWith('192.0.2.100');
  });
});
