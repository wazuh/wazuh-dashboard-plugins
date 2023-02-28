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

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
}).use(MarkdownItLinkAttributes, {
  attrs: {
    target: '_blank'
  }
});

interface MarkdownProps{
  markdown: string
  className?: string
};

export const Markdown = ({markdown, className = ''}: MarkdownProps) => (
  <div
    className={classnames('wz-markdown-margin', 'wz-markdown-wrapper', className)}
    /*
     * Justification for dangerouslySetInnerHTML:
     * Render HTML elements from a markdown text using a function to transform the 
     * Markdown into HTML elements
     */
    dangerouslySetInnerHTML={{__html: md.render(markdown)}}>
  </div>
);
