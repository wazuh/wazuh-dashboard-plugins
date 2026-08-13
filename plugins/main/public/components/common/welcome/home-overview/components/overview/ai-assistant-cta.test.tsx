import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { AiAssistantCta } from './ai-assistant-cta';
import { getAiAssistantUrl } from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getAiAssistantUrl: jest.fn(() => '/mock/wazuhAiAssistant'),
}));

describe('AiAssistantCta', () => {
  it('renders a single "AI Assistant" card linking to the AI Assistant app', () => {
    const { container } = render(<AiAssistantCta />);
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-ai-assistant-card"]',
      ),
    ).toBeInTheDocument();
    const link = screen.getByText('AI Assistant').closest('a');
    expect(link).toHaveAttribute('href', '/mock/wazuhAiAssistant');
    expect(getAiAssistantUrl).toHaveBeenCalled();
  });
});
