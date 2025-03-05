from opensearchpy import OpenSearch, helpers
import json
import os.path
import warnings
from importlib import import_module
import logging
import sys

warnings.filterwarnings("ignore")

def get_opensearch_connection():
  verified = False
  connection_config_file='connection.json'
  if os.path.exists(connection_config_file):
    with open(connection_config_file) as configFile:
      config = json.load(configFile)
      if 'ip' not in config or 'port' not in config or 'username' not in config or 'password' not in config:
        print('\nConnection configuration file is not properly configured. Continuing without it.')
      else:
        verified = True
  else:
    print('\nConnection configuration file not found. Continuing without it.')

  if not verified:
    ip = input("\nEnter the IP of your Indexer [default=0.0.0.0]: \n")
    if ip == '':
      ip = '0.0.0.0'

    port = input("\nEnter the port of your Indexer [default=9200]: \n")
    if port == '':
      port = '9200'

    username = input("\nUsername [default=admin]: \n")
    if username == '':
      username = 'admin'

    password = input("\nPassword [default=admin]: \n")
    if password == '':
      password = 'admin'

    config = {'ip':ip,'port':port,'username':username,'password':password}

    store = input("\nDo you want to store these settings for future use? (y/n) [default=n] \n")
    if store == '':
        store = 'n'

    while store != 'y' and store != 'n':
        store = input("\nInvalid option.\n Do you want to store these settings for future use? (y/n) \n")
    if store == 'y':
      with open(connection_config_file, 'w') as configFile:
        json.dump(config, configFile)
  return config


def main():
    config = get_opensearch_connection()
    client = OpenSearch([{'host':config['ip'],'port':config['port']}], http_auth=(config['username'], config['password']), use_ssl=True, verify_certs=False)
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)

    if not client.ping():
      logger.error('Could not connect to the indexer')
      return

    module_name = sys.argv[1]

    if not module_name:
      logger.error('No dataset selected')

    module = import_module(f'dataset.{module_name}.main')
    logger.info(f'Running dataset [{module_name}]')
    module.main({"client":client, "logger": logging.getLogger(module_name)})

if __name__=="__main__":
  main()
