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
 * against a live instance at https://localhost:8444 (deployed build `50645f4ef`) using a real
 * browser + `getBoundingClientRect`, before being encoded here. Two are expected to be RED right
 * now against that build — each is called out at its assertion with the measured value and the
 * defect it documents, per this task's instruction to encode the intended spec rather than
 * whatever currently renders:
 *
 *   1. The wide/table row's prose and meta/timestamp row measured 22px left of where every other
 *      row's prose sits (397/397 vs the normal row's 419), because
 *      `.wzMessageRow--wide .wzProseMeasure`/`.wzMessageRow--wide .wzMsgMetaRow` (chat-page.scss)
 *      add back only HALF of `$wzMsgAvatarColumn` when the sibling `.wzMessageRow--wide
 *      .wzMsgAvatarItem`/`.wzResultsCard` rules (same file) now give the avatar column back in
 *      FULL — a fix for this is being tracked separately (do not "fix" it by loosening these
 *      assertions; they are written to the ~2px noise floor a correct fix lands on, confirmed by
 *      live-patching the rule and re-measuring).
 *   2. The card/prose→footer(meta) row gap measured 6px on this build, not the spec's 8px, on
 *      every row checked (both a card-bearing and a card-less one) — a second, separate
 *      discrepancy this audit turned up that nobody has picked up yet.
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

  it('4. two-left-edges rule: avatar/card share one x, prose/meta share another — and that second x is the SAME on a wide row as on a normal row', () => {
    cy.get('.wzMessageRow').eq(PROSE_ROW).then($proseRow => {
      const avatar = rectOf($proseRow.find('.wzMsgAvatarItem').first());
      const prose = rectOf($proseRow.find('.wzProseMeasure').first());
      const meta = rectOf($proseRow.find('.wzMsgMetaRow').first());

      // Normal row: prose/meta sit exactly one avatar-column-width right of the avatar.
      expect(prose.left - avatar.left, 'normal row: prose.left - avatar.left').to.be.closeTo(40, PX);
      expect(meta.left, 'normal row: meta.left ≈ prose.left').to.be.closeTo(prose.left, 3);

      cy.get('.wzMessageRow').eq(WIDE_ROW).then($wideRow => {
        const wideAvatar = rectOf($wideRow.find('.wzMsgAvatarItem').first());
        const wideCard = rectOf($wideRow.find('.wzResultsCard').first());
        const wideProse = rectOf($wideRow.find('.wzProseMeasure').first());
        const wideMeta = rectOf($wideRow.find('.wzMsgMetaRow').first());

        // The card is entitled to break out to the avatar's own (further-left) edge on a wide
        // row — that's by design, not a defect (rulebook: only a table may break out).
        expect(wideCard.left, 'wide row: card.left == avatar.left (intentional breakout)').to.be.closeTo(wideAvatar.left, PX);

        // KNOWN RED on build 50645f4ef (see file banner, defect 1): prose/meta on the wide row
        // are supposed to land on the SAME absolute x as the normal row's prose rail (avatarX+40
        // for a normal row), not at their own avatar's x+40 (which is a different row's avatar
        // entirely, since the wide row's avatar itself breaks out further left). Fix pending.
        expect(wideProse.left, 'prose.left is the SAME on a wide row as on a normal row')
          .to.be.closeTo(prose.left, WIDE_ROW_PROSE_TOLERANCE_PX);
        expect(wideMeta.left, 'meta.left is the SAME on a wide row as on a normal row')
          .to.be.closeTo(prose.left, WIDE_ROW_PROSE_TOLERANCE_PX);
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

  it('7. prose→results-card is 16px; card→footer(meta) row is 8px', () => {
    cy.get('.wzMessageRow').eq(WIDE_ROW).then($row => {
      const prose = rectOf($row.find('.wzProseMeasure').first());
      const card = rectOf($row.find('.wzResultsCard').first());
      const meta = rectOf($row.find('.wzMsgMetaRow').first());

      expect(card.top - prose.bottom, 'prose.bottom -> card.top').to.be.closeTo(16, PX);

      // KNOWN RED on build 50645f4ef (see file banner, defect 2): measured 6px on this build,
      // not the spec's 8px. Independent of, and not fixed by, the wide-row prose/meta drift fix
      // tracked for assertion 4 above.
      expect(meta.top - card.bottom, 'card.bottom -> meta.top').to.be.closeTo(8, PX);
    });
  });

  it('8. prose→footer(meta) row is 8px on a card-less row too', () => {
    cy.get('.wzMessageRow').eq(BADGE_ROW).then($row => {
      const prose = rectOf($row.find('.wzProseMeasure').first());
      const meta = rectOf($row.find('.wzMsgMetaRow').first());

      // KNOWN RED on build 50645f4ef (see file banner, defect 2): same 6px-not-8px gap as
      // assertion 7's card->footer case, confirming it is not specific to the card being present.
      expect(meta.top - prose.bottom, 'prose.bottom -> meta.top').to.be.closeTo(8, PX);
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

  it('11. [documents a known variance, not a hard spec target] the VISIBLE content-to-content gap is currently 24px, not 32px, due to a symmetric -4px margin leak on .wzMsgRow', () => {
    // `.wzMessageRow` itself (assertion 1) measures a clean 32px because `display: flow-root`
    // (chat-page.scss, iteration-4 audit P0 item 1) stops the child flex group's negative gutter
    // margin from shrinking the NEXT row's structural position. It does not stop that same
    // negative margin from letting the child's own rendered box poke 4px past `.wzMessageRow`'s
    // top AND bottom edges (flow-root affects auto-height/margin-collapse, not paint/clipping,
    // and `.wzMessageRow` deliberately carries no `overflow: hidden`, which would clip a wide
    // row's breakout content). Net effect: 32px - 4px - 4px = 24px of actual visible whitespace
    // between one turn's avatar/text and the next's, even though the `.wzMessageRow`-level
    // measurement in assertion 1 is exactly on-spec. This assertion pins the CURRENT number so a
    // future change cannot silently shrink it further (e.g. to 16 or 0) without this suite
    // noticing — it intentionally does not assert 32, which would just re-fail assertion 1's own
    // finding under a different name.
    messageRows().then($rows => {
      const innerRects = [...$rows].map(row => row.querySelector('.wzMsgRow').getBoundingClientRect());
      for (let i = 1; i < innerRects.length; i++) {
        const gap = innerRects[i].top - innerRects[i - 1].bottom;
        expect(gap, `visible-content gap between row ${i - 1} and row ${i}`).to.be.closeTo(24, PX);
      }
    });
  });
});
