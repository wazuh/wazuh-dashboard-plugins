import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedContentPanel } from './feed-content-panel';

jest.mock('../../plugin-services', () => ({
  getCore: () => ({
    application: {
      currentAppId$: jest.requireActual('rxjs').of('cti-feed'),
      getUrlForApp: (appId: string, { path = '' } = {}) =>
        `/app/${appId}${path}`,
      navigateToUrl: jest.fn(),
    },
  }),
}));

configure({ testIdAttribute: 'data-test-subj' });

const COUNTS = {
  rules: 365,
  decoders: 514,
  integrations: 127,
  kvdbs: 49,
  iocs: 672843,
  vulnerabilities: null,
};

describe('FeedContentPanel', () => {
  test('shows one tile per content type with its formatted count', () => {
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('ctiFeedContentStat-rules')).toHaveTextContent(
      '365',
    );
    expect(screen.getByTestId('ctiFeedContentStat-iocs')).toHaveTextContent(
      new Intl.NumberFormat().format(672843),
    );
    expect(screen.getByTestId('ctiFeedContentStat-kvdbs')).toHaveTextContent(
      'KVDBs',
    );
  });

  test('marks a count that could not be read', () => {
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('ctiFeedContentStat-vulnerabilities'),
    ).toHaveTextContent('—');
  });

  test('links ruleset content to its Standard space in Ruleset Management', () => {
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('ctiFeedContentStat-rules-link')).toHaveAttribute(
      'href',
      '/app/rules#/rules?space=standard',
    );
    expect(
      screen.getByTestId('ctiFeedContentStat-integrations-link'),
    ).toHaveAttribute(
      'href',
      '/app/sa-integrations#/integrations?space=standard',
    );
    expect(screen.queryByTestId('ctiFeedContentStat-iocs-link')).toBeNull();
  });

  test('names the destination of a link on hover', async () => {
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    fireEvent.mouseOver(screen.getByTestId('ctiFeedContentStat-kvdbs-link'));

    expect(
      await screen.findByText('View the Standard KVDBs in Ruleset Management'),
    ).toBeInTheDocument();
  });

  test('does not link a count that could not be read', () => {
    render(
      <FeedContentPanel
        counts={{ ...COUNTS, decoders: null }}
        loading={false}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('ctiFeedContentStat-decoders-link')).toBeNull();
  });

  test('does not show placeholder values while loading', () => {
    render(<FeedContentPanel counts={null} loading onRefresh={jest.fn()} />);

    expect(screen.queryByText('—')).toBeNull();
    expect(screen.getByTestId('ctiFeedContentRefresh')).toBeDisabled();
  });

  test('refreshes the counts on demand', () => {
    const onRefresh = jest.fn();
    render(
      <FeedContentPanel
        counts={COUNTS}
        loading={false}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByTestId('ctiFeedContentRefresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
