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
    groups = ['default', 'group1', 'group2', 'group3']
    num_groups = random.randint(1, len(groups))
    return random.sample(groups, num_groups)

def generateNodeNames():
    nodes = ['wazuh', 'node01', 'node02', 'node03', 'node04', 'node05']
    return nodes

def generateRandomAgent(i):
    agent={}
    agent['build'] = {'original':'build{}'.format(random.randint(0, 9999))}
    agent['id'] = str(uuid.uuid4())
    agent['name'] = 'Agent_{}'.format(i)
    agent['version'] = 'v5.0.0'
    agent['ephemeral_id'] = '{}'.format(random.randint(0, 99999))
    agent['groups'] = generateRandomGroups()
    agent['node_name'] = random.choice(generateNodeNames())
    agent['last_login'] = generateRandomDate()
    return(agent)

def generateRandomHost():
    host = {}
   
    os_versions = [
        "Microsoft Windows 10 Home",
        "Microsoft Windows 10 Pro",
        "Microsoft Windows 11 Home",
        "Microsoft Windows 11 Pro",
        "macOS 10.15 Catalina",
        "macOS 11 Big Sur",
        "macOS 12 Monterey",
        "Ubuntu 18.04 LTS",
        "Ubuntu 20.04 LTS",
        "Ubuntu 22.04 LTS",
        "CentOS 7",
        "CentOS 8",
        "Red Hat Enterprise Linux 7",
        "Red Hat Enterprise Linux 8",
        "Debian 9 Stretch",
        "Debian 10 Buster",
        "Debian 11 Bullseye",
        "Fedora 34",
        "Fedora 35",
        "Fedora 36",
        "Arch Linux",
        "OpenSUSE Leap 15.3",
        "OpenSUSE Leap 15.4",
    ]

    platform_map = {
        "Microsoft Windows": "windows",
        "macOS": "darwin",
        "Ubuntu": "linux",
        "CentOS": "linux",
        "Red Hat Enterprise Linux": "linux",
        "Debian": "linux",
        "Fedora": "linux",
        "Arch Linux": "linux",
        "OpenSUSE": "linux",
    }

    os = random.choice(os_versions)
    platform_key = next(key for key in platform_map if os.startswith(key))
    platform = platform_map[platform_key]

    host['architecture'] = random.choice(["x86_64", "arm64", "i386"])
    host['checksum'] = str(uuid.uuid4()).replace('-', '')[:32]
    host['hostname'] = f"host-{random.randint(1000, 9999)}"
    host['os'] = {
        'name': os.split(' ')[0],
        'platform': platform,
        'version': os.split(' ')[-1],
        'kernel': f"kernel-{random.randint(1, 10)}.{random.randint(0, 9)}.{random.randint(0, 99)}",
        'full': os,
        'type': platform_key.lower()
    }
    host['scan_time'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    host['sysname'] = platform_key.lower()
    host['ip'] = f"192.168.{random.randint(0, 255)}.{random.randint(0, 255)}"
    return(host)

def generateRandomNetwork():
    network_names = ["docker0", "enp3s0", "virbr0", "wlp2s0", "eth0", "eth1", "lo", "br-3a2df5e3b74a"]
    states = ["up", "down"]
    types = ["ethernet", "wifi", "bridge", "loopback"]
    
    network = {}
    network['name'] =  random.choice(network_names)
    network['mac'] =  ':'.join(['{:02x}'.format(random.randint(0, 255)) for _ in range(6)])
    network['state'] =  random.choice(states)
    network['mtu'] =  str(random.choice([1500, 9000, 1450, 1400]))
    network['type'] = random.choice(types)
    return (network)

def generateRandomWazuh():
    wazuh = {}
    wazuh['cluster'] = {'name':random.choice(['wazuh.manager', 'wazuh']), 'node':random.choice(['master','worker-01','worker-02','worker-03'])}
    return(wazuh)

def generateFleetData(number):
    for i in range(0, int(number)):
        yield{
            'agent':generateRandomAgent(i),
            'host': generateRandomHost(),
            'wazuh':generateRandomWazuh()
        }

# def generateSystemData(fleetData):
#     for agent in fleetData:
#         yield{
#             'agent':{
#                     'id':agent['agent']['id']
#                 },
#             'host':generateRandomHost(),
#             'wazuh':agent['wazuh']
#         }

def generateNetworksData(fleetData, number):
    for agent in fleetData:
        for i in range(0, int(number)):
            yield{
                'agent':{
                        'id':agent['agent']['id']
                    },
                'network':generateRandomNetwork(),
                'wazuh':agent['wazuh']
            }

def verifyIndex(index,instance,entity):
    if not instance.indices.exists(index):
        if os.path.exists(f'DIS_Template{entity}.json'):
            print(f'\nIndex {index} does not exist. Trying to create it with the template in DIS_Template{entity}.json'.format(index))
            with open(f'DIS_Template{entity}.json') as templateFile:
                template = json.load(templateFile)
            try:
                instance.indices.create(index=index, body=template)
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
            if 'ip' not in config or 'port' not in config or 'indexFleet' not in config or 'indexInventorySystem' not in config or 'indexInventoryNetworks' not in config or 'indexInventoryProcesses' not in config or 'indexInventoryPackages' not in config or 'username' not in config or 'password' not in config:
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

        indexFleet = input("\nEnter the index name for the fleet [default=fleet-agents-default]: \n")
        if indexFleet == '':
            indexFleet = 'fleet-agents-default'

        indexInventorySystem = input("\nEnter the index name for the inventory system [default=inventory-system-default]: \n")
        if indexInventorySystem == '':
            indexInventorySystem = 'inventory-system-default'

        indexInventoryNetworks = input("\nEnter the index name for the inventory networks [default=inventory-networks-default]: \n")
        if indexInventoryNetworks == '':
            indexInventoryNetworks = 'inventory-networks-default'

        indexInventoryProcesses = input("\nEnter the index name for the inventory processes [default=inventory-processes-default]: \n")
        if indexInventoryProcesses == '':
            indexInventoryProcesses = 'inventory-processes-default'

        indexInventoryPackages = input("\nEnter the index name for the inventory packages [default=inventory-packages-default]: \n")
        if indexInventoryPackages == '':
            indexInventoryPackages = 'inventory-packages-default'

        username = input("\nUsername [default=admin]: \n")
        if username == '':
            username = 'admin'

        password = input("\nPassword [default=admin]: \n")
        if password == '':
            password = 'admin'

        config = {'ip':ip,'port':port,'indexFleet':indexFleet, 'indexInventorySystem':indexInventorySystem, 'indexInventoryNetworks':indexInventoryNetworks, 'indexInventoryProcesses':indexInventoryProcesses, 'indexInventoryPackages':indexInventoryPackages, 'username':username,'password':password}

        store = input("\nDo you want to store these settings for future use? (y/n) [default=n] \n")
        if store == '':
            store = 'n'

        while store != 'y' and store != 'n':
            store = input("\nInvalid option.\n Do you want to store these settings for future use? (y/n) \n")
        if store == 'y':
            with open('DIS_Settings.json', 'w') as configFile:
                json.dump(config, configFile)
    return config

# def injectEvents(fleetData, systemData, networksData, processesData, packagesData):
def injectEvents(fleetData, networksData):
    config = verifySettings()
    instance = OpenSearch([{'host':config['ip'],'port':config['port']}], http_auth=(config['username'], config['password']), use_ssl=True, verify_certs=False)

    if not instance.ping():
        print('\nError: Could not connect to the indexer')
        return

    if (verifyIndex(config['indexFleet'],instance, 'FleetAgents')):
        print('\nTrying to inject the fleet generated data...\n')
        try:
            helpers.bulk(instance, fleetData, index=config['indexFleet'])
            print('\nDone!')
        except Exception as e:
            print('\nError: {}'.format(e))
    
        # if (verifyIndex(config['indexInventorySystem'],instance, 'InventorySystem')):
        #     print('\nTrying to inject the system generated data...\n')
        # try:
        #     helpers.bulk(instance, systemData, index=config['indexInventorySystem'])
        #     print('\nDone!')
        # except Exception as e:
        #     print('\nError: {}'.format(e))

        if (verifyIndex(config['indexInventoryNetworks'],instance, 'InventoryNetworks')):
            print('\nTrying to inject the networks generated data...\n')
        try:
            helpers.bulk(instance, networksData, index=config['indexInventoryNetworks'])
            print('\nDone!')
        except Exception as e:
            print('\nError: {}'.format(e))

    return


def main():
    numberAgents = input("\nHow many agents do you want to generate? [default=20]\n")
    if numberAgents == '':
        numberAgents = '20'
    while(not numberAgents.isdigit()):
        numberAgents = input("Invalid option.\n How many agents do you want to generate? \n")

    numberNetworksAgent = input("\nHow many networks by agent do you want to generate? [default=5]\n")
    if numberNetworksAgent == '':
        numberNetworksAgent = '5'
    while(not numberNetworksAgent.isdigit()):
        numberNetworksAgent = input("Invalid option.\n How many networks by agent do you want to generate? \n")

    fleetData = generateFleetData(numberAgents)
    fleetList = list(fleetData)
    # systemData = generateSystemData(fleetList)
    networksData = generateNetworksData(fleetList, numberNetworksAgent)
    # processesData = generateProcessesData(fleetData)
    # packagesData = generatePackagesData(fleetData)

    # injectEvents(fleetData, systemData, networksData, processesData, packagesData)
    injectEvents(fleetList, networksData)
    return

if __name__=="__main__":
    main()
