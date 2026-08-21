import React, { useMemo, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCheckbox,
  EuiFieldSearch,
  EuiFieldText,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiConfirmModal,
  EuiLoadingSpinner,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ConversationSummary } from '../../../common/types';
import './conversation-list.scss';

/** How the page grid is presenting the rail (layout contract §5) — chat-page.tsx measures the
 * pane and decides which of the three to render; this component only reacts to whichever it's
 * told. Exported so chat-page.tsx (and its own tests) can name the type instead of inlining the
 * three string literals again. */
export type ConversationRailDisplayMode = 'expanded' | 'collapsed' | 'flyout';

interface ConversationListProps {
  conversations: ConversationSummary[];
  isLoading: boolean;
  /** Null while the current chat has never been saved yet (a brand new, unsaved conversation). */
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  onDelete: (id: string) => void;
  /** Inline rename (issue #9010, finding E2). Optional, like `onCollapse`/`onExpand` below: a
   * caller that hasn't wired renaming yet simply never sees the pencil affordance rendered at all
   * (see the row rendering below), rather than throwing on a missing handler. */
  onRename?: (id: string, title: string) => void;
  /** Bulk delete (issue #9010, finding E3): called once with every selected conversation id after
   * the "Delete N conversations?" confirm modal is accepted. Same optionality reasoning as
   * `onRename` above — no handler means no "Select conversations" entry point is rendered. The
   * caller decides how to apply it (sequential awaits, `Promise.allSettled`, a bulk endpoint...);
   * this component's own job ends at handing over the id list. */
  onBulkDelete?: (ids: string[]) => void;
  /**
   * How the page grid is presenting the rail (layout contract §5). Optional, defaulting to
   * 'expanded' — every pre-redesign call site (and every pre-redesign test) keeps rendering the
   * full rail exactly as before without having to pass this at all.
   */
  displayMode?: ConversationRailDisplayMode;
  /** The pinned "‹ Collapse" control (only shown in 'expanded' mode) calls this. Optional: a
   * caller that hasn't wired collapsing yet simply never sees it invoked. */
  onCollapse?: () => void;
  /** The collapsed 48px strip's expand affordances call this — search included, since a 48px
   * strip has no room for a real search field and "open search" and "show the full rail" are the
   * same action from here. */
  onExpand?: () => void;
  /** The "Conversations" title row + loading spinner (only relevant in 'expanded'/'flyout' mode).
   * Default true — every pre-existing caller keeps its title row. The sidecar header's own
   * conversations popover (assistant-chat-panel.tsx) passes false: the popover already has its own
   * trigger button, and repeating a "Conversations" label inside it is pure redundancy. */
  showHeader?: boolean;
  /** The "New conversation" button (only relevant in 'expanded'/'flyout' mode). Default true. The
   * sidecar header's conversations popover passes false: it gets its own "New conversation" icon
   * button next to the popover's own trigger instead, per the header's own doc comment. */
  showNewConversationButton?: boolean;
}

/**
 * `Intl.RelativeTimeFormat` is a built-in (no new dependency) — picks the coarsest unit that still rounds to at least 1 (seconds only for
 * anything under a minute), falling back to a plain locale datetime string if the browser's Intl
 * implementation throws for any reason (defensive; every evergreen browser OSD targets supports
 * this API).
 */
function formatRelativeTime(iso: string): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return '';
  }
  const diffSeconds = Math.round((Date.now() - target.getTime()) / 1000);

  // Compact by design: the rail spends this stamp on EVERY row, and a full "21 hours ago" ate so
  // much of a 260px rail that titles truncated to about ten characters — the "undense rail" gap
  // this redesign exists to close. The reference writes them as `17h`, `Mon`, `Jul 26`, which is
  // the same information in a quarter of the width, so the title gets the rest.
  if (diffSeconds < 60) {
    return i18n.translate('wazuhAiAssistant.chat.conversations.justNow', {
      defaultMessage: 'now',
    });
  }
  if (diffSeconds < 3600) {
    return i18n.translate('wazuhAiAssistant.chat.conversations.minutesShort', {
      defaultMessage: '{count}m',
      values: { count: Math.floor(diffSeconds / 60) },
    });
  }
  if (diffSeconds < 86400) {
    return i18n.translate('wazuhAiAssistant.chat.conversations.hoursShort', {
      defaultMessage: '{count}h',
      values: { count: Math.floor(diffSeconds / 3600) },
    });
  }

  const locale =
    typeof i18n.getLocale === 'function' ? i18n.getLocale() : undefined;
  try {
    // Inside a week a weekday name is more useful than "6d" (an analyst thinks in "Monday"), past
    // that a weekday is ambiguous, so it becomes a date — mirroring the date-group headers above.
    if (diffSeconds < 7 * 86400) {
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
        target,
      );
    }
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(target);
  } catch {
    return target.toLocaleDateString();
  }
}

const truncateTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const MS_PER_DAY = 86400000;

/** Local midnight for `date`, so day differences are calendar-day differences never affected by
 * the time-of-day component — a conversation updated at 23:59 and one updated the next day at
 * 00:01 must land in different buckets even though under two hours separate them. */
function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

interface ConversationGroup {
  key: string;
  label: string;
  items: ConversationSummary[];
}

/**
 * Buckets a conversation's `updatedAt` into TODAY / YESTERDAY / this-week's weekday / an older
 * date, per Screen 1's rail grouping. Keyed (not just labelled) so two different weekdays a week
 * apart never collide. `now` is threaded in (rather than read via `new Date()` here) so
 * date-boundary tests can pin it exactly like `formatRelativeTime`'s own tests already do.
 */
function dateBucketKey(iso: string, now: Date): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return 'unknown';
  }
  const diffDays = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(target)) / MS_PER_DAY,
  );
  if (diffDays <= 0) {
    // <= 0, not === 0: a clock-skewed/future `updatedAt` still reads as "the most recent bucket"
    // instead of falling through to the weekday/date branches below.
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return `weekday-${target.getDay()}`;
  }
  return `date-${target.getFullYear()}-${target.getMonth()}-${target.getDate()}`;
}

/** Natural-case label text ("Today", "Monday", "Aug 5") — the group header's own CSS
 * (`wzConvoRailGroupHeader`, via the shared `wzMicroLabel` mixin) applies the uppercase transform,
 * so this never bakes locale-insensitive uppercasing into the translated string itself. */
function dateBucketLabel(key: string, iso: string, now: Date): string {
  if (key === 'today') {
    return i18n.translate(
      'wazuhAiAssistant.chat.conversations.dateGroup.today',
      {
        defaultMessage: 'Today',
      },
    );
  }
  if (key === 'yesterday') {
    return i18n.translate(
      'wazuhAiAssistant.chat.conversations.dateGroup.yesterday',
      { defaultMessage: 'Yesterday' },
    );
  }
  if (key === 'unknown') {
    return i18n.translate(
      'wazuhAiAssistant.chat.conversations.dateGroup.unknown',
      {
        defaultMessage: 'Earlier',
      },
    );
  }
  const target = new Date(iso);
  const locale =
    typeof i18n.getLocale === 'function' ? i18n.getLocale() : undefined;
  try {
    if (key.startsWith('weekday-')) {
      return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(
        target,
      );
    }
    const sameYear = target.getFullYear() === now.getFullYear();
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    }).format(target);
  } catch {
    return target.toLocaleDateString();
  }
}

/**
 * Groups already-ordered `conversations` by date bucket, WITHOUT re-sorting — the list is expected
 * newest-first from its caller (chat-page.tsx's own conversations state), the same assumption the
 * un-grouped list relied on implicitly before this redesign. A group opens the first time its key
 * is seen and every later conversation with the same key joins it, so a caller whose list is not
 * strictly date-ordered would see a bucket appear more than once rather than crash — a degraded
 * rendering, not a broken one.
 */
function groupByDate(
  conversations: ConversationSummary[],
  now: Date,
): ConversationGroup[] {
  const groups: ConversationGroup[] = [];
  const byKey = new Map<string, ConversationGroup>();
  for (const conversation of conversations) {
    const key = dateBucketKey(conversation.updatedAt, now);
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        label: dateBucketLabel(key, conversation.updatedAt, now),
        items: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(conversation);
  }
  return groups;
}

/**
 * Sidebar-style list of the caller's own saved conversations: a search field, date-grouped rows
 * (title + relative `updatedAt` on one line, click to resume), and a per-row delete with a confirm
 * modal (matches settings_page.tsx's provider-delete pattern) — plus the three `displayMode`
 * renderings the surrounding page grid can ask for (layout contract §5). Purely presentational —
 * chat-page.tsx owns the actual load/select/save/delete side effects and the list of
 * `conversations` this renders; search/grouping here are client-side only, over whatever it was
 * already given.
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  activeConversationId,
  onSelect,
  onNewConversation,
  onDelete,
  onRename,
  onBulkDelete,
  displayMode = 'expanded',
  onCollapse,
  onExpand,
  showHeader = true,
  showNewConversationButton = true,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(
    null,
  );
  // Hover-to-reveal delete icon (cheap, no stylesheet available in this plugin yet): tracked in
  // React state rather than a CSS :hover rule, so the icon fades in only for the row currently
  // under the pointer, while staying reachable (opacity change only, never unmounted) for
  // keyboard/touch users who can't hover.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Inline rename (E2): which row (if any) currently shows an input instead of its title text, and
  // that input's own in-progress value. Only one row can be renaming at a time.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Bulk delete (E3): an explicit select mode a "Select conversations" button enters/exits — rows
  // never show checkboxes outside of it. `selectedIds` is cleared both on entry and on exit, so a
  // stale selection from a previous select-mode session never survives into the next one.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Hooks run unconditionally on every render (rules of hooks) even though `displayMode ===
  // 'collapsed'` below returns a much smaller tree that never uses most of this state — the
  // collapsed strip's content is a rendering choice, not a reason to skip hooks.
  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return conversations;
    }
    return conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(term),
    );
  }, [conversations, searchTerm]);

  // `new Date(Date.now())`, not a bare `new Date()`: the latter is NOT guaranteed to consult a
  // mocked `Date.now` (engines implement the no-arg constructor as its own native "current time"
  // read, independent of the `Date.now` static property), which would make the TODAY/YESTERDAY
  // boundary untestable the same way `formatRelativeTime` above already relies on `Date.now()`
  // being mockable.
  const groups = useMemo(
    () => groupByDate(filteredConversations, new Date(Date.now())),
    [filteredConversations],
  );

  const requestDelete = (
    event: React.MouseEvent,
    conversation: ConversationSummary,
  ) => {
    // Never let the row's own onClick (resume) fire alongside the trash icon's click.
    event.stopPropagation();
    setDeleteTarget(conversation);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // --- Inline rename (E2) ---------------------------------------------------------------------

  const startRename = (
    event: React.MouseEvent,
    conversation: ConversationSummary,
  ) => {
    // Same reason as `requestDelete`'s stopPropagation: never let the row's own onClick (resume)
    // fire alongside the pencil icon's click.
    event.stopPropagation();
    setRenamingId(conversation.id);
    setRenameValue(conversation.title);
  };

  const commitRename = () => {
    const id = renamingId;
    const nextTitle = renameValue.trim();
    setRenamingId(null);
    // An empty (or whitespace-only) title commits nothing rather than saving a blank title — the
    // row simply reverts to showing its previous title, same as Escape would.
    if (id && nextTitle) {
      onRename?.(id, nextTitle);
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  // --- Bulk delete / select mode (E3) -----------------------------------------------------------

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const confirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    setBulkDeleteConfirmOpen(false);
    exitSelectMode();
    onBulkDelete?.(ids);
  };

  const deleteModal = deleteTarget && (
    <EuiConfirmModal
      title={i18n.translate(
        'wazuhAiAssistant.chat.conversations.deleteConfirm.title',
        {
          defaultMessage: 'Delete conversation',
        },
      )}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
      cancelButtonText={i18n.translate(
        'wazuhAiAssistant.chat.conversations.deleteConfirm.cancel',
        {
          defaultMessage: 'Cancel',
        },
      )}
      confirmButtonText={i18n.translate(
        'wazuhAiAssistant.chat.conversations.deleteConfirm.confirm',
        { defaultMessage: 'Delete' },
      )}
      buttonColor='danger'
    >
      <p>
        {i18n.translate(
          'wazuhAiAssistant.chat.conversations.deleteConfirm.body',
          {
            defaultMessage:
              'This will permanently delete the conversation "{title}". This action cannot be undone.',
            values: { title: deleteTarget.title },
          },
        )}
      </p>
    </EuiConfirmModal>
  );

  const bulkDeleteModal = bulkDeleteConfirmOpen && (
    <EuiConfirmModal
      title={i18n.translate(
        'wazuhAiAssistant.chat.conversations.bulkDeleteConfirm.title',
        {
          defaultMessage:
            '{count, plural, one {Delete conversation?} other {Delete {count} conversations?}}',
          values: { count: selectedIds.size },
        },
      )}
      onCancel={() => setBulkDeleteConfirmOpen(false)}
      onConfirm={confirmBulkDelete}
      cancelButtonText={i18n.translate(
        'wazuhAiAssistant.chat.conversations.bulkDeleteConfirm.cancel',
        { defaultMessage: 'Cancel' },
      )}
      confirmButtonText={i18n.translate(
        'wazuhAiAssistant.chat.conversations.bulkDeleteConfirm.confirm',
        { defaultMessage: 'Delete' },
      )}
      buttonColor='danger'
    >
      <p>
        {i18n.translate(
          'wazuhAiAssistant.chat.conversations.bulkDeleteConfirm.body',
          {
            defaultMessage:
              'This will permanently delete the selected {count, plural, one {conversation} other {conversations}}. This action cannot be undone.',
            values: { count: selectedIds.size },
          },
        )}
      </p>
    </EuiConfirmModal>
  );

  if (displayMode === 'collapsed') {
    // A 48px icon-only strip (layout contract §5): no room here for a title, a search field, or
    // any row — "search" and "expand" both just mean "give me the full rail back", since neither
    // is actually usable at this width.
    return (
      <div className='wzConvoRailCollapsed'>
        <EuiToolTip
          content={i18n.translate('wazuhAiAssistant.chat.conversations.new', {
            defaultMessage: 'New conversation',
          })}
        >
          <EuiButtonIcon
            iconType='plusInCircle'
            aria-label={i18n.translate(
              'wazuhAiAssistant.chat.conversations.new',
              {
                defaultMessage: 'New conversation',
              },
            )}
            onClick={onNewConversation}
          />
        </EuiToolTip>
        <EuiToolTip
          content={i18n.translate(
            'wazuhAiAssistant.chat.conversations.searchPlaceholder',
            { defaultMessage: 'Search conversations' },
          )}
        >
          <EuiButtonIcon
            iconType='search'
            aria-label={i18n.translate(
              'wazuhAiAssistant.chat.conversations.searchPlaceholder',
              { defaultMessage: 'Search conversations' },
            )}
            onClick={() => onExpand?.()}
          />
        </EuiToolTip>
        <div className='wzConvoRailCollapsedSpacer' />
        <EuiButtonIcon
          iconType='arrowRight'
          aria-label={i18n.translate(
            'wazuhAiAssistant.chat.conversations.expand',
            { defaultMessage: 'Expand conversation list' },
          )}
          onClick={() => onExpand?.()}
        />
      </div>
    );
  }

  return (
    <>
      {showHeader && (
        <>
          <div className='wzConvoRailHeader'>
            <EuiFlexGroup
              responsive={false}
              alignItems='center'
              justifyContent='spaceBetween'
              gutterSize='s'
            >
              <EuiFlexItem grow={false}>
                <EuiTitle size='xxs'>
                  <h3 className='wzConvoRailTitle'>
                    {i18n.translate(
                      'wazuhAiAssistant.chat.conversations.title',
                      {
                        defaultMessage: 'Conversations',
                      },
                    )}
                  </h3>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                {isLoading && (
                  <EuiLoadingSpinner
                    size='s'
                    aria-label={i18n.translate(
                      'wazuhAiAssistant.chat.conversations.loading',
                      {
                        defaultMessage: 'Loading conversations',
                      },
                    )}
                  />
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
          <EuiSpacer size='s' />
        </>
      )}
      {showNewConversationButton && !selectMode && (
        <>
          <EuiButton
            iconType='plusInCircle'
            size='s'
            fill={false}
            fullWidth
            style={{ textDecoration: 'none' }}
            onClick={onNewConversation}
          >
            {i18n.translate('wazuhAiAssistant.chat.conversations.new', {
              defaultMessage: 'New conversation',
            })}
          </EuiButton>
          <EuiSpacer size='s' />
        </>
      )}
      {selectMode ? (
        // Bulk-delete toolbar (E3): replaces the search field row for the duration of select
        // mode — searching and bulk-selecting at once is out of scope, and this keeps the row's
        // layout footprint identical to the search row it stands in for.
        <EuiFlexGroup responsive={false} alignItems='center' gutterSize='xs'>
          <EuiFlexItem grow>
            <EuiText size='xs' color='subdued'>
              {i18n.translate(
                'wazuhAiAssistant.chat.conversations.selectMode.selectedCount',
                {
                  defaultMessage: '{count} selected',
                  values: { count: selectedIds.size },
                },
              )}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size='xs' onClick={exitSelectMode}>
              {i18n.translate(
                'wazuhAiAssistant.chat.conversations.selectMode.cancel',
                { defaultMessage: 'Cancel selection' },
              )}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              size='s'
              color='danger'
              fill
              isDisabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteConfirmOpen(true)}
            >
              {i18n.translate(
                'wazuhAiAssistant.chat.conversations.selectMode.deleteButton',
                {
                  defaultMessage: 'Delete ({count})',
                  values: { count: selectedIds.size },
                },
              )}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        <EuiFlexGroup responsive={false} alignItems='center' gutterSize='xs'>
          <EuiFlexItem grow>
            <EuiFieldSearch
              placeholder={i18n.translate(
                'wazuhAiAssistant.chat.conversations.searchPlaceholder',
                { defaultMessage: 'Search conversations' },
              )}
              aria-label={i18n.translate(
                'wazuhAiAssistant.chat.conversations.searchPlaceholder',
                { defaultMessage: 'Search conversations' },
              )}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              fullWidth
              compressed
              isClearable
            />
          </EuiFlexItem>
          {onBulkDelete && conversations.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.selectMode.enter',
                  { defaultMessage: 'Select conversations' },
                )}
              >
                <EuiButtonIcon
                  iconType='listAdd'
                  aria-label={i18n.translate(
                    'wazuhAiAssistant.chat.conversations.selectMode.enter',
                    { defaultMessage: 'Select conversations' },
                  )}
                  onClick={enterSelectMode}
                />
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      )}
      <EuiSpacer size='m' />

      {/* Only this section scrolls (`.wzConvoRailScroll`): with the whole rail scrolling instead,
          a long history pushed the pinned "Collapse" control below the fold and put a second
          scrollbar around the search field that never needed one. */}
      <div className='wzConvoRailScroll'>
        {filteredConversations.length === 0 ? (
          <EuiText size='xs' color='subdued'>
            <p>
              {searchTerm.trim()
                ? i18n.translate(
                    'wazuhAiAssistant.chat.conversations.noSearchResults',
                    { defaultMessage: 'No conversations match your search.' },
                  )
                : i18n.translate('wazuhAiAssistant.chat.conversations.empty', {
                    defaultMessage: 'No saved conversations yet.',
                  })}
            </p>
          </EuiText>
        ) : (
          groups.map(group => (
            <React.Fragment key={group.key}>
              <div className='wzConvoRailGroupHeader'>{group.label}</div>
              {/* Real list markup (E4/#9010): each date group is its own native `<ul>` of `<li>`
                  rows, so a screen reader announces "list, N items" the way EUI's own
                  `EuiListGroup` does — rather than the previous plain `<div>`s, which read as an
                  undifferentiated run of generic elements. `.wzConvoRailGroupList`/
                  `.wzConvoRailListItem` (conversation-list.scss) reset the browser's default
                  list marker/indent so this is a markup-only change with no visual effect. */}
              <ul className='wzConvoRailGroupList' aria-label={group.label}>
                {group.items.map(conversation => {
                  const isSelected = conversation.id === activeConversationId;
                  const isHovered = conversation.id === hoveredId;
                  const isRenaming = conversation.id === renamingId;
                  const isChecked = selectedIds.has(conversation.id);
                  return (
                    <li
                      key={conversation.id}
                      className='wzConvoRailListItem'
                    >
                      {/* Plain `div` (not EuiFlexGroup) carries the interactive/a11y attributes,
                        since EUI's own prop types don't guarantee accepting arbitrary
                        role/tabIndex/onKeyDown passthrough — EuiFlexGroup nested inside is purely
                        for the row's layout. In select mode the row toggles this conversation's
                        checkbox instead of resuming it. */}
                      <div
                        role={selectMode ? undefined : 'button'}
                        tabIndex={selectMode ? undefined : 0}
                        // Programmatic indication of the single-select list's current item, for
                        // assistive tech — the selected row is also signaled visually (the soft-tinted
                        // pill fill below, plus bold text), but this is what a screen reader can key
                        // off of. Only meaningful outside select mode (select mode has its own
                        // multi-select semantics via each row's checkbox).
                        aria-current={
                          !selectMode && isSelected ? 'true' : undefined
                        }
                        onClick={() => {
                          if (selectMode) {
                            toggleSelected(conversation.id);
                            return;
                          }
                          if (!isRenaming) {
                            onSelect(conversation.id);
                          }
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (selectMode) {
                              toggleSelected(conversation.id);
                            } else if (!isRenaming) {
                              onSelect(conversation.id);
                            }
                          }
                        }}
                        onMouseEnter={() => setHoveredId(conversation.id)}
                        onMouseLeave={() =>
                          setHoveredId(current =>
                            current === conversation.id ? null : current,
                          )
                        }
                        // wzConvoRow (chat-page.scss) supplies a reduced-motion-safe transition timing
                        // for the background/border-color changes below — the colors themselves stay
                        // driven by this row's own hover/selected state, unchanged.
                        className='wzConvoRow'
                        style={{
                          cursor: selectMode ? 'default' : 'pointer',
                          padding: '8px',
                          // "Soft-tinted pill on the active row" (design language, "Navigation"): a
                          // filled, well-rounded highlight rather than the old left-border indicator —
                          // font-weight 600 plus `aria-current` above are what carry the
                          // non-color-reliant signal now.
                          borderRadius: 8,
                          background:
                            !selectMode && isSelected
                              ? 'var(--wz-accent-soft)'
                              : isHovered
                              ? 'var(--wz-accent-hover)'
                              : 'transparent',
                        }}
                      >
                        <EuiFlexGroup
                          responsive={false}
                          alignItems='center'
                          gutterSize='xs'
                        >
                          {selectMode && (
                            <EuiFlexItem
                              grow={false}
                              // The row's own onClick above ALSO toggles selection in select mode
                              // (so clicking anywhere on the row works, not only the checkbox
                              // itself) -- without stopping propagation here, a click on the
                              // checkbox would bubble into that same handler and toggle twice,
                              // net effect: nothing changes.
                              onClick={event => event.stopPropagation()}
                            >
                              <EuiCheckbox
                                id={`wzConvoSelect-${conversation.id}`}
                                checked={isChecked}
                                onChange={() =>
                                  toggleSelected(conversation.id)
                                }
                                label=''
                                aria-label={i18n.translate(
                                  'wazuhAiAssistant.chat.conversations.selectMode.selectRow',
                                  {
                                    defaultMessage: 'Select "{title}"',
                                    values: { title: conversation.title },
                                  },
                                )}
                              />
                            </EuiFlexItem>
                          )}
                          <EuiFlexItem grow style={{ minWidth: 0 }}>
                            {isRenaming ? (
                              <EuiFieldText
                                compressed
                                autoFocus
                                value={renameValue}
                                aria-label={i18n.translate(
                                  'wazuhAiAssistant.chat.conversations.renameInputLabel',
                                  { defaultMessage: 'Conversation title' },
                                )}
                                onClick={event => event.stopPropagation()}
                                onChange={event =>
                                  setRenameValue(event.target.value)
                                }
                                onKeyDown={event => {
                                  // Never let Enter/Escape/Space bubble to the row's own
                                  // onKeyDown above (Space would otherwise re-trigger onSelect).
                                  event.stopPropagation();
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    commitRename();
                                  } else if (event.key === 'Escape') {
                                    event.preventDefault();
                                    cancelRename();
                                  }
                                }}
                              />
                            ) : (
                              <EuiText
                                size='s'
                                style={{
                                  ...truncateTextStyle,
                                  fontWeight: isSelected ? 600 : undefined,
                                }}
                                title={conversation.title}
                              >
                                {conversation.title}
                              </EuiText>
                            )}
                          </EuiFlexItem>
                          {!selectMode && !isRenaming && (
                            <>
                              {/* The relative timestamp moves onto the row's own line (design gap "a
                                whole line spent on a relative timestamp") — `flexShrink: 0` and
                                `whiteSpace: 'nowrap'` keep it from ever wrapping under the truncated
                                title beside it. */}
                              <EuiFlexItem grow={false}>
                                <EuiText
                                  size='xs'
                                  color='subdued'
                                  style={{
                                    fontVariantNumeric: 'tabular-nums',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {formatRelativeTime(conversation.updatedAt)}
                                </EuiText>
                              </EuiFlexItem>
                              {onRename && (
                                <EuiFlexItem
                                  grow={false}
                                  // Same WCAG 1.4.11 reasoning as the trash icon below: 0 at rest,
                                  // 1 on hover, selection, OR keyboard focus.
                                  style={{
                                    opacity: isHovered || isSelected ? 1 : 0,
                                  }}
                                >
                                  <EuiButtonIcon
                                    iconType='pencil'
                                    aria-label={i18n.translate(
                                      'wazuhAiAssistant.chat.conversations.rename',
                                      { defaultMessage: 'Rename conversation' },
                                    )}
                                    onClick={(event: React.MouseEvent) =>
                                      startRename(event, conversation)
                                    }
                                    onFocus={() =>
                                      setHoveredId(conversation.id)
                                    }
                                    onBlur={() =>
                                      setHoveredId(current =>
                                        current === conversation.id
                                          ? null
                                          : current,
                                      )
                                    }
                                  />
                                </EuiFlexItem>
                              )}
                              <EuiFlexItem
                                grow={false}
                                // 0 at rest (never a mid-opacity resting state that fails WCAG 1.4.11's
                                // 3:1 contrast requirement for a control) — 1 on hover, selection, OR
                                // keyboard focus, so a keyboard/switch user can find and reach this
                                // control too.
                                style={{ opacity: isHovered || isSelected ? 1 : 0 }}
                              >
                                <EuiButtonIcon
                                  iconType='trash'
                                  color='danger'
                                  aria-label={i18n.translate(
                                    'wazuhAiAssistant.chat.conversations.delete',
                                    {
                                      defaultMessage: 'Delete conversation',
                                    },
                                  )}
                                  onClick={(event: React.MouseEvent) =>
                                    requestDelete(event, conversation)
                                  }
                                  onFocus={() => setHoveredId(conversation.id)}
                                  onBlur={() =>
                                    setHoveredId(current =>
                                      current === conversation.id
                                        ? null
                                        : current,
                                    )
                                  }
                                />
                              </EuiFlexItem>
                            </>
                          )}
                        </EuiFlexGroup>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </React.Fragment>
          ))
        )}
      </div>

      {displayMode === 'expanded' && (
        <>
          <EuiSpacer size='s' />
          <EuiButtonEmpty
            iconType='arrowLeft'
            size='s'
            flush='left'
            className='wzConvoRailCollapseControl'
            onClick={() => onCollapse?.()}
          >
            {i18n.translate('wazuhAiAssistant.chat.conversations.collapse', {
              defaultMessage: 'Collapse',
            })}
          </EuiButtonEmpty>
        </>
      )}

      {deleteModal}
      {bulkDeleteModal}
    </>
  );
};
