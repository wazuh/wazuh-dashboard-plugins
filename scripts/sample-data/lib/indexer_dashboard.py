from lib.indexer import create_index_data, get_index_documents_config_creator
from lib.dashboard import get_index_pattern_config_creator, helpers_create_index_pattern


def setup_dataset_index_index_pattern(ctx, template_file, generate_document, default_index_name, default_count):

  dataset=ctx['dataset']
  configuration = ctx['configuration']

  # create index
  dataset_config_key_index = f'dataset/{dataset}/index'
  configuration.register(
    dataset_config_key_index,
    get_index_documents_config_creator(default_index_name, default_count),
    lambda config: 'count' in config or 'index_name' in config
  )

  create_index_data(
    ctx,
    template_file=template_file,
    generate_document=generate_document,
    index_document_config=configuration.get(dataset_config_key_index)
  )

  # create index pattern
  dataset_config_key_index_pattern = f'dataset/{dataset}/index_pattern'
  configuration.register(
    dataset_config_key_index_pattern,
    get_index_pattern_config_creator(default_index_name),
    lambda config: 'create_index_pattern' in config or 'index_pattern_name' in config
  )

  config_dashboard=configuration.get(dataset_config_key_index_pattern)

  dashboard_client=ctx['dashboard_client']

  if config_dashboard['create_index_pattern'] == 'y' and config_dashboard['index_pattern_name']:
      helpers_create_index_pattern(dashboard_client, config_dashboard['index_pattern_name'])