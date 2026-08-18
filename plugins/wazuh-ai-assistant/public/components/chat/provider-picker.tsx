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

  // Bug (behavioral, iteration-4 audit item 1): `EuiContextMenuPanel` focuses its first item on
  // mount regardless of selection. That focus background reads as "selected", so on every open the
  // reader saw item 0 highlighted while the ACTUAL current provider (check icon + "Default" badge)
  // sat highlighted-looking further down — two contradictory "selected" cues in the same list.
  // Confirmed live at localhost:8444 (2026-08-18): opening the picker with "Claude test" selected
  // focused "Groq" (item 0) instead.
  //
  // Fix, part 1: `initialFocusedItemIndex`, the exact prop `EuiContextMenuPanel` ships for this —
  // NOT a per-item `buttonRef`, which looked promising but doesn't work here.
  // `EuiContextMenuPanel`'s own source (`context_menu_panel.js`) clones every element passed via
  // its `items` prop and unconditionally OVERWRITES `buttonRef` with its own internal tracker
  // (`cloneElement(MenuItem, { buttonRef: (node) => this.menuItemRef(index, node) })`), so a
  // `buttonRef` set on our own `EuiContextMenuItem` elements is silently discarded — confirmed by
  // instrumenting it: the ref callback never fired. `initialFocusedItemIndex` reads into that SAME
  // internal `menuItems` array the panel already builds from `items`, so it is the one lever that
  // actually reaches it. It only takes effect once, from the panel's constructor — safe here
  // because `EuiPopover` unmounts its panel content entirely on close (`popover.js`: content only
  // renders while `isOpen || isClosing`), so every open is a fresh mount that re-reads the current
  // selection.
  //
  // Fix, part 2: `EuiPopover` ALSO runs its own independent initial-focus pass (`popover.js`'s own
  // `updateFocus`, guarding a `OuiFocusTrap`), on its OWN `requestAnimationFrame`, racing
  // `EuiContextMenuPanel`'s. When no `initialFocus` target is given, its fallback is "the first
  // tabbable element in the panel" (or the panel itself if none resolves) — a SECOND opinion that
  // can override the first one after the fact, observed live in this repo's own jsdom tests via a
  // `focus()` spy: item 2 was correctly focused first, then the popover's own pass immediately
  // refocused the panel container. Telling `EuiPopover` to target the SAME element via
  // `initialFocus` (a selector string, resolved lazily — see `getElementFromInitialFocus`) makes
  // both mechanisms agree, so whichever one's `requestAnimationFrame` runs last still lands on the
  // right item instead of undoing the other's work.
  const selectedProviderIndex = providers.findIndex(
    provider => provider.id === selectedProviderId,
  );
  // Falls back to item 0 when nothing is selected yet (e.g. no provider configured), matching the
  // "if no provider is selected, fall back to index 0" requirement.
  const initialFocusedItemIndex =
    selectedProviderIndex >= 0 ? selectedProviderIndex : 0;
  const initialFocusedProviderId =
    providers[initialFocusedItemIndex]?.id ?? providers[0]?.id;

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
        // Gives `EuiPopover`'s own `initialFocus` (below) a stable, lazily-resolved selector for
        // whichever item `initialFocusedItemIndex` above also targets — see that effect's comment
        // for why both need to agree on the same element.
        data-test-subj={
          provider.id === initialFocusedProviderId
            ? 'wzProviderPickerInitialFocusItem'
            : undefined
        }
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
      className='wzProviderPickerFooterItem'
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
      initialFocus='[data-test-subj="wzProviderPickerInitialFocusItem"]'
    >
      <EuiContextMenuPanel
        className='wzProviderPickerPanel'
        items={[...providerItems, manageProvidersItem]}
        initialFocusedItemIndex={initialFocusedItemIndex}
      />
    </EuiPopover>
  );
};
