import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationList } from './conversation-list';
import { ConversationSummary } from '../../../common/types';

function conversation(
  overrides: Partial<ConversationSummary> = {},
): ConversationSummary {
  return {
    id: 'c1',
    title: 'How many critical alerts today?',
    updatedAt: '2024-01-01T09:55:00.000Z',
    ...overrides,
  };
}

function noop() {}

describe('ConversationList', () => {
  it('shows the empty-state message when there are no conversations', () => {
    render(
      <ConversationList
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    expect(screen.getByText('No saved conversations yet.')).toBeInTheDocument();
  });

  it('renders one row per conversation, with its title and a relative updated-at time', () => {
    jest.spyOn(Date, 'now').mockReturnValue(
      Date.parse('2024-01-01T10:00:00.000Z'), // exactly 5 minutes after updatedAt
    );

    render(
      <ConversationList
        conversations={[conversation()]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    expect(
      screen.getByText('How many critical alerts today?'),
    ).toBeInTheDocument();
    // Compact stamp (design: `17h`, `Mon`) — the rail spends this on every row, and the long
    // form was eating the width the title needs.
    expect(screen.getByText('5m')).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it('shows a loading spinner only while isLoading is true', () => {
    const { container: loadingContainer } = render(
      <ConversationList
        conversations={[]}
        isLoading
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );
    expect(loadingContainer.querySelector('.euiLoadingSpinner')).not.toBeNull();

    const { container: idleContainer } = render(
      <ConversationList
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );
    expect(idleContainer.querySelector('.euiLoadingSpinner')).toBeNull();
  });

  it('calls onNewConversation when "New conversation" is clicked', () => {
    const onNewConversation = jest.fn();
    render(
      <ConversationList
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={onNewConversation}
        onDelete={noop}
      />,
    );

    fireEvent.click(screen.getByText('New conversation'));
    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with the conversation id when a row is clicked', () => {
    const onSelect = jest.fn();
    render(
      <ConversationList
        conversations={[conversation({ id: 'c42' })]}
        isLoading={false}
        activeConversationId={null}
        onSelect={onSelect}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    const row = screen
      .getByText('How many critical alerts today?')
      .closest('[role="button"]') as HTMLElement;
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith('c42');
  });

  it('calls onSelect on Enter/Space when a row has keyboard focus', () => {
    const onSelect = jest.fn();
    render(
      <ConversationList
        conversations={[conversation({ id: 'c42' })]}
        isLoading={false}
        activeConversationId={null}
        onSelect={onSelect}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    const row = screen
      .getByText('How many critical alerts today?')
      .closest('[role="button"]') as HTMLElement;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('c42');

    fireEvent.keyDown(row, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('renders the active conversation title bold, unlike the others', () => {
    render(
      <ConversationList
        conversations={[
          conversation({ id: 'active', title: 'Active one' }),
          conversation({ id: 'other', title: 'Other one' }),
        ]}
        isLoading={false}
        activeConversationId='active'
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    expect(screen.getByText('Active one').style.fontWeight).toBe('600');
    expect(screen.getByText('Other one').style.fontWeight).toBe('');
  });

  describe('search filters the rail (client-side, over the conversations already loaded)', () => {
    it('shows only conversations whose title matches the search term, case-insensitively', () => {
      render(
        <ConversationList
          conversations={[
            conversation({ id: 'c1', title: 'Critical findings today' }),
            conversation({ id: 'c2', title: 'Disconnected agents' }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search conversations'), {
        target: { value: 'critical' },
      });

      expect(screen.getByText('Critical findings today')).toBeInTheDocument();
      expect(screen.queryByText('Disconnected agents')).toBeNull();
    });

    it('shows a distinct "no matches" message, not the "no conversations at all" one, when a search matches nothing', () => {
      render(
        <ConversationList
          conversations={[conversation({ title: 'Critical findings today' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search conversations'), {
        target: { value: 'nothing matches this' },
      });

      expect(
        screen.getByText('No conversations match your search.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('No saved conversations yet.')).toBeNull();
    });

    it('restores every conversation once the search term is cleared', () => {
      render(
        <ConversationList
          conversations={[
            conversation({ id: 'c1', title: 'Critical findings today' }),
            conversation({ id: 'c2', title: 'Disconnected agents' }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const searchField = screen.getByPlaceholderText('Search conversations');
      fireEvent.change(searchField, { target: { value: 'critical' } });
      expect(screen.queryByText('Disconnected agents')).toBeNull();

      fireEvent.change(searchField, { target: { value: '' } });
      expect(screen.getByText('Disconnected agents')).toBeInTheDocument();
    });

    it("renders the search field as a bare, full-width control with no wrapping flex group (#9010 review decision: the select-mode entry point moved into the header, so this row goes back to upstream's own bare shape)", () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      const searchField = screen.getByPlaceholderText('Search conversations');
      expect(searchField.closest('.euiFlexGroup')).toBeNull();
    });
  });

  describe('select-mode entry point lives in the rail header, not the search row (#9010 review decision)', () => {
    it('renders the "Select conversations" icon inside the header row, right-aligned against the "Conversations" label', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      const title = screen.getByText('Conversations');
      const icon = screen.getByRole('button', {
        name: 'Select conversations',
      });
      const headerRow = title.closest('.wzConvoRailHeader') as HTMLElement;
      expect(headerRow).not.toBeNull();
      expect(headerRow.contains(icon)).toBe(true);
      expect(
        screen
          .getByPlaceholderText('Search conversations')
          .closest('.wzConvoRailHeader'),
      ).toBeNull();

      // The OUTER flex row (label group + icon) is what carries the flex-grow guard class --
      // `title`'s nearest `.euiFlexGroup` ancestor is actually the INNER title+spinner
      // sub-group, one level down.
      const headerFlexRow = headerRow.querySelector(
        '.euiFlexGroup',
      ) as HTMLElement;
      expect(headerFlexRow).not.toBeNull();
      expect(headerFlexRow.className).toMatch(/wzConvoRailSearchRow/);
      expect(headerFlexRow.contains(icon)).toBe(true);
    });

    it('hides the header\'s select-mode icon once select mode is entered (the toolbar\'s own "Cancel selection" replaces it)', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Selectable' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );

      expect(
        screen.queryByRole('button', { name: 'Select conversations' }),
      ).toBeNull();
    });

    it('does not render the icon in the header when onBulkDelete is not supplied', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(
        screen.queryByRole('button', { name: 'Select conversations' }),
      ).toBeNull();
    });

    it('falls back to the old placement (search row, inline icon) when the header itself is not rendered (`showHeader={false}`, the docked popover -- m14/#9010 review: that surface is a PRIMARY rail surface entitled to the same bulk-delete affordance as the inline rail)', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
          showHeader={false}
          showNewConversationButton={false}
        />,
      );

      expect(screen.queryByText('Conversations')).toBeNull();
      const icon = screen.getByRole('button', {
        name: 'Select conversations',
      });
      const searchRow = screen
        .getByPlaceholderText('Search conversations')
        .closest('.euiFlexGroup') as HTMLElement;
      expect(searchRow).not.toBeNull();
      expect(searchRow.contains(icon)).toBe(true);
      expect(searchRow.className).toMatch(/wzConvoRailSearchRow/);
    });
  });

  describe('date grouping (TODAY / YESTERDAY boundary)', () => {
    // Pinned "now": 2024-01-02, 10:00 UTC. `jest.spyOn(Date, 'now')` is what conversation-list.tsx
    // reads via `new Date(Date.now())` for its bucketing "now" — see that call site's own comment
    // for why a bare `new Date()` would NOT be reliably mockable here. Bucketing is by LOCAL
    // calendar day (see `startOfLocalDay`), so this suite assumes a test runner clock at or near
    // UTC — true of this repo's documented Docker dev/test container (docker/osd-dev) — and every
    // instant below is chosen mid-day UTC specifically to stay clear of a local-midnight boundary
    // for any realistic runner timezone.
    const NOW_ISO = '2024-01-02T10:00:00.000Z';

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(Date.parse(NOW_ISO));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('buckets a conversation updated earlier the SAME calendar day under "Today"', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'Same-day one',
              updatedAt: '2024-01-02T01:00:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.queryByText('Yesterday')).toBeNull();
    });

    it('buckets a conversation updated moments before local midnight under "Yesterday", not "Today", even though under 24h separates them', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'Late last night',
              // 23:50 the calendar day before NOW_ISO — under 10 hours before "now", but a
              // different CALENDAR day, which is what must decide the bucket.
              updatedAt: '2024-01-01T23:50:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.queryByText('Today')).toBeNull();
    });

    it('splits Today and Yesterday conversations into two separate, correctly-labelled groups', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'From today',
              updatedAt: '2024-01-02T09:00:00.000Z',
            }),
            conversation({
              id: 'c2',
              title: 'From yesterday',
              updatedAt: '2024-01-01T09:00:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('From today')).toBeInTheDocument();
      expect(screen.getByText('From yesterday')).toBeInTheDocument();
    });

    it('buckets a conversation from 8+ days ago under a formatted date, not a weekday name', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'From last month',
              updatedAt: '2023-12-01T09:00:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('From last month')).toBeInTheDocument();
      expect(screen.queryByText('Today')).toBeNull();
      expect(screen.queryByText('Yesterday')).toBeNull();
      // Formatted month/day, not a bare weekday name like "Friday" — the >= 7-day-old branch.
      // Scoped to the GROUP HEADER: past a week the row's own compact stamp also falls back to a
      // month/day ("Dec 1"), so an unscoped match now finds both and cannot say which one it
      // checked. This test is about the bucket, so it reads the bucket.
      expect(
        document.querySelector('.wzConvoRailGroupHeader')?.textContent,
      ).toMatch(/Dec 1/);
    });
  });

  describe('displayMode', () => {
    it('defaults to the full expanded rail when displayMode is omitted', () => {
      render(
        <ConversationList
          conversations={[]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );
      expect(
        screen.getByPlaceholderText('Search conversations'),
      ).toBeInTheDocument();
    });

    it('renders a 48px icon-only strip in "collapsed" mode, with no search field or rows', () => {
      render(
        <ConversationList
          conversations={[conversation({ title: 'Should not render' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='collapsed'
        />,
      );

      expect(screen.queryByPlaceholderText('Search conversations')).toBeNull();
      expect(screen.queryByText('Should not render')).toBeNull();
      expect(
        screen.getByRole('button', { name: 'New conversation' }),
      ).toBeInTheDocument();
    });

    it("calls onExpand when the collapsed strip's search or expand icon is clicked", () => {
      const onExpand = jest.fn();
      render(
        <ConversationList
          conversations={[]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='collapsed'
          onExpand={onExpand}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Search conversations' }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Expand conversation list' }),
      );
      expect(onExpand).toHaveBeenCalledTimes(2);
    });

    it('calls onCollapse when the pinned "Collapse" control is clicked in expanded mode', () => {
      const onCollapse = jest.fn();
      render(
        <ConversationList
          conversations={[]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='expanded'
          onCollapse={onCollapse}
        />,
      );

      fireEvent.click(screen.getByText('Collapse'));
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('renders the same full list content in "flyout" mode as in "expanded", without mounting its own EuiFlyout', () => {
      const { container } = render(
        <ConversationList
          conversations={[conversation({ title: 'Flyout conversation' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='flyout'
        />,
      );

      expect(
        screen.getByPlaceholderText('Search conversations'),
      ).toBeInTheDocument();
      expect(screen.getByText('Flyout conversation')).toBeInTheDocument();
      expect(container.querySelector('.euiFlyout')).toBeNull();
      // The pinned "Collapse" control is an 'expanded'-only affordance — the wrapping page shell
      // owns closing a flyout (its own X button/overlay click), not this component.
      expect(screen.queryByText('Collapse')).toBeNull();
    });
  });

  describe('delete button visibility (WCAG 1.4.11)', () => {
    it('is invisible at rest (opacity 0, never a low-contrast in-between value)', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const deleteButton = screen.getByRole('button', {
        name: 'Delete conversation',
      });
      expect(
        (deleteButton.closest('[style]') as HTMLElement).style.opacity,
      ).toBe('0');
    });

    it('becomes visible on keyboard focus, not just mouse hover', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const deleteButton = screen.getByRole('button', {
        name: 'Delete conversation',
      });
      fireEvent.focus(deleteButton);
      expect(
        (deleteButton.closest('[style]') as HTMLElement).style.opacity,
      ).toBe('1');

      fireEvent.blur(deleteButton);
      expect(
        (deleteButton.closest('[style]') as HTMLElement).style.opacity,
      ).toBe('0');
    });
  });

  describe('delete flow', () => {
    it('clicking the trash icon opens a confirm modal without triggering onSelect', () => {
      const onSelect = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={onSelect}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );

      expect(onSelect).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          'This will permanently delete the conversation "Delete me". This action cannot be undone.',
        ),
      ).toBeInTheDocument();
    });

    it('Cancel closes the modal without calling onDelete', () => {
      const onDelete = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={onDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByText(/permanently delete/)).toBeNull();
    });

    it('confirming the modal calls onDelete with the conversation id and closes the modal', () => {
      const onDelete = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={onDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onDelete).toHaveBeenCalledWith('c1');
      expect(screen.queryByText(/permanently delete/)).toBeNull();
    });

    it('m12/F-4: focus lands on the rail scroll container after a confirmed delete, not lost to <body>', async () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(document.activeElement).toHaveClass('wzConvoRailScroll');
      });
    });
  });

  describe('list semantics (WCAG/AT: a real list, not a run of generic divs) — E5', () => {
    it('renders each date group as a native <ul>/<li> list', () => {
      const { container } = render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Row one' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const list = container.querySelector('ul.wzConvoRailGroupList');
      expect(list).not.toBeNull();
      expect(list?.querySelector('li.wzConvoRailListItem')).not.toBeNull();
      expect(screen.getByText('Row one').closest('li')).not.toBeNull();
    });
  });

  describe('inline rename (E2)', () => {
    it('does not render a rename affordance when onRename is not supplied', () => {
      render(
        <ConversationList
          conversations={[conversation({ title: 'No rename here' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(
        screen.queryByRole('button', { name: 'Rename conversation' }),
      ).toBeNull();
    });

    it('M3 REGRESSION: at rest, the pencil sits OUTSIDE the row flex group -- the row is byte-identical to upstream/5.0.0', () => {
      // Screenshot-equivalent DOM check: rather than a real layout engine (jsdom has none), this
      // asserts the actual STRUCTURE the M3 fix relies on. The pencil used to be a zero-width
      // EuiFlexItem inside the row's `gutterSize='xs'` EuiFlexGroup -- but EUI gutters are margins
      // on every flex item, so even a collapsed one still cost the row a few px of dead gutter at
      // rest, on top of the reflow it caused. The fix takes it out of the flex flow entirely and
      // renders it as an absolutely-positioned overlay anchored to the row, so the row's OWN flex
      // group is left with exactly the three items upstream/5.0.0's own row markup has --
      // [title][timestamp][trash], nothing else -- proving the at-rest row is structurally
      // identical to upstream, not just "close" to it.
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Rename me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );

      const row = screen.getByText('Rename me').closest('.wzConvoRow');
      const flexGroup = row?.querySelector(':scope > .euiFlexGroup');
      expect(flexGroup).not.toBeNull();
      // Exactly [title][timestamp][trash] -- no pencil item, no extra gutter contributor.
      expect(flexGroup?.children).toHaveLength(3);

      const pencil = screen.getByRole('button', {
        name: 'Rename conversation',
      });
      // The pencil is a DESCENDANT of the row (still reachable/focusable), but not of its flex
      // group -- it renders as the row's own absolutely-positioned sibling overlay instead.
      expect(row?.contains(pencil)).toBe(true);
      expect(flexGroup?.contains(pencil)).toBe(false);

      const overlay = pencil.closest('.wzConvoRowRenameOverlay') as HTMLElement;
      expect(overlay).not.toBeNull();
      expect(overlay.style.opacity).toBe('0');
      expect(overlay.style.pointerEvents).toBe('none');

      fireEvent.mouseEnter(row as HTMLElement);

      expect(overlay.style.opacity).toBe('1');
      expect(overlay.style.pointerEvents).toBe('auto');
      // Hovering never adds/removes a flex item either -- no title reflow on hover.
      expect(flexGroup?.children).toHaveLength(3);
    });

    // #9018 review (Ian, screenshot): "The edit button is located above some text, which makes it
    // hard to see." The pencil overlay's background was `--wz-accent-hover` -- a 6% tint, i.e. 94%
    // transparent -- so the text it sat on read straight through the icon. jsdom has no layout
    // engine and does not compile the SCSS, so what is assertable here is the STRUCTURE the fix
    // hangs off: the overlay still carries the class the opaque-pill rule targets, the timestamp
    // now carries the class that reserves the width the overlay sits over, and that reservation is
    // present at rest (a width that only appeared on hover would reflow the title on hover, which
    // is exactly what the M3 overlay exists to avoid). The rendered colors themselves are a visual
    // check -- see the PR's evidence pass.
    it('#9018: the rename overlay and the width it reserves are both wired at rest', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Rename me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );

      const row = screen.getByText('Rename me').closest('.wzConvoRow');
      const pencil = screen.getByRole('button', {
        name: 'Rename conversation',
      });
      // The opaque-pill rule (conversation-list.scss) is keyed on this class, and it is on the
      // overlay unconditionally -- so it applies to BOTH reveal paths this branch ships, pointer
      // hover and keyboard focus, not only to hover.
      expect(pencil.closest('.wzConvoRowRenameOverlay')).not.toBeNull();

      // The reserved timestamp slot: present before any hover, and inside the row's own flex group
      // (so it is real reserved layout, not another overlay).
      const flexGroup = row?.querySelector(':scope > .euiFlexGroup');
      const timestampSlot = flexGroup?.querySelector('.wzConvoRowTimestamp');
      expect(timestampSlot).not.toBeNull();

      // Hovering reveals the pencil without adding, removing or re-classing a single flex item --
      // the reservation is the same one it was at rest.
      fireEvent.mouseEnter(row as HTMLElement);
      expect(flexGroup?.children).toHaveLength(3);
      expect(flexGroup?.querySelectorAll('.wzConvoRowTimestamp')).toHaveLength(
        1,
      );
    });

    // #9018 review G1: the pill used to hardcode the hover tint, so it matched the row only while
    // hovered-and-unselected -- on a SELECTED row it under-painted a 10% tint at 6% and read as a
    // lighter patch. The row now PUBLISHES the background it paints and the pill re-paints that same
    // value over its own opaque ground, so the two match in every state by construction.
    //
    // Only the PUBLISHED value is asserted here. The painted one is not readable in this
    // environment: jsdom's `background` shorthand parser drops a `var()` value outright, so
    // `style.background` reports whatever last parsed rather than what React set -- asserting it
    // would test jsdom's CSS parser, not this component. That the two agree is structural (one
    // `const` feeds both), and the rendered colors are a visual check for the evidence pass.
    it('#9018: the row publishes the background it paints, in every state', () => {
      const { rerender } = render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Publish me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );

      const rowOf = () =>
        screen.getByText('Publish me').closest('.wzConvoRow') as HTMLElement;
      const publishedBg = (element: HTMLElement) =>
        element.style.getPropertyValue('--wz-convo-row-bg');

      // At rest: transparent, and published as such -- the pill then resolves to bare surface,
      // which is exactly what an unhighlighted row renders as over that same ground.
      const atRest = publishedBg(rowOf());
      expect(atRest).toBe('transparent');

      // Hovered: the hover tint, published.
      fireEvent.mouseEnter(rowOf());
      const hovered = publishedBg(rowOf());
      expect(hovered).toBe('var(--wz-accent-hover)');

      // SELECTED: the 10% tint the pill used to under-paint at 6%. This is the state G1 is about.
      rerender(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Publish me' })]}
          isLoading={false}
          activeConversationId='c1'
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );
      const selected = publishedBg(rowOf());
      expect(selected).toBe('var(--wz-accent-soft)');

      // Three states, three DIFFERENT published values -- so a pill following this property tracks
      // all of them, where the hardcoded tint could only ever match one.
      expect(new Set([atRest, hovered, selected]).size).toBe(3);
    });

    // #9018 review nit: the row's padding is the figure the overlay's geometry is derived from, so
    // it lives in the stylesheet as one SCSS constant rather than as an inline literal here.
    it('#9018: the row takes its padding from the stylesheet, not an inline literal', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Pad me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );

      const row = screen.getByText('Pad me').closest('.wzConvoRow');
      expect(row).toHaveClass('wzConvoRowLayout');
      expect((row as HTMLElement).style.padding).toBe('');
    });

    it('M3 REGRESSION: the pencil is NOT permanently shown on the active/selected row -- hover or focus only', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'active', title: 'Active one' })]}
          isLoading={false}
          activeConversationId='active'
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );

      const pencil = screen.getByRole('button', {
        name: 'Rename conversation',
      });
      const overlay = pencil.closest('.wzConvoRowRenameOverlay') as HTMLElement;
      // Selected but neither hovered nor focused -- must still be at rest, unlike the pre-fix
      // condition which also checked `isSelected`.
      expect(overlay.style.opacity).toBe('0');
      expect(overlay.style.pointerEvents).toBe('none');
    });

    it('clicking the pencil icon swaps the title for an input, without triggering onSelect', () => {
      const onSelect = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Rename me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={onSelect}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );

      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByText('Rename me')).toBeNull();
      const input = screen.getByLabelText(
        'Conversation title',
      ) as HTMLInputElement;
      expect(input.value).toBe('Rename me');
    });

    it('Enter commits the new title via onRename and closes the input', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      const input = screen.getByLabelText('Conversation title');
      fireEvent.change(input, { target: { value: 'New title' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onRename).toHaveBeenCalledWith('c1', 'New title');
      expect(screen.queryByLabelText('Conversation title')).toBeNull();
    });

    it('Escape cancels without calling onRename, restoring the original title', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      const input = screen.getByLabelText('Conversation title');
      fireEvent.change(input, { target: { value: 'Abandoned' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onRename).not.toHaveBeenCalled();
      expect(screen.getByText('Old title')).toBeInTheDocument();
    });

    it('an empty/whitespace-only title is not committed', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      const input = screen.getByLabelText('Conversation title');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onRename).not.toHaveBeenCalled();
    });

    it('m6: commits on blur (clicking/tabbing away), without needing Enter', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      const input = screen.getByLabelText('Conversation title');
      fireEvent.change(input, { target: { value: 'Blurred title' } });
      fireEvent.blur(input);

      expect(onRename).toHaveBeenCalledWith('c1', 'Blurred title');
      expect(onRename).toHaveBeenCalledTimes(1);
    });

    it('m6: Enter does not ALSO commit a second time via the unmount blur that follows it', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      const input = screen.getByLabelText('Conversation title');
      fireEvent.change(input, { target: { value: 'New title' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      // The input is unmounted now (isRenaming false) -- simulates the blur a real browser fires
      // when a focused element is removed from the DOM.
      fireEvent.blur(input);

      expect(onRename).toHaveBeenCalledTimes(1);
      expect(onRename).toHaveBeenCalledWith('c1', 'New title');
    });

    it('F-5 REGRESSION: clicking the row body while renaming commits the edit but does NOT also navigate', () => {
      // A real click on a different focusable element blurs the currently focused input FIRST
      // (native default action on mousedown), THEN dispatches its own click -- by the time the
      // row's onClick runs, the commit has already happened. Simulated explicitly here rather than
      // relying on jsdom to chain these on its own, the same way the "Enter" test above simulates
      // the unmount blur explicitly.
      const onRename = jest.fn();
      const onSelect = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={onSelect}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      const input = screen.getByLabelText('Conversation title');
      fireEvent.change(input, { target: { value: 'New title' } });
      const row = input.closest('[role="button"]') as HTMLElement;

      fireEvent.mouseDown(row);
      fireEvent.blur(input);
      fireEvent.click(row);

      expect(onRename).toHaveBeenCalledWith('c1', 'New title');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('m6: entering select mode clears a rename in progress', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      expect(screen.getByLabelText('Conversation title')).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );

      expect(screen.queryByLabelText('Conversation title')).toBeNull();
      expect(screen.getByText('Old title')).toBeInTheDocument();
    });

    it('m6: changing the search term clears a rename in progress', () => {
      const onRename = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      fireEvent.change(screen.getByPlaceholderText('Search conversations'), {
        target: { value: 'old' },
      });

      expect(screen.queryByLabelText('Conversation title')).toBeNull();
    });

    it('m6: switching the active conversation clears a rename in progress', () => {
      const onRename = jest.fn();
      const { rerender } = render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Rename conversation' }),
      );
      expect(screen.getByLabelText('Conversation title')).toBeInTheDocument();

      rerender(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Old title' })]}
          isLoading={false}
          activeConversationId='c1'
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={onRename}
        />,
      );

      expect(screen.queryByLabelText('Conversation title')).toBeNull();
    });
  });

  describe('select mode / bulk delete (E3)', () => {
    it('does not render a "Select conversations" entry point when onBulkDelete is not supplied', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(
        screen.queryByRole('button', { name: 'Select conversations' }),
      ).toBeNull();
    });

    it('the select-mode toolbar is ONE compact flex row (count, cancel, delete), not a wrapped stack', () => {
      // #9010 review: the previous `wrap` toolbar spread "N selected" / "Cancel selection" /
      // "Delete (N)" across a sparse 3-line column. The fix keeps all three inside a single,
      // non-wrapping `EuiFlexGroup` -- this asserts the STRUCTURE (one row, three controls),
      // not pixels jsdom has no layout engine to measure anyway.
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Selectable' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );

      const countText = screen.getByText('0 selected');
      const toolbar = countText.closest('.euiFlexGroup') as HTMLElement;
      expect(toolbar).not.toBeNull();
      // Never wraps to a second line.
      expect(toolbar.className).not.toMatch(/wrap/i);
      // Exactly the three controls, in one row: count, cancel, delete.
      expect(toolbar.children).toHaveLength(3);
      expect(
        toolbar.querySelector('[aria-label="Cancel selection"]'),
      ).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Delete (0)' })).toBeTruthy();
      expect(
        toolbar.contains(screen.getByRole('button', { name: 'Delete (0)' })),
      ).toBe(true);
    });

    it("carries `wzConvoRailSearchRow` on the select-mode toolbar too, so it also opts out of EuiFlexGroup's default flex-grow (#9010 review regression)", () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Selectable' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );

      const toolbar = screen
        .getByText('0 selected')
        .closest('.euiFlexGroup') as HTMLElement;
      expect(toolbar).not.toBeNull();
      expect(toolbar.className).toMatch(/wzConvoRailSearchRow/);
    });

    it('entering select mode shows a checkbox per row and hides the delete/rename icons', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Selectable' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onRename={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select "Selectable"' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Delete conversation' }),
      ).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Rename conversation' }),
      ).toBeNull();
    });

    it('"Cancel selection" exits select mode and clears the selection', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Selectable' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select "Selectable"' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancel selection' }));

      expect(
        screen.queryByRole('checkbox', { name: 'Select "Selectable"' }),
      ).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Select conversations' }),
      ).toBeInTheDocument();
    });

    it('the delete button stays disabled until at least one row is checked', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Selectable' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );
      expect(screen.getByRole('button', { name: 'Delete (0)' })).toBeDisabled();

      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select "Selectable"' }),
      );
      expect(
        screen.getByRole('button', { name: 'Delete (1)' }),
      ).not.toBeDisabled();
    });

    it('shows a "Delete N conversations?" confirm and calls onBulkDelete with every checked id', () => {
      const onBulkDelete = jest.fn();
      render(
        <ConversationList
          conversations={[
            conversation({ id: 'c1', title: 'First' }),
            conversation({ id: 'c2', title: 'Second' }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={onBulkDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select "First"' }));
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select "Second"' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Delete (2)' }));

      expect(screen.getByText('Delete 2 conversations?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onBulkDelete).toHaveBeenCalledTimes(1);
      expect(new Set(onBulkDelete.mock.calls[0][0])).toEqual(
        new Set(['c1', 'c2']),
      );
      // Confirming also leaves select mode.
      expect(
        screen.queryByRole('button', { name: 'Cancel selection' }),
      ).toBeNull();
    });

    it('canceling the bulk-delete confirm calls neither onDelete nor onBulkDelete', () => {
      const onBulkDelete = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'First' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={onBulkDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select "First"' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete (1)' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onBulkDelete).not.toHaveBeenCalled();
    });

    it('m11: Escape exits select mode from anywhere in the rail', () => {
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'First' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );
      expect(
        screen.getByRole('checkbox', { name: 'Select "First"' }),
      ).toBeInTheDocument();

      fireEvent.keyDown(
        screen.getByRole('checkbox', { name: 'Select "First"' }),
        { key: 'Escape' },
      );

      expect(
        screen.queryByRole('checkbox', { name: 'Select "First"' }),
      ).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Select conversations' }),
      ).toBeInTheDocument();
    });

    it('m13: a selected id no longer present in `conversations` is pruned on the next render', () => {
      const onBulkDelete = jest.fn();
      const { rerender } = render(
        <ConversationList
          conversations={[
            conversation({ id: 'c1', title: 'First' }),
            conversation({ id: 'c2', title: 'Second' }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={onBulkDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Select conversations' }),
      );
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select "First"' }));
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select "Second"' }),
      );
      expect(
        screen.getByRole('button', { name: 'Delete (2)' }),
      ).toBeInTheDocument();

      // 'First' (c1) is removed from the list this component is given — e.g. a refresh after it
      // was deleted through some other path (another tab, the single-delete flow).
      rerender(
        <ConversationList
          conversations={[conversation({ id: 'c2', title: 'Second' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          onBulkDelete={onBulkDelete}
        />,
      );

      // The stale id is pruned -- the count drops to 1, not 2, and a confirm would only ever
      // target the id that still exists.
      expect(
        screen.getByRole('button', { name: 'Delete (1)' }),
      ).toBeInTheDocument();
    });
  });
});
