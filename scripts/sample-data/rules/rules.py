import random
import sys
import os.path
import json
from opensearchpy import helpers

index_template_file='template.json'

def generate_document(params):
  id_int = int(params["id"])
  top_limit = id_int - 1 if id_int - 1 > -1 else 0
  data = {
    "ecs": {"version": "1.7.0"},
    "id": str(id_int),
    "wazuh": {
      "cluster": {
        "name": "wazuh"
      }
    },
    "parent_id": None
  }
  if(bool(random.getrandbits(1))):
    top_limit = id_int - 1 if id_int - 1 > -1 else 0
    data["parent_id"] = str(random.randint(0, top_limit))

  return data

def generate_documents(params):
  for i in range(0, int(params["count"])):
    yield generate_document({"id": i})

def get_params(ctx):
  default_count='100'
  default_index_name='wazuh-rules'
  count = ''
  while not count.isdigit():
    count = input_question(f'\nHow many events do you want to generate? [default={default_count}]\n', {"default_value": default_count})

  index_name = input_question(f'\nEnter the index name [default={default_index_name}]: \n', {"default_value": default_index_name})

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
  ctx.logger.info('Getting configuration')
  config = get_params(ctx)
  print(f'Config {config}')

  client = ctx["client"]

  print(f'Checking existence of index [{config["index_name"]}]')
  if client.indices.exists(config["index_name"]):
    print(f'Index found [{config["index_name"]}]')
    should_delete_index = input_question(f'Remove the [{config["index_name"]}] index? [Y/n]', {"default_value": 'Y'})
    if should_delete_index == 'Y':
      client.indices.delete(config["index_name"])
      print(f'Index [{config["index_name"]}] deleted')
    else:
      print(f'Index found [{config["index_name"]}] should be removed before create and insert documents')
      sys.exit(1)

  print(f'Index not found [{config["index_name"]}]')

  if not os.path.exists(index_template_file):
    print(f'Index template found [{index_template_file}]')
    sys.exit(1)

  with open(index_template_file) as templateFile:
    index_template = json.load(templateFile)
    try:
      client.indices.create(index=config["index_name"], body=index_template)
      print(f'Index [{config["index_name"]}] created')
    except Exception as e:
      print('Error: {}'.format(e))
      sys.exit(1)

  generator = generate_documents(config)
  helpers.bulk(client, generator, index=config['index_name'])


dataset = {
  "name": "rules",
  "run": main
}
