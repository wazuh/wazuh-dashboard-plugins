import { tDocViewerProps } from "./doc-viewer"
import { IndexPattern } from "../../../../../../src/plugins/data/common";

type tUseDocViewerInputs = {
    indexPattern: IndexPattern;
    doc: any;
}

export const useDocViewer = (props: tUseDocViewerInputs): tDocViewerProps => {
    const { indexPattern, doc } = props;

    if (!indexPattern || !doc) {
        return {
            flattened: {},
            formatted: {},
            indexPattern: undefined,
            mapping: undefined
        }
    }

    const mapping = indexPattern?.fields.getByName;
    return {
        flattened: indexPattern?.flattenHit(doc),
        formatted: indexPattern?.formatHit(doc, 'html'),
        indexPattern,
        mapping
    }
}