import React, { useLayoutEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';

interface ModuleHeaderButtonsProps {
  buttons: React.ComponentType<Record<string, unknown>>[];
  buttonProps: Record<string, unknown>;
}

const HEADER_SELECTOR = '.wz-welcome-page-agent-tabs';

const getRight = (element?: Element | null) =>
  element?.getBoundingClientRect().right ?? 0;

/**
 * Buttons of a module tab. They fold into a menu only when they do not fit next to the tabs.
 * Render it with the tab id as key, so another tab measures its own buttons.
 */
export const ModuleHeaderButtons = ({
  buttons,
  buttonProps,
}: ModuleHeaderButtonsProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  // Header width when the buttons last folded
  const foldedHeaderWidthRef = useRef(0);
  const [isFolded, setIsFolded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const item = itemRef.current;
    const header = item?.closest(HEADER_SELECTOR);
    if (!item || !header) {
      return;
    }

    const update = () => {
      const { right: headerRight, width: headerWidth } =
        header.getBoundingClientRect();
      if (!isFolded) {
        if (getRight(item) > headerRight + 1) {
          foldedHeaderWidthRef.current = headerWidth;
          setIsFolded(true);
        }
        return;
      }
      // Wider header: show the row again; it folds back before paint if it still overflows
      if (headerWidth > foldedHeaderWidthRef.current) {
        setIsFolded(false);
      }
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, [isFolded]);

  const renderButtons = (grow?: boolean) =>
    buttons.map((ModuleViewButton, index) => (
      <EuiFlexItem grow={grow} key={`module_button_${index}`}>
        <ModuleViewButton {...buttonProps} />
      </EuiFlexItem>
    ));

  const moreLabel = i18n.translate('wazuh.common.moduleHeader.moreActions', {
    defaultMessage: 'More actions',
  });

  return (
    <div ref={itemRef} className='wz-module-header-buttons'>
      {isFolded ? (
        <EuiPopover
          isOpen={isMenuOpen}
          // A flyout opened from the menu lives in it; keep the menu while it is open
          closePopover={() =>
            !document.querySelector('.euiFlyout') && setIsMenuOpen(false)
          }
          anchorPosition='downRight'
          panelPaddingSize='s'
          button={
            <EuiToolTip content={moreLabel}>
              <EuiButtonIcon
                iconType='boxesVertical'
                size='m'
                style={{ marginTop: 6 }}
                aria-label={moreLabel}
                onClick={() => setIsMenuOpen(isOpen => !isOpen)}
                data-test-subj='wzModuleHeaderMoreActions'
              />
            </EuiToolTip>
          }
        >
          <EuiFlexGroup
            direction='column'
            gutterSize='s'
            alignItems='flexStart'
          >
            {renderButtons(false)}
          </EuiFlexGroup>
        </EuiPopover>
      ) : (
        <EuiFlexGroup>{renderButtons()}</EuiFlexGroup>
      )}
    </div>
  );
};
