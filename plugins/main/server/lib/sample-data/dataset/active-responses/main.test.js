const fs = require('fs');
const path = require('path');
const { generateDocument } = require('./main');

const { mappings } = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'template.json'), 'utf8'),
).template;

// Every leaf of the document, where an array counts as a leaf (its items share the mapping).
const leafPaths = (value, prefix = '') => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [prefix];
};

const isMapped = fieldPath => {
  let node = mappings;

  for (const part of fieldPath.split('.')) {
    node = node?.properties?.[part];
  }

  return Boolean(node);
};

const documents = Array.from({ length: 200 }, () => generateDocument({}));

describe('active-responses sample data', () => {
  it('only emits fields mapped by the strict template', () => {
    const unmapped = documents
      .flatMap(document => leafPaths(document))
      .filter(fieldPath => !isMapped(fieldPath));

    expect([...new Set(unmapped)]).toEqual([]);
  });

  it('assigns the documents to the wazuh cluster', () => {
    documents.forEach(({ wazuh }) => expect(wazuh.cluster.name).toBe('wazuh'));
  });

  it('sets the timeout only on stateful responses', () => {
    documents.forEach(({ wazuh: { active_response: response } }) => {
      expect(['stateful', 'stateless']).toContain(response.type);
      expect('stateful_timeout' in response).toBe(response.type === 'stateful');
    });
  });

  it('sets the agent of the response only for the defined-agent location', () => {
    documents.forEach(({ wazuh: { active_response: response } }) => {
      expect(['local', 'all', 'defined-agent']).toContain(response.location);
      expect('agent_id' in response).toBe(
        response.location === 'defined-agent',
      );
    });
  });
});
