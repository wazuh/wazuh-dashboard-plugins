import random
import sys
import os.path
import json
from opensearchpy import helpers
from pathlib import Path

index_template_file='template.json'
default_count='10000'
default_index_name='otel-v1-apm-service-map-test'
asset_identifier='otel-v1-apm-service-map'

def generate_document(params):
  id_int = int(params["id"])
  top_limit = id_int - 1 if id_int - 1 > -1 else 0

  data = {
    "hashId": f'06ae51d662ff69c132eae6416b3d50f{random.choice(["1","2","3"])}',
    "serviceName": f'dev-agent-api-{random.choice(["1","2","3"])}',
    "kind": 'SPAN_KIND_SERVER',
    "destination": {
      "domain": f'test{random.choice(["1","2","3"])}',
      "resource": f'test{random.choice(["1","2","3"])}'
    },
    "target": {
      "domain": f'test{random.choice(["1","2","3"])}',
      "resource": f'test{random.choice(["1","2","3"])}'
    },
    "traceGroupName": f'test{random.choice(["1","2","3"])}'
  }
  if(bool(random.getrandbits(1))):
    top_limit = id_int - 1 if id_int - 1 > 0 else 0
    data["parents"] = [f'{asset_identifier}/{str(random.randint(0, top_limit))}/0']

  return data

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
