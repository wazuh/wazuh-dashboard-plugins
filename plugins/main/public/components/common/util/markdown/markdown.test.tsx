/*
 * Wazuh app - Markdown Component - Test
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { Markdown } from './markdown';

describe('Markdown container', () => {
  test('should render the component', () => {
    const component = shallow(<Markdown markdown={'Example text'} />);
    expect(component).toMatchSnapshot();
  });

  test('should render a link', () => {
    const component = shallow(
      <Markdown markdown={`[label](https://example.com)`} />,
    );
    const html = component.html();
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('>label<');
  });

  test('should sanitize dangerous HTML', () => {
    const component = shallow(
      <Markdown markdown={'<script>alert("xss")</script>text'} />,
    );
    const html = component.html();
    expect(html).not.toContain('<script>');
    expect(html).toContain('text');
  });

  describe('copyableCodeBlocks', () => {
    const remediation = [
      '- IF - module is not needed:',
      '',
      '1. Unload the module',
      '2. Disable it',
      '',
      '```',
      '# modprobe -r gfs2 2>/dev/null',
      '# rmmod <gfs2>',
      '```',
    ].join('\n');

    test('should render lists and a copy button per fenced block', () => {
      const html = shallow(
        <Markdown markdown={remediation} copyableCodeBlocks />,
      ).html();
      expect(html).toContain('<ul>');
      expect(html).toContain('<ol>');
      expect(html.match(/wz-markdown-copy-button/g)).toHaveLength(1);
      expect(html).toContain('# modprobe -r gfs2 2&gt;/dev/null');
      expect(html).not.toContain('<h1>');
    });

    test('should not render the copy button by default', () => {
      const html = shallow(<Markdown markdown={remediation} />).html();
      expect(html).not.toContain('wz-markdown-copy-button');
    });

    test('should copy the text of the clicked code block', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const wrapper = mount(
        <Markdown markdown={remediation} copyableCodeBlocks />,
        {
          attachTo: container,
        },
      );
      const execCommand = jest.fn().mockReturnValue(true);
      document.execCommand = execCommand;
      (container.querySelector('button') as HTMLElement).click();
      expect(execCommand).toHaveBeenCalledWith('copy');
      wrapper.unmount();
      container.remove();
    });

    test('should keep placeholders and straight quotes in flat text', () => {
      const html = shallow(
        <Markdown
          markdown={
            'sudo visudo -f <PATH TO FILE> and set GRUB="apparmor=1" for <USERNAME>'
          }
          copyableCodeBlocks
        />,
      ).html();
      expect(html).toContain('&lt;PATH TO FILE&gt;');
      expect(html).toContain('&lt;USERNAME&gt;');
      expect(html).toContain('GRUB="apparmor=1"');
      expect(html).not.toContain('“');
    });

    test('should keep backslashes in flat text', () => {
      const html = shallow(
        <Markdown
          markdown={
            'grep -P \'pam_pwhistory\\.so\' and echo "Mode: \\"$l_mode\\" \\:$l_max" in \\/etc'
          }
          copyableCodeBlocks
        />,
      ).html();
      expect(html).toContain('pam_pwhistory\\.so');
      expect(html).toContain('\\"$l_mode\\"');
      expect(html).toContain('\\:$l_max');
      expect(html).toContain('\\/etc');
    });

    test('should keep bold in remediations', () => {
      const html = shallow(
        <Markdown markdown={'**WARNING:** review first'} copyableCodeBlocks />,
      ).html();
      expect(html).toContain('<strong>WARNING:</strong>');
    });

    test('should keep consuming backslash escapes with the default renderer', () => {
      const html = shallow(<Markdown markdown={'a \\. b'} />).html();
      expect(html).toContain('a . b');
    });

    test('should not render headings for command comments', () => {
      const html = shallow(
        <Markdown
          markdown={'# command\nsome text\n=====\nmore'}
          copyableCodeBlocks
        />,
      ).html();
      expect(html).not.toMatch(/<h[1-6]/);
      expect(html).toContain('# command');
    });

    test('should escape a forged copy button', () => {
      const html = shallow(
        <Markdown
          markdown={
            '<button class="wz-markdown-copy-button">Learn more</button>\n\n```\nreal\n```'
          }
          copyableCodeBlocks
        />,
      ).html();
      expect(html.match(/<button/g)).toHaveLength(1);
    });

    test('should keep rendering HTML and headings with the default renderer', () => {
      const html = shallow(
        <Markdown markdown={'# Title\n\nUse <code>ls</code>'} />,
      ).html();
      expect(html).toContain('<h1>');
      expect(html).toContain('<code>ls</code>');
    });

    test('should keep sanitizing HTML inside fenced blocks and text', () => {
      const html = shallow(
        <Markdown
          markdown={
            '<img src=x onerror=alert(1)>\n\n```\n<script>x</script>\n```'
          }
          copyableCodeBlocks
        />,
      ).html();
      expect(html).not.toContain('<img');
      expect(html).not.toContain('<script>');
    });
  });
});
