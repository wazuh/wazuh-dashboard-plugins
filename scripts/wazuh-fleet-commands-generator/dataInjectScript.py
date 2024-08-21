from datetime import timedelta, datetime
from opensearchpy import OpenSearch, helpers
import random
import json
import os.path
import warnings
import uuid

warnings.filterwarnings("ignore")
def generateRandomDate(days_interval=10):
    start_date = datetime.now()
    end_date = start_date - timedelta(days=days_interval)
    random_date = start_date + (end_date - start_date) * random.random()
    return(random_date.strftime("%Y-%m-%dT%H:%M:%S.{}Z".format(random.randint(0, 999))))

def generateRandomGroups():
    groups = ['default', 'group1', 'group2', 'group3', 'group4', 'group5']
    return groups

def generateNodeNames():
    nodes = ['wazuh', 'node1', 'node2', 'node3', 'node4', 'node5']
    return nodes

def generateRandomUUID():
    return str(uuid.uuid4())

def generateRandomAgent():
    agent={}
    agent['build'] = {'original':'build{}'.format(random.randint(0, 9999))}
    agent['id'] = '00{}'.format(random.randint(1, 99))
    agent['name'] = 'Agent{}'.format(random.randint(0, 99))
    agent['version'] = 'v{}-stable'.format(random.randint(0, 9))
    agent['ephemeral_id'] = '{}'.format(random.randint(0, 99999))
    agent['groups'] = random.sample(generateRandomGroups(), random.randint(1, len(generateRandomGroups())))
    agent['node_name'] = random.choice(generateNodeNames())
    agent['created'] = generateRandomDate()
    return(agent)

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

def generateRandomWazuh():
    wazuh = {}
    wazuh['cluster'] = {'name':random.choice(['wazuh.manager', 'wazuh']), 'node':random.choice(['master','worker-01','worker-02','worker-03'])}
    return(wazuh)

# Add command line example data. Example: ["/usr/bin/ssh", "-l", "user", "10.0.0.16"]
def generateRandomCommandLine():
    command_line = [
        '/usr/bin/ssh',
        '-l',
        'user',
        '10.0.0.16',
        '/usr/bin/curl',
        '-X',
        'GET',
        'https://example.com',
        '/usr/bin/ping',
        'localhost',
        '/usr/bin/ls',
        '-l',
        '/usr/bin/grep',
        'pattern',
        '/usr/bin/cat',
        '/path/to/file',
        '/usr/bin/mkdir',
        '/path/to/directory',
        '/usr/bin/rm',
        '/path/to/file',
        '/usr/bin/mv',
        '/path/to/source',
        '/path/to/destination',
        '/usr/bin/chmod',
        '755',
        '/path/to/file',
        '/usr/bin/chown',
        'user:group',
        '/path/to/file',
        '/usr/bin/git',
        'clone',
        'https://github.com/example/repo.git'
    ]
    return command_line
"""
Process name.
Sometimes called program name or similar.
example: ssh
"""
def getProcessName():
    process_name = [
        'ssh',
        'curl',
        'ping',
        'ls',
        'grep',
        'cat',
        'mkdir',
        'rm',
        'mv',
        'chmod',
        'chown',
        'git'
    ]
    return process_name

# Array of process arguments, starting with the absolute path to the executable.
def getProcessArgs():
    args = [
        '/usr/bin/ssh',
        '/usr/bin/curl',
        '/usr/bin/ping',
        '/usr/bin/ls',
        '/usr/bin/grep',
        '/usr/bin/cat',
        '/usr/bin/mkdir',
        '/usr/bin/rm',
        '/usr/bin/mv',
        '/usr/bin/chmod',
        '/usr/bin/chown',
        '/usr/bin/git'
    ]
    return args

# One of: ["pending", "sent", "completed", "failed"]**
def getCommandStatus():
    status = ['pending', 'sent', 'completed', 'failed']
    return status

# additional information of the execution of the command. For example, the error message.
def getCommandInfo():
    info = [
        'Error: Connection refused',
        'Error: File not found',
        'Error: Invalid argument',
        'Error: Permission denied'
    ]
    return info

def generateRandomProcess():
    process = {}
    process['command_line'] = random.choice(generateRandomCommandLine())
    process['end'] = generateRandomDate()
    process['start'] = generateRandomDate()
    process['name'] = random.choice(getProcessName())
    return process

def generateRandomData(number):
    for i in range(0, int(number)):    
        yield {
            'process': generateRandomProcess(),
            'args': random.sample(getProcessArgs(), random.randint(1, len(getProcessArgs()))),
            'agent': {
                'id': generateRandomUUID(),
            }, 
            'status': random.choice(getCommandStatus()),
            'info': random.choice(getCommandInfo()),
            'wazuh': generateRandomWazuh()
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

        index = input("\nEnter the index name [default=wazuh-fleet-groups-default]: \n")
        if index == '':
            index = 'wazuh-fleet-groups-default'

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
    number = input("\nHow many agents do you want to generate? [default=20]\n")
    if number == '':
        number = '20'
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
