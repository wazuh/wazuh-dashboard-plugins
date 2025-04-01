import { IndexPattern } from 'src/plugins/data/public';
import { tDocViewerProps } from './doc-viewer';

interface UseDocViewerInputs {
  indexPattern: IndexPattern;
  doc: any;
}

export const useDocViewer = (props: UseDocViewerInputs): tDocViewerProps => {
  const { indexPattern, doc } = props;

  if (!indexPattern || !doc) {
    return {
      flattened: {},
      formatted: {},
      indexPattern: undefined,
      mapping: undefined,
    };
  }

  const mapping = indexPattern?.fields.getByName;

  return {
    flattened: indexPattern?.flattenHit(doc),
    formatted: indexPattern?.formatHit(doc, 'html'),
    indexPattern,
    mapping,
    docJSON: doc._source,
  };
};
