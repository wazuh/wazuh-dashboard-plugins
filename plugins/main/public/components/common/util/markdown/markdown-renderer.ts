/*
 * Wazuh app - React component that renders markdown
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import MarkdownIt from 'markdown-it';
import MarkdownItLinkAttributes from 'markdown-it-link-attributes';
import DOMPurify from 'dompurify';
import { i18n } from '@osd/i18n';

// React-free so the rendering can also run in Node (see scripts/render-markdown.js).
export const COPY_BUTTON_CLASS = 'wz-markdown-copy-button';
const CODE_BLOCK_CLASS = 'wz-markdown-code';

const createMarkdownIt = (options: MarkdownIt.Options = {}) =>
  new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
    typographer: true,
    ...options,
  }).use(MarkdownItLinkAttributes, {
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  });

const md = createMarkdownIt();

// Remediations are command text, not prose: placeholders like <PATH TO FILE> must not be parsed
// as HTML, quotes must stay straight to be copyable, and a leading "# " is a shell comment, not a
// heading. Backslash escapes stay literal (`\.`, `\"`, `\:` are part of regexes and scripts).
// Emphasis stays enabled so markdown remediations can use bold.
const mdWithCopyableCodeBlocks = createMarkdownIt({
  html: false,
  typographer: false,
}).disable(['heading', 'lheading', 'escape']);

// Every fenced code block gets a copy button. The click is handled by the component through
// event delegation, because the button lives in injected HTML.
mdWithCopyableCodeBlocks.renderer.rules.fence = (tokens, index) => {
  const label = i18n.translate('wazuh.common.markdown.copyCodeButton', {
    defaultMessage: 'Copy code',
  });
  const code = mdWithCopyableCodeBlocks.utils.escapeHtml(tokens[index].content);

  return `<div class="${CODE_BLOCK_CLASS}"><button type="button" class="${COPY_BUTTON_CLASS}" aria-label="${label}" title="${label}">${label}</button><pre><code>${code}</code></pre></div>\n`;
};

export type MarkdownSanitizer = (html: string) => string;

/**
 * Renders markdown to sanitized HTML. `copyableCodeBlocks` selects the remediation (SCA)
 * renderer; otherwise the shared renderer (MITRE ATT&CK, CTI release notes) is used.
 * `sanitize` defaults to the browser DOMPurify; Node callers must provide a DOM-backed one.
 */
export const renderMarkdown = (
  markdown: string,
  { copyableCodeBlocks = false }: { copyableCodeBlocks?: boolean } = {},
  sanitize: MarkdownSanitizer = html => DOMPurify.sanitize(html),
) =>
  sanitize(
    (copyableCodeBlocks ? mdWithCopyableCodeBlocks : md).render(markdown),
  );
