import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { TDocViewerProps } from './doc-viewer';

interface TUseDocViewerInputs {
  indexPattern: IndexPattern;
  doc: any;
}

export const useDocViewer = (props: TUseDocViewerInputs): TDocViewerProps => {
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
