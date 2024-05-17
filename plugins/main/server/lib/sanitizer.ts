import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

function sanitizeCSV(svgString: string) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  const cleanSVG = DOMPurify.sanitize(svgString);
  return cleanSVG;
}
export { sanitizeCSV };
