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

/** Home overview heading: a real heading drawn as a badge, description beside it. */
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
