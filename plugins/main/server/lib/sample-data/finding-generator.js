const { loadDocs } = require('./shared-utils');
const random = require('./lib/random');

const EVENT_TIMESTAMPS = ['created', 'start', 'end'];
const DAYS = 30;

const docsCache = new Map();

function getDocs(targetDir) {
  if (!docsCache.has(targetDir)) {
    docsCache.set(targetDir, loadDocs(targetDir));
  }
  return docsCache.get(targetDir);
}

function setIfPresent(obj, key, value) {
  if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
    obj[key] = value;
  }
}

function generateFinding(params = {}, targetDir) {
  const { index } = params;
  const docs = getDocs(targetDir);
  const baseIdx =
    typeof index === 'number'
      ? index % docs.length
      : Math.floor(Math.random() * docs.length);
  const doc = JSON.parse(JSON.stringify(docs[baseIdx]));
  const iso = random.date(DAYS);
  doc['@timestamp'] = iso;
  if (doc.event && typeof doc.event === 'object') {
    for (const key of EVENT_TIMESTAMPS) {
      setIfPresent(doc.event, key, iso);
    }
  }
  doc.wazuh = doc.wazuh || {};
  doc.wazuh.cluster = {
    name: params?.cluster?.name || 'wazuh',
    node: params?.cluster?.node || 'node01',
  };
  return doc;
}

module.exports = { generateFinding };
