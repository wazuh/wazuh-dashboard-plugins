import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzRequest } from '../../../../react-services/wz-request';
import { AIAnalysisTab } from './ai-analysis-tab';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: {
    genericReq: jest.fn(),
  },
}));

const alertReference = { index: 'wazuh-alerts-4.x-2026.10.24', id: 'test-id' };
const secondAlertReference = {
  index: 'wazuh-alerts-4.x-2026.10.24',
  id: 'second-test-id',
};

const renderKeyedAnalysisTab = ({ index, id }: typeof alertReference) => (
  <AIAnalysisTab key={`${index}:${id}`} index={index} id={id} />
);

describe('AIAnalysisTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests analysis through the Wazuh server and displays it as text', async () => {
    const analysis = '<script>not executable</script>\nObserved facts';
    (WzRequest.genericReq as jest.Mock).mockResolvedValue({
      data: { ok: true, analysis },
    });

    const { container } = render(<AIAnalysisTab {...alertReference} />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze alert' }));

    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe(analysis);
    });
    expect(document.querySelector('script')).toBeNull();
    expect(WzRequest.genericReq).toHaveBeenCalledWith(
      'POST',
      '/api/ai/analyze-alert',
      alertReference,
      { shouldRetry: false, checkCurrentApiIsUp: false },
    );
  });

  it('shows a loading state and prevents duplicate requests', () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    (WzRequest.genericReq as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve;
        }),
    );

    render(<AIAnalysisTab {...alertReference} />);
    const button = screen.getByRole('button', { name: 'Analyze alert' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByText('Analyzing alert…')).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(WzRequest.genericReq).toHaveBeenCalledTimes(1);

    act(() => {
      resolveRequest({ data: { ok: true, analysis: 'Done' } });
    });
  });

  it('shows a safe error without exposing request details', async () => {
    (WzRequest.genericReq as jest.Mock).mockRejectedValue(
      new Error('private URL or token detail'),
    );

    render(<AIAnalysisTab {...alertReference} />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze alert' }));

    expect(
      await screen.findByText(
        'AI analysis is unavailable. Check the backend connection and try again.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/private URL or token detail/)).toBeNull();
  });

  it('clears the previous alert analysis when the selected alert changes', async () => {
    (WzRequest.genericReq as jest.Mock).mockResolvedValueOnce({
      data: { ok: true, analysis: 'Alert A analysis' },
    });

    const { rerender } = render(renderKeyedAnalysisTab(alertReference));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze alert' }));
    expect(await screen.findByText('Alert A analysis')).toBeInTheDocument();

    rerender(renderKeyedAnalysisTab(secondAlertReference));

    expect(screen.queryByText('Alert A analysis')).toBeNull();
    expect(
      screen.queryByText(
        'AI analysis is unavailable. Check the backend connection and try again.',
      ),
    ).toBeNull();
  });

  it('clears the previous alert error when the selected alert changes', async () => {
    (WzRequest.genericReq as jest.Mock).mockRejectedValueOnce(
      new Error('synthetic request failure'),
    );

    const { rerender } = render(renderKeyedAnalysisTab(alertReference));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze alert' }));
    expect(
      await screen.findByText(
        'AI analysis is unavailable. Check the backend connection and try again.',
      ),
    ).toBeInTheDocument();

    rerender(renderKeyedAnalysisTab(secondAlertReference));

    expect(
      screen.queryByText(
        'AI analysis is unavailable. Check the backend connection and try again.',
      ),
    ).toBeNull();
    expect(screen.queryByText('Alert A analysis')).toBeNull();
  });

  it('does not show an old in-flight response after switching alerts', async () => {
    let resolveAlertA: (value: unknown) => void = () => undefined;
    (WzRequest.genericReq as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveAlertA = resolve;
          }),
      )
      .mockResolvedValueOnce({
        data: { ok: true, analysis: 'Alert B analysis' },
      });

    const { rerender } = render(renderKeyedAnalysisTab(alertReference));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze alert' }));
    expect(screen.getByText('Analyzing alert…')).toBeInTheDocument();

    rerender(renderKeyedAnalysisTab(secondAlertReference));
    expect(screen.queryByText('Analyzing alert…')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Analyze alert' }));
    expect(await screen.findByText('Alert B analysis')).toBeInTheDocument();

    await act(async () => {
      resolveAlertA({ data: { ok: true, analysis: 'Alert A late analysis' } });
      await Promise.resolve();
    });

    expect(screen.getByText('Alert B analysis')).toBeInTheDocument();
    expect(screen.queryByText('Alert A late analysis')).toBeNull();
  });
});
