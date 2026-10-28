import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { of } from 'rxjs';
import { getCore } from '../../../../../../kibana-services';
import { LogDataAnalysisSection } from './log-data-analysis-section';

jest.mock('../../utils/navigation', () => ({
  getDecodersUrl: jest.fn(() => '/decoders'),
  getRulesUrl: jest.fn(() => '/rules'),
  isDecodersRegistered: jest.fn((apps: ReadonlyMap<string, unknown>) =>
    apps.has('decoders'),
  ),
  isRulesRegistered: jest.fn((apps: ReadonlyMap<string, unknown>) =>
    apps.has('rules'),
  ),
}));
jest.mock('../../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

const mockApplications = (ids: string[]) =>
  (getCore as jest.Mock).mockReturnValue({
    application: {
      applications$: of(new Map(ids.map(id => [id, {}]))),
    },
  });

describe('LogDataAnalysisSection', () => {
  beforeEach(() => mockApplications(['decoders', 'rules']));

  it('shows the collect, decode and detect stages', () => {
    render(<LogDataAnalysisSection />);

    expect(
      screen.getByRole('heading', { name: 'Log data analysis' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1. Collect')).toBeInTheDocument();
    expect(screen.getByText('2. Decode')).toBeInTheDocument();
    expect(screen.getByText('3. Detect')).toBeInTheDocument();
  });

  it('links each stage to where it is done', () => {
    render(<LogDataAnalysisSection />);

    expect(
      screen.getByRole('link', { name: /How to collect a log/ }),
    ).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/log-data-collection/index.html',
    );
    expect(screen.getByRole('link', { name: 'Open Decoders' })).toHaveAttribute(
      'href',
      '/decoders',
    );
    expect(screen.getByRole('link', { name: 'Open Rules' })).toHaveAttribute(
      'href',
      '/rules',
    );
  });

  it('renders the stages without links when the Ruleset management apps are not registered', () => {
    mockApplications([]);
    render(<LogDataAnalysisSection />);

    expect(screen.getByText('2. Decode')).toBeInTheDocument();
    expect(screen.getByText('3. Detect')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open Decoders' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open Rules' })).toBeNull();
    expect(
      screen.getByRole('link', { name: /How to collect a log/ }),
    ).toBeInTheDocument();
  });
});
