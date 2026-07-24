import React from 'react';
import {
  EuiBreadcrumbs,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiBetaBadge,
} from '@elastic/eui';

export interface SectionHeaderProps {
  title: string;
  description: React.ReactNode;
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
}) => (
  <>
    <EuiFlexGroup gutterSize='s' alignItems='baseline' responsive={false} wrap>
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
    <EuiSpacer size='m' />
  </>
);
