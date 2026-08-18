/**
 * Chat transcript geometry — durable regression guard for the class of spacing/alignment defects
 * found by the iteration-4 spacing audit and (partially) fixed on
 * `enhancement/ai-assistant-ux-iteration-4` (see chat-page.scss's "iteration-4 audit" comments
 * around `.wzMessageRow`, `.wzMessageRow--wide .wzProseMeasure`, `.wzStatusCallouts`, etc.).
 *
 * Encodes the numeric layout spec handed down for that fix as plain
 * `getBoundingClientRect()` / `getComputedStyle()` arithmetic, so a future change that
 * reintroduces any of these defects fails a specific, named assertion instead of only showing up
 * as a "looks a bit off" screenshot in a design review.
 *
 * ── How to run ──────────────────────────────────────────
 *   cd plugins/wazuh-ai-assistant/test/cypress
 *   yarn install                                            # installs the local `cypress` devDep
 *   CYPRESS_baseUrl=https://localhost:8444 yarn start        # interactive runner
 *   CYPRESS_baseUrl=https://localhost:8444 yarn cypress:run  # headless, single run
 *
 * `baseUrl` defaults to https://localhost:8444 (cypress.config.js) when the env var is omitted.
 * `CYPRESS_username` / `CYPRESS_password` override the admin/admin default login
 * (plugins/wazuh-ai-assistant/test/cypress/cypress/support/commands.js).
 *
 * ── Prerequisites ───────────────────────────────────────
 * These specs need a REACHABLE dashboard with:
 *   - an admin/admin-capable login (or CYPRESS_username/password),
 *   - at least one AI Assistant provider configured (Settings tab) so a typed question gets a
 *     real model answer back,
 *   - some indexed data recent enough that "last 7 days" findings returns a non-empty result
 *     table (the question used to seed the `--wide`/table turn below).
 *
 * Turns are seeded by asking the live assistant real questions (prose-only, table-bearing,
 * zero-result) rather than by intercepting/mocking the chat response: the whole point of this
 * suite is transcript LAYOUT, which is identical regardless of answer content, and stubbing the
 * streamed response shape convincingly (tool-call chips, incremental markdown, a real result
 * table) would have to reverse-engineer the same rendering path these assertions are meant to
 * guard, at which point the fixture could silently drift from what the real backend sends. The
 * one exception is the sticky status-band test, which DOES use `cy.intercept` — there the goal is
 * only "does an error callout get an opaque background", which a real backend failure is a poor,
 * flaky way to reproduce on demand.
 *
 * These specs were authored and every one of their target numbers was hand-verified turn-by-turn
 * against a live instance at https://localhost:8444 using a real browser +
 * `getBoundingClientRect`/`getComputedStyle`, before being encoded here.
 *
 * The wide-row alignment (assertion 4) was RED on the earlier build `50645f4ef`: a table-bearing
 * turn centred its wider row 120px further left and then used per-element `calc()` corrections that
 * left the avatar (and card) short of the prose rail, so the avatar drifted ~120px left of where a
 * prose-only turn's avatar sits and the prose/meta landed 22px short of the normal rail. The
 * ux-iteration-4 fix removed that scheme: `.wzMessageRow--wide` now anchors its own inline-start
 * edge at the normal row's, so avatar/prose/meta all keep their normal x. A SECOND ux-iteration-4
 * revision (owner's "bound the table by the chat box" call) then capped the wide row at the shared
 * content measure ($wzContentMaxWidth) instead of a wider table-only $wzTableMaxWidth: the results
 * card now fills the content column to its right edge — which lands on the COMPOSER's own right edge
 * — and never overshoots it, at every viewport. Assertion 4 encodes that fixed spec (do not "fix" a
 * regression by loosening it; the tolerances are the ~2px noise floor a correct fix lands on, plus a
 * small scrollbar-gutter allowance on the card→composer right-edge match, confirmed by live-patching
 * the rule and re-measuring at both 1920px and 1280px).
 *
 * Two other candidates flagged in an earlier pass through this suite — a "24px not 32px" turn
 * gap, and a "6px not 8px" card/prose→footer gap — turned out, after the same
 * live-patch-and-re-measure treatment, to be measurement artifacts rather than real defects: both
 * `.wzMsgRow` and `.wzMsgMetaRow` are themselves `EuiFlexGroup`s, and EUI's gutter compensation
 * gives each of them a `margin: -Npx` on every side that is exactly cancelled by a `+Npx` margin
 * on their own flex item(s) — leaving the GROUP's own box N px larger than its visible content on
 * every side, but with nothing painted in that margin (no background/border/box-shadow) and the
 * actual avatar/prose/timestamp exactly where they'd be without any of it. Measuring those two
 * wrapper elements' own rects (rather than the avatar/timestamp elements actually inside them)
 * undercounted both gaps by exactly that cancelled-out margin. Assertions 7, 8 and 11 below
 * measure the correct (visible-content) element for this reason; assertion 11's comment has the
 * full live-patch evidence for anyone re-deriving this.
 */

const QUESTIONS = {
  prose: 'In one sentence, what is a Wazuh decoder?',
  table: 'Show me the findings in the last 7 days',
  zeroResult: 'Any brute force attempts from agent nonexistent-agent-cypress-zzz999',
};

// Post-fix noise floor for the wide-row prose/meta correction (see file banner, defect 1): a
// couple of px of built-in EUI flex-gutter offset is present on card-less rows too, so this is
// not "loose enough to hide a regression" — a regression here reads in the tens of px, not this.
const WIDE_ROW_PROSE_TOLERANCE_PX = 4;
// Card→composer right-edge match allowance: the transcript reserves a ~10px scrollbar gutter
// (`scrollbar-gutter: stable`, chat-page.scss) that the composer row does not, so the card's right
// edge can land a few px INSIDE the composer's right edge. The card must never sit OUTSIDE it (that
// separate `at.most` check has no such slack) — this only allows the small inward gutter offset.
const CARD_TO_COMPOSER_RIGHT_TOLERANCE_PX = 12;
// General sub-pixel/rounding tolerance for exact-integer spec targets (16, 4, 32, ...).
const PX = 1;

function rectOf($el) {
  const r = $el[0].getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
}

function messageRows() {
  return cy.get('.wzMessageRow');
}

describe('AI Assistant — transcript geometry', () => {
  before(() => {
    cy.wzLogin();
    cy.wzOpenFreshAssistantConversation();
    cy.wzSendMessage(QUESTIONS.prose);
    cy.wzSendMessage(QUESTIONS.table);
    cy.wzSendMessage(QUESTIONS.zeroResult);
  });

  // After the three seeded Q&A pairs: rows 0/2/4 are the user's own turns, rows 1/3/5 are the
  // assistant's (prose-only, wide/table, zero-result/badge-only respectively). Row 3 carries
  // `.wzMessageRow--wide` and a `.wzResultsCard`; rows 1 and 5 do not.
  const PROSE_ROW = 1;
  const WIDE_ROW = 3;
  const BADGE_ROW = 5;

  it('1. holds a uniform 32px gap between every consecutive .wzMessageRow, regardless of content', () => {
    messageRows().should('have.length', 6);
    messageRows().then($rows => {
      const rects = [...$rows].map(el => el.getBoundingClientRect());
      for (let i = 1; i < rects.length; i++) {
        const gap = rects[i].top - rects[i - 1].bottom;
        expect(gap, `gap between row ${i - 1} and row ${i}`).to.be.closeTo(32, PX);
      }
    });
  });

  it('2. collapsing/re-expanding the results card changes row height but not either adjacent gap', () => {
    let expandedHeight;
    let gapBefore;
    let gapAfter;

    messageRows().then($rows => {
      const before = [...$rows].map(el => el.getBoundingClientRect());
      expandedHeight = before[WIDE_ROW].height;
      gapBefore = {
        above: before[WIDE_ROW].top - before[WIDE_ROW - 1].bottom,
        below: before[WIDE_ROW + 1].top - before[WIDE_ROW].bottom,
      };
    });

    cy.get('.wzMessageRow').eq(WIDE_ROW).find('.wzResultsCardToggle').click();
    cy.wait(300); // collapse transition

    messageRows().then($rows => {
      const collapsed = [...$rows].map(el => el.getBoundingClientRect());
      expect(collapsed[WIDE_ROW].height, 'row height after collapse').to.be.lessThan(expandedHeight);
      const gapCollapsed = {
        above: collapsed[WIDE_ROW].top - collapsed[WIDE_ROW - 1].bottom,
        below: collapsed[WIDE_ROW + 1].top - collapsed[WIDE_ROW].bottom,
      };
      expect(gapCollapsed.above, 'gap above the row, collapsed').to.be.closeTo(gapBefore.above, PX);
      expect(gapCollapsed.below, 'gap below the row, collapsed').to.be.closeTo(gapBefore.below, PX);
    });

    cy.get('.wzMessageRow').eq(WIDE_ROW).find('.wzResultsCardToggle').click();
    cy.wait(300); // re-expand transition

    messageRows().then($rows => {
      const reExpanded = [...$rows].map(el => el.getBoundingClientRect());
      expect(reExpanded[WIDE_ROW].height, 'row height after re-expand').to.be.closeTo(expandedHeight, PX);
      gapAfter = {
        above: reExpanded[WIDE_ROW].top - reExpanded[WIDE_ROW - 1].bottom,
        below: reExpanded[WIDE_ROW + 1].top - reExpanded[WIDE_ROW].bottom,
      };
      expect(gapAfter.above, 'gap above the row, re-expanded').to.be.closeTo(gapBefore.above, PX);
      expect(gapAfter.below, 'gap below the row, re-expanded').to.be.closeTo(gapBefore.below, PX);
    });
  });

  it('3. no row reserves empty trailing space below its own last rendered descendant', () => {
    messageRows().then($rows => {
      [...$rows].forEach((row, i) => {
        const rowBottom = row.getBoundingClientRect().bottom;
        let maxDescendantBottom = -Infinity;
        const walker = document.createTreeWalker(row, NodeFilter.SHOW_ELEMENT);
        let node = walker.currentNode;
        while (node) {
          const b = node.getBoundingClientRect().bottom;
          if (b > maxDescendantBottom) maxDescendantBottom = b;
          node = walker.nextNode();
        }
        // One-directional: a row ending noticeably AFTER its last visible descendant is dead
        // trailing space. A row ending at-or-slightly-before its descendant (a few px of EUI's
        // own flex-gutter margin escaping a `display: flow-root` boundary, present on every row
        // here) is a separate, pre-existing rendering quirk, not the "reserved space" defect this
        // check targets, so it is not asserted against here.
        expect(rowBottom - maxDescendantBottom, `row ${i} bottom vs its own last descendant`).to.be.at.most(6);
      });
    });
  });

  it('4. avatar, prose and meta sit at the SAME absolute x on a wide row as on a normal row; the results card fills the content column and its right edge lands on (never past) the composer right edge', () => {
    cy.get('.wzMessageRow').eq(PROSE_ROW).then($proseRow => {
      const normalRow = rectOf($proseRow);
      const avatar = rectOf($proseRow.find('.wzMsgAvatarItem').first());
      const prose = rectOf($proseRow.find('.wzProseMeasure').first());
      const meta = rectOf($proseRow.find('.wzMsgMetaRow').first());

      // Normal row: prose/meta sit exactly one avatar-column-width right of the avatar.
      expect(prose.left - avatar.left, 'normal row: prose.left - avatar.left').to.be.closeTo(40, PX);
      expect(meta.left, 'normal row: meta.left ≈ prose.left').to.be.closeTo(prose.left, 3);

      cy.get('.wzMessageRow').eq(WIDE_ROW).then($wideRow => {
        const wideRow = rectOf($wideRow);
        const wideAvatar = rectOf($wideRow.find('.wzMsgAvatarItem').first());
        const wideCard = rectOf($wideRow.find('.wzResultsCard').first());
        const wideProse = rectOf($wideRow.find('.wzProseMeasure').first());
        const wideMeta = rectOf($wideRow.find('.wzMsgMetaRow').first());

        // The owner's fix (ux-iteration-4): a table-bearing turn must never pull the avatar (or the
        // prose, or the meta row) leftward. All three keep the exact x they hold on a prose-only
        // turn, so avatars line up turn-to-turn instead of drifting left on table answers. This is
        // the assertion that was RED before the fix — the avatar used to break out ~120px further
        // left than the prose-only row's avatar.
        expect(wideAvatar.left, 'wide row: avatar.left == normal row avatar.left (no left drift)')
          .to.be.closeTo(avatar.left, WIDE_ROW_PROSE_TOLERANCE_PX);
        expect(wideProse.left, 'wide row: prose.left == normal row prose.left')
          .to.be.closeTo(prose.left, WIDE_ROW_PROSE_TOLERANCE_PX);
        expect(wideMeta.left, 'wide row: meta.left == normal row prose rail')
          .to.be.closeTo(prose.left, WIDE_ROW_PROSE_TOLERANCE_PX);

        // The results card fills the content column and is BOUNDED by it: its left edge aligns with
        // the prose column (avatarX + 40), never breaking out leftward, and its right edge lands on
        // the composer's own right edge — never past it — instead of reaching a wider table-only cap.
        expect(wideCard.left, 'wide row: card.left == prose rail (avatarX + 40), not the avatar edge')
          .to.be.closeTo(prose.left, WIDE_ROW_PROSE_TOLERANCE_PX);
        expect(wideRow.left, 'wide row left edge == normal row left edge')
          .to.be.closeTo(normalRow.left, WIDE_ROW_PROSE_TOLERANCE_PX);
        // Bounded, not breaking out: the wide row no longer extends past a normal row — both cap at
        // $wzContentMaxWidth now that the table-only breakout is gone.
        expect(wideRow.right, 'wide row right edge == normal row right edge (both at the content measure)')
          .to.be.closeTo(normalRow.right, WIDE_ROW_PROSE_TOLERANCE_PX);

        cy.get('.wzComposerMeasure').then($composer => {
          const composer = rectOf($composer);
          // The owner's "bound the table by the chat box" call: the card's right edge sits AT the
          // composer's right edge and NEVER overshoots it (the earlier ~1300px table cap stuck out
          // ~235px past the composer on a 1920px window). It may land a few px inside — the
          // transcript reserves a scrollbar gutter the composer does not — but never outside.
          expect(wideCard.right, 'card.right never overshoots composer.right')
            .to.be.at.most(composer.right + PX);
          expect(wideCard.right, 'card.right aligns with composer.right (within the scrollbar gutter)')
            .to.be.closeTo(composer.right, CARD_TO_COMPOSER_RIGHT_TOLERANCE_PX);
        });
      });
    });
  });

  it('5. the footer/timestamp row left edge matches the prose left edge, on both a normal and a wide row', () => {
    [PROSE_ROW, WIDE_ROW].forEach(idx => {
      cy.get('.wzMessageRow').eq(idx).then($row => {
        const prose = rectOf($row.find('.wzProseMeasure').first());
        const timestamp = rectOf($row.find('.wzAiAssistantMessageTimestamp').first());
        expect(timestamp.left, `row ${idx}: timestamp.left == prose.left`).to.be.closeTo(prose.left, 3);
      });
    });
  });

  it('6. prose rhythm: paragraph→paragraph and paragraph→list are 16px, list-item→list-item is 4px', () => {
    cy.get('.wzMessageRow').eq(WIDE_ROW).find('.wzProseMeasure .euiMarkdownFormat').first().then($md => {
      // `.euiMarkdownFormat` wraps the actual sequence of <p>/<ul>/<p> blocks in one or more
      // single-child passthrough <div>s (react-markdown's own wrapper elements) before reaching
      // the node whose children are the real top-level blocks — descend through those rather
      // than assuming a fixed nesting depth, since that depth is an implementation detail of the
      // markdown renderer, not something this spec should encode.
      let node = $md[0];
      while (node.children.length === 1 && node.children[0].children.length > 0) {
        node = node.children[0];
      }
      const blocks = [...node.children];
      expect(blocks.length, 'markdown top-level block count').to.be.greaterThan(1);
      for (let i = 1; i < blocks.length; i++) {
        const gap = blocks[i].getBoundingClientRect().top - blocks[i - 1].getBoundingClientRect().bottom;
        expect(gap, `block ${i - 1} -> block ${i} (${blocks[i - 1].tagName} -> ${blocks[i].tagName})`).to.be.closeTo(16, PX);
      }

      const list = blocks.find(b => b.tagName === 'UL' || b.tagName === 'OL');
      expect(list, 'a list block exists in this answer').to.exist;
      const items = [...list.children];
      expect(items.length, 'list item count').to.be.greaterThan(1);
      for (let i = 1; i < items.length; i++) {
        const gap = items[i].getBoundingClientRect().top - items[i - 1].getBoundingClientRect().bottom;
        expect(gap, `li ${i - 1} -> li ${i}`).to.be.closeTo(4, PX);
      }
    });
  });

  // `.wzMsgMetaRow` is itself a `EuiFlexGroup` (`gutterExtraSmall`), which carries EUI's usual
  // gutter-compensation margin: the GROUP gets `margin: -2px` on every side, and its own flex
  // item(s) (the timestamp, tool-call chips) get `margin: 2px` back — a self-cancelling pair
  // that keeps the group's actual VISIBLE content flush with where it would sit with no gutter
  // machinery at all. That makes the group's own `getBoundingClientRect()` a 2px-oversized,
  // unpainted box (no background/border/box-shadow: confirmed via computed style), not the
  // visible edge a reader perceives — reading `.wzMsgMetaRow` itself under-counts this gap by
  // exactly the 2px its own margin borrows. `.wzAiAssistantMessageTimestamp` is the actual
  // visible content and is what these two assertions measure against.
  it('7. prose→results-card is 16px; card→footer(meta) row is 8px', () => {
    cy.get('.wzMessageRow').eq(WIDE_ROW).then($row => {
      const prose = rectOf($row.find('.wzProseMeasure').first());
      const card = rectOf($row.find('.wzResultsCard').first());
      const timestamp = rectOf($row.find('.wzAiAssistantMessageTimestamp').first());

      expect(card.top - prose.bottom, 'prose.bottom -> card.top').to.be.closeTo(16, PX);
      expect(timestamp.top - card.bottom, 'card.bottom -> timestamp.top').to.be.closeTo(8, PX);
    });
  });

  it('8. prose→footer(meta) row is 8px on a card-less row too', () => {
    cy.get('.wzMessageRow').eq(BADGE_ROW).then($row => {
      const prose = rectOf($row.find('.wzProseMeasure').first());
      const timestamp = rectOf($row.find('.wzAiAssistantMessageTimestamp').first());

      expect(timestamp.top - prose.bottom, 'prose.bottom -> timestamp.top').to.be.closeTo(8, PX);
    });
  });

  it("9. the sticky status band's background is not transparent when a status callout renders", () => {
    // A real backend failure is a flaky way to summon this band on demand; intercept the chat
    // endpoint instead so this assertion is deterministic and does not depend on a live model.
    cy.intercept('POST', '**/api/wazuh_ai_assistant/chat', {
      statusCode: 500,
      body: { statusCode: 500, error: 'Internal Server Error', message: 'stubbed failure for geometry spec' },
    }).as('chatFailure');

    cy.get('.wzComposerTextarea').click().type('trigger an error callout');
    cy.get('.wzComposerSendButton').click();
    cy.wait('@chatFailure');

    cy.get('.wzStatusCallouts', { timeout: 20000 })
      .should('be.visible')
      .then($band => {
        const bg = window.getComputedStyle($band[0]).backgroundColor;
        expect(bg, 'computed background-color').to.not.equal('rgba(0, 0, 0, 0)');
        expect(bg, 'computed background-color').to.not.equal('transparent');
      });
  });

  it('10. the composer control row keeps privacy chip / provider trigger / send button on one 32px-tall, top-aligned line', () => {
    cy.get('[data-test-subj="wzPrivacyChip"]').then($chip => {
      const chip = rectOf($chip);

      cy.get('.wzProviderPickerTrigger').then($trigger => {
        const trigger = rectOf($trigger);

        cy.get('.wzComposerSendButton').then($send => {
          const send = rectOf($send);

          [chip, trigger, send].forEach((rect, i) => {
            expect(rect.height, `control ${i} height`).to.be.closeTo(32, PX);
          });
          expect(trigger.top, 'trigger.top == chip.top').to.be.closeTo(chip.top, PX);
          expect(send.top, 'send.top == chip.top').to.be.closeTo(chip.top, PX);
        });
      });
    });
  });

  it('11. the VISIBLE avatar/content box (not the invisible EuiFlexGroup wrapper) is exactly flush with .wzMessageRow on every row — confirming the 32px gap (assertion 1) is real ink, not a measurement artifact', () => {
    // An earlier pass through this suite measured `.wzMsgRow` itself (the row's own
    // `EuiFlexGroup`, `gutterSmall`) between consecutive rows and got 24px, not 32 — and wrongly
    // reported that as a real "visible gap" defect. `.wzMsgRow` carries EUI's usual
    // gutter-compensation pair (`margin: -4px` on the group, `margin: 4px` on each flex item,
    // confirmed via computed style), which is self-cancelling BY DESIGN: it lets the group's own
    // box run 4px past its content on every side while the actual avatar/content stay exactly
    // where they'd be without any of this machinery. `.wzMsgRow` paints nothing of its own
    // (`background-color: rgba(0,0,0,0)`, no border, no box-shadow — confirmed via computed
    // style) so that 4px is never rendered; treating its rect as "the visible content" was the
    // error, not the CSS. Live-patching `.wzMsgRow`'s margin-top/bottom to 0 and re-measuring
    // proved this two ways: the row grew 8px taller and the avatar shifted 4px away from the
    // row's own edge — i.e. "fixing" it makes the rendering WORSE, not better. No SCSS change is
    // warranted here; this assertion instead locks in the actual invariant (avatar/content flush
    // with the row) so a future change to the gutter-compensation margins can't quietly break it.
    [1, 3, 5].forEach(i => {
      cy.get('.wzMessageRow').eq(i).then($row => {
        const row = rectOf($row);
        const avatar = rectOf($row.find('.wzMsgAvatarItem').first());
        expect(avatar.top, `row ${i}: avatar.top == row.top`).to.be.closeTo(row.top, PX);
        expect(avatar.bottom, `row ${i}: avatar.bottom == row.bottom`).to.be.closeTo(row.bottom, PX);
      });
    });
  });
});
