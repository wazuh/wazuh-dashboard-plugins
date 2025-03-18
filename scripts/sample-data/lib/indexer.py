import sys
import os.path
import json
from opensearchpy import helpers
from pathlib import Path
from lib.input import input_question

def get_index_documents_config_creator(default_index_name = '', default_count = 10000):
  def get_index_documents_config(config = None):
    count = ''
    while not count.isdigit():
      count = input_question(f'How many documents do you want to generate? [default={default_count}]', {"default_value": default_count})

    input_index_name = input_question(f'Enter the index name [default={default_index_name}]', {"default_value": default_index_name})

    return {
      "count": count,
      "index_name": input_index_name
    }
  return get_index_documents_config


def helper_create_index(client, index_name, template_file, logger):

  logger.debug(f'Checking existence of index [{index_name}]')
  if client.indices.exists( index_name):
    logger.info(f'Index found [{index_name}]')
    should_delete_index = input_question(f'Remove the [{index_name}] index? [Y/n]', {"default_value": 'Y'})
    if should_delete_index == 'Y':
      client.indices.delete( index_name)
      logger.info(f'Index [{index_name}] deleted')
    else:
      logger.error(f'Index found [{index_name}] should be removed before create and insert documents')
      sys.exit(1)

  if not os.path.exists(template_file):
    logger.error(f'Index template not found [{template_file}]')
    sys.exit(1)

  with open(template_file) as templateFile:
    index_template = json.load(templateFile)
    # Remove index_patterns and order that is not used in the index settings
    del index_template['index_patterns']
    del index_template['order']
    try:
      client.indices.create(index=index_name, body=index_template)
      logger.info(f'Index [{index_name}] created')
    except Exception as e:
      logger.error(f'Error: {e}')
      sys.exit(1)

def helper_index_data(client, index_name, generate_documents, logger):
  logger.debug(f'Indexing data into [{index_name}]')
  helpers.bulk(client, generate_documents, index=index_name)
  logger.info(f'Data was indexed into [{index_name}]')


def create_index_data(ctx, template_file, generate_document, index_document_config):
  logger = ctx["logger"]

  helper_create_index(
    client=ctx["indexer_client"],
    index_name=index_document_config['index_name'],
    template_file=template_file,
    logger=logger
  )

  helper_index_data(
    client=ctx["indexer_client"],
    index_name=index_document_config['index_name'],
    generate_documents=generate_documents(generate_document, index_document_config['count']),
    logger= logger
  )


def generate_documents(generate_document, count):
  for i in range(0, int(count)):
    yield generate_document({"id": i})
