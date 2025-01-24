const metaFields = [
  {
    name: '_id',
    type: 'string',
    esTypes: ['_id'],
    searchable: true,
    aggregatable: true,
    readFromDocValues: false,
  },
  {
    name: '_index',
    type: 'string',
    esTypes: ['_index'],
    searchable: true,
    aggregatable: true,
    readFromDocValues: false,
  },
  {
    name: '_score',
    type: 'number',
    searchable: false,
    aggregatable: false,
    readFromDocValues: false,
  },
  {
    name: '_source',
    type: '_source',
    esTypes: ['_source'],
    searchable: false,
    aggregatable: false,
    readFromDocValues: false,
  },
];

const esTypes2Types = {
  keyword: 'string',
  text: 'string',
  long: 'number',
  float: 'number',
  integer: 'number',
  short: 'number',
  date: 'date',
  geo_point: 'geo_point',
  ip: 'ip',
  boolean: 'boolean',
};

/**
 * Define the index pattern fields mappers for esTypes (Wazuh indexer types)
 */
const esTypes2IndexPatternFieldMappers = {
  flat_object: (key, value) => {
    return [
      {
        name: key,
        type: 'unknown',
        esTypes: ['flat_object'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      {
        name: `${key}.`,
        type: 'unknown',
        esTypes: ['flat_object'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        subType: {
          multi: {
            parent: key,
          },
        },
      },
      {
        name: `${key}._value`,
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        subType: {
          multi: {
            parent: key,
          },
        },
      },
      {
        name: `${key}._valueAndPath`,
        type: 'string',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        subType: {
          multi: {
            parent: key,
          },
        },
      },
    ];
  },
  object: (name, value) => {
    console.error(`WARNING: ${name} field is [${value.type}] and is ignored.`);
    return []; // no add index pattern field
  },
  default: (name, value) => {
    const type = mapEsTypes2Types(name, value.type);
    return [
      {
        name: name,
        type: type,
        esTypes: [value.type],
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
    ];
  },
};

/**
 * Map the Wazuh indexer type to Wazuh dashboard type used by the index patterns
 * @param {*} name
 * @param {*} type
 * @returns
 */
function mapEsTypes2Types(name, type) {
  let result = esTypes2Types[type];
  if (!result) {
    console.error(`WARNING: ${name} field has no esType, assigning [${type}]`);
    result = type;
  }
  return result;
}

/**
 * Get the property field path taking into account the parent property path
 * @param {string} parentPathProp
 * @param {string} pathProp
 * @returns
 */
function concatPathProp(parentPathProp, pathProp) {
  return [parentPathProp, pathProp].filter(v => v).join('.');
}

/**
 * Map the template field to index pattern field
 * @param {*} name
 * @param {*} property
 * @returns
 */
function mapTemplateFieldToIndexPatternField(name, property) {
  return (
    esTypes2IndexPatternFieldMappers[property.type] ||
    esTypes2IndexPatternFieldMappers.default
  )(name, property);
}

/**
 * Map properties to index pattern fields
 * @param {*} properties
 * @param {*} store
 * @param {*} parentPathProp
 */
function mapPropertiesToIndexPatternFields(
  properties,
  store = [],
  parentPathProp = '',
) {
  if (typeof properties === 'object') {
    Object.entries(properties).forEach(([key, value]) => {
      if (value.properties) {
        mapPropertiesToIndexPatternFields(
          value.properties,
          store,
          concatPathProp(parentPathProp, key),
        );
      } else {
        const name = concatPathProp(parentPathProp, key);
        store.push(...mapTemplateFieldToIndexPatternField(name, value));
      }
    });
  }
}

/**
 * Map the template mappings to index pattern fields. Add the metafields.
 * @param {*} template
 * @returns
 */
function mapTemplateToIndexPatternFields(template) {
  const fields = [];

  mapPropertiesToIndexPatternFields(template.mappings.properties, fields);

  return [...metaFields, ...fields];
}

module.exports.mapTemplateToIndexPatternFields =
  mapTemplateToIndexPatternFields;
