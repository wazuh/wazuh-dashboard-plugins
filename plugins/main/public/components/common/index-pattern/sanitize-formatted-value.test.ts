import dompurify from 'dompurify';
import { sanitizeFormattedValue } from './sanitize-formatted-value';

const toFragment = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

describe('sanitizeFormattedValue', () => {
  it('removes script elements', () => {
    const fragment = toFragment(
      sanitizeFormattedValue('safe<script>alert(1)</script>'),
    );

    expect(fragment.querySelector('script')).toBeNull();
    expect(fragment.textContent).toBe('safe');
  });

  it('removes event handler attributes', () => {
    const fragment = toFragment(
      sanitizeFormattedValue('<img src="x" onerror="alert(1)">'),
    );
    const image = fragment.querySelector('img');

    expect(image).not.toBeNull();
    expect(image?.hasAttribute('onerror')).toBe(false);
  });

  it('keeps href and target on links', () => {
    const anchor = toFragment(
      sanitizeFormattedValue(
        '<a href="https://x.example" target="_blank" rel="noopener noreferrer">x</a>',
      ),
    ).querySelector('a');

    expect(anchor?.getAttribute('href')).toBe('https://x.example');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('forces rel noopener noreferrer when a target is present', () => {
    const anchor = toFragment(
      sanitizeFormattedValue(
        '<a href="https://x.example" target="_blank" rel="opener">x</a>',
      ),
    ).querySelector('a');

    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('does not add rel when there is no target', () => {
    const anchor = toFragment(
      sanitizeFormattedValue('<a href="https://x.example">x</a>'),
    ).querySelector('a');

    expect(anchor?.hasAttribute('rel')).toBe(false);
  });

  it('keeps escaped markup as text', () => {
    const fragment = toFragment(
      sanitizeFormattedValue('&lt;b&gt;bold&lt;/b&gt;'),
    );

    expect(fragment.querySelector('b')).toBeNull();
    expect(fragment.textContent).toBe('<b>bold</b>');
  });

  it('does not change the default DOMPurify instance', () => {
    sanitizeFormattedValue('<a href="https://x.example" target="_blank">x</a>');
    const anchor = toFragment(
      dompurify.sanitize('<a href="https://x.example" target="_blank">x</a>'),
    ).querySelector('a');

    expect(anchor?.hasAttribute('target')).toBe(false);
    expect(anchor?.hasAttribute('rel')).toBe(false);
  });
});
