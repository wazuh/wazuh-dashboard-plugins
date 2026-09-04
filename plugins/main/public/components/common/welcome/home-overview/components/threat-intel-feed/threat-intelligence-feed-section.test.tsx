import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ThreatIntelligenceFeedSection } from './threat-intelligence-feed-section';
import {
  useDecodersCount,
  useDetectorsCount,
  useFiltersCount,
  useIntegrationsCount,
  useKvdbsCount,
  useRulesCount,
} from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';
import * as navigation from '../../utils/navigation';

jest.mock('../../hooks/use-overview-data', () => ({
  useRulesCount: jest.fn(),
  useDecodersCount: jest.fn(),
  useDetectorsCount: jest.fn(),
  useIntegrationsCount: jest.fn(),
  useKvdbsCount: jest.fn(),
  useFiltersCount: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  getRulesUrl: jest.fn(),
  getDecodersUrl: jest.fn(),
  getDetectorsUrl: jest.fn(),
  getIntegrationsUrl: jest.fn(() => '/manage-content'),
  getKvdbsUrl: jest.fn(),
  getFiltersUrl: jest.fn(),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));
const asMock = (fn: unknown) => fn as jest.Mock;
const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

const threatIntelAvailable = {
  status: 'available' as const,
  data: { total: 2048, feedByType: [], byThreatType: [] },
};

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useRulesCount).mockReturnValue(available(482));
  asMock(useDecodersCount).mockReturnValue(available(128));
  asMock(useDetectorsCount).mockReturnValue(available(9));
  asMock(useIntegrationsCount).mockReturnValue(available(14));
  asMock(useKvdbsCount).mockReturnValue(available(6));
  asMock(useFiltersCount).mockReturnValue(available(3));
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
  asMock(navigation.getIntegrationsUrl).mockReturnValue('/manage-content');
});

describe('ThreatIntelligenceFeedSection', () => {
  it('renders one section with both the Ruleset management and Threat catalog cards', () => {
    render(
      <ThreatIntelligenceFeedSection threatIntel={threatIntelAvailable} />,
    );
    expect(screen.getByText('Threat intelligence feed')).toBeInTheDocument();
    expect(screen.getByText('Ruleset management')).toBeInTheDocument();
    expect(screen.getByText('Threat catalog')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.getByText('KVDBs')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('IOCs')).toBeInTheDocument();
    expect(screen.getByText('482')).toBeInTheDocument();
  });

  it('navigates to the Ruleset Management tiles on click, and to the module from the card title', () => {
    render(
      <ThreatIntelligenceFeedSection threatIntel={threatIntelAvailable} />,
    );
    fireEvent.click(screen.getByText('Rules'));
    expect(navigation.getRulesUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ruleset management'));
    expect(navigation.getIntegrationsUrl).toHaveBeenCalled();
  });

  it('always renders both cards, even when every tile is unavailable', () => {
    for (const mock of [
      useRulesCount,
      useDecodersCount,
      useDetectorsCount,
      useIntegrationsCount,
      useKvdbsCount,
      useFiltersCount,
    ]) {
      asMock(mock).mockReturnValue({ status: 'unavailable' });
    }
    render(
      <ThreatIntelligenceFeedSection threatIntel={{ status: 'unavailable' }} />,
    );
    expect(screen.getByText('Ruleset management')).toBeInTheDocument();
    expect(screen.getByText('Threat catalog')).toBeInTheDocument();
    expect(screen.getByText('IOCs')).toBeInTheDocument();
  });

  it('fetches the Ruleset Management tiles lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(
      <ThreatIntelligenceFeedSection threatIntel={threatIntelAvailable} />,
    );
    expect(asMock(useRulesCount)).toHaveBeenCalledWith(false);
    expect(asMock(useKvdbsCount)).toHaveBeenCalledWith(false);
  });

  it('keeps the IOC count and shows the threat-type composition below it', () => {
    const { container } = render(
      <ThreatIntelligenceFeedSection
        threatIntel={{
          status: 'available',
          data: {
            total: 2048,
            feedByType: [],
            byThreatType: [
              { key: 'botnet_cc', count: 1420 },
              { key: 'payload_delivery', count: 628 },
            ],
          },
        }}
      />,
    );
    expect(screen.getAllByText('2,048').length).toBeGreaterThan(0);
    expect(
      container.querySelector('[data-test-subj="threat-catalog-threat-types"]'),
    ).toBeTruthy();
    expect(screen.getAllByText('Botnet CC').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Payload delivery').length).toBeGreaterThan(0);
  });
});
