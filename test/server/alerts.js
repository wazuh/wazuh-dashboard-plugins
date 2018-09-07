const chai   = require('chai');
const needle = require('needle')

chai.should();

const headers = {headers: {'kbn-xsrf': 'kibana', 'Content-Type': 'application/json'}}

const date  = new Date();
const day   = date.getDate();
const month = date.getMonth() + 1;
const index = `wazuh-alerts-3.x-2018.${month > 10 ? month : `0${month}`}.${day > 10 ? day : `0${day}`}`;

describe('Elasticsearch', () => {
    it('GET /_cat/indices', async () => {
        const res = await needle('get', `localhost:9200/_cat/indices`, {}, headers);
        res.statusCode.should.be.eql(200)
        res.body.should.be.a('string')
    })

    it(`GET /_cat/indices/${index}`, async () => {
        const res = await needle('get', `localhost:9200/_cat/indices/${index}`, {}, headers);
        res.statusCode.should.be.eql(200)
        res.body.should.be.a('string')
    })

    describe('Manager (agent.id: 000)', () => {
        it(`GET /${index}/_search - vulnerability-detector`, async () => {
            const res = await needle('get', `localhost:9200/${index}/_search`,
                {
                    "query": {
                        "bool": {
                            "must": [
                                { "match": { "agent.id": "001" } },
                                { "match": { "rule.groups": "vulnerability-detector" } }
                            ]
                        }
                    }
                }, headers);
                
            const sample = res.body.hits.hits[0]._source;

            res.statusCode.should.be.eql(200)
            res.body.should.be.a('object')
            res.body.hits.hits.should.be.a('array')
            sample.data.should.be.a('object')
            sample.data.vulnerability.should.be.a('object')
            sample.data.vulnerability.reference.should.be.a('string')
            sample.data.vulnerability.package.condition.should.be.a('string')
            sample.data.vulnerability.package.patch.should.be.a('string')
            sample.data.vulnerability.title.should.be.a('string')
            sample.data.vulnerability.severity.should.be.a('string')
            sample.data.vulnerability.state.should.be.a('string')
            sample.data.vulnerability.cve.should.be.a('string')
            sample.agent.id.should.be.a('string')
            sample.agent.should.be.a('object')
            sample.agent.name.should.be.a('string')
            sample.agent.ip.should.be.a('string')
            sample.agent.id.should.be.a('string')
            sample.agent.id.length.should.be.eql(3)
            sample.rule.should.be.a('object')
            sample.rule.groups.should.be.a('array')
            sample.rule.groups[0].should.be.eql('vulnerability-detector')
            sample.manager.should.be.a('object')
            sample.manager.name.should.be.a('string')
            sample.source.should.be.eql('/var/ossec/logs/alerts/alerts.json')
            sample.location.should.be.eql('vulnerability-detector')
        })
    })

});