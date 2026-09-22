/**
 * @jest-environment node
 */
import {
  icuPlaceholders,
  renderFailures,
  scanSourceText,
} from './i18n-strings-gate';

const scan = (text: string, fileName = '/plugin/public/component.tsx') =>
  scanSourceText(fileName, text, '/plugin');

describe('icuPlaceholders', () => {
  it('names only the arguments a caller has to supply', () => {
    expect(icuPlaceholders('Ask about {name}')).toEqual(['name']);
    expect(icuPlaceholders('Request failed (HTTP {status}): {detail}')).toEqual(
      ['detail', 'status'],
    );
    expect(icuPlaceholders('Nothing to interpolate')).toEqual([]);
  });

  it('ignores plural and select branch bodies', () => {
    // Regression: a depth-blind scan read the single-word branch bodies as arguments.
    expect(
      icuPlaceholders(
        'Delete the selected {count, plural, one {conversation} other {conversations}}?',
      ),
    ).toEqual(['count']);
    expect(
      icuPlaceholders('{kind, select, chat {chat} other {other}}'),
    ).toEqual(['kind']);
    expect(
      icuPlaceholders(
        ' (+{count, plural, one {# more field} other {# more fields}} per row.)',
      ),
    ).toEqual(['count']);
  });

  it('still sees arguments that follow a nested block', () => {
    expect(
      icuPlaceholders(
        '{count, plural, one {one thing} other {# things}} for {name}',
      ),
    ).toEqual(['count', 'name']);
  });

  it('treats backslash-escaped braces as literal text', () => {
    expect(icuPlaceholders('Use \\{\\} for an empty object')).toEqual([]);
    expect(icuPlaceholders('Use \\{name\\} or {value}')).toEqual(['value']);
  });

  it('does not derail on unbalanced braces', () => {
    // Malformed messages are the render check's job; this must not throw or mis-scan the rest.
    expect(icuPlaceholders('Algo {salio mal')).toEqual([]);
    expect(icuPlaceholders('Stray } then {name}')).toEqual(['name']);
  });
});

describe('scanSourceText', () => {
  it('extracts i18n.translate calls and <FormattedMessage> elements', () => {
    const { messages, unrecognized, conflicts } = scan(`
      import { i18n } from '@osd/i18n';
      import { FormattedMessage } from '@osd/i18n/react';
      const title = i18n.translate('wazuh.home.app.title', {
        defaultMessage: 'Over' + 'view',
      });
      const node = (
        <FormattedMessage id="wazuh.home.app.description" defaultMessage="Don't panic" />
      );
    `);
    expect(unrecognized).toEqual([]);
    expect(conflicts).toEqual([]);
    expect(messages.get('wazuh.home.app.title')).toEqual({
      defaultMessage: 'Overview',
      location: 'public/component.tsx:4',
    });
    expect(messages.get('wazuh.home.app.description')?.defaultMessage).toBe(
      "Don't panic",
    );
  });

  it('rejects an id built at runtime', () => {
    expect(() =>
      scan(
        "i18n.translate(`wazuh.${area}.title`, { defaultMessage: 'Title' });",
      ),
    ).toThrow(/must be static string literals.*public\/component\.tsx:1/);
  });

  it('rejects a translate call with no static defaultMessage', () => {
    expect(() =>
      scan("i18n.translate('wazuh.home.app.title', { defaultMessage: text });"),
    ).toThrow(/must be static string literals/);
    expect(() => scan("i18n.translate('wazuh.home.app.title');")).toThrow(
      /has no static defaultMessage/,
    );
  });

  it('reports one id used for two different messages', () => {
    const { conflicts } = scan(`
      i18n.translate('wazuh.a.b.c', { defaultMessage: 'One' });
      i18n.translate('wazuh.a.b.c', { defaultMessage: 'One' });
      i18n.translate('wazuh.a.b.c', { defaultMessage: 'Two' });
    `);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatch(/^wazuh\.a\.b\.c: "One" at .*"Two" at /);
  });

  it('flags i18n usage it cannot extract', () => {
    const { unrecognized } = scan(`
      import { i18n as intl } from '@osd/i18n';
      intl.translate('wazuh.a.b.c', { defaultMessage: 'Hidden' });
      props.intl.formatMessage({ id: 'wazuh.a.b.d' });
      const node = <FormattedHTMLMessage id="wazuh.a.b.e" defaultMessage="Html" />;
    `);
    expect(unrecognized).toHaveLength(4);
    expect(unrecognized.join('\n')).toMatch(/i18n imported as intl/);
    expect(unrecognized.join('\n')).toMatch(/intl\.translate/);
    expect(unrecognized.join('\n')).toMatch(/props\.intl\.formatMessage/);
    expect(unrecognized.join('\n')).toMatch(/<FormattedHTMLMessage>/);
  });
});

describe('renderFailures', () => {
  it('accepts valid messages, including escaped braces', () => {
    expect(
      renderFailures([
        ['wazuh.a.b.plain', 'Plain text'],
        ['wazuh.a.b.arg', 'Value should be lower or equal than {max}.'],
        ['wazuh.a.b.plural', '{count, plural, one {# hit} other {# hits}}'],
        ['wazuh.a.b.brace', 'Use \\{\\} for an empty object'],
      ]),
    ).toEqual([]);
  });

  it('reports a plural missing its other branch and an unbalanced brace', () => {
    const problems = renderFailures([
      ['wazuh.a.b.noOther', '{count, plural, one {# hit}}'],
      ['wazuh.a.b.unbalanced', 'Use {} for an empty object'],
    ]);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/^wazuh\.a\.b\.noOther /);
    expect(problems[1]).toMatch(/^wazuh\.a\.b\.unbalanced /);
  });
});
