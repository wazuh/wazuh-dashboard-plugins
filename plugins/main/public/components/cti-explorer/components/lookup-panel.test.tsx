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
    // A table of the matches, with no callout around it.
    expect(listed).toHaveTextContent('ThreatFox, Cisco Talos');
    expect(listed.closest('.euiCallOut')).toBeNull();
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

  it('shows a CVE record with the CVE columns and opens it', async () => {
    mockLookup.mockResolvedValue({
      kind: 'vulnerability',
      id: 'CVE-2024-6387',
      found: true,
      record: {
        id: 'CVE-2024-6387',
        type: 'CVE',
        offset: 1,
        document: {
          cveMetadata: {
            cveId: 'CVE-2024-6387',
            assignerShortName: 'redhat',
            state: 'PUBLISHED',
          },
        },
      },
    });
    const { onOpenVulnerability } = renderPanel();

    check('cve-2024-6387');
    const found = await screen.findByTestId('ctiExplorerLookupRecordFound');
    expect(found).toHaveTextContent('Highest CVSS');
    expect(found).toHaveTextContent('Assigner: redhat');
    expect(found).not.toHaveTextContent('Vendor pattern');
    expect(found.closest('.euiCallOut')).toBeNull();

    fireEvent.click(screen.getByTestId('ctiExplorerLookupOpenVulnerability'));
    expect(onOpenVulnerability).toHaveBeenCalledWith('CVE-2024-6387');
  });

  it('shows a translation rule with the rule columns', async () => {
    mockLookup.mockResolvedValue({
      kind: 'vulnerability',
      id: 'TID-0048',
      found: true,
      record: {
        id: 'TID-0048',
        type: 'TID',
        offset: 1,
        document: {
          action: ['replace_vendor'],
          target: ['centos'],
          source: { vendor: '', product: '^nodejs$' },
          translation: [{ vendor: 'nodejs', product: 'node.js' }],
        },
      },
    });
    renderPanel();

    check('TID-0048');
    const found = await screen.findByTestId('ctiExplorerLookupRecordFound');
    expect(found).toHaveTextContent('Product pattern');
    expect(found).toHaveTextContent('^nodejs$');
    expect(found).toHaveTextContent('nodejs:node.js');
    expect(found).toHaveTextContent('replace_vendor');
    expect(found).not.toHaveTextContent('Highest CVSS');
    expect(
      screen.getByTestId('ctiExplorerLookupOpenVulnerability'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('ctiExplorerLookupHunt')).toBeNull();
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
