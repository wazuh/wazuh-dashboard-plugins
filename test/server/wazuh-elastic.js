const chai   = require('chai');
const needle = require('needle')

chai.should();

const headers = {headers: {'kbn-xsrf': 'kibana', 'Content-Type': 'application/json'}}

describe('wazuh-elastic', () => {
    
    describe('Checking index patterns', () => {
        it('GET /get-list', async () => {
            const res = await needle('get', `localhost:5601/get-list`, {}, headers);
            res.body.data.should.be.a('array')
            res.body.data.length.should.be.gt(0)
            res.body.data[0].should.be.a('object')
            res.body.data[0].id.should.be.a('string')
            res.body.data[0].title.should.be.a('string')
        })

        it('GET /refresh-fields/{pattern}', async () => {
            const res = await needle('get', `localhost:5601/refresh-fields/wazuh-alerts-3.x-*`, {}, headers);
            res.body.acknowledge.should.be.eql(true)
            res.body.output.should.be.a('object')
            res.body.output._index.should.be.eql('.kibana')
            res.body.output._type.should.be.eql('doc')
            res.body.output._id.should.be.eql('index-pattern:wazuh-alerts-3.x-*')
        })
    })

    describe('Checking visualization composers', () => {
        it('GET /api/wazuh-elastic/create-vis/{tab}/{pattern}', async () => {
            const res = await needle('get', `localhost:5601/api/wazuh-elastic/create-vis/overview-general/wazuh-alerts-3.x-*`, {}, headers);
            res.body.acknowledge.should.be.eql(true)
            res.body.raw.should.be.a('array')
            res.body.raw.length.should.be.eql(15)
            res.body.raw[0].attributes.should.be.a('object')
            res.body.raw[0].type.should.be.eql('visualization')
            res.body.raw[0].id.should.be.a('string')          
        })

        it('POST /api/wazuh-elastic/create-vis/{tab}/{pattern}', async () => {
            const res = await needle('post', `localhost:5601/api/wazuh-elastic/create-vis/cluster-monitoring/wazuh-alerts-3.x-*`, {nodes:{items:[],name:'node01'}}, headers);
            res.body.acknowledge.should.be.eql(true)
            res.body.raw.should.be.a('array')
            res.body.raw.length.should.be.eql(4)
            res.body.raw[0].attributes.should.be.a('object')
            res.body.raw[0].type.should.be.eql('visualization')
            res.body.raw[0].id.should.be.a('string')          
        })
    })

    describe('Checking template and index pattern existance', () => {
        it('GET /api/wazuh-elastic/template/{pattern}', async () => {
            const res = await needle('get', `localhost:5601/api/wazuh-elastic/template/wazuh-alerts-3.x-*`, {}, headers);
            res.body.statusCode.should.be.eql(200)
            res.body.status.should.be.eql(true)
            res.body.data.should.be.eql('Template found for wazuh-alerts-3.x-*')    
        })

        it('GET /api/wazuh-elastic/pattern/{pattern}', async () => {
            const res = await needle('get', `localhost:5601/api/wazuh-elastic/pattern/wazuh-alerts-3.x-*`, {}, headers);
            res.body.statusCode.should.be.eql(200)
            res.body.status.should.be.eql(true)
            res.body.data.should.be.eql('Index pattern found') 
        
        })
    })

    /*it('GET /api/wazuh-elastic/top/{mode}/{cluster}/{field}/{pattern}', async () => {
        throw Error('Test not implemented...')
    })*/
    
    describe('Checking .wazuh-version index', () => {
        it('GET /api/wazuh-elastic/setup', async () => {
            const res = await needle('get', `localhost:5601/api/wazuh-elastic/setup`, {}, headers);
            res.body.statusCode.should.be.eql(200)
            res.body.data.should.be.a('object')
            res.body.data.name.should.be.eql('Wazuh App')
            res.body.data['app-version'].should.be.eql('3.6.0')
            res.body.data.revision.should.be.eql('0407')
            res.body.data.installationDate.should.be.a('string')
            res.body.data.lastRestart.should.be.a('string')                
        })

        it('GET /api/wazuh-elastic/timestamp', async () => {
            const res = await needle('get', `localhost:5601/api/wazuh-elastic/timestamp`, {}, headers);    
            res.body.installationDate.should.be.a('string')
            res.body.lastRestart.should.be.a('string')
        })
    })
})