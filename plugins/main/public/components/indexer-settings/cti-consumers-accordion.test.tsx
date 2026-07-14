import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenericRequest } from '../../react-services';
import { CtiConsumersAccordion } from './cti-consumers-accordion';

jest.mock('../../react-services', () => ({
  GenericRequest: {
    request: jest.fn(),
  },
}));

const mockedRequest = GenericRequest.request as jest.Mock;

describe('CtiConsumersAccordion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders each consumer field in a 2-column grid with resource spanning the full row', async () => {
    mockedRequest.mockResolvedValue({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'ok',
          local_offset: 10,
          remote_offset: 12,
        },
      ],
    });

    render(<CtiConsumersAccordion />);

    await waitFor(() =>
      expect(mockedRequest).toHaveBeenCalledWith('GET', '/api/cti-consumers'),
    );

    expect(await screen.findByText('consumer-1')).toBeInTheDocument();
    expect(screen.getByText('ctx-1')).toBeInTheDocument();
    expect(screen.getByText('type-1')).toBeInTheDocument();
    expect(
      screen.getByText('https://example.test/resource-1'),
    ).toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument();

    const resourceItem = document.querySelector(
      '[data-test-subj="ctiConsumersResourceItem"]',
    );
    expect(resourceItem).not.toBeNull();
    expect(resourceItem).toHaveTextContent('https://example.test/resource-1');
  });

  it('shows an empty state when no consumers are returned', async () => {
    mockedRequest.mockResolvedValue({ data: [] });

    render(<CtiConsumersAccordion />);

    expect(await screen.findByText('No consumers')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    mockedRequest.mockRejectedValue(new Error('network error'));

    render(<CtiConsumersAccordion />);

    expect(
      await screen.findByText('Could not load consumers'),
    ).toBeInTheDocument();
  });
});
