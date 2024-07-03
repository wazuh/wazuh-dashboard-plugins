/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const reportingStyle = `
html,
body {
  margin: 0;
  padding: 0;
  padding-top: 0px;
}

iframe, embed, object {
  display: none !important;
}

.reportWrapper {
  padding: 8px;
}

/* Notice that I'm using an ID of #reportingHeader, and #reportingFooter, instead of a classname (.reportingHeader, .reportingFooter). This is
  in order to force specificity here higher in case any other styles would conflict */
#reportingHeader,
#reportingFooter {
  border: 1px solid #d3dae6;
  box-shadow: 0 2px 2px -1px rgba(152, 162, 179, 0.3),
  0 1px 5px -2px rgba(152, 162, 179, 0.3);
  border-radius: 4px;
  padding: 1em;
  margin-bottom: 1em;
}

#reportingFooter {
  margin-top: 1em;
}

#reportingHeader p,
#reportingFooter p {
  max-width: 960px;
}

/* Adjust the margin when the header is the first item */
#reportingHeader h1:first-child,
#reportingFooter h1:first-child,
#reportingHeader h2:first-child,
#reportingFooter h2:first-child,
#reportingHeader h3:first-child,
#reportingFooter h3:first-child,
#reportingHeader h4:first-child,
#reportingFooter h4:first-child,
#reportingHeader h5:first-child,
#reportingFooter h5:first-child,
#reportingHeader h6:first-child,
#reportingFooter h6:first-child {
  margin-top: 0.25em;
}

/* nicer list styles */
#reportingHeader ul,
#reportingFooter ul,
#reportingHeader ol,
#reportingFooter ol {
  max-width: 70rem;
  margin-bottom: 1em;
}

#reportingHeader ul li,
#reportingFooter ul li,
#reportingHeader ol li,
#reportingFooter ol li {
  margin-bottom: 0.25em;
  margin-left: -0.5em;
  padding-left: 0.25em;
}

#reportingHeader ul,
#reportingFooter ul {
  list-style-type: disc;
}

/* here we explicitly set nested paragraphs inside lists to inherit their styles from the list, in case markdown does funky things */
#reportingHeader ul p,
#reportingFooter ul p,
#reportingHeader ol p,
#reportingFooter ol p {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  /* We only inherit vertical spacing, not horizontal */
  margin-top: inherit;
  margin-bottom: inherit;
}
</style>
<style>
/* mde style sheet*/
.mde-preview .mde-preview-content {
  padding: 10px;
}
.mde-preview .mde-preview-content p,
.mde-preview .mde-preview-content blockquote,
.mde-preview .mde-preview-content ul,
.mde-preview .mde-preview-content ol,
.mde-preview .mde-preview-content dl,
.mde-preview .mde-preview-content table,
.mde-preview .mde-preview-content pre {
  margin-top: 0;
  margin-bottom: 16px;
}
.mde-preview .mde-preview-content h1,
.mde-preview .mde-preview-content h2,
.mde-preview .mde-preview-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  padding-bottom: 0.3em;
}
.mde-preview .mde-preview-content h1 {
  font-size: 1.6em;
  border-bottom: 1px solid #eee;
}
.mde-preview .mde-preview-content h2 {
  font-size: 1.4em;
}
.mde-preview .mde-preview-content h3 {
  font-size: 1.2em;
}
.mde-preview .mde-preview-content ul,
.mde-preview .mde-preview-content ol {
  padding-left: 2em;
}
.mde-preview .mde-preview-content blockquote {
  margin-left: 0;
  padding: 0 1em;
  color: #777;
  border-left: 0.25em solid #ddd;
}
.mde-preview .mde-preview-content blockquote > :first-child {
  margin-top: 0;
}
.mde-preview .mde-preview-content blockquote > :last-child {
  margin-bottom: 0;
}
.mde-preview .mde-preview-content code {
  padding: 0.2em 0 0.2em 0;
  margin: 0;
  font-size: 90%;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
}

.mde-preview .mde-preview-content pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f7f7f7;
  border-radius: 3px;
}
.mde-preview .mde-preview-content pre code {
  display: inline;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}
.mde-preview .mde-preview-content pre code::before,
.mde-preview .mde-preview-content pre code::after {
  content: none;
}
.mde-preview .mde-preview-content pre > code {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
}
.mde-preview .mde-preview-content a {
  color: #4078c0;
  text-decoration: none;
}
.mde-preview .mde-preview-content a:hover {
  text-decoration: underline;
}
.mde-preview .mde-preview-content > *:first-child {
  margin-top: 0 !important;
}
.mde-preview .mde-preview-content > *:last-child {
  margin-bottom: 0 !important;
}
.mde-preview .mde-preview-content::after {
  display: table;
  clear: both;
  content: '';
}
.mde-preview .mde-preview-content table {
  display: block;
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
}
.mde-preview .mde-preview-content table thead th {
  font-weight: bold;
}
.mde-preview .mde-preview-content table th,
.mde-preview .mde-preview-content table td {
  padding: 6px 13px;
  border: 1px solid #c8ccd0;
}
`;
