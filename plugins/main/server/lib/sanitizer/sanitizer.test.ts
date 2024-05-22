import { sanitizeSVG } from './sanitizer';

const mockedFilesContents = [
  {
    original: `<svg xml:space="preserve" style="enable-background:new 0 0 100 100;" viewBox="0 0 100 100" height="100px" width="100px" y="0px" x="0px" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" id="Capa_1" version="1.1">

  <circle id="foo" fill="green" r="45" cy="50" cx="50"></circle>



</svg>`,
    clean: `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">

  <circle cx="50" cy="50" r="45" fill="green" id="foo"></circle>



</svg>`,
  },
  { original: '<img src=x onerror=alert(1)//>', clean: '<img src="x">' },
  { original: '<svg><g/onload=alert(2)//<p>', clean: '<svg><g></g></svg>' },
  {
    original: '<p>abc<iframe//src=jAva&Tab;script:alert(3)>def</p>',
    clean: '<p>abc</p>',
  },
  {
    original: '<math><mi//xlink:href="data:x,<script>alert(4)</script>">',
    clean: '<math><mi></mi></math>',
  },
  {
    original: '<TABLE><tr><td>HELLO</tr></TABL>',
    clean: '<table><tbody><tr><td>HELLO</td></tr></tbody></table>',
  },
  {
    original: '<UL><li><A HREF=//google.com>click</UL>',
    clean: '<ul><li><a href="//google.com">click</a></li></ul>',
  },
];

describe('[Sanitize SVG] SVG files sample contents are properly cleaned', () => {
  it('Check output of sanitized sample contents', () => {
    mockedFilesContents.forEach(mockedFileContent => {
      const sanitizedContent = sanitizeSVG(mockedFileContent.original);
      expect(sanitizedContent).toBe(mockedFileContent.clean);
    });
  });
});
