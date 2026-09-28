import {
  neutralizeMarkdownImages,
  stripImageMarkersFromProse,
} from './neutralize-markdown-images';

describe('neutralizeMarkdownImages', () => {
  it('turns a plain inline image into a link, leaving no image marker', () => {
    expect(neutralizeMarkdownImages('![alt](http://x/1)')).toBe(
      '[alt](http://x/1)',
    );
  });

  it('neutralizes an image whose alt text contains an escaped bracket', () => {
    expect(neutralizeMarkdownImages('![a\\]b](http://x/2)')).toBe(
      '[a\\]b](http://x/2)',
    );
  });

  it('neutralizes an image whose alt text contains nested brackets', () => {
    expect(neutralizeMarkdownImages('![a[b]c](http://x/3)')).toBe(
      '[a[b]c](http://x/3)',
    );
  });

  it('neutralizes a shortcut reference image, leaving its link definition intact', () => {
    expect(neutralizeMarkdownImages('See ![ref]\n\n[ref]: http://x/4')).toBe(
      'See [ref]\n\n[ref]: http://x/4',
    );
  });

  it('neutralizes a full and a collapsed reference image', () => {
    expect(neutralizeMarkdownImages('![a][b] and ![c]')).toBe('[a][b] and [c]');
  });

  it('neutralizes an image after an escaped backtick, keeping the real code span that follows', () => {
    // The escaped backtick is a literal, not a code-span opener; a naive split would treat
    // "` ![x](..) `" as a code span and skip the image.
    expect(neutralizeMarkdownImages('a \\` ![x](http://x/5) `code`')).toBe(
      'a \\` [x](http://x/5) `code`',
    );
  });

  it('collapses several bangs before a bracket so no image marker survives', () => {
    expect(neutralizeMarkdownImages('!!![x](http://x/6)')).toBe(
      '[x](http://x/6)',
    );
  });

  it('leaves an image inside an inline code span untouched', () => {
    expect(neutralizeMarkdownImages('use `![x](http://x/7)` here')).toBe(
      'use `![x](http://x/7)` here',
    );
  });

  it('leaves an image inside a fenced code block untouched', () => {
    const fenced = '```\n![x](http://x/8)\n```';
    expect(neutralizeMarkdownImages(fenced)).toBe(fenced);
  });

  it('does not touch a bang that is not immediately before a bracket', () => {
    expect(
      neutralizeMarkdownImages('Done! [link](http://x/9) and 5 != [1]'),
    ).toBe('Done! [link](http://x/9) and 5 != [1]');
  });

  it('exposes the prose-only helper for reuse in the string sanitizer', () => {
    expect(stripImageMarkersFromProse('![x](u)')).toBe('[x](u)');
  });
});
