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
      `localhost:5601/elastic/apis`,
      {},
      {}
    );
    if (!res.body || !res.body.length) {
      /* eslint-disable */
      console.log('There are no APIs stored in Elasticsearch, exiting...');
      process.exit(1);
      /* eslint-enable */
    }
    API_ID = res.body[0]._id;
  });

  it('PUT /elastic/api', async () => {
    const res = await needle(
      'put',
      `localhost:5601/elastic/api`,
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
      `localhost:5601/elastic/apis/${res.body.response._id}`,
      {},
      headers
    );
    removed.body.result.should.be.eql('deleted');
  });

  it('PUT /elastic/api-settings', async () => {
    const res = await needle(
      'put',
      `localhost:5601/elastic/api`,
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
      `localhost:5601/elastic/api-settings`,
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
      `localhost:5601/elastic/apis/${res.body.response._id}`,
      {},
      headers
    );
    updated.body.statusCode.should.be.eql(200);
    updated.body.message.should.be.eql('ok');
  });

  it('GET /elastic/apis', async () => {
    const res = await needle(
      'get',
      `localhost:5601/elastic/apis`,
      {},
      headers
    );
    res.body.should.be.a('array');
    res.body.length.should.be.gt(0);
  });

  it('DELETE /elastic/apis/{id}', async () => {
    const insert = await needle(
      'put',
      `localhost:5601/elastic/api`,
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
      `localhost:5601/elastic/apis/${insert.body.response._id}`,
      {},
      headers
    );
    res.body.result.should.be.eql('deleted');
  });

  /*it('PUT /elastic/apis/{id}', async () => {
        const res = await needle('put', `localhost:5601/elastic/apis/${API_ID}`, {}, headers);
        console.log(res.body)
        res.body.statusCode.should.be.eql(200)
        res.body.message.should.be.eql('ok')
    })*/

  it('PUT /elastic/api-hostname/{id}', async () => {
    const res = await needle(
      'put',
      `localhost:5601/elastic/api-hostname/${API_ID}`,
      {},
      headers
    );
    res.body.statusCode.should.be.eql(200);
    res.body.message.should.be.eql('ok');
  });
});
