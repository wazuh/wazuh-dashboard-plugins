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
  /** `h1` for the page title, `h2` for the sections under it. */
  headingLevel?: 'h1' | 'h2';
}

/**
 * Section heading shared by every Home overview section. The title is a real
 * heading drawn as a badge, with the description sitting beside it on the same
 * line, giving the on-page sections a lighter, navigation-style treatment. On
 * narrow widths the description wraps below the badge.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actions,
  headingLevel: Heading = 'h2',
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
          <EuiFlexItem grow={false} component={Heading}>
            <EuiBetaBadge color='subdued' label={title} />
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
