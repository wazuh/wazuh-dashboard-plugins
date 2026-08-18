import './provider-picker.scss';
import React, { useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ProviderSummary } from '../../../common/types';

/** The trigger's own label is truncated with CSS ellipsis (`.wzProviderPickerTriggerLabel`,
 * provider-picker.scss) rather than sliced in JS — this bound is just what keeps a pathologically
 * long provider name from ballooning the composer's controls row before the CSS clamp engages;
 * the full name is still always available via `title`/aria on the trigger. */
const TRIGGER_LABEL_MAX_CHARS = 22;

function truncateLabel(name: string): string {
  return name.length > TRIGGER_LABEL_MAX_CHARS
    ? `${name.slice(0, TRIGGER_LABEL_MAX_CHARS - 1)}…`
    : name;
}

interface ProviderPickerProps {
  providers: ProviderSummary[];
  selectedProviderId: string;
  onProviderChange: (id: string) => void;
  /** Navigates to the Settings app's providers table — the SAME helper each embedding context
   * (application.tsx's tab switch, assistant-chat-panel.tsx's `openSettings`) already uses for a
   * plain "go to Settings" visit, kept distinct from `onNavigateToSettings`'s
   * `?addProvider=true` flyout-opening behaviour. */
  onManageProviders: () => void;
}

/**
 * Provider selector, option A2 (iteration-4 item 2): a text trigger plus a popover menu, replacing
 * the old `EuiSelect compressed` and its inline hairline divider. Each provider's name and model
 * are both shown (the old `<select>` could only ever show one line per option), the selected
 * provider carries a check mark, and a footer item hands off to the full Settings page instead of
 * requiring the reader to already know where "more providers" live.
 *
 * No connection-status chip here (unlike the design note that first scoped this component): the
 * live test-outcome state (`testResults`/`testingIds`) is local to `settings-page.tsx` and was
 * never threaded through to `ChatPage`/here, and plumbing a NEW cross-page data path was out of
 * this item's stated scope (chat-page.tsx prop wiring only). Left for a follow-up if the product
 * decision is that the chat surface needs live provider health, not just its name and model.
 */
export const ProviderPicker: React.FC<ProviderPickerProps> = ({
  providers,
  selectedProviderId,
  onProviderChange,
  onManageProviders,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedProvider = providers.find(
    provider => provider.id === selectedProviderId,
  );
  const triggerText = selectedProvider
    ? truncateLabel(selectedProvider.name)
    : i18n.translate('wazuhAiAssistant.chat.providerPicker.noSelection', {
        defaultMessage: 'Select a provider',
      });

  const closePopover = () => setIsOpen(false);

  const button = (
    <EuiButtonEmpty
      size='s'
      color='text'
      iconType='arrowDown'
      iconSide='right'
      onClick={() => setIsOpen(previous => !previous)}
      title={selectedProvider?.name}
      aria-label={i18n.translate(
        'wazuhAiAssistant.chat.providerPicker.triggerAriaLabel',
        {
          defaultMessage: 'AI provider: {name}. Change provider.',
          values: {
            name:
              selectedProvider?.name ??
              i18n.translate(
                'wazuhAiAssistant.chat.providerPicker.noSelection',
                { defaultMessage: 'Select a provider' },
              ),
          },
        },
      )}
    >
      <span className='wzProviderPickerTriggerLabel'>{triggerText}</span>
    </EuiButtonEmpty>
  );

  const providerItems = providers.map(provider => (
    <EuiContextMenuItem
      key={provider.id}
      icon={provider.id === selectedProviderId ? 'check' : 'empty'}
      onClick={() => {
        onProviderChange(provider.id);
        closePopover();
      }}
    >
      <EuiFlexGroup
        alignItems='center'
        gutterSize='s'
        responsive={false}
        className='wzProviderPickerItem'
      >
        <EuiFlexItem>
          <EuiFlexGroup alignItems='center' gutterSize='xs' responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size='s' className='wzProviderPickerItemName'>
                {provider.name}
              </EuiText>
            </EuiFlexItem>
            {provider.isDefault && (
              <EuiFlexItem grow={false}>
                <EuiBadge color='hollow'>
                  {i18n.translate(
                    'wazuhAiAssistant.chat.providerPicker.defaultBadge',
                    { defaultMessage: 'Default' },
                  )}
                </EuiBadge>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
          <EuiText size='xs' color='subdued' className='wzProviderPickerItemModel'>
            {provider.model}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiContextMenuItem>
  ));

  const manageProvidersItem = (
    <EuiContextMenuItem
      key='wzManageProviders'
      icon='gear'
      onClick={() => {
        closePopover();
        onManageProviders();
      }}
    >
      {i18n.translate('wazuhAiAssistant.chat.providerPicker.manageProviders', {
        defaultMessage: 'Manage providers',
      })}
    </EuiContextMenuItem>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={closePopover}
      panelPaddingSize='none'
      anchorPosition='downRight'
    >
      <EuiContextMenuPanel items={[...providerItems, manageProvidersItem]} />
    </EuiPopover>
  );
};
