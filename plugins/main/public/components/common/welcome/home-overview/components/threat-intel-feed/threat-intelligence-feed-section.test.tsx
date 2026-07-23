import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThreatIntelligenceFeedSection } from './threat-intelligence-feed-section';
import {
  useDecodersCount,
  useDetectorsCount,
  useIntegrationsCount,
  useRulesCount,
} from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';

jest.mock('../../hooks/use-overview-data', () => ({
  useRulesCount: jest.fn(),
  useDecodersCount: jest.fn(),
  useIntegrationsCount: jest.fn(),
  useDetectorsCount: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  goToRules: jest.fn(),
  goToDecoders: jest.fn(),
  goToIntegrations: jest.fn(),
  goToDetectors: jest.fn(),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));

const asMock = (fn: unknown) => fn as jest.Mock;
const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

const vulnerabilitiesAvailable = {
  status: 'available' as const,
  data: {
    severity: { critical: 0, high: 0, medium: 0, low: 0 },
    byOs: [],
    cvesMatched: 3521,
  },
};

const threatIntelAvailable = {
  status: 'available' as const,
  data: { total: 2048, feedByType: [] },
};

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useRulesCount).mockReturnValue(available(482));
  asMock(useDecodersCount).mockReturnValue(available(128));
  asMock(useIntegrationsCount).mockReturnValue(available(14));
  asMock(useDetectorsCount).mockReturnValue(available(9));
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('ThreatIntelligenceFeedSection', () => {
  it('renders the section with all tiles when everything is available', () => {
    render(
      <ThreatIntelligenceFeedSection
        vulnerabilities={vulnerabilitiesAvailable}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(screen.getByText('Threat intelligence feed')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.getByText('IOCs')).toBeInTheDocument();
    expect(screen.getByText('CVEs matched')).toBeInTheDocument();
    expect(screen.getByText('482')).toBeInTheDocument();
  });

  it('always renders the section, even when every tile is unavailable', () => {
    for (const mock of [
      useRulesCount,
      useDecodersCount,
      useIntegrationsCount,
      useDetectorsCount,
    ]) {
      asMock(mock).mockReturnValue({ status: 'unavailable' });
    }
    render(
      <ThreatIntelligenceFeedSection
        vulnerabilities={{ status: 'unavailable' }}
        threatIntel={{ status: 'unavailable' }}
      />,
    );
    expect(screen.getByText('Threat intelligence feed')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.getByText('IOCs')).toBeInTheDocument();
  });

  it('keeps the section (showing IOCs and CVEs matched) when Security Analytics is absent but the feed and vulnerabilities data are not', () => {
    for (const mock of [
      useRulesCount,
      useDecodersCount,
      useIntegrationsCount,
      useDetectorsCount,
    ]) {
      asMock(mock).mockReturnValue({ status: 'unavailable' });
    }
    render(
      <ThreatIntelligenceFeedSection
        vulnerabilities={vulnerabilitiesAvailable}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(screen.getByText('Threat intelligence feed')).toBeInTheDocument();
    expect(screen.getByText('IOCs')).toBeInTheDocument();
    expect(screen.getByText('CVEs matched')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
  });

  it('fetches the Security Analytics tiles lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(
      <ThreatIntelligenceFeedSection
        vulnerabilities={vulnerabilitiesAvailable}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(asMock(useRulesCount)).toHaveBeenCalledWith(false);
  });
});
