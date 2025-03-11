import random
import sys
import os.path
import json
import uuid
from opensearchpy import helpers
from pathlib import Path
from datetime import timedelta, datetime

index_template_file='template.json'
default_count='10000'
default_index_name='wazuh-agents-sample-data'

def generateRandomDate(days_interval=10):
    start_date = datetime.now()
    end_date = start_date - timedelta(days=days_interval)
    random_date = start_date + (end_date - start_date) * random.random()
    return(random_date.strftime("%Y-%m-%dT%H:%M:%S.{}Z".format(random.randint(0, 999))))

def generateRandomGroups(max_groups = 5):
    # Generate a number of groups equal to a random number between 1 and 5
    num_groups = random.randint(1, max_groups)
    # Create a list of group names using numbers
    groups = ['default'] + [f'group{i}' for i in range(1, num_groups + 1)]
    # Return a random sample of groups (at least 1, at most all groups)
    return random.sample(groups, random.randint(1, len(groups)))

def generateGeo():

    city_names = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']

    iso_codes = ['US', 'CA', 'MX', 'GB', 'AU', 'NZ']

    geo={}
    geo['city_name'] = random.choice(city_names)
    geo['continent_name'] = random.choice(['North America', 'Europe', 'Asia', 'Africa', 'Australia', 'Antarctica']),
    geo['continent_code'] = random.choice(['NA', 'EU', 'AS', 'AF', 'OC', 'AN'])
    geo['country_iso_code'] = random.choice(iso_codes)
    geo['country_name'] = random.choice(['United States', 'Canada', 'Mexico', 'United Kingdom', 'Australia', 'New Zealand'])
    geo['location'] = {'lat': random.uniform(-90, 90), 'lon': random.uniform(-180, 180)}
    geo['name'] = random.choice(city_names)
    geo['region_name'] = random.choice(city_names)
    geo['region_iso_code'] = random.choice(iso_codes)
    geo['timezone'] = random.choice(['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'])
    geo['postal_code'] = random.choice(['10001', '20001', '30001', '40001', '50001'])
    return(geo)

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
    host['boot'] = {'id':str(uuid.uuid4())}
    host['cpu'] = {'usage': random.randint(0, 100)}
    host['disk'] = {'read': {'bytes':random.randint(0, 100)}}
    host['disk'] = {'write': {'bytes':random.randint(0, 100)}}
    host['domain'] = random.choice(['local', 'external'])
    host['geo'] = generateGeo()
    host['hostname'] = f"host-{random.randint(1000, 9999)}"
    host['id'] = str(uuid.uuid4())
    host['ip'] = f"192.168.{random.randint(0, 255)}.{random.randint(0, 255)}"
    host['mac'] = ':'.join(['{:02x}'.format(random.randint(0, 255)) for _ in range(6)])
    host['name'] = random.choice(['host-1', 'host-2', 'host-3', 'host-4', 'host-5'])
    host['network'] = generateRandomNetwork()
    host['os'] = {
        'family':  platform_key.lower(),
        'full': os,
        'kernel': f"kernel-{random.randint(1, 10)}.{random.randint(0, 9)}.{random.randint(0, 99)}",
        'name': os.split(' ')[0],
        'platform': platform,
        'type': platform_key.lower(),
        'version': os.split(' ')[-1],
    }
    host['pid_ns_ino'] = str(random.randint(4000000000, 4294967295))
    level = ['none', 'low', 'medium', 'high', 'critical']
    host['risk'] = {
      'calculated_level': random.choice(level),
      'calculated_score': round(random.uniform(0, 100), 2),
      'calculated_score_norm': round(random.uniform(0, 100), 2),
      'static_level': random.choice(level),
      'static_score': round(random.uniform(0, 100), 2),
      'static_score_norm': round(random.uniform(0, 100), 2)
    }
    host['type'] = random.choice(['host', 'container'])
    host['uptime'] = random.randint(0, 100)
    return(host)

def generateRandomNetwork():
    network = {}
    network['egress'] = {'bytes':random.randint(0, 100), 'packets':random.randint(0, 100)}
    network['ingress'] = {'bytes':random.randint(0, 100), 'packets':random.randint(0, 100)}
    return (network)


def generateRandomAgent(i):
    agent={}
    agent['id'] = str(uuid.uuid4())
    agent['key'] = str(uuid.uuid4())
    agent['last_login'] = generateRandomDate()
    agent['name'] = 'Agent_{}'.format(i)
    agent['status'] = random.choice(['active', 'disconnected', 'never_connected'])
    agent['type'] = random.choice(['server', 'client'])
    agent['version'] = 'v5.0.0'
    agent['groups'] = generateRandomGroups()
    agent['host'] = generateRandomHost()
    return(agent)

def generate_documents(number):
    for i in range(0, int(number)):
        yield{
            'agent': generateRandomAgent(i),
        }

def get_params(ctx):
  count = ''
  while not count.isdigit():
    count = input_question(f'How many documents do you want to generate? [default={default_count}]', {"default_value": default_count})

  index_name = input_question(f'Enter the index name [default={default_index_name}]', {"default_value": default_index_name})

  return {
    "count": count,
    "index_name": index_name
  }

def input_question(message, options = {}):
  response = input(message)

  if(options["default_value"] and response == ''):
    response = options["default_value"]

  return response

def main(ctx):
  client = ctx["client"]
  logger = ctx["logger"]
  logger.info('Getting configuration')

  config = get_params(ctx)
  logger.info(f'Config {config}')

  resolved_index_template_file = os.path.join(Path(__file__).parent, index_template_file)

  logger.info(f'Checking existence of index [{config["index_name"]}]')
  if client.indices.exists(config["index_name"]):
    logger.info(f'Index found [{config["index_name"]}]')
    should_delete_index = input_question(f'Remove the [{config["index_name"]}] index? [Y/n]', {"default_value": 'Y'})
    if should_delete_index == 'Y':
      client.indices.delete(config["index_name"])
      logger.info(f'Index [{config["index_name"]}] deleted')
    else:
      logger.error(f'Index found [{config["index_name"]}] should be removed before create and insert documents')
      sys.exit(1)

  if not os.path.exists(resolved_index_template_file):
    logger.error(f'Index template found [{resolved_index_template_file}]')
    sys.exit(1)

  with open(resolved_index_template_file) as templateFile:
    index_template = json.load(templateFile)
    try:
      client.indices.create(index=config["index_name"], body=index_template)
      logger.info(f'Index [{config["index_name"]}] created')
    except Exception as e:
      logger.error(f'Error: {e}')
      sys.exit(1)

  helpers.bulk(client, generate_documents(config['count']), index=config['index_name'])
  logger.info(f'Data was indexed into [{config["index_name"]}]')
