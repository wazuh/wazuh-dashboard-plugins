# AI Assistant redesign v2 — extracted design spec

The contract the redesign was implemented against, and the acceptance criteria it is verified by.
Extracted from the Claude Design bundle for this redesign (rendered, then text-extracted), so
everything below is the design's own wording. Copy is unchanged from the live product: only
presentation moves, and it is all EUI/OUI plus scoped SCSS.

> Commit messages on the implementing branch cite this file by the path it was authored at,
> `AI/design/redesign-v2-spec.md`. This is that file.

## Design language (what the reference gives us, in EUI terms)

- **Depth — almost none.** Flat: a 1px `#E7EAEF` hairline and nothing else. Shadow is reserved for
  things that genuinely float — popovers, flyout, the composer's top edge. Chat cards must LOSE
  their current shadow.
- **Radius & padding — 12px, 20–24px inside.** `$euiBorderRadius: 8px` for controls, a scoped 12px
  for panels. The felt difference is padding, not radius: cards breathe at 20–24px while rows stay
  at EUI's compressed height.
- **Status chips.** Tinted fill, no border, fully round, 11px semibold = `EuiBadge` with a custom
  color, no fork. Replaces today's three different status treatments.
- **Micro-labels.** 11px uppercase, muted, above the value, tinted icon square opposite. Used for
  section headers and table column heads.
- **Navigation.** Uppercase group labels, soft-tinted pill on the active row, collapse chevron
  pinned at the bottom. Applied to the conversation rail, grouped by date.
- **Motion — 120–200ms ease-out.** Rail collapse, composer autogrow, accordion chevron, hover
  fills. Nothing loops. Reduced-motion disables the composer height transition.

**Deliberately NOT taken:** the reference's saturated chart palette (Wazuh severity colours are
load-bearing and stay); its 30px metric numerals (Home's scale sets the ceiling); any of its layout
primitives (no utility framework — this is border, radius, padding and one badge recolour).

## Screen 1 · Chat welcome (full chrome, 1920×1080 and 1280×620)

Rail: `CONVERSATIONS` header, `＋ New conversation`, `⌕ Search conversations`, date groups
(`TODAY` / `YESTERDAY`) with per-item relative timestamps, `‹ Collapse` pinned at the bottom.

Welcome: hero "Ask the AI Assistant something" + "Ask questions about your security data in plain
language." then a `TRY ONE OF THESE` group containing three horizontal cards (icon-left, title +
description): Critical findings / Disconnected agents / Brute force attempts.

Composer: textarea placeholder "Ask the AI Assistant about your security findings…", a controls row
BELOW it with the privacy pill (`⚿ Off`) and `Provider: … ▾`, send button, and the disclaimer
"AI responses may contain errors. Always verify critical information."

**Variations:** 1a card group (pill-headed container, most consistent, one extra border) ·
1b loose cards (lightest, loses the grouping anchor) · 1c prompt list (densest, survives any
height, scales past three prompts, least visual welcome). Design recommends **1a**.

**Gap to Home, ranked**

- BREAKING — **Anchored composer**: floats over the scroll region rather than owning a row, so it
  lands on the welcome cards at ~620px height. Home has no absolutely positioned content.
- BREAKING — **Clipped placeholder**: same cause; the controls row overlays the textarea instead of
  stacking below it, so the field can be squeezed under one line box.
- HIGH — **Cards are not Home's card**: icon-top, 150px tall, one truncated line, half the box
  empty. Home is icon-left, title plus two-line description, hairline border, 16px padding.
- HIGH — **No grouping container**: three cards float on the page background.
- MED — **Undense rail**: no search, no date grouping, no collapse; titles cut at ~22 characters
  with a whole line spent on a relative timestamp.
- MED — **Three nested boxes**: focus ring, field border and an inner provider select each draw an
  outline. Home never nests borders.

**EUI mapping:** `EuiPage`/`EuiPageBody` + CSS grid body (NOT `EuiBottomBar`) ·
`EuiCollapsibleNav` docked + `EuiFieldSearch` + `EuiListGroup` per-date groups ·
`EuiPanel hasBorder hasShadow={false}` + `EuiBadge` pill header ·
`EuiCard layout="horizontal" display="plain" hasBorder` in `EuiFlexGrid columns={3}` ·
`EuiTextArea resize="none"` + JS autogrow capped at 5 rows ·
`EuiPopover` + `EuiSelectable` for the provider pill, `EuiButtonIcon` send.

## Screen 2 · Conversation with a results table

Prose held to 68ch; the table is free to use the width. Results card header carries the title
`Results (26 rows)`, the tool-name chip (`get_critical_findings`), `↗ Open in Discover`, and the
collapse chevron. Pagination sits INSIDE the card.

**Variations:** 2a docked row (grid row, full width; overlap impossible; transcript absorbs height
changes) · 2b floating island (closest to the reference but reintroduces the overlay that caused
both bugs — fragile) · 2c inline at end of transcript (no overlap, but the input goes off-screen
after a long answer). Design recommends **2a**.

**Gap to Home, ranked**

- BREAKING — **Pagination is covered**: page 2 of 6 unreachable without resizing the window.
- HIGH — **Table has no container**: sits directly on the transcript with a floating collapse caret.
- HIGH — **Unbounded measure**: at 1920 the answer runs past 200 characters per line.
- MED — **Three elevations for three peers**: shadowed user bubble, bare assistant text,
  grey-on-grey tool block.
- MED — **Provenance after the fact**: the tool call renders below the table it produced; it should
  become a chip in the card header expanding to the JSON on click.

**EUI mapping:** `EuiCommentList`/`EuiComment` with `max-width:68ch` on prose only ·
`EuiPanel hasBorder paddingSize="none"` as the results card · `EuiBasicTable` with
`itemIdToExpandedRowMap` + `EuiTablePagination` inside the panel · `EuiAccordion` for collapse ·
`EuiBadge` level chips · `EuiCodeBlock isCopyable` in the provenance popover ·
`EuiButtonEmpty iconType="popout"` for Open in Discover.

## Layout contract (screens 1–2) — the part that must not be improvised

1. **The pane is a two-row grid.** `display:grid; grid-template-rows:1fr auto; height:100%`.
   Transcript is the `1fr` row with `min-height:0; overflow-y:auto`; the composer is the `auto` row,
   in flow. No `position:absolute`, no `EuiBottomBar`. Overlap becomes structurally impossible
   instead of something tuned per breakpoint.
2. **The composer has a floor and a ceiling.** Textarea min-height of one line box, autogrow to
   5 rows then internal scroll, whole composer capped at `max-height:30dvh`. Controls stack BELOW
   the field, never over it — this is what removes the clipped placeholder.
   (collapsed 96px · max 5 rows 176px · cap at 620 → 186px)
3. **The welcome centres only when there is room.** Inside the transcript row as
   `min-height:100%; display:grid; place-content:center`. Tall viewport: centred. Short viewport: it
   uses the transcript's own scroll rather than pushing into the composer. Hero uses `clamp()` tied
   to height; cards are `repeat(auto-fit, minmax(240px,1fr))` — 3-up, 2-up, 1-up with no fixed pixel
   widths, so horizontal scroll cannot appear.
4. **Tables own their scroll, pagination stays inside.** Results card is
   `grid-template-rows:auto minmax(0,1fr) auto` with `max-height:min(460px, 52dvh)`. Header and
   pagination are pinned card rows; only the body scrolls. Page size steps 5 → 10 above 900px of
   transcript height.
5. **One measure, one gutter.** Transcript prose and composer share a `max-width:1060px` centred
   column; tables may break out to `min(100%, 1300px)`. Extra width at 1920 goes to the rail and
   gutters, never to line length. Rail collapses to a 48px strip below 1100px of pane width, becomes
   an `EuiFlyout` below 900px.

**Acceptance checks**

- At 1280×620 with the composer at max height, the pagination row is fully visible without page
  scroll.
- No horizontal scrollbar between 1024 and 2560px of window width.
- The placeholder renders one full line box at every height from 560px up.
- Welcome cards never overlap the composer; below 540px of transcript height the welcome scrolls.

**Safari / high-resolution robustness**

- No `vh` for pane height (Safari's 100vh excludes then includes the toolbar). Use `100%` from a
  height-constrained ancestor, or `100dvh` at the outermost element only.
- Every flex/grid child that scrolls gets `min-height:0`.
- No `position:sticky` inside an `overflow:auto` table body — pin the header as a grid row instead.
- Avoid `-webkit-fill-available` and `calc(100vh - Npx)` chains.
- Test at fractional zoom and 2× DPR.
- No fixed pixel widths on content — every column is `fr`, `minmax` or `auto-fit`.

## Screen 3 · Settings — providers

Page header `AI Assistant settings` / "Manage AI providers, privacy and conversation history." with
`＋ Add provider` as a right-side item. Three bordered cards under centred pills: **PROVIDERS**
(with `⌕ Filter providers` and `Test all` in the card header), **PRIVACY**, **CONVERSATION HISTORY**.
Provider table columns: star (default) · NAME · TYPE · ENDPOINT · MODEL · API KEY · STATUS · ACTIONS.

**Variations:** 3a one chip, four states (OK (441 ms) / Failed / Testing… / Could not verify — same
shape, same position, colour carries state; reason on hover and in the row detail) · 3b dot + text
(`EuiHealth` as-is, denser and quieter, scans worse) · 3c chip + latency column (failure reason
visible without hover — `401 · invalid key` — costs ~140px of width). Design recommends **3a**.

**Gap to Home, ranked**

- HIGH — **Sections are headings, not cards** → three bordered cards under centred pills.
- HIGH — **Three status languages** → one chip, four states.
- MED — **Endpoints dominate the row**: middle-truncate with a tooltip; all eight columns stay.
- MED — **No filter or bulk test**: a search field and `Test all` belong in the card header.
- LOW — **Two toggle idioms**: both should be `EuiSwitch`.

**EUI mapping:** `EuiPageHeader rightSideItems` · `EuiPanel hasBorder hasShadow={false}` +
`EuiBadge` pill per section · `EuiInMemoryTable` with search and expandable row detail ·
`EuiBadge` status chip with `EuiLoadingSpinner` inside while testing · `EuiToolTip` on the
middle-truncated endpoint · `EuiPopover` + `EuiContextMenu` row actions · `EuiSwitch` ×2.

## Screen 4 · Add provider flyout

Every warning and help string is the audited copy from the live form, unchanged. What moves is
where it sits and how much of it you meet at once. Structure: `ⓘ Getting started` callout, then
numbered groups — **1 Provider type** (two selectable cards: OpenAI-compatible / Anthropic, with the
explanatory line below), **2 Connection** (Name + API key two-up, Endpoint URL with example chips
and "API documentation" link), **3 Model** (with example chips and "See available models"), then the
audited tool-calling warning in a callout. Footer: `Cancel` · `Save & test`.

**Variations:** 4a numbered groups (one scroll, three labelled groups, everything visible and
editable at once) · 4b stepped wizard (gentlest for a first-timer, worst for an admin editing one
field) · 4c vendor preset first (fastest path, but adds a vendor list the backend must maintain).
Design recommends **4a**.

**Problems, ranked**

- HIGH — **The deciding field is a dropdown, second**: provider type determines endpoint, key format
  and model list. It comes first, as visible options, and prefills the rest.
- HIGH — **Guidance is a five-line paragraph**: the text stays word for word but moves into a
  warning callout; model names inside it become clickable chips.
- HIGH — **Six ungrouped fields, one column**: three numbered groups and a two-up row for
  Name / API key cut the scroll roughly in half.
- MED — **Examples are prose, not chips**: same strings, now clickable.
- MED — **Save & test has no result state**: the caveat that a passing test does not guarantee chat
  works has nowhere to appear at the moment it matters.

**EUI mapping:** `EuiFlyout size="m"` + Header/Body/Footer · `EuiCheckableCard` ×2 for provider type
· `EuiFormFieldset` per numbered group with the legend as the title · `EuiFormRow helpText`,
`EuiFieldText`, `EuiFieldPassword type="dual"` · `EuiComboBox singleSelection customOptionText` for
the model · `EuiBadge onClick` for endpoint and model example chips · `EuiCallOut color="warning"
size="s"` holding the audited warning verbatim.

## The design's own open decisions

1. **Missing string** for the Save & test result panel — **ANSWERED**: v24 already ships it as
   `wazuhAiAssistant.settings.form.gettingStartedTestCaveat`: "A green test confirms connection and
   key — it does not guarantee every chat request will succeed." (landed with PR #8952.)
2. **Pick per variation** — welcome 1a/1b/1c, composer 2a/2b/2c, status 3a/3b/3c, flyout 4a/4b/4c.
3. **Rail collapse threshold** — 1100px of pane width is a guess.
4. **Safari reproduction** — resolution and Safari version where leadership saw the breakage.
