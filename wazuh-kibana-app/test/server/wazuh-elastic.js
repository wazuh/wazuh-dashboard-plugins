const chai = require('chai');
const needle = require('needle');
const { PLUGIN_PLATFORM_REQUEST_HEADERS } = require('../../common/constants');

const kibanaServer = process.env.KIBANA_IP || 'localhost';

chai.should();

const headers = {
  headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json' }
};

describe('wazuh-elastic', () => {
  describe('Checking index patterns', () => {
    it('GET /elastic/known-fields/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/known-fields/${getSettingDefaultValue('pattern')}`,
        {},
        headers
      );
      res.body.acknowledge.should.be.eql(true);
      res.body.output.should.be.a('object');
      //res.body.output._index.should.be.eql('.kibana');
      res.body.output._type.should.be.eql('doc');
      res.body.output._id.should.be.eql(`index-pattern:${getSettingDefaultValue('pattern')}`);
    });
  });

  describe('Checking visualization composers', () => {
    it('GET /elastic/visualizations/{tab}/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/visualizations/overview-general/${getSettingDefaultValue('pattern')}`,
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
        `${kibanaServer}:5601/elastic/visualizations/cluster-monitoring/${getSettingDefaultValue('pattern')}`,
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
        `${kibanaServer}:5601/elastic/template/${getSettingDefaultValue('pattern')}`,
        {},
        headers
      );
      res.body.statusCode.should.be.eql(200);
      res.body.status.should.be.eql(true);
      res.body.data.should.be.eql(`Template found for ${getSettingDefaultValue('pattern')}`);
    });

    it('GET /elastic/index-patterns/{pattern}', async () => {
      const res = await needle(
        'get',
        `${kibanaServer}:5601/elastic/index-patterns/${getSettingDefaultValue('pattern')}`,
        {},
        headers
      );
      res.body.statusCode.should.be.eql(200);
      res.body.status.should.be.eql(true);
      res.body.data.should.be.eql('Index pattern found');
    });
  });
});
