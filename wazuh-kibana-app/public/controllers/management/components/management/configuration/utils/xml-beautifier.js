/*
 * Wazuh app - Module for XML beautify
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export default xml => {
  const reg = /(>)\s*(<)(\/*)/g; // updated Mar 30, 2015
  const wsexp = / *(.*) +\n/g;
  const contexp = /(<.+>)(.+\n)/g;
  xml = xml
    .replace(reg, '$1\n$2$3')
    .replace(wsexp, '$1\n')
    .replace(contexp, '$1\n$2');
  let formatted = '';
  const lines = xml.split('\n');
  let indent = 0;
  let lastType = 'other';
  // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
  const transitions = {
    'single->single': 0,
    'single->closing': -1,
    'single->opening': 0,
    'single->other': 0,
    'closing->single': 0,
    'closing->closing': -1,
    'closing->opening': 0,
    'closing->other': 0,
    'opening->single': 1,
    'opening->closing': 0,
    'opening->opening': 1,
    'opening->other': 1,
    'other->single': 0,
    'other->closing': -1,
    'other->opening': 0,
    'other->other': 0
  };

  for (const ln of lines) {
    // Luca Viggiani 2017-07-03: handle optional <?xml ... ?> declaration
    if (ln.match(/\s*<\?xml/)) {
      formatted += ln + '\n';
      continue;
    }
    // ---

    const single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
    const closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
    const opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
    const type = single
      ? 'single'
      : closing
      ? 'closing'
      : opening
      ? 'opening'
      : 'other';
    const fromTo = lastType + '->' + type;
    lastType = type;
    let padding = '';

    indent += transitions[fromTo];
    for (let j = 0; j < indent; j++) {
      padding += '\t';
    }
    if (fromTo == 'opening->closing')
      formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
    // substr removes line break (\n) from prev loop
    else formatted += padding + ln + '\n';
  }

  return formatted;
};
