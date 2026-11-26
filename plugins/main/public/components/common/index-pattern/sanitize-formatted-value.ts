import DOMPurify from 'dompurify';

type DOMPurifyInstance = ReturnType<typeof DOMPurify>;

const SAFE_REL = 'noopener noreferrer';

let purifier: DOMPurifyInstance | undefined;

/*
 * Use a dedicated instance so the hook below does not change the behaviour of
 * other consumers of the default DOMPurify instance (for example, the markdown
 * renderer).
 */
const getPurifier = (): DOMPurifyInstance => {
  if (!purifier) {
    purifier = DOMPurify(window);
    purifier.addHook('afterSanitizeAttributes', node => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).hasAttribute('target')
      ) {
        (node as Element).setAttribute('rel', SAFE_REL);
      }
    });
  }
  return purifier;
};

/**
 * Sanitize the HTML produced by the index pattern field formatters before it is
 * rendered with dangerouslySetInnerHTML. The `target` attribute is kept so the
 * url formatter "open in a new tab" setting still works, and any element with a
 * `target` gets `rel="noopener noreferrer"`.
 */
export const sanitizeFormattedValue = (value: string): string =>
  getPurifier().sanitize(value, { ADD_ATTR: ['target'] });
