import React, { Suspense, lazy, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EuiHeaderSectionItemButton, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';

const AssistantChatFlyout = lazy(() =>
  import('./assistant-chat-flyout').then(module => ({
    default: module.AssistantChatFlyout,
  })),
);

export const AssistantHeaderButton: React.FC<{ core: CoreStart }> = ({
  core,
}) => {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  return (
    <>
      <EuiHeaderSectionItemButton
        aria-label={i18n.translate(
          'wazuhAiAssistant.header.openChatButtonLabel',
          { defaultMessage: 'Open the AI Assistant' },
        )}
        onClick={() => setIsFlyoutOpen(open => !open)}
        data-test-subj='wzAiAssistantHeaderButton'
      >
        <EuiIcon type='chatRight' size='m' />
      </EuiHeaderSectionItemButton>
      {isFlyoutOpen && (
        <Suspense fallback={null}>
          <AssistantChatFlyout
            core={core}
            onClose={() => setIsFlyoutOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export function registerAssistantHeaderButton(core: CoreStart): void {
  const isNewHomePageEnabled = core.uiSettings.get('home:useNewHomePage');

  core.chrome.navControls[
    isNewHomePageEnabled ? 'registerLeftBottom' : 'registerRight'
  ]({
    order: 90,
    mount: (element: HTMLElement) => {
      const root = createRoot(element);
      root.render(<AssistantHeaderButton core={core} />);

      return () => root.unmount();
    },
  });
}
