import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThreatIntelligenceFeedSection } from './threat-intelligence-feed-section';
import {
  useCvesMatchedCount,
  useDecodersCount,
  useDetectorsCount,
  useIntegrationsCount,
  useRulesCount,
} from '../services/use-overview-data';
import { useInViewport } from '../../../hooks';

jest.mock('../services/use-overview-data', () => ({
  useRulesCount: jest.fn(),
  useDecodersCount: jest.fn(),
  useIntegrationsCount: jest.fn(),
  useDetectorsCount: jest.fn(),
  useCvesMatchedCount: jest.fn(),
}));
jest.mock('../services/navigation', () => ({
  goToRules: jest.fn(),
  goToDecoders: jest.fn(),
  goToIntegrations: jest.fn(),
  goToDetectors: jest.fn(),
}));
jest.mock('../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));

const asMock = (fn: unknown) => fn as jest.Mock;
const available = (value: number) => ({ status: 'available' as const, data: value });

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useRulesCount).mockReturnValue(available(482));
  asMock(useDecodersCount).mockReturnValue(available(128));
  asMock(useIntegrationsCount).mockReturnValue(available(14));
  asMock(useDetectorsCount).mockReturnValue(available(9));
  asMock(useCvesMatchedCount).mockReturnValue(available(3521));
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('ThreatIntelligenceFeedSection', () => {
  it('renders the section with all tiles when everything is available', () => {
    render(<ThreatIntelligenceFeedSection />);
    expect(screen.getByText('Threat intelligence feed')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.getByText('CVEs matched')).toBeInTheDocument();
    expect(screen.getByText('482')).toBeInTheDocument();
  });

  it('hides the whole section when every tile is unavailable', () => {
    for (const mock of [
      useRulesCount,
      useDecodersCount,
      useIntegrationsCount,
      useDetectorsCount,
      useCvesMatchedCount,
    ]) {
      asMock(mock).mockReturnValue({ status: 'unavailable' });
    }
    const { container } = render(<ThreatIntelligenceFeedSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the section (showing CVEs matched) when Security Analytics is absent but vulnerabilities data is not', () => {
    for (const mock of [
      useRulesCount,
      useDecodersCount,
      useIntegrationsCount,
      useDetectorsCount,
    ]) {
      asMock(mock).mockReturnValue({ status: 'unavailable' });
    }
    render(<ThreatIntelligenceFeedSection />);
    expect(screen.getByText('Threat intelligence feed')).toBeInTheDocument();
    expect(screen.getByText('CVEs matched')).toBeInTheDocument();
    expect(screen.queryByText('Rules')).not.toBeInTheDocument();
  });

  it('fetches lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(<ThreatIntelligenceFeedSection />);
    expect(asMock(useRulesCount)).toHaveBeenCalledWith(false);
    expect(asMock(useCvesMatchedCount)).toHaveBeenCalledWith(false);
  });
});
