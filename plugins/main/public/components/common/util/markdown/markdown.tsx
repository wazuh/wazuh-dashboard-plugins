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
import classnames from 'classnames';
import { copyToClipboard } from '@elastic/eui';
import { COPY_BUTTON_CLASS, renderMarkdown } from './markdown-renderer';

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
      __html: renderMarkdown(markdown, { copyableCodeBlocks }),
    }}
  ></div>
);
