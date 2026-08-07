import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiBetaBadge,
} from '@elastic/eui';

export interface SectionHeaderProps {
  title: string;
  description: React.ReactNode;
  /** Optional right-aligned content, e.g. the page-level Quick access menu. */
  actions?: React.ReactNode;
}

/**
 * Section heading shared by every Home overview section. The title renders as
 * a breadcrumb rather than a plain heading, with the description sitting beside
 * it on the same line, giving the on-page sections a lighter, navigation-style
 * treatment. On narrow widths the description wraps below the breadcrumb.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actions,
}) => (
  <>
    <EuiFlexGroup
      gutterSize='s'
      alignItems='baseline'
      responsive={false}
      wrap
      justifyContent={actions ? 'spaceBetween' : undefined}
    >
      <EuiFlexItem grow={false}>
        <EuiFlexGroup
          gutterSize='s'
          alignItems='baseline'
          responsive={false}
          wrap
        >
          <EuiFlexItem grow={false}>
            <EuiBetaBadge
              color='subdued'
              label={`${title}`}
              aria-label={`${title} section`}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s' color='subdued'>
              {description}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      {actions && <EuiFlexItem grow={false}>{actions}</EuiFlexItem>}
    </EuiFlexGroup>
    <EuiSpacer size='m' />
  </>
);
