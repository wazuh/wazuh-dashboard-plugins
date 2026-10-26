import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { LogDataAnalysisSection } from './log-data-analysis-section';

jest.mock('../../utils/navigation', () => ({
  getDecodersUrl: jest.fn(() => '/decoders'),
  getRulesUrl: jest.fn(() => '/rules'),
}));
jest.mock('../../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('LogDataAnalysisSection', () => {
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
});
