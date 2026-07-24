/**
 * Splits an array into batches of at most `size` elements each.
 * @param {Array} array array to split
 * @param {number} size max size of each batch
 * @returns {Array[]} array of batches
 */
function batch(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

// Output formats. Each entry is { doc, index } so bulk-api can route every
// document to its own resolved index (needed when --all / --all-findings mixes
// datasets with different default indices).
const formats = {
  ndjson: {
    description: 'Format the documents to ndjson. Each line is a document.',
    run: entries => entries.map(e => JSON.stringify(e.doc)).join('\n'),
  },
  'bulk-api': {
    description:
      'Format the documents to OpenSearch or Elasticsearch Bulk API.',
    run: entries =>
      entries
        .map(
          e => `{"create": {"_index": "${e.index}"}}\n${JSON.stringify(e.doc)}`,
        )
        .join('\n') + '\n',
  },
};

module.exports = {
  batch,
  formats,
};
