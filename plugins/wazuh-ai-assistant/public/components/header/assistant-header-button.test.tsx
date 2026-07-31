import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoreStart } from '../../../../../src/core/public';
import {
  AssistantHeaderButton,
  registerAssistantHeaderButton,
} from './assistant-header-button';

const mockReact = React;

jest.mock('./assistant-chat-flyout', () => ({
  AssistantChatFlyout: (props: { onClose: () => void }) =>
    mockReact.createElement(
      'div',
      { 'data-test-subj': 'flyout-stub' },
      mockReact.createElement(
        'button',
        { type: 'button', onClick: () => props.onClose() },
        'close flyout',
      ),
    ),
}));

function coreMock({ newHomePage = false } = {}): CoreStart {
  return {
    uiSettings: { get: () => newHomePage },
    chrome: {
      navControls: {
        registerRight: jest.fn(),
        registerLeftBottom: jest.fn(),
      },
    },
  } as unknown as CoreStart;
}

const flyoutStub = () =>
  document.querySelector('[data-test-subj="flyout-stub"]');

describe('AssistantHeaderButton', () => {
  it('opens the chat flyout on click and closes it again from the flyout', async () => {
    render(<AssistantHeaderButton core={coreMock()} />);
    expect(flyoutStub()).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Open the AI Assistant'));
    // findBy: the flyout module is React.lazy-loaded, so it appears asynchronously.
    await screen.findByText('close flyout');

    fireEvent.click(screen.getByText('close flyout'));
    expect(flyoutStub()).not.toBeInTheDocument();
  });

  it('toggles the flyout closed when the button is clicked again', async () => {
    render(<AssistantHeaderButton core={coreMock()} />);

    fireEvent.click(screen.getByLabelText('Open the AI Assistant'));
    await screen.findByText('close flyout');

    fireEvent.click(screen.getByLabelText('Open the AI Assistant'));
    expect(flyoutStub()).not.toBeInTheDocument();
  });
});

describe('registerAssistantHeaderButton', () => {
  it('registers on the header right section by default', () => {
    const core = coreMock();
    registerAssistantHeaderButton(core);

    expect(core.chrome.navControls.registerRight).toHaveBeenCalledTimes(1);
    expect(core.chrome.navControls.registerLeftBottom).not.toHaveBeenCalled();
  });

  it('registers on the left-bottom slot when the new home page is enabled', () => {
    const core = coreMock({ newHomePage: true });
    registerAssistantHeaderButton(core);

    expect(core.chrome.navControls.registerLeftBottom).toHaveBeenCalledTimes(1);
    expect(core.chrome.navControls.registerRight).not.toHaveBeenCalled();
  });

  it('mounts the button into the chrome-provided element and unmounts cleanly', () => {
    const core = coreMock();
    registerAssistantHeaderButton(core);

    const { mount } = (core.chrome.navControls.registerRight as jest.Mock).mock
      .calls[0][0];
    const element = document.createElement('div');
    document.body.append(element);

    let unmount: () => void = () => undefined;
    act(() => {
      unmount = mount(element);
    });
    expect(
      element.querySelector('[data-test-subj="wzAiAssistantHeaderButton"]'),
    ).toBeInTheDocument();

    act(() => unmount());
    expect(element.innerHTML).toBe('');
    element.remove();
  });
});
