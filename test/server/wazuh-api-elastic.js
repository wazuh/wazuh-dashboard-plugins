const chai = require('chai');
const needle = require('needle');

chai.should();

const headers = {
  headers: { 'kbn-xsrf': 'kibana', 'Content-Type': 'application/json' }
};

let API_ID = null;

describe('wazuh-api-elastic', () => {

  before(async () => {
    const res = await needle(
      'get',
      `localhost:5601/api/wazuh-api/apiEntries`,
      {},
      {}
    );
    if (!res.body || !res.body.length) {
      console.log('There are no APIs stored in Elasticsearch, exiting...');
      process.exit(1);
    }
    API_ID = res.body[0]._id;
  });

  it('PUT /api/wazuh-api/settings', async () => {
    const res = await needle(
      'put',
      `localhost:5601/api/wazuh-api/settings`,
      {
        user: 'foo',
        password: 'bar',
        url: 'http://localhost',
        port: 55000,
        insecure: true,
        component: 'API',
        active: true,
        cluster_info: {},
        extensions: {}
      },
      headers
    );
    res.body.response.result.should.be.eql('created');
    const removed = await needle(
      'delete',
      `localhost:5601/api/wazuh-api/apiEntries/${res.body.response._id}`,
      {},
      headers
    );
    removed.body.result.should.be.eql('deleted');
  });

  it('PUT /api/wazuh-api/update-settings', async () => {
    const res = await needle(
      'put',
      `localhost:5601/api/wazuh-api/settings`,
      {
        user: 'foo',
        password: 'bar',
        url: 'http://localhost',
        port: 55000,
        insecure: true,
        component: 'API',
        active: true,
        cluster_info: {},
        extensions: {}
      },
      headers
    );
    const updated = await needle(
      'put',
      `localhost:5601/api/wazuh-api/update-settings`,
      {
        user: 'john',
        password: 'bar',
        url: 'http://0.0.0.0',
        port: 55000,
        id: res.body.response._id
      },
      headers
    );
    await needle(
      'delete',
      `localhost:5601/api/wazuh-api/apiEntries/${res.body.response._id}`,
      {},
      headers
    );
    updated.body.statusCode.should.be.eql(200);
    updated.body.message.should.be.eql('ok');
  });

  it('GET /api/wazuh-api/apiEntries', async () => {
    const res = await needle(
      'get',
      `localhost:5601/api/wazuh-api/apiEntries`,
      {},
      headers
    );
    res.body.should.be.a('array');
    res.body.length.should.be.gt(0);
  });

  it('DELETE /api/wazuh-api/apiEntries/{id}', async () => {
    const insert = await needle(
      'put',
      `localhost:5601/api/wazuh-api/settings`,
      {
        user: 'foo',
        password: 'bar',
        url: 'http://localhost',
        port: 55000,
        insecure: true,
        component: 'API',
        active: true,
        cluster_info: {},
        extensions: {}
      },
      headers
    );
    const res = await needle(
      'delete',
      `localhost:5601/api/wazuh-api/apiEntries/${insert.body.response._id}`,
      {},
      headers
    );
    res.body.result.should.be.eql('deleted');
  });

  /*it('PUT /api/wazuh-api/apiEntries/{id}', async () => {
        const res = await needle('put', `localhost:5601/api/wazuh-api/apiEntries/${API_ID}`, {}, headers);
        console.log(res.body)
        res.body.statusCode.should.be.eql(200)
        res.body.message.should.be.eql('ok')
    })*/

  it('PUT /api/wazuh-api/updateApiHostname/{id}', async () => {
    const res = await needle(
      'put',
      `localhost:5601/api/wazuh-api/updateApiHostname/${API_ID}`,
      {},
      headers
    );
    res.body.statusCode.should.be.eql(200);
    res.body.message.should.be.eql('ok');
  });
});
