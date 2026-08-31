import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ConversationSummary } from '../../../common/types';
import './conversation-list.scss';

/** How the page grid is presenting the rail — chat-page.tsx measures the
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
  /** Inline rename. Optional, like `onCollapse`/`onExpand` below: a caller that hasn't wired
   * renaming yet simply never sees the pencil affordance rendered at all (see the row rendering
   * below), rather than throwing on a missing handler. */
  onRename?: (id: string, title: string) => void;
  /** Bulk delete: called once with every selected conversation id after
   * the "Delete N conversations?" confirm modal is accepted. Same optionality reasoning as
   * `onRename` above — no handler means no "Select conversations" entry point is rendered. The
   * caller decides how to apply it (sequential awaits, `Promise.allSettled`, a bulk endpoint...);
   * this component's own job ends at handing over the id list. */
  onBulkDelete?: (ids: string[]) => void;
  /**
   * How the page grid is presenting the rail. Optional, defaulting to
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
 * renderings the surrounding page grid can ask for. Purely presentational —
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

  // The rail's own scroll container (below) doubles as a focus target after a delete/bulk-delete
  // closes its confirm modal: EUI's modal otherwise tries to return focus to the row/button
  // that opened it, which the delete just removed, silently dropping focus to `<body>`.
  // `tabIndex={-1}` (set on the element below) makes a plain `<div>` programmatically focusable
  // without adding it to the Tab order.
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Per-row "Conversation actions" trigger buttons, keyed by conversation id -- lets the Escape
  // handler below explicitly return focus to the trigger it came from once its menu closes.
  // A plain Map is enough since at most one row's menu (and therefore trigger-to-refocus) is ever
  // relevant at a time.
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());

  // Separate from `hoveredId` (WCAG 2.4.11): the row's OWN `onMouseEnter`/`onMouseLeave` also
  // drive `hoveredId`, so revealing the pencil/trash icons on `hoveredId` alone would mean a
  // keyboard user who tabs to row A's pencil (revealing it via that button's own `onFocus`
  // setting `hoveredId`), then merely moves the MOUSE over row B, would see row A's pencil
  // collapse out from under their still-live focus ring the instant `onMouseEnter` overwrote
  // `hoveredId` with row B's id. `focusedId` tracks keyboard/programmatic focus independently, so
  // a focused control's reveal survives the pointer wandering elsewhere; each icon reveals on
  // `isHovered || isFocused`.
  const [focusedId, setFocusedId] = useState<string | null>(null);

  /**
   * Which row's overflow ("kebab") menu is open, if any — at most one at a time, since opening a
   * second row's menu closes the first.
   *
   * The row's per-row actions are ONE trigger opening this menu, rather than two always-mounted
   * icon buttons (a rename pencil and a delete trash) revealed together on hover: the row keeps a
   * single quiet affordance however many actions it grows, and a third action costs a menu entry
   * rather than another icon competing with the title for the same few pixels.
   *
   * This id also has to participate in the row's REVEAL condition. The trigger is hidden at rest
   * and shown on hover/focus, so a menu left open while the pointer wanders off its row would
   * otherwise have its own trigger fade out from under it.
   */
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Inline rename: which row (if any) currently shows an input instead of its title text, and
  // that input's own in-progress value. Only one row can be renaming at a time.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Mirrors `renamingId` but updated SYNCHRONOUSLY (state updates are not) -- see `commitRename`'s
  // doc comment below for why the commit-on-blur behavior needs this to avoid double-committing.
  const renamingIdRef = useRef<string | null>(null);
  // A mousedown on the row body while renaming blurs the input FIRST -- committing, via
  // `onBlur={commitRename}` below -- and only THEN does the click itself fire (the browser's
  // default mousedown action moves focus, hence blur, before mouseup/click). By that point
  // `renamingIdRef.current` has ALREADY been cleared by the commit, so checking it in the row's
  // own onClick (below) is not enough on its own -- the click would still read "not renaming" and
  // fire `onSelect`, navigating away in the same gesture that just committed the rename. This ref
  // is what `commitRename`'s `onBlur` case (specifically -- NOT its Enter/keyboard case, which
  // has no click to race) stamps with the id whose blur-triggered commit a click might be about
  // to follow; the row's onClick (below) consumes and clears it to suppress exactly that one
  // click, and a queued microtask clears it on its own if no click ever claims it (e.g. the user
  // tabbed away instead of clicking), so it can never linger and wrongly swallow some LATER,
  // unrelated click on the same row.
  const justCommittedViaBlurIdRef = useRef<string | null>(null);

  // Bulk delete: an explicit select mode a "Select conversations" button enters/exits — rows
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

  // A rename in progress belongs to ONE specific conversation id -- switching to a different
  // conversation (the row's own onSelect already fired) leaves it pointed at a row that is no
  // longer the point of focus, so clear it rather than let a stale edit linger off-screen.
  useEffect(() => {
    renamingIdRef.current = null;
    setRenamingId(null);
  }, [activeConversationId]);

  // Prune `selectedIds` whenever the caller's own `conversations` list changes -- a refresh
  // after a delete elsewhere (another tab, the single-delete flow) can drop an id this rail still
  // had checked; keeping it selected would let a later "Delete (N)" confirm try to delete an id
  // that no longer exists. A no-op (same `Set` reference returned) when nothing needs pruning, so
  // this never triggers an extra render on every ordinary list refresh.
  useEffect(() => {
    setSelectedIds(current => {
      if (current.size === 0) {
        return current;
      }
      const validIds = new Set(conversations.map(c => c.id));
      const next = new Set<string>();
      let changed = false;
      current.forEach(id => {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [conversations]);

  // `new Date(Date.now())`, not a bare `new Date()`: the latter is NOT guaranteed to consult a
  // mocked `Date.now` (engines implement the no-arg constructor as its own native "current time"
  // read, independent of the `Date.now` static property), which would make the TODAY/YESTERDAY
  // boundary untestable the same way `formatRelativeTime` above already relies on `Date.now()`
  // being mockable.
  const groups = useMemo(
    () => groupByDate(filteredConversations, new Date(Date.now())),
    [filteredConversations],
  );

  // After a delete/bulk-delete closes its confirm modal, park focus on the rail's own scroll
  // container rather than let it fall through to `<body>` -- EUI's modal tries to restore focus to
  // whatever opened it (the trash icon / "Delete (N)" button), which the action just deleted along
  // with its row. Deferred one frame: EUI's own focus-restoration runs as part of the SAME
  // dismissal, and would otherwise win a synchronous race against this.
  //
  // Same fallback chat-page.tsx's own dock-animation effect uses for a missing
  // `requestAnimationFrame` -- without it, an environment lacking rAF would simply never run the
  // callback at all, silently dropping focus after the delete instead of just doing it a frame
  // late.
  /**
   * Runs `action` one frame later — the shared primitive for the two places that must let one of
   * EUI's own focus handoffs finish before starting another (`focusRailContainer` just below, and
   * `requestDelete`).
   *
   * Falls back to running `action` immediately where `requestAnimationFrame` does not exist,
   * rather than never running it at all. A frame late is a cosmetic problem; never is a lost focus.
   */
  const deferOneFrame = (action: () => void) => {
    if (typeof window.requestAnimationFrame !== 'function') {
      action();
      return;
    }
    window.requestAnimationFrame(action);
  };

  const focusRailContainer = () => {
    deferOneFrame(() => scrollContainerRef.current?.focus());
  };

  const requestDelete = (
    event: React.MouseEvent,
    conversation: ConversationSummary,
  ) => {
    // Never let the row's own onClick (resume) fire alongside the action's own click. Synchronous,
    // because propagation cannot be stopped a frame late.
    event.stopPropagation();
    // The modal opens one frame later, deliberately. This is reached from inside the row's overflow
    // menu, and `EuiPopover ownFocus` owns a focus trap that is still unwinding as the menu closes.
    // Mounting the modal's own trap in the SAME frame would leave two competing: the popover's
    // teardown pulls focus back into its own closing panel, and `focusRailContainer` (after the
    // delete is confirmed) then has nothing left to hand the rail — focus falls through to
    // `<body>`, the same defect the single-delete flow above avoids by deferring. One frame lets
    // the menu finish closing so only one trap is ever live, which also restores the modal's own
    // return target to the trigger that opened it.
    deferOneFrame(() => setDeleteTarget(conversation));
  };

  // --- Per-row overflow menu ---------------------------------------------------------------------

  const closeRowMenu = () => setMenuOpenId(null);

  /** Toggles one row's menu. `stopPropagation` is what keeps the row's own onClick (resume the
   * conversation) from firing in the same gesture — the trigger sits inside the row's hit area, so
   * without it, opening the menu would also navigate away from underneath it. */
  const toggleRowMenu = (
    event: React.MouseEvent,
    conversation: ConversationSummary,
  ) => {
    event.stopPropagation();
    setMenuOpenId(current =>
      current === conversation.id ? null : conversation.id,
    );
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
    focusRailContainer();
  };

  // --- Inline rename ----------------------------------------------------------------------------

  const clearRename = () => {
    renamingIdRef.current = null;
    setRenamingId(null);
  };

  const startRename = (
    event: React.MouseEvent,
    conversation: ConversationSummary,
  ) => {
    // Same reason as `requestDelete`'s stopPropagation: never let the row's own onClick (resume)
    // fire alongside the action's own click.
    event.stopPropagation();
    renamingIdRef.current = conversation.id;
    setRenamingId(conversation.id);
    setRenameValue(conversation.title);
  };

  /**
   * Commits via `renamingIdRef` (NOT the `renamingId` state variable) so this can be called from
   * BOTH Enter and `onBlur` (commit-on-blur, the mainstream inline-rename convention) without
   * double-committing. Enter clears the ref synchronously before the resulting re-render unmounts
   * the input; when a browser removes a focused element from the DOM it also fires a `blur` event
   * on it as part of that removal, and this function running a second time off THAT blur -- with
   * the ref already cleared -- is a deliberate no-op rather than a second `onRename` call with a
   * stale closure's values. A "real" blur (the user clicked or tabbed away without pressing
   * Enter/Escape) still finds the ref pointing at this row and commits normally.
   */
  const commitRename = () => {
    const id = renamingIdRef.current;
    if (!id) {
      return;
    }
    const nextTitle = renameValue.trim();
    clearRename();
    // An empty (or whitespace-only) title commits nothing rather than saving a blank title — the
    // row simply reverts to showing its previous title, same as Escape would.
    if (nextTitle) {
      onRename?.(id, nextTitle);
    }
  };

  /**
   * The rename input's own `onBlur` (commit-on-blur) calls THIS, not `commitRename` directly --
   * it additionally stamps `justCommittedViaBlurIdRef` with the id whose commit this
   * blur just performed, so the row's own onClick (below), if a click follows this exact blur in
   * the same gesture, can suppress navigating away instead of also firing `onSelect` right after
   * the commit. Enter's own keydown handler calls `commitRename` directly instead of this
   * wrapper: an Enter keypress never has a click racing it, so it has nothing to suppress.
   * Cleared via a queued microtask if no click claims it within this same synchronous turn (a
   * "real" blur with nothing to suppress, e.g. Tab), so a stale flag can never wrongly swallow
   * some LATER, unrelated click on the same row.
   */
  const handleRenameBlur = () => {
    const id = renamingIdRef.current;
    commitRename();
    if (id) {
      justCommittedViaBlurIdRef.current = id;
      queueMicrotask(() => {
        if (justCommittedViaBlurIdRef.current === id) {
          justCommittedViaBlurIdRef.current = null;
        }
      });
    }
  };

  const cancelRename = () => {
    clearRename();
  };

  /**
   * One row's overflow-menu entries, as an ARRAY so adding a future action is one push rather than
   * another branch in the row's JSX (pin, duplicate, export…). Order is stable and the destructive
   * entry stays last.
   *
   * Each entry closes the menu FIRST and then runs the existing flow untouched — `startRename`
   * (inline editor) and `requestDelete` (confirm modal) are the very same functions the two icon
   * buttons called, so neither flow changed shape; only how it is reached did. Closing first also
   * means focus lands where the flow puts it (the rename input autofocuses, the confirm modal takes
   * focus) instead of being pulled back to the trigger by the popover's own focus return.
   *
   * `onRename` is optional on this component, so the Rename entry appears only when a handler was
   * supplied — the same condition that used to gate the pencil.
   */
  const rowMenuItems = (
    conversation: ConversationSummary,
  ): React.ReactElement[] => {
    const items: React.ReactElement[] = [];
    if (onRename) {
      items.push(
        <EuiContextMenuItem
          key='rename'
          icon='pencil'
          onClick={(event: React.MouseEvent) => {
            closeRowMenu();
            startRename(event, conversation);
          }}
        >
          {i18n.translate('wazuhAiAssistant.chat.conversations.rename', {
            defaultMessage: 'Rename conversation',
          })}
        </EuiContextMenuItem>,
      );
    }
    items.push(
      <EuiContextMenuItem
        key='delete'
        // The danger tone lives on BOTH the icon and the label (`wzConvoRowMenuDanger`,
        // conversation-list.scss): EuiContextMenuItem has no `color` prop, and colouring only the
        // icon would leave the one destructive entry reading like the others at a glance.
        icon={<EuiIcon type='trash' color='danger' />}
        className='wzConvoRowMenuDanger'
        onClick={(event: React.MouseEvent) => {
          closeRowMenu();
          requestDelete(event, conversation);
        }}
      >
        {i18n.translate('wazuhAiAssistant.chat.conversations.delete', {
          defaultMessage: 'Delete conversation',
        })}
      </EuiContextMenuItem>,
    );
    return items;
  };

  // --- Bulk delete / select mode ----------------------------------------------------------------

  const enterSelectMode = () => {
    // A rename in progress and select mode are mutually exclusive UI states (the row's rename
    // affordance is hidden while selectMode is true anyway) -- clear rather than leave it dangling.
    clearRename();
    // Same reasoning for an open overflow menu: select mode stops rendering the trigger this menu
    // is anchored to, so leaving it "open" would strand a panel with no anchor.
    closeRowMenu();
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
    focusRailContainer();
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
    // A 48px icon-only strip: no room here for a title, a search field, or
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
    // `display: 'contents'`: purely an event-listener wrapper (Escape exits select mode
    // from anywhere in the rail, not only from a row) with zero layout/visual effect -- the
    // element renders no box of its own, so it cannot be what "byte-identical row layout at rest"
    // is checked against; every child below lays out exactly as if this wrapper were the
    // Fragment it replaces.
    <div
      style={{ display: 'contents' }}
      onKeyDown={event => {
        if (event.key === 'Escape' && selectMode) {
          exitSelectMode();
        }
      }}
    >
      {showHeader && (
        <>
          <div className='wzConvoRailHeader'>
            {/* Select-mode entry point lives HERE, right-aligned against the "Conversations"
              label, not in the search row below: the search row goes
              back to a bare, upstream-shaped field with nothing beside it. This outer group is a
              direct child of `.wzConvoRailHeader` -- a plain block div, not a flex container --
              so it never inherits `.wzConvoRail`'s column-flex grow bug the way the search row
              itself did; `wzConvoRailSearchRow` is still applied defensively in case that wrapper
              div is ever flattened away. */}
            <EuiFlexGroup
              responsive={false}
              alignItems='center'
              justifyContent='spaceBetween'
              gutterSize='none'
              className='wzConvoRailSearchRow'
            >
              <EuiFlexItem grow={false}>
                <EuiFlexGroup
                  responsive={false}
                  alignItems='center'
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
              </EuiFlexItem>
              {/* Hidden once select mode is entered: the toolbar that replaces the search row
                below already carries its own "Cancel selection" control, so a second entry point
                here would be redundant (and, mid-selection, ambiguous). */}
              {onBulkDelete && conversations.length > 0 && !selectMode && (
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
        // Bulk-delete toolbar: replaces the search field row for the duration of select
        // mode — searching and bulk-selecting at once is out of scope, and this keeps the row's
        // layout footprint identical to the search row it stands in for.
        //
        // Compact ONE-ROW toolbar: `wrap` would let the
        // count/cancel/delete controls stack into a sparse 3-line column at 260-288px instead of
        // fitting on one line -- the opposite of what a "dense rail" redesign wants. The count
        // text truncates instead of pushing the buttons off (`minWidth: 0` + ellipsis, same
        // pattern the row titles already use), "Cancel selection" is an icon button (a `cross`,
        // same convention as the collapsed-rail affordances above) rather than a full-sentence
        // EuiButtonEmpty so its own translated string can never be the thing that overflows, and
        // Delete keeps its short `Delete ({count})` label, which already fits both locales at
        // both known toolbar widths (260px inline rail / ~288px docked popover).
        <EuiFlexGroup
          responsive={false}
          alignItems='center'
          gutterSize='s'
          className='wzConvoRailSearchRow'
        >
          <EuiFlexItem grow style={{ minWidth: 0 }}>
            <EuiText size='xs' color='subdued' style={truncateTextStyle}>
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
            <EuiToolTip
              content={i18n.translate(
                'wazuhAiAssistant.chat.conversations.selectMode.cancel',
                { defaultMessage: 'Cancel selection' },
              )}
            >
              <EuiButtonIcon
                iconType='cross'
                size='xs'
                aria-label={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.selectMode.cancel',
                  { defaultMessage: 'Cancel selection' },
                )}
                onClick={exitSelectMode}
              />
            </EuiToolTip>
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
      ) : showHeader ? (
        // Bare, full-width field -- exactly upstream's own structure: the select-mode entry point
        // lives in the header above, so this row no longer needs to
        // wrap the field in a flex group to make room for that icon beside it. A plain direct
        // child of `.wzConvoRail`, same as `EuiButton`/`EuiSpacer` elsewhere in this render, never
        // an `EuiFlexGroup` (which is exactly what needed the `wzConvoRailSearchRow` flex-grow
        // override in the first place -- so that class stays OFF this row now).
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
          onChange={event => {
            setSearchTerm(event.target.value);
            // A rename in progress belongs to a specific row that a new search term may
            // filter out of view entirely -- clear it rather than leave an edit open on a row
            // the user can no longer see. (select mode has no search field to begin with --
            // see the toolbar's own comment above -- so there is no equivalent case there.)
            clearRename();
          }}
          fullWidth
          compressed
          isClearable
        />
      ) : (
        // `showHeader === false` (the docked popover, assistant-chat-panel.tsx): that surface
        // never renders `.wzConvoRailHeader`, so the select-mode entry point has no header to
        // live in. This popover is a PRIMARY surface for the rail, entitled to the SAME
        // bulk-delete affordance as the inline rail -- dropping the icon here entirely (to match
        // the bare-field row above) would silently regress that, so this keeps the wrapped layout
        // (field + inline icon) as the fallback placement for this one context.
        <EuiFlexGroup
          responsive={false}
          alignItems='center'
          gutterSize='xs'
          className='wzConvoRailSearchRow'
        >
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
              onChange={event => {
                setSearchTerm(event.target.value);
                clearRename();
              }}
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
          scrollbar around the search field that never needed one. `tabIndex={-1}` + the ref
          make this a valid focus TARGET (after a delete/bulk-delete closes its confirm modal)
          without adding it to the Tab order itself. */}
      <div className='wzConvoRailScroll' ref={scrollContainerRef} tabIndex={-1}>
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
              {/* `role='heading'`/`aria-level`: a screen reader should announce "Today" the
                  same way it announces the panel's own "Conversations" title (a REAL `<h3>` above)
                  -- one level down, since this heads a sub-section of that title, not a sibling of
                  it -- rather than as an unstructured run of text before the list that follows it.
                  Zero visual change: still the same `<div>` + `wzConvoRailGroupHeader` class: only
                  an ARIA role/level is added, nothing about markup tag or styling. */}
              <div
                className='wzConvoRailGroupHeader'
                role='heading'
                aria-level={4}
              >
                {group.label}
              </div>
              {/* Real list markup: each date group is its own native `<ul>` of `<li>`
                  rows, so a screen reader announces "list, N items" the way EUI's own
                  `EuiListGroup` does — rather than as plain `<div>`s, which read as an
                  undifferentiated run of generic elements. `.wzConvoRailGroupList`/
                  `.wzConvoRailListItem` (conversation-list.scss) reset the browser's default
                  list marker/indent so this is a markup-only change with no visual effect.
                  No `aria-label` here: the `role='heading'` div right above already
                  announces this group's name -- an `aria-label` repeating the SAME text on the
                  list itself would make a screen reader announce "Today" twice back to back. */}
              <ul className='wzConvoRailGroupList'>
                {group.items.map(conversation => {
                  const isSelected = conversation.id === activeConversationId;
                  const isHovered = conversation.id === hoveredId;
                  const isFocused = conversation.id === focusedId;
                  const isMenuOpen = conversation.id === menuOpenId;
                  const isRenaming = conversation.id === renamingId;
                  const isChecked = selectedIds.has(conversation.id);
                  return (
                    <li key={conversation.id} className='wzConvoRailListItem'>
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
                          // A click that immediately follows this exact row's blur-triggered
                          // commit (see `handleRenameBlur`'s own doc comment) is suppressed here,
                          // once, rather than also firing `onSelect` and navigating away in the
                          // same gesture that just committed the rename.
                          if (
                            justCommittedViaBlurIdRef.current ===
                            conversation.id
                          ) {
                            justCommittedViaBlurIdRef.current = null;
                            return;
                          }
                          // Reads the synchronous `renamingIdRef`, NOT the `isRenaming`
                          // state-derived flag above, for the same reason: by the time a click
                          // dispatches, a blur that already ran has already cleared this ref
                          // (and re-rendered, flipping `isRenaming` too) — either way, "not
                          // renaming any more" is the correct read for a click that ISN'T the one
                          // suppressed above.
                          if (renamingIdRef.current !== conversation.id) {
                            onSelect(conversation.id);
                          }
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (selectMode) {
                              toggleSelected(conversation.id);
                            } else if (
                              renamingIdRef.current !== conversation.id
                            ) {
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
                          position: 'relative',
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
                                onChange={() => toggleSelected(conversation.id)}
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
                                // Commit on blur (clicking/tabbing away), the mainstream
                                // inline-rename convention — `handleRenameBlur` (not
                                // `commitRename` directly) both commits (safe to ALSO run
                                // after an Enter-triggered unmount's own synthetic blur, without
                                // double-committing — see `commitRename`'s own doc comment) AND
                                // arms the one-click navigation suppression a mousedown-triggered
                                // blur needs — see that function's own doc comment.
                                onBlur={handleRenameBlur}
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
                              <EuiFlexItem
                                grow={false}
                                // 0 at rest (never a mid-opacity resting state that fails WCAG 1.4.11's
                                // 3:1 contrast requirement for a control) — 1 on hover, selection, OR
                                // keyboard focus (`isFocused`, not `isHovered`, is what survives
                                // the pointer moving to a different row), so a keyboard/switch user
                                // can find and reach this control too. `isMenuOpen` is in there for
                                // the pointer leaving the row while this row's own menu is open: the
                                // trigger fading out from under an open menu it anchors would be
                                // both jarring and a lost focus target when that menu closes.
                                style={{
                                  opacity:
                                    isHovered ||
                                    isSelected ||
                                    isFocused ||
                                    isMenuOpen
                                      ? 1
                                      : 0,
                                }}
                                // Guards every control this wrapper anchors -- the trigger AND,
                                // once open, the Rename/Delete menu items -- from the ROW's own
                                // `onKeyDown` further below. `EuiPopover` renders its panel through
                                // a React portal, so those menu items live elsewhere in the real
                                // DOM, but React still bubbles their events through this component
                                // tree, not the portal's -- the row would otherwise see their
                                // Enter/Space too and `preventDefault()` the control's own native
                                // activation before it can fire, treating it as "resume this
                                // conversation" instead. Escape while this menu is open closes the
                                // MENU and stops there; guarded on `isMenuOpen` so a closed menu's
                                // row never swallows an Escape meant for an enclosing surface (the
                                // rail's own select-mode exit, a docked flyout) — closed, this
                                // handler does nothing at all beyond the Enter/Space guard.
                                onKeyDown={(event: React.KeyboardEvent) => {
                                  if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                  ) {
                                    event.stopPropagation();
                                    return;
                                  }
                                  if (event.key === 'Escape' && isMenuOpen) {
                                    event.stopPropagation();
                                    closeRowMenu();
                                    // `stopPropagation` above is what keeps this Escape from also
                                    // closing an enclosing popover (see the comment above), but it
                                    // has a side effect: it stops the native keydown before it ever
                                    // reaches `EuiPopover`'s own focus-trap library, which is what
                                    // normally returns focus to the trigger on close. Closing the
                                    // popover ourselves via `closeRowMenu()` above bypasses that
                                    // return-focus step entirely, so we do it ourselves -- deferred
                                    // one frame for the same reason `requestDelete` below defers its
                                    // modal: the trap isn't done unwinding on this tick yet.
                                    deferOneFrame(() =>
                                      triggerRefs.current
                                        .get(conversation.id)
                                        ?.focus(),
                                    );
                                  }
                                }}
                              >
                                <EuiPopover
                                  ownFocus
                                  panelPaddingSize='none'
                                  anchorPosition='leftUp'
                                  isOpen={isMenuOpen}
                                  closePopover={closeRowMenu}
                                  button={
                                    <EuiButtonIcon
                                      iconType='boxesHorizontal'
                                      color='text'
                                      aria-label={i18n.translate(
                                        'wazuhAiAssistant.chat.conversations.actionsMenu',
                                        {
                                          defaultMessage:
                                            'Conversation actions',
                                        },
                                      )}
                                      // `true`, not `'menu'`: `EuiContextMenuPanel` renders plain
                                      // buttons, not `role="menu"`/`role="menuitem"`, and naming a
                                      // role the DOM does not carry would send a screen reader
                                      // looking for menu semantics that are not there. EUI's own
                                      // examples use `true` for the same reason.
                                      aria-haspopup='true'
                                      aria-expanded={isMenuOpen}
                                      onClick={(event: React.MouseEvent) =>
                                        toggleRowMenu(event, conversation)
                                      }
                                      buttonRef={node =>
                                        triggerRefs.current.set(
                                          conversation.id,
                                          node,
                                        )
                                      }
                                      onFocus={() =>
                                        setFocusedId(conversation.id)
                                      }
                                      onBlur={() =>
                                        setFocusedId(current =>
                                          current === conversation.id
                                            ? null
                                            : current,
                                        )
                                      }
                                    />
                                  }
                                >
                                  {/* Rendered ONLY while open, deliberately — a narrow win, not a
                                    leak fix. `EuiPopover` does eventually unmount its own panel:
                                    it renders while `isOpen || isClosing` and clears `isClosing`
                                    on a 250ms `closingTransitionTimeout` (EUI's popover.js), so
                                    nothing accumulates. What this avoids is that 250ms window, in
                                    which the panel is still mounted with two focusable entries a
                                    keyboard user could tab into for a menu they just dismissed.
                                    Gating on `isMenuOpen` empties it in the same tick as the close
                                    instead. Re-mounting on each open also re-arms
                                    `EuiContextMenuPanel`'s initial focus/arrow-key state, which
                                    EUI otherwise resets only when that same timeout fires — so
                                    reopening a menu inside 250ms would find it un-armed. */}
                                  {isMenuOpen ? (
                                    <EuiContextMenuPanel
                                      items={rowMenuItems(conversation)}
                                    />
                                  ) : null}
                                </EuiPopover>
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
    </div>
  );
};
