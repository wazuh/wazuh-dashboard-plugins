const chai = require('chai');
const needle = require('needle');
const { PLUGIN_PLATFORM_REQUEST_HEADERS } = require('../../common/constants');
const elasticServer = process.env.WAZUH_ELASTIC_IP || 'localhost';
chai.should();

const headers = {
  headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json' }
};

const date = new Date();
const day = date.getDate();
const month = date.getMonth() + 1;
const index = `wazuh-alerts-2018.${month >= 10 ? month : `0${month}`}.${
  day >= 10 ? day : `0${day}`
}`;

const commonFields = sample => {
  sample.agent.id.should.be.a('string');
  sample.agent.should.be.a('object');
  sample.agent.name.should.be.a('string');
  sample.agent.id.should.be.a('string');
  sample.agent.id.length.should.be.eql(3);
  sample.rule.should.be.a('object');
};

const checkRes = res => {
  res.statusCode.should.be.eql(200);
  res.body.should.be.a('object');
  res.body.hits.hits.should.be.a('array');
};

const syscheck = async agentID => {
  const res = await needle(
    'get',
    `${elasticServer}:9200/${index}/_search`,
    {
      query: {
        bool: {
          must: [
            { match: { 'agent.id': `${agentID}` } },
            { match: { 'rule.groups': 'syscheck' } }
          ]
        }
      }
    },
    headers
  );

  if (!res.body.hits.hits.length) {
    throw new Error('There are no alerts to check!');
  }

  const sample = res.body.hits.hits[0]._source;

  checkRes(res);
  commonFields(sample);
  sample.syscheck.should.be.a('object');
  sample.rule.groups.should.be.a('array').that.includes('syscheck');
  sample.manager.should.be.a('object');
  sample.manager.name.should.be.a('string');
  sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json');
  sample.location.should.be.eql('syscheck');
  sample.cluster.should.be.a('object');
  sample.cluster.name.should.be.eql('wazuh');
  sample.cluster.node.should.be.eql('node01');
};

const rootcheck = async agentID => {
  const res = await needle(
    'get',
    `${elasticServer}:9200/${index}/_search`,
    {
      query: {
        bool: {
          must: [
            { match: { 'agent.id': `${agentID}` } },
            { match: { 'rule.groups': 'rootcheck' } }
          ]
        }
      }
    },
    headers
  );

  if (!res.body.hits.hits.length) {
    throw new Error('There are no alerts to check!');
  }

  const sample = res.body.hits.hits[0]._source;

  checkRes(res);
  commonFields(sample);
  sample.rule.groups.should.be.a('array').that.includes('rootcheck');
  sample.manager.should.be.a('object');
  sample.manager.name.should.be.a('string');
  sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json');
  sample.location.should.be.eql('rootcheck');
  sample.cluster.should.be.a('object');
  sample.cluster.name.should.be.eql('wazuh');
  sample.cluster.node.should.be.eql('node01');
};

const vulnerability = async agentID => {
  const res = await needle(
    'get',
    `${elasticServer}:9200/${index}/_search`,
    {
      query: {
        bool: {
          must: [
            { match: { 'agent.id': `${agentID}` } },
            { match: { 'rule.groups': 'vulnerability-detector' } }
          ]
        }
      }
    },
    headers
  );

  if (!res.body.hits.hits.length) {
    throw new Error('There are no alerts to check!');
  }

  const sample = res.body.hits.hits[0]._source;

  checkRes(res);
  commonFields(sample);
  sample.data.should.be.a('object');
  sample.data.vulnerability.should.be.a('object');
  sample.data.vulnerability.reference.should.be.a('string');
  sample.data.vulnerability.package.condition.should.be.a('string');
  sample.data.vulnerability.package.patch.should.be.a('string');
  sample.data.vulnerability.title.should.be.a('string');
  sample.data.vulnerability.severity.should.be.a('string');
  sample.data.vulnerability.state.should.be.a('string');
  sample.data.vulnerability.cve.should.be.a('string');
  sample.rule.groups.should.be
    .a('array')
    .that.includes('vulnerability-detector');
  sample.manager.should.be.a('object');
  sample.manager.name.should.be.a('string');
  sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json');
  sample.location.should.be.eql('vulnerability-detector');
  sample.cluster.should.be.a('object');
  sample.cluster.name.should.be.eql('wazuh');
  sample.cluster.node.should.be.eql('node01');
};

const pciDss = async agentID => {
  const res = await needle(
    'get',
    `${elasticServer}:9200/${index}/_search`,
    {
      query: {
        bool: {
          must: [
            { match: { 'agent.id': `${agentID}` } },
            { exists: { field: 'rule.pci_dss' } }
          ]
        }
      }
    },
    headers
  );

  if (!res.body.hits.hits.length) {
    throw new Error('There are no alerts to check!');
  }

  const sample = res.body.hits.hits[0]._source;

  checkRes(res);
  commonFields(sample);
  sample.rule.pci_dss.should.be.a('array');
  sample.manager.should.be.a('object');
  sample.manager.name.should.be.a('string');
  sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json');
  sample.cluster.should.be.a('object');
  sample.cluster.name.should.be.eql('wazuh');
  sample.cluster.node.should.be.eql('node01');
};

const gdpr = async agentID => {
  const res = await needle(
    'get',
    `${elasticServer}:9200/${index}/_search`,
    {
      query: {
        bool: {
          must: [
            { match: { 'agent.id': `${agentID}` } },
            { exists: { field: 'rule.gdpr' } }
          ]
        }
      }
    },
    headers
  );

  if (!res.body.hits.hits.length) {
    throw new Error('There are no alerts to check!');
  }

  const sample = res.body.hits.hits[0]._source;

  checkRes(res);
  commonFields(sample);
  sample.rule.gdpr.should.be.a('array');
  sample.manager.should.be.a('object');
  sample.manager.name.should.be.a('string');
  sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json');
  sample.cluster.should.be.a('object');
  sample.cluster.name.should.be.eql('wazuh');
  sample.cluster.node.should.be.eql('node01');
};

const audit = async agentID => {
  const res = await needle(
    'get',
    `${elasticServer}:9200/${index}/_search`,
    {
      query: {
        bool: {
          must: [
            { match: { 'agent.id': `${agentID}` } },
            { match: { 'rule.groups': 'audit' } }
          ]
        }
      }
    },
    headers
  );

  if (!res.body.hits.hits.length) {
    throw new Error('There are no alerts to check!');
  }

  const sample = res.body.hits.hits[0]._source;

  checkRes(res);
  commonFields(sample);
  sample.data.should.be.a('object');
  sample.rule.groups.should.be.a('array').that.includes('audit');
  sample.manager.should.be.a('object');
  sample.manager.name.should.be.a('string');
  sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json');
  sample.location.should.be.eql('/var/log/audit/audit.log');
  sample.cluster.should.be.a('object');
  sample.cluster.name.should.be.eql('wazuh');
  sample.cluster.node.should.be.eql('node01');
};

describe('Elasticsearch', () => {
  it('GET /_cat/indices', async () => {
    const res = await needle(
      'get',
      `${elasticServer}:9200/_cat/indices`,
      {},
      headers
    );
    res.statusCode.should.be.eql(200);
    res.body.should.be.a('string');
  });

  it(`GET /_cat/indices/${index}`, async () => {
    const res = await needle(
      'get',
      `${elasticServer}:9200/_cat/indices/${index}`,
      {},
      headers
    );
    res.statusCode.should.be.eql(200);
    res.body.should.be.a('string');
  });

  describe('Manager (agent.id: 000)', () => {
    it(`GET /${index}/_search - vulnerability-detector`, async () =>
      vulnerability('000'));
    it(`GET /${index}/_search - syscheck`, async () => syscheck('000'));
    it(`GET /${index}/_search - rootcheck`, async () => rootcheck('000'));
    it(`GET /${index}/_search - pci_dss`, async () => pciDss('000'));
    it(`GET /${index}/_search - gdpr`, async () => gdpr('000'));
    it(`GET /${index}/_search - audit`, async () => audit('000'));
  });

  describe('Agent (agent.id: 001)', () => {
    it(`GET /${index}/_search - vulnerability-detector`, async () =>
      vulnerability('001'));
    it(`GET /${index}/_search - syscheck`, async () => syscheck('001'));
    it(`GET /${index}/_search - rootcheck`, async () => rootcheck('001'));
    it(`GET /${index}/_search - pci_dss`, async () => pciDss('001'));
    it(`GET /${index}/_search - gdpr`, async () => gdpr('001'));
    it(`GET /${index}/_search - audit`, async () => audit('001'));
  });
});
