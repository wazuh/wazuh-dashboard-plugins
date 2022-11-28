import _ from 'lodash';

// Utility functions extracted from Kibana 7.10.2 and adapted to use in Kibana >= 7.16
export const formatField = function (hit: Record<string, any>, fieldName: string, indexPattern: any) {
  const val = fieldName === '_source' ? hit._source : indexPattern.flattenHit(hit)[fieldName];
  return convert(hit, val, fieldName, indexPattern);
}

export const formatHit = function (hit: Record<string, any>, indexPattern: any, type: string = 'html') {
  if (type === 'text') {
    const flattened = indexPattern.flattenHit(hit);
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(flattened)) {
      result[key] = convert(hit, value, key, indexPattern, type);
    }
    return result;
  }

  const cache: Record<string, any> = {};

  _.forOwn(indexPattern.flattenHit(hit), function (val: any, fieldName?: string) {
    // sync the formatted and partial cache
    if (!fieldName) {
      return;
    }
    cache[fieldName] = convert(hit, val, fieldName, indexPattern);
  });

  return cache;
}

const convert = (
  hit: Record<string, any>,
  val: any,
  fieldName: string,
  indexPattern: any,
  type: 'html' | 'text' = 'html'
): string => {
  // Get the field definition by name
  const field = indexPattern.fields.getByName(fieldName);

  if (!field) {
    return Array.isArray(val) ?
      indexPattern.getFormatterForField('_index')// If the field is a nested field it has to be formatted whether it is known or not
        .convert(val, type, { field, hit, indexPattern })
      : val;// If the field is not known, just return the value as it is.
  } else {
    const format = indexPattern.getFormatterForField(field);
    return format.convert(val, type, { field, hit, indexPattern });
  }
}
