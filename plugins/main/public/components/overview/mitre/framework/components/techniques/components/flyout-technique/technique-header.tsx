import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutHeader,
  EuiLink,
  EuiLoadingContent,
  EuiTitle,
} from '@elastic/eui';
import { MitreItem, MitreTechnique } from './lib/technique';
import { goToIntelligence } from './lib/navigation';

type TechniqueHeaderProps = {
  techniqueId: string;
  technique?: MitreTechnique;
  tactics: MitreItem[];
  isLoading: boolean;
};

export const TechniqueHeader = ({
  techniqueId,
  technique,
  tactics,
  isLoading,
}: TechniqueHeaderProps) => (
  // The right padding keeps the link clear of the flyout close button
  <EuiFlyoutHeader hasBorder style={{ padding: '12px 48px 12px 16px' }}>
    <EuiFlexGroup
      alignItems='flexStart'
      justifyContent='spaceBetween'
      gutterSize='m'
      responsive={false}
      wrap
    >
      <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
        {isLoading ? (
          <EuiLoadingContent lines={1} />
        ) : (
          <EuiTitle size='m'>
            <h2 id='flyoutSmallTitle'>{technique?.name ?? techniqueId}</h2>
          </EuiTitle>
        )}
        <EuiFlexGroup
          gutterSize='xs'
          wrap
          responsive={false}
          style={{ marginTop: 4 }}
        >
          <EuiFlexItem grow={false}>
            <EuiBadge
              color='hollow'
              onClick={() => goToIntelligence('techniques', techniqueId)}
              onClickAriaLabel={i18n.translate(
                'wazuh.mitreAttack.techniqueFlyout.openTechniqueInIntelligenceTooltip',
                {
                  defaultMessage:
                    'Open {technique} details in the Intelligence section',
                  values: { technique: techniqueId },
                },
              )}
            >
              {techniqueId}
            </EuiBadge>
          </EuiFlexItem>
          {tactics.map(tactic => (
            <EuiFlexItem grow={false} key={tactic.external_id}>
              <EuiBadge
                color='default'
                onClick={() => goToIntelligence('tactics', tactic.external_id)}
                onClickAriaLabel={i18n.translate(
                  'wazuh.mitreAttack.techniqueFlyout.openTacticInIntelligenceTooltip',
                  {
                    defaultMessage:
                      'Open {tactic} details in the Intelligence section',
                    values: { tactic: tactic.name },
                  },
                )}
              >
                {tactic.name}
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiFlexItem>
      {technique?.url && (
        <EuiFlexItem grow={false}>
          <EuiLink href={technique.url} target='_blank' external>
            {i18n.translate(
              'wazuh.mitreAttack.techniqueFlyout.header.viewOnMitre',
              {
                defaultMessage: 'View on MITRE ATT&CK',
              },
            )}
          </EuiLink>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  </EuiFlyoutHeader>
);
