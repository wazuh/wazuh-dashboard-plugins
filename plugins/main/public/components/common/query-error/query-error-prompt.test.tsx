import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryErrorPrompt } from './query-error-prompt';

const forbidden = Object.assign(new Error('security_exception'), {
  status: 403,
});

describe('QueryErrorPrompt', () => {
  it('explains a permission error and names the index pattern', () => {
    const { container } = render(
      <QueryErrorPrompt error={forbidden} indexPatternTitle='wazuh-alerts-*' />,
    );
    expect(
      screen.getByText("You don't have permission to view this data."),
    ).toBeInTheDocument();
    expect(screen.getByText(/wazuh-alerts-\*/)).toBeInTheDocument();
    expect(
      container.querySelector(
        '[data-test-subj="query-error-prompt-permission-denied"]',
      ),
    ).toBeInTheDocument();
  });

  it('shows the error message for any other failure', () => {
    render(
      <QueryErrorPrompt
        error={new Error('Gateway Timeout')}
        indexPatternTitle='wazuh-alerts-*'
      />,
    );
    expect(screen.getByText('Gateway Timeout')).toBeInTheDocument();
    expect(screen.queryByText(/wazuh-alerts-\*/)).not.toBeInTheDocument();
  });
});
