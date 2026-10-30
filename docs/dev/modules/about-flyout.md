# About flyout and documentation links

Every module view shows an **About \<module\>** button that opens a flyout describing the module,
and links to the page of the documentation that matches the view. This page defines both rules.

## Rules

1. **About button.** Reuse `AboutFlyoutButton`
   (`plugins/main/public/components/common/flyouts/about-flyout-button.tsx`). Do not build the
   button, the flyout or the header again in a module.
2. **Documentation link.** Declare the path of the documentation page once in `DOCS_PATHS`
   (`plugins/main/common/services/docs-paths.ts`) and use it from there:

   - `docsPath` of the About flyout, which renders the "Learn more in the documentation" link
     in the flyout header.
   - `docsUrl` of the application in `plugins/main/public/utils/applications.ts`, built with
     `webDocumentationLink(DOCS_PATHS.<key>)`. The Help menu of the header links it
     (see `setAppHelpExtension`).

   Do not write documentation paths as literals in components.

## Button placement

Add the button at the start of the `buttons` of **every tab** of the module in
`plugins/main/public/components/common/modules/modules-defaults.tsx`, so the flyout is
available in all its views. Modules with tabs use `withAboutButton(module, ButtonAbout<Module>)`.

## Content of the flyout

The flyout always renders these sections, in this order (extra sections come after the terms and `indices` before how to start). `AboutFlyoutButton` owns the headings,
spacing and order, so a module only provides the content through its props:

| Prop            | Section      | Content                                                                                                                                                                               |
| :-------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `overview`      | _(no title)_ | What the module is and what it reports. Required.                                                                                                                                     |
| `terms`         | Terms        | What the data and the terms of the module mean, as `{ title, description }` pairs.                                                                                                    |
| `extraSections` | Custom       | Optional sections after the terms, such as the tabs of the module or a related warning.                                                                                               |
| `indices`       | Indices      | The index patterns that each tab reads, as `{ id, tab, patterns }`. Build them from the `WAZUH_*_PATTERN` constants and the tab names of the UI. Omit it for modules with no indices. |
| `howToStart`    | How to start | Where to start and what is needed to get data, including why the views can be empty.                                                                                                  |

Write the content as follows:

- Explain the terms of the module in the user's words. Do not explain the product.
- When a view can be empty although another one has data, say why.
- Put a secondary documentation link inside the text with `AboutFlyoutDocsLink`.
- Texts go through `i18n.translate` with the ids `wazuh.<area>.aboutFlyout.<element>`.

## Adding it to a new module

1. Add the documentation path to `DOCS_PATHS` and set `docsUrl` in the application.
2. Create `button-about-<module>.tsx` in a `components/about` folder of the module, with its
   test beside it, using `AboutFlyoutButton`.
3. Wire the button in `modules-defaults.tsx`.
