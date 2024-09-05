from datetime import timedelta, datetime
from opensearchpy import OpenSearch, helpers
import random
import json
import os.path
import warnings

warnings.filterwarnings("ignore")
def generateRandomDate(days_interval=10):
    start_date = datetime.now()
    end_date = start_date - timedelta(days=days_interval)
    random_date = start_date + (end_date - start_date) * random.random()
    return(random_date.strftime("%Y-%m-%dT%H:%M:%S.{}Z".format(random.randint(0, 999))))

def generateRandomAgent():
    agent={}
    agent['build'] = {'original':'build{}'.format(random.randint(0, 9999))}
    agent['id'] = '00{}'.format(random.randint(1, 99))
    agent['name'] = 'Agent{}'.format(random.randint(0, 99))
    agent['version'] = 'v{}-stable'.format(random.randint(0, 9))
    agent['ephemeral_id'] = '{}'.format(random.randint(0, 99999))
    agent['type'] = random.choice(['filebeat','windows','linux','macos'])
    return(agent)

def generateRandomEvent():
    event = {}
    event['action'] = random.choice(['login','logout','create','delete','modify','read','write','upload','download','copy','paste','cut','move','rename','open','close','execute','run','install','uninstall','start','stop','kill','suspend','resume','sleep','wake','lock','unlock','encrypt','decrypt','compress','decompress','archive','unarchive','mount','unmount','eject','connect','disconnect','send','receive'])
    event['agent_id_status'] = random.choice(['verified','mismatch','missing','auth_metadata_missing'])
    event['category'] = random.choice(['authentication','authorization','configuration','communication','file','network','process','registry','storage','system','web'])
    event['code'] = '{}'.format(random.randint(0, 99999))
    event['created'] = generateRandomDate()
    event['dataset'] = random.choice(['process','file','registry','socket','dns','http','tls','alert','authentication','authorization','configuration','communication','file','network','process','registry','storage','system','web'])
    event['duration'] = random.randint(0, 99999)
    new_date = generateRandomDate()
    while new_date < event['created']:
        new_date = generateRandomDate()
    event['end'] = new_date
    event['hash'] = str(hash('hash{}'.format(random.randint(0, 99999))))
    event['id'] = '{}'.format(random.randint(0, 99999))
    event['ingested'] = generateRandomDate()
    event['kind'] = random.choice(['alert','asset','enrichment','event','metric','state','pipeline_error','signal'])
    event['module'] = random.choice(['process','file','registry','socket','dns','http','tls','alert','authentication','authorization','configuration','communication','file','network','process','registry','storage','system','web'])
    event['original'] = 'original{}'.format(random.randint(0, 99999))
    event['outcome'] = random.choice(['success','failure','unknown'])
    event['provider'] = random.choice(['process','file','registry','socket','dns','http','tls','alert','authentication','authorization','configuration','communication','file','network','process','registry','storage','system','web'])
    event['reason'] = 'This event happened due to reason{}'.format(random.randint(0, 99999))
    event['reference'] = 'https://system.example.com/event/#{}'.format(random.randint(0, 99999))
    event['risk_score'] = round(random.uniform(0, 10),1)
    event['risk_score_norm'] = round(random.uniform(0, 10),1)
    event['sequence'] = random.randint(0, 10)
    event['severity'] = random.randint(0, 10)
    event['start'] = generateRandomDate()
    event['timezone'] = random.choice(['UTC','GMT','PST','EST','CST','MST','PDT','EDT','CDT','MDT'])
    event['type'] = random.choice(['access','admin','allowed', 'change', 'connection', 'creation', 'deletion', 'denied', 'end', 'error', 'group', 'indicator', 'info', 'installation', 'protocol', 'start', 'user'])
    event['url'] = 'http://mysystem.example.com/alert/{}'.format(random.randint(0, 99999))
    return(event)

def generateRandomHost():
    host = {}
    family=random.choice(['debian','ubuntu','macos','ios','android','RHEL'])
    version='{}.{}'.format(random.randint(0, 99),random.randint(0, 99))
    host['os'] = {
        'family': family,
        'full': family + ' ' + version,
        'kernel': version+'kernel{}'.format(random.randint(0, 99)),
        'name': family + ' ' + version,
        'platform': family,
        'type': random.choice(['windows','linux','macos','ios','android','unix']),
        'version': version
    }
    return(host)



def generateRandomLabels():
    labels = {}
    labels['label1'] = 'label{}'.format(random.randint(0, 99))
    labels['label2'] = 'label{}'.format(random.randint(0, 99))
    return(labels)

def generateRandomPackage():
    package = {}
    package['architecture'] = random.choice(['x86','x64','arm','arm64'])
    package['build_version'] = 'build{}'.format(random.randint(0, 9999))
    package['checksum'] = 'checksum{}'.format(random.randint(0, 9999))
    package['description'] = 'description{}'.format(random.randint(0, 9999))
    package['install_scope'] = random.choice(['user','system'])
    package['license'] = 'license{}'.format(random.randint(0, 9))
    package['name'] = 'name{}'.format(random.randint(0, 99))
    package['path'] = '/path/to/package{}'.format(random.randint(0, 99))
    package['reference'] = 'package-reference-{}'.format(random.randint(0, 99))
    package['size'] = random.randint(0, 99999)
    package['type'] = random.choice(['deb','rpm','msi','pkg','app','apk','exe','zip','tar','gz','7z','rar','cab','iso','dmg','tar.gz','tar.bz2','tar.xz','tar.Z','tar.lz4','tar.sz','tar.zst'])
    package['version'] = 'v{}-stable'.format(random.randint(0, 9))
    return(package)

def generateRandomTags():
    tags = []
    for i in range(0, random.randint(0, 9)):
        new_tag = 'tag{}'.format(random.randint(0, 99))
        while new_tag in tags:
            new_tag = 'tag{}'.format(random.randint(0, 99))
        tags.append('tag{}'.format(random.randint(0, 99)))
    return(tags)

def generateRandomVulnerability():
    vulnerability = {}
    vulnerability['category'] = random.choice(['security','config','os','package','custom'])
    vulnerability['classification'] = 'classification{}'.format(random.randint(0, 9999))
    vulnerability['description'] = 'description{}'.format(random.randint(0, 9999))
    vulnerability['enumeration'] = 'CVE'
    vulnerability['id'] = 'CVE-{}'.format(random.randint(0, 9999))
    vulnerability['reference'] = 'https://mycve.test.org/cgi-bin/cvename.cgi?name={}'.format(vulnerability['id'])
    vulnerability['report_id'] = 'report-{}'.format(random.randint(0, 9999))
    vulnerability['scanner'] = {'vendor':'vendor-{}'.format(random.randint(0, 9))}
    vulnerability['score'] = {'base':round(random.uniform(0, 10),1), 'environmental':round(random.uniform(0, 10),1), 'temporal':round(random.uniform(0, 10),1),'version':'{}'.format(round(random.uniform(0, 10),1))}
    vulnerability['severity'] = random.choice(['Low','Medium','High','Critical'])
    vulnerability['published_at'] = generateRandomDate(2000)
    vulnerability['detected_at'] = generateRandomDate(180)
    return(vulnerability)

def generateRandomWazuh():
    wazuh = {}
    wazuh['cluster'] = {'name':random.choice(['wazuh.manager', 'wazuh']), 'node':random.choice(['master','worker-01','worker-02','worker-03'])}
    wazuh['vulnerability'] = {'under_evaluation': random.choice([True, False])}
    return(wazuh)

def generateRandomData(number):
    for i in range(0, int(number)):
        yield{
            'agent':generateRandomAgent(),
            'ecs':{'version':'1.7.0'},
            'host':generateRandomHost(),
            'message':'message{}'.format(random.randint(0, 99999)),
            'package':generateRandomPackage(),
            'tags':generateRandomTags(),
            'vulnerability':generateRandomVulnerability(),
            'wazuh':generateRandomWazuh()
        }

def verifyIndex(index,instance):
    if not instance.indices.exists(index):
        if os.path.exists('DIS_Template.json'):
            print('\nIndex {} does not exist. Trying to create it with the template in DIS_Template.json'.format(index))
            with open('DIS_Template.json') as templateFile:
                template = json.load(templateFile)
            try:
                instance.indices.create(index=index, body=template)
                indexExist = True
                print('Done!')
            except Exception as e:
                print('Error: {}'.format(e))
        else:
            notemplate=input('\nIndex {} does not exist. Template file not found. Continue without template? (y/n)'.format(index))
            while notemplate != 'y' and notemplate != 'n':
                notemplate=input('\nInvalid option. Continue without template? (y/n) \n')
            if notemplate == 'n':
                return False
            print('\nTrying to create index {} without template'.format(index))
            try:
                instance.indices.create(index=index)
                print('\nDone!')
            except Exception as e:
                print('\nError: {}'.format(e))
    return True

def verifySettings():
    verified = False
    if os.path.exists('DIS_Settings.json'):
        with open('DIS_Settings.json') as configFile:
            config = json.load(configFile)
            if 'ip' not in config or 'port' not in config or 'index' not in config or 'username' not in config or 'password' not in config:
                print('\nDIS_Settings.json is not properly configured. Continuing without it.')
            else:
                verified = True
    else:
        print('\nDIS_Settings.json not found. Continuing without it.')

    if not verified:
        ip = input("\nEnter the IP of your Indexer [default=0.0.0.0]: \n")
        if ip == '':
            ip = '0.0.0.0'

        port = input("\nEnter the port of your Indexer [default=9200]: \n")
        if port == '':
            port = '9200'

        index = input("\nEnter the index name [default=wazuh-states-vulnerabilities-default]: \n")
        if index == '':
            index = 'wazuh-states-vulnerabilities-default'

        url = 'https://{}:{}/{}/_doc'.format(ip, port, index)

        username = input("\nUsername [default=admin]: \n")
        if username == '':
            username = 'admin'

        password = input("\nPassword [default=admin]: \n")
        if password == '':
            password = 'admin'

        config = {'ip':ip,'port':port,'index':index,'username':username,'password':password}

        store = input("\nDo you want to store these settings for future use? (y/n) [default=n] \n")
        if store == '':
            store = 'n'

        while store != 'y' and store != 'n':
            store = input("\nInvalid option.\n Do you want to store these settings for future use? (y/n) \n")
        if store == 'y':
            with open('DIS_Settings.json', 'w') as configFile:
                json.dump(config, configFile)
    return config

def injectEvents(generator):
    config = verifySettings()
    instance = OpenSearch([{'host':config['ip'],'port':config['port']}], http_auth=(config['username'], config['password']), use_ssl=True, verify_certs=False)

    if not instance.ping():
        print('\nError: Could not connect to the indexer')
        return

    if (verifyIndex(config['index'],instance)):
        print('\nTrying to inject the generated data...\n')
        try:
            helpers.bulk(instance, generator, index=config['index'])
            print('\nDone!')
        except Exception as e:
            print('\nError: {}'.format(e))
    return


def main():
    action = input("Do you want to inject data or save it to a file? (i/s) [default=i]\n")
    if action == '':
        action = 'i'

    while(action != 'i' and action != 's'):
        action = input("\nInvalid option.\n Do you want to inject data or save it to a file? (i/s) \n")
    number = input("\nHow many events do you want to generate? [default=100]\n")
    if number == '':
        number = '100'
    while(not number.isdigit()):
        number = input("Invalid option.\n How many events do you want to generate? \n")
    data = generateRandomData(number)
    if action == 's':
        print('\nGenerating {} events...\n'.format(number))
        outfile = open('generatedData.json','a')
        for i in data:
            json.dump(i, outfile)
            outfile.write('\n')
        outfile.close()
        print('\nDone!\n')
    else:
        injectEvents(data)
    return

if __name__=="__main__":
    main()
