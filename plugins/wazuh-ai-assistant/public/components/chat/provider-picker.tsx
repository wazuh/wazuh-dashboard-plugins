import './provider-picker.scss';
import React, { useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ProviderSummary } from '../../../common/types';

interface ProviderPickerProps {
  providers: ProviderSummary[];
  selectedProviderId: string;
  onProviderChange: (id: string) => void;
  /** Navigates to the Settings app's providers table — the SAME helper each embedding context
   * (application.tsx's tab switch, assistant-chat-panel.tsx's `openSettings`) already uses for a
   * plain "go to Settings" visit, kept distinct from `onNavigateToSettings`'s
   * `?addProvider=true` flyout-opening behaviour. */
  onManageProviders: () => void;
  /**
   * The conversation this picker is currently anchored above. Purely a close signal (audit item 4,
   * bug B): "New conversation" (and switching to a different saved conversation from the sidebar)
   * swaps out the whole transcript underneath this control without the popover itself ever
   * receiving a click, so a reader who opened it right before either action was left looking at a
   * menu anchored to a trigger that had visually moved/reset under it. Undefined is a valid,
   * distinct value (no conversation saved yet) — the effect below still fires on the transition
   * into/out of it.
   */
  activeConversationId?: string | null;
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
  activeConversationId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Closes a popover left open across a conversation switch (see the prop's own doc comment above)
  // — "New conversation" and picking a different saved conversation from the sidebar both change
  // this id without ever routing a click through the popover's own `closePopover`, so nothing else
  // here would otherwise notice the transition. Only closes; it never OPENS the popover, since
  // `undefined` on mount must not pop it open on first render.
  useEffect(() => {
    setIsOpen(false);
  }, [activeConversationId]);

  const selectedProvider = providers.find(
    provider => provider.id === selectedProviderId,
  );
  // Truncation is CSS-only now (`.wzProviderPickerTriggerLabel`, provider-picker.scss): a JS
  // character-count slice raced the actual rendered width (font metrics, zoom, locale) and could
  // still overflow or clip early. The full name is still always available via `title`/aria below.
  const triggerText = selectedProvider
    ? selectedProvider.name
    : i18n.translate('wazuhAiAssistant.chat.providerPicker.noSelection', {
        defaultMessage: 'Select a provider',
      });

  const closePopover = () => setIsOpen(false);

  const button = (
    <EuiButtonEmpty
      className='wzProviderPickerTrigger'
      size='s'
      color='text'
      iconType='arrowDown'
      iconSide='right'
      onClick={() => setIsOpen(previous => !previous)}
      title={selectedProvider?.name}
      aria-haspopup='true'
      aria-expanded={isOpen}
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

  const providerItems = providers.map(provider => {
    const isSelected = provider.id === selectedProviderId;
    return (
      <EuiContextMenuItem
        key={provider.id}
        icon={isSelected ? 'check' : 'empty'}
        // Selection is EuiContextMenuItem's own `icon` (a check mark), which is decorative only —
        // it never reaches assistive tech. `menuitemradio`/`aria-checked` convey the same
        // single-select-from-a-list semantics that the old <select> gave for free.
        role='menuitemradio'
        aria-checked={isSelected}
        onClick={() => {
          onProviderChange(provider.id);
          closePopover();
        }}
      >
        {/* Button content model: a <button> may legally contain block content in HTML5, but the
            menu item's accessible name/description computation is far more predictable when its
            content is plain phrasing content, so this stays span-based rather than the
            EuiFlexGroup/EuiFlexItem (div-based) layout used elsewhere on the page. */}
        <span className='wzProviderPickerItem'>
          <span className='wzProviderPickerItemBody'>
            <span className='wzProviderPickerItemNameRow'>
              <EuiText
                size='s'
                component='span'
                className='wzProviderPickerItemName'
              >
                {provider.name}
              </EuiText>
              {provider.isDefault && (
                <EuiBadge color='hollow'>
                  {i18n.translate(
                    'wazuhAiAssistant.chat.providerPicker.defaultBadge',
                    { defaultMessage: 'Default' },
                  )}
                </EuiBadge>
              )}
            </span>
            <EuiText
              size='xs'
              color='subdued'
              component='span'
              className='wzProviderPickerItemModel'
            >
              {provider.model}
            </EuiText>
          </span>
        </span>
      </EuiContextMenuItem>
    );
  });

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
      <EuiContextMenuPanel
        className='wzProviderPickerPanel'
        items={[...providerItems, manageProvidersItem]}
      />
    </EuiPopover>
  );
};
