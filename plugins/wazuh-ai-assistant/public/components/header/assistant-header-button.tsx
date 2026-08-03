import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { EuiHeaderSectionItemButton, EuiIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type {
  CoreStart,
  ISidecarConfig,
  OverlayRef,
} from '../../../../../src/core/public';
import { confirmInterruption } from '../../services/interrupt-confirm';

const AssistantChatPanel = lazy(() =>
  import('./assistant-chat-panel').then(module => ({
    default: module.AssistantChatPanel,
  })),
);

const SIDECAR_WIDTH_STORAGE_KEY = 'wazuhAiAssistant.sidecarWidth';
const DEFAULT_SIDECAR_WIDTH = 480;
const MIN_SIDECAR_WIDTH = 350;

function initialSidecarWidth(): number {
  const stored = Number(window.localStorage.getItem(SIDECAR_WIDTH_STORAGE_KEY));
  const width =
    Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_SIDECAR_WIDTH;
  return Math.min(
    Math.max(width, MIN_SIDECAR_WIDTH),
    Math.floor(window.innerWidth * 0.8),
  );
}

export const AssistantHeaderButton: React.FC<{ core: CoreStart }> = ({
  core,
}) => {
  const sidecarRef = useRef<OverlayRef | null>(null);
  const isGeneratingRef = useRef(false);
  const confirmPendingRef = useRef(false);
  const lastWidthRef = useRef(DEFAULT_SIDECAR_WIDTH);
  const widthSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const runGuarded = useCallback(
    (action: () => void) => {
      if (!isGeneratingRef.current) {
        action();
        return;
      }
      if (confirmPendingRef.current) {
        return;
      }
      confirmPendingRef.current = true;
      void confirmInterruption(core.overlays)
        .then(confirmed => {
          if (confirmed) {
            action();
          }
        })
        .finally(() => {
          confirmPendingRef.current = false;
        });
    },
    [core.overlays],
  );

  const closeSidecar = useCallback(() => {
    void sidecarRef.current?.close();
  }, []);

  const openSidecar = useCallback(() => {
    if (sidecarRef.current) {
      return;
    }
    isGeneratingRef.current = false;
    lastWidthRef.current = initialSidecarWidth();
    const sidecar = core.overlays.sidecar.open(
      element => {
        const root = createRoot(element);
        root.render(
          <Suspense fallback={null}>
            <AssistantChatPanel
              core={core}
              onClose={closeSidecar}
              runGuarded={runGuarded}
              isGeneratingRef={isGeneratingRef}
            />
          </Suspense>,
        );
        return () => setTimeout(() => root.unmount());
      },
      {
        'data-test-subj': 'wzAiAssistantSidecar',
        config: {
          dockedMode: 'right' as ISidecarConfig['dockedMode'],
          paddingSize: lastWidthRef.current,
        },
      },
    );
    sidecarRef.current = sidecar;
    setIsOpen(true);
    widthSubscriptionRef.current = core.overlays.sidecar
      .getSidecarConfig$()
      .subscribe(config => {
        if (
          config?.paddingSize &&
          config.paddingSize !== lastWidthRef.current
        ) {
          lastWidthRef.current = config.paddingSize;
          window.localStorage.setItem(
            SIDECAR_WIDTH_STORAGE_KEY,
            String(config.paddingSize),
          );
        }
      });
    void sidecar.onClose.then(() => {
      sidecarRef.current = null;
      setIsOpen(false);
      widthSubscriptionRef.current?.unsubscribe();
      widthSubscriptionRef.current = null;
      window.localStorage.setItem(
        SIDECAR_WIDTH_STORAGE_KEY,
        String(lastWidthRef.current),
      );
    });
  }, [core, closeSidecar, runGuarded]);

  useEffect(() => closeSidecar, [closeSidecar]);

  return (
    <EuiToolTip
      content={i18n.translate('wazuhAiAssistant.header.buttonTooltip', {
        defaultMessage: 'AI Assistant',
      })}
      position='bottom'
    >
      <EuiHeaderSectionItemButton
        aria-label={
          isOpen
            ? i18n.translate('wazuhAiAssistant.header.closeChatButtonLabel', {
                defaultMessage: 'Close the AI Assistant',
              })
            : i18n.translate('wazuhAiAssistant.header.openChatButtonLabel', {
                defaultMessage: 'Open the AI Assistant',
              })
        }
        aria-expanded={isOpen}
        onClick={() => {
          if (sidecarRef.current) {
            runGuarded(closeSidecar);
          } else {
            openSidecar();
          }
        }}
        data-test-subj='wzAiAssistantHeaderButton'
      >
        <EuiIcon type='chatRight' size='m' />
      </EuiHeaderSectionItemButton>
    </EuiToolTip>
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
