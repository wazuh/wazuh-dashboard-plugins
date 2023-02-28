const chai = require('chai');
const needle = require('needle');
const { PLUGIN_PLATFORM_REQUEST_HEADERS } = require('../../common/constants');

chai.should();

const headers = {
  headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json' }
};

let API_ID = null;
let API_PORT = null;
let API_URL = null;
let API_USERNAME = null;

describe('wazuh-api', () => {
  before(async () => {
    const res = await needle('get', `localhost:5601/elastic/apis`, {}, {});

    /* eslint-disable */
    if (!res.body || !res.body.length) {
      console.log('There are no APIs stored in Elasticsearch, exiting...');
      process.exit(1);
    }
    /* eslint-enable */

    API_ID = res.body[0]._id;
    API_URL = res.body[0]._source.url;
    API_PORT = res.body[0]._source.api_port;
    API_USERNAME = res.body[0]._source.api_username;
  });

  it('POST /api/csv', async () => {
    const res = await needle(
      'post',
      `localhost:5601/api/csv`,
      { path: '/agents', id: API_ID },
      headers
    );
    res.body.should.be.a('string');
  });

  it('POST /api/check-api', async () => {
    const res = await needle(
      'post',
      `localhost:5601/api/check-api`,
      { username: API_USERNAME, url: API_URL, port: API_PORT, id: API_ID },
      headers
    );
    res.body.should.be.a('object');
    res.body.manager.should.be.a('string');
    res.body.cluster.should.be.a('string');
    res.body.status.should.be.a('string');
  });

  it('POST /api/check-stored-api', async () => {
    const res = await needle(
      'post',
      `localhost:5601/api/check-stored-api`,
      API_ID,
      headers
    );
    res.body.should.be.a('object');
    res.body.statusCode.should.be.eql(200);
    res.body.data.should.be.a('object');
    res.body.data.username.should.be.a('string');
    res.body.data.password.should.be.a('string');
    res.body.data.url.should.be.a('string');
    res.body.data.port.should.be.a('string');
    res.body.data.extensions.should.be.a('object');
    res.body.data.cluster_info.should.be.a('object');
  });

  it('POST /api/request', async () => {
    const res = await needle(
      'post',
      `localhost:5601/api/request`,
      { method: 'GET', path: '/agents/000', body: {}, id: API_ID },
      headers
    );
    res.body.should.be.a('object');
    res.body.error.should.be.eql(0);
    res.body.data.should.be.a('object');
    res.body.data.status.should.be.eql('Active');
    res.body.data.id.should.be.eql('000');
  });

  it('GET /api/pci/{requirement}', async () => {
    const res = await needle('get', `localhost:5601/api/pci/all`, {}, {});
    res.body.should.be.a('object');
    res.body['1.1.1'].should.be.eql(
      'A formal process for approving and testing all network connections and changes to the firewall and router configurations'
    );
  });

  it('GET /api/gdpr/{requirement}', async () => {
    const res = await needle('get', `localhost:5601/api/gdpr/all`, {}, {});
    res.body.should.be.a('object');
    res.body['II_5.1.f'].should.be.eql(
      'Ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services, verifying its modifications, accesses, locations and guarantee the safety of them.<br>File sharing protection and file sharing technologies that meet the requirements of data protection.'
    );
  });

  it('GET /utils/configuration', async () => {
    const res = await needle(
      'get',
      `localhost:5601/utils/configuration`,
      {},
      {}
    );
    res.body.should.be.a('object');
    res.body.error.should.be.eql(0);
    res.body.statusCode.should.be.eql(200);
    res.body.data.should.be.a('object');
  });

  it('GET /utils/memory', async () => {
    const res = await needle('get', `localhost:5601/utils/memory`, {}, {});
    res.body.should.be.a('object');
    res.body.error.should.be.eql(0);
    res.body.ram.should.be.gt(1);
  });

  it('GET /api/agents-unique/{api}', async () => {
    const res = await needle(
      'get',
      `localhost:5601/api/agents-unique/${API_ID}`,
      {},
      {}
    );
    res.body.should.be.a('object');
    res.body.error.should.be.eql(0);
    res.body.result.should.be.a('object');
    res.body.result.groups.should.be.a('array');
    res.body.result.nodes.should.be.a('array');
    res.body.result.versions.should.be.a('array');
    res.body.result.osPlatforms.should.be.a('array');
    res.body.result.lastAgent.should.be.a('object');
    res.body.result.summary.should.be.a('object');
  });

  it('GET /utils/logs', async () => {
    const res = await needle('get', `localhost:5601/utils/logs`, {}, {});
    res.body.should.be.a('object');
    res.body.lastLogs.should.be.a('array');
    res.body.error.should.be.eql(0);
  });
});
