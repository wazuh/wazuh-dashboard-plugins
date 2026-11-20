const mockSettings: Record<string, string> = {
  'format:number:defaultPattern': '0,0.[000]',
  'format:number:defaultLocale': 'en',
};

jest.mock('../../plugin-services', () => ({
  getCore: () => ({
    application: {
      getUrlForApp: (appId: string, { path = '' } = {}) =>
        `/app/${appId}${path}`,
    },
    uiSettings: { get: (key: string) => mockSettings[key] },
  }),
}));

import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedContentLine } from './feed-content';

configure({ testIdAttribute: 'data-test-subj' });

const RULESET = 'cti:catalog:consumer:ruleset';
const IOCS = 'cti:catalog:consumer:iocs';
const VULNERABILITIES = 'cti:catalog:consumer:vulnerabilities';

const COUNTS = {
  rules: 603,
  decoders: 524,
  integrations: 132,
  kvdbs: 49,
  iocs: 952987,
  vulnerabilities: 1,
};

describe('FeedContentLine', () => {
  test('lists what the ruleset feed delivered, each count linked', () => {
    render(
      <FeedContentLine feedType={RULESET} counts={COUNTS} loading={false} />,
    );

    expect(screen.getByTestId(`ctiFeedContent-${RULESET}`)).toHaveTextContent(
      'Delivered: 603 rules · 524 decoders · 132 integrations · 49 KVDBs',
    );
    expect(screen.getByTestId('ctiFeedContentCount-rules')).toHaveAttribute(
      'href',
      '/app/rules#/rules?space=standard',
    );
    expect(
      screen.getByTestId('ctiFeedContentCount-integrations'),
    ).toHaveAttribute(
      'href',
      '/app/sa-integrations#/integrations?space=standard',
    );
  });

  test('links the IOCs and the CVEs to CTI Explorer, with plural forms', () => {
    const { rerender } = render(
      <FeedContentLine feedType={IOCS} counts={COUNTS} loading={false} />,
    );
    expect(screen.getByTestId('ctiFeedContentCount-iocs')).toHaveTextContent(
      '952,987 IOCs',
    );
    expect(screen.getByTestId('ctiFeedContentCount-iocs')).toHaveAttribute(
      'href',
      '/app/cti-explorer#/cti-explorer/?tab=iocs',
    );

    rerender(
      <FeedContentLine
        feedType={VULNERABILITIES}
        counts={COUNTS}
        loading={false}
      />,
    );
    expect(
      screen.getByTestId('ctiFeedContentCount-vulnerabilities'),
    ).toHaveTextContent('1 CVE');
  });

  test('formats the counts with the number format of the advanced settings', () => {
    mockSettings['format:number:defaultPattern'] = '0.0,[000]';
    try {
      render(
        <FeedContentLine feedType={IOCS} counts={COUNTS} loading={false} />,
      );

      // The number follows the setting (no decimals for a whole count); the
      // plural, the count itself.
      expect(screen.getByTestId('ctiFeedContentCount-iocs')).toHaveTextContent(
        '952,987 IOCs',
      );
    } finally {
      mockSettings['format:number:defaultPattern'] = '0,0.[000]';
    }
  });

  test('names the page a count opens in its tooltip', async () => {
    render(
      <FeedContentLine feedType={RULESET} counts={COUNTS} loading={false} />,
    );

    fireEvent.mouseOver(screen.getByTestId('ctiFeedContentCount-decoders'));

    expect(
      await screen.findByText(
        'View the Standard decoders in Ruleset Management',
      ),
    ).toBeInTheDocument();
  });

  test('shows a count that is not available as a dash, not linked', async () => {
    render(
      <FeedContentLine
        feedType={RULESET}
        counts={{ ...COUNTS, kvdbs: null }}
        loading={false}
      />,
    );

    const kvdbs = screen.getByTestId('ctiFeedContentCount-kvdbs');
    expect(kvdbs).toHaveTextContent('KVDBs: —');
    expect(kvdbs).not.toHaveAttribute('href');
    fireEvent.mouseOver(kvdbs);
    expect(
      await screen.findByText(/This count is not available/),
    ).toBeInTheDocument();
  });

  test('shows a placeholder while the first counts load', () => {
    render(<FeedContentLine feedType={RULESET} counts={null} loading />);

    expect(screen.getByTestId('ctiFeedContentLoading')).toBeInTheDocument();
  });

  test('keeps the counts on screen while they are read again', () => {
    render(<FeedContentLine feedType={RULESET} counts={COUNTS} loading />);

    expect(screen.queryByTestId('ctiFeedContentLoading')).toBeNull();
    expect(screen.getByTestId('ctiFeedContentCount-rules')).toHaveTextContent(
      '603 rules',
    );
  });

  test('renders nothing for a feed with no known content', () => {
    const { container } = render(
      <FeedContentLine
        feedType='cti:catalog:consumer:other'
        counts={COUNTS}
        loading={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
