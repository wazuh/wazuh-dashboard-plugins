from opensearchpy import OpenSearch, helpers
import json
import os.path
import warnings
from importlib import import_module
import logging
import sys
from lib.configuration import Configuration
from lib.dashboard import OpenSearchDashboards
from lib.indexer_dashboard import setup_dataset_index_index_pattern
from pathlib import Path

warnings.filterwarnings("ignore")

configuration_file='config.json'

def get_config_indexer(config = None):
  default_ip='0.0.0.0'
  default_port='9200'
  default_username='admin'
  default_password='admin'
  ip = input(f"Enter the IP of your Indexer [default={default_ip}]: ")
  if ip == '':
    ip = default_ip

  port = input(f"\nEnter the port of your Indexer [default={default_port}]: ")
  if port == '':
    port = default_port

  username = input(f"\nUsername [default={default_username}]: ")
  if username == '':
    username = default_username

  password = input(f"\nPassword [default={default_password}]: ")
  if password == '':
    password = default_password

  return {'ip':ip,'port':port,'username':username,'password':password}

def get_config_dashboard(config = None):
  default_url='https://localhost:5601'
  default_username='admin'
  default_password='admin'
  url = input(f"Enter the URL of your Dashboard [default={default_url}]: ")
  if url == '':
    url = default_url

  username = input(f"\nUsername [default={default_username}]: ")
  if username == '':
    username = default_username

  password = input(f"\nPassword [default={default_password}]: ")
  if password == '':
    password = default_password

  return {'url':url,'username':username,'password':password}


def main():
    dataset = sys.argv[1]

    log_level = logging.DEBUG if '--debug' in sys.argv else logging.INFO

    logger = logging.getLogger(__name__)
    logging.basicConfig(level=log_level)

    # Check dataset is defined
    if not dataset:
      logger.error('No dataset selected')
      sys.exit(1)

    datasets_dir = os.path.join(Path(__file__).parent, 'dataset')

    # Get available datasets
    datasets = [f for f in os.listdir(datasets_dir) if os.path.isdir(os.path.join(datasets_dir,f))]

    # Check the selected dataset exists
    if dataset not in datasets:
        logger.error(f'Dataset [{dataset}] not found. Available datasets: {", ".join(datasets)}')
        sys.exit(1)


    # Get configuration
    configuration = Configuration(configuration_file, {'log_level': log_level})
    config = configuration.load()

    # Register configuration
    # Indexer
    configuration.register('indexer', get_config_indexer, lambda config: 'ip' in config or 'port' in config or 'username' in config or 'password' in config )
    # Dashboard
    configuration.register('dashboard', get_config_dashboard, lambda config: 'url' in config or 'username' in config or 'password' in config )

    # Create clients
    # Indexer client
    indexer_client_config = configuration.get('indexer')
    indexer_client = OpenSearch([{
      'host':indexer_client_config['ip'],
      'port':indexer_client_config['port']
      }],
      http_auth=(indexer_client_config['username'], indexer_client_config['password']),
      use_ssl=True,
      verify_certs=False
    )

    if not indexer_client.ping():
      logger.error('Could not connect to the indexer')
      return

    # Dashboard client
    dashboard_client_config = configuration.get('dashboard')
    dashboard_client = OpenSearchDashboards(dashboard_client_config['url'], (dashboard_client_config['username'], dashboard_client_config['password']), {'log_level': log_level})

    # Load dataset
    module = import_module(f'dataset.{dataset}.main')
    logger.info(f'Running dataset [{dataset}]')
    dataset_logger = logging.getLogger(dataset)
    dataset_logger.setLevel(log_level)

    if hasattr(module, 'main'):
        logger.debug(f'Running main method from dataset [{dataset}]')
        module.main({
          "dataset": dataset,
          "logger": logging.getLogger(dataset),
          "configuration": configuration,
          "indexer_client":indexer_client,
          "dashboard_client": dashboard_client,
        })
    else:
        logger.debug('main method is not defined, trying the pre-defined flows')
        if hasattr(module, 'generate_document') and hasattr(module, 'default_index_name') and hasattr(module, 'default_count'):

            # TODO: Add flag to manage the cluster
            def generate_document(*args,**kwargs):
                doc = module.generate_document(*args,**kwargs)
                doc['wazuh']['cluster']['name'] = 'wazuh'
                return doc
            logger.debug(f'Running main method from dataset [{dataset}]')
            setup_dataset_index_index_pattern({
              "dataset": dataset,
              "logger": logging.getLogger(dataset),
              "configuration": configuration,
              "indexer_client":indexer_client,
              "dashboard_client": dashboard_client,
            },
              template_file=os.path.join(datasets_dir, dataset, 'template.json'),
              generate_document=generate_document,
              default_index_name=module.default_index_name,
              default_count=module.default_count
            )

if __name__=="__main__":
  main()
