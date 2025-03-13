import random
import sys
import os.path
import json
from opensearchpy import helpers
from pathlib import Path
import datetime

index_template_file='template.json'
default_count='10000'
default_index_name_prefix='wazuh-states-inventory-processes'
default_index_name=f'{default_index_name_prefix}-sample'
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

def generate_random_ip():
    return f'{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}'

def generate_random_port():
    return random.randint(0,65535)

def generate_random_date():
    start_date = datetime.datetime.now()
    end_date = start_date - datetime.timedelta(days=10)
    random_date = start_date + (end_date - start_date) * random.random()
    return random_date.strftime(DATE_FORMAT)


def generate_random_agent():
    agent_id = f'{random.randint(0, 99):03d}'
    return {
        "id": agent_id,
        "name": f"Agent{random.randint(0, 99)}",
        "version": f"v{random.randint(0, 9)}-stable",
        "host": generate_random_host(),
    }


def generate_random_host():
    return {
        "architecture": random.choice(["x86_64", "arm64"]),
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
    }


def generate_random_process():
    return {
        "args": f"arg{random.randint(0, 9999)}",
        "command_line": f"command{random.randint(0, 9999)}",
        "name": f"process{random.randint(0, 9999)}",
        "parent": {"pid": random.randint(1, 9999)},
        "pid": random.randint(1, 9999),
        "state": random.choice(
            [
                "Running",
                "Uninterruptible Sleep",
                "Interruptable Sleep",
                "Stopped",
                "Zombie",
            ]
        ),
        "stime": generate_random_unix_timestamp(),
        "utime": generate_random_unix_timestamp(),
    }


def generate_random_unix_timestamp():
    start_time = datetime.datetime(2000, 1, 1)
    end_time = datetime.datetime.now()
    random_time = start_time + datetime.timedelta(
        seconds=random.randint(0, int((end_time - start_time).total_seconds()))
    )
    return int(random_time.timestamp())


def generate_random_operation():
    return {"name": random.choice(["INSERTED", "MODIFIED", "DELETED"])}


def generate_random_wazuh():
    return {
        "cluster": {
            "name": f"wazuh-cluster-{random.randint(0, 10)}",
            "node": f"wazuh-cluster-node-{random.randint(0, 10)}",
        },
        "schema": {"version": "1.7.0"},
    }


def generate_document(params):
  # https://github.com/wazuh/wazuh-indexer/pull/744

  return {
      "@timestamp": generate_random_date(),
      "agent": generate_random_agent(),
      "process": generate_random_process(),
      "operation": generate_random_operation(),
      "wazuh": generate_random_wazuh(),
  }

def generate_documents(params):
  for i in range(0, int(params["count"])):
    yield generate_document({"id": i})

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

  helpers.bulk(client, generate_documents(config), index=config['index_name'])
  logger.info(f'Data was indexed into [{config["index_name"]}]')

