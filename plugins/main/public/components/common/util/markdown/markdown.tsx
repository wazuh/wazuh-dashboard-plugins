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
import React from 'react';
import MarkdownIt from 'markdown-it';
import MarkdownItLinkAttributes from 'markdown-it-link-attributes';
import classnames from 'classnames';
import DOMPurify from 'dompurify';
import { copyToClipboard } from '@elastic/eui';
import { i18n } from '@osd/i18n';

const COPY_BUTTON_CLASS = 'wz-markdown-copy-button';
const CODE_BLOCK_CLASS = 'wz-markdown-code';

const createMarkdownIt = () =>
  new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
    typographer: true,
  }).use(MarkdownItLinkAttributes, {
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  });

const md = createMarkdownIt();

// Same renderer, but every fenced code block gets a copy button. The click is handled by
// the component through event delegation, because the button lives in injected HTML.
const mdWithCopyableCodeBlocks = createMarkdownIt();
mdWithCopyableCodeBlocks.renderer.rules.fence = (tokens, index) => {
  const label = i18n.translate('wazuh.common.markdown.copyCodeButton', {
    defaultMessage: 'Copy code',
  });
  const code = mdWithCopyableCodeBlocks.utils.escapeHtml(tokens[index].content);

  return `<div class="${CODE_BLOCK_CLASS}"><button type="button" class="${COPY_BUTTON_CLASS}" aria-label="${label}" title="${label}">${label}</button><pre><code>${code}</code></pre></div>\n`;
};

interface MarkdownProps {
  markdown: string;
  className?: string;
  /** Adds a copy button to every fenced code block. */
  copyableCodeBlocks?: boolean;
}

const handleCopyClick = (event: React.MouseEvent<HTMLDivElement>) => {
  const button = (event.target as HTMLElement).closest?.(
    `.${COPY_BUTTON_CLASS}`,
  );
  const code = button?.parentElement?.querySelector('code');

  if (code) {
    copyToClipboard(code.textContent ?? '');
  }
};

export const Markdown = ({
  markdown,
  className = '',
  copyableCodeBlocks = false,
}: MarkdownProps) => (
  <div
    className={classnames(
      'wz-markdown-margin',
      'wz-markdown-wrapper',
      className,
    )}
    {...(copyableCodeBlocks ? { onClick: handleCopyClick } : {})}
    /*
     * Justification for dangerouslySetInnerHTML:
     * Render HTML elements from a markdown text using a function to transform the
     * Markdown into HTML elements
     */
    dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(
        (copyableCodeBlocks ? mdWithCopyableCodeBlocks : md).render(markdown),
      ),
    }}
  ></div>
);
