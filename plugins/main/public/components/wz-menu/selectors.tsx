import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIconTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';

/**
 * Container component for selectors in the menu.
 * @param param0
 * @returns
 */
export const SelectorContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EuiFlexGroup alignItems='center' responsive={false} gutterSize='s'>
      {children}
    </EuiFlexGroup>
  );
};

/**
 * Label component for selectors in the menu.
 * @param param0
 * @returns
 */
export const SelectorLabel = ({
  actionError,
  showSelectorsInPopover,
  children,
}: {
  actionError?: string;
  showSelectorsInPopover: boolean;
  children: React.ReactNode;
}) => {
  return (
    <>
      <EuiFlexItem grow={showSelectorsInPopover}>
        <p>{children}</p>
      </EuiFlexItem>
      {actionError && (
        <EuiFlexItem grow={false}>
          <EuiIconTip
            anchorClassName='wz-agent-icon-tip'
            aria-label={i18n.translate(
              'wazuh.core.menu.selectorErrorAriaLabel',
              { defaultMessage: 'Error' },
            )}
            size='m'
            type='alert'
            color='danger'
            content={actionError}
          />
        </EuiFlexItem>
      )}
    </>
  );
};

/**
 * Selector component for selectors in the menu. This wraps the form input component.
 * @param param0
 * @returns
 */
export const Selector = ({
  children,
  showSelectorsInPopover,
}: {
  showSelectorsInPopover: boolean;
  children: React.ReactNode;
}) => {
  return <EuiFlexItem grow={showSelectorsInPopover}>{children}</EuiFlexItem>;
};
