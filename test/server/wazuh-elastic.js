const chai = require('chai');
const needle = require('needle');

const kibanaServer = process.env.KIBANA_IP || 'localhost';

chai.should();

const headers = {
  headers: { 'kbn-xsrf': 'kibana', 'Content-Type': 'application/json' }
};

describe('wazuh-elastic', () => {
  describe('Checking index patterns', () => {
    it('GET /elastic/index-patterns', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/index-patterns`,
        {},
        headers
      );
      res.body.data.should.be.a('array');
      res.body.data.length.should.be.gt(0);
      res.body.data[0].should.be.a('object');
      res.body.data[0].id.should.be.a('string');
      res.body.data[0].title.should.be.a('string');
    });

    it('GET /elastic/known-fields/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/known-fields/wazuh-alerts-3.x-*`,
        {},
        headers
      );
      res.body.acknowledge.should.be.eql(true);
      res.body.output.should.be.a('object');
      //res.body.output._index.should.be.eql('.kibana');
      res.body.output._type.should.be.eql('doc');
      res.body.output._id.should.be.eql('index-pattern:wazuh-alerts-3.x-*');
    });
  });

  describe('Checking visualization composers', () => {
    it('GET /elastic/visualizations/{tab}/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/visualizations/overview-general/wazuh-alerts-3.x-*`,
        {},
        headers
      );
      res.body.acknowledge.should.be.eql(true);
      res.body.raw.should.be.a('array');
      res.body.raw.length.should.be.eql(15);
      res.body.raw[0].attributes.should.be.a('object');
      res.body.raw[0].type.should.be.eql('visualization');
      res.body.raw[0].id.should.be.a('string');
    });

    it('POST /elastic/visualizations/{tab}/{pattern}', async () => {
      const res = await needle(
        'post',
        `${kibanaServer}:5601/elastic/visualizations/cluster-monitoring/wazuh-alerts-3.x-*`,
        { nodes: { items: [], name: 'node01' } },
        headers
      );
      res.body.acknowledge.should.be.eql(true);
      res.body.raw.should.be.a('array');
      res.body.raw.length.should.be.eql(4);
      res.body.raw[0].attributes.should.be.a('object');
      res.body.raw[0].type.should.be.eql('visualization');
      res.body.raw[0].id.should.be.a('string');
    });
  });

  describe('Checking template and index pattern existance', () => {
    it('GET /elastic/template/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/template/wazuh-alerts-3.x-*`,
        {},
        headers
      );
      res.body.statusCode.should.be.eql(200);
      res.body.status.should.be.eql(true);
      res.body.data.should.be.eql('Template found for wazuh-alerts-3.x-*');
    });

    it('GET /elastic/index-patterns/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/index-patterns/wazuh-alerts-3.x-*`,
        {},
        headers
      );
      res.body.statusCode.should.be.eql(200);
      res.body.status.should.be.eql(true);
      res.body.data.should.be.eql('Index pattern found');
    });
  });
});
