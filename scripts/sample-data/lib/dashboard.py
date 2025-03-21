import json
import logging
import requests

def get_index_pattern_config_creator(default_index_pattern_name = ''):
  def get_index_pattern_config(config = None):
    default_create_index_pattern='n'
    create_index_pattern = ''
    index_pattern_name = ''
    while not create_index_pattern in ['y', 'n']:
      create_index_pattern = input_question(f'Create index pattern in dashboard? [y/N]', {"default_value": default_create_index_pattern})

    if create_index_pattern == 'y':
      index_pattern_name = input_question(f'Enter the index pattern name [default={default_index_pattern_name}]', {"default_value": default_index_pattern_name})

    return {
      "create_index_pattern": create_index_pattern,
      "index_pattern_name": index_pattern_name
    }
  return get_index_pattern_config


def input_question(message, options = {}):
  response = input(message)

  if(options["default_value"] and response == ''):
    response = options["default_value"]

  return response

class OpenSearchDashboards():
  def __init__(self, address, http_auth, options):
      self.address = address
      self.http_auth = http_auth
      self.session = requests.Session()
      self.session.auth = self.http_auth
      self.session.verify = False
      self.logger = logging.getLogger('opensearchdashboards')
      self.logger.setLevel(options.get('log_level', logging.INFO))

      # Wrap
      self.saved_objects = OpenSearchDashboardsSavedObjects(self)

  def _request(self, method, endpoint, data = None):
      request_url = f"{self.address}{endpoint}"
      headers = {"Content-Type": "application/json", 'osd-xsrf': 'opensearchdashboardpy'}
      self.logger.debug(f'Request: {method.upper()} {request_url} data=[{data}]')
      response = getattr(self.session, method)(request_url, headers=headers, data=data)
      self.logger.debug(f'Response {method.upper()} {request_url}: headers=[{response.headers}] content=[{response.content}]')
      if "application/json" in response.headers['content-type']:
          self.logger.debug(f'Response {method.upper()} [{request_url}] has content-type as [application/json]')
          return response.json()
      return response

  def _create_request_method(method):

      def _create_request_fn(fn):

        def wrapper(self, *args, **kwargs):
            fn(*args, **kwargs)
            return self._request(method, *args, **kwargs)

        return wrapper

      return _create_request_fn

  @_create_request_method('get')
  def get(self, *args, **kwargs):
      pass

  @_create_request_method('post')
  def post(self, *args, **kwargs):
      pass

  @_create_request_method('put')
  def put(self, *args, **kwargs):
      pass

  @_create_request_method('delete')
  def delete(self, *args, **kwargs):
      pass

  @_create_request_method('head')
  def head(self, *args, **kwargs):
      pass


class OpenSearchDashboardsSavedObjects():
  def __init__(self, client):
      self._client = client

      # Wraps
      self.index_patterns = OpenSearchDashboardsSavedObjectsIndexPatterns(self._client)

class OpenSearchDashboardsSavedObjectsIndexPatterns():
  saved_object_type='index-pattern'
  def __init__(self, client):
      self._client = client
      self.logger = self._client.logger

  def get_all(self):
      self.logger.debug('Getting all index patterns')
      response = self._client.get('/api/saved_objects/_find?fields=title&fields=type&per_page=10000&type=index-pattern')
      index_patterns = response['saved_objects']
      self.logger.debug(f'Index patterns [{index_patterns}]')
      return index_patterns
  def exists(self, index_pattern):
      self.logger.debug(f'Checking the existence of index pattern [{index_pattern}]')
      index_patterns = self.get_all()
      return len(list(filter(lambda saved_object: index_pattern in [saved_object['id'], saved_object['attributes']['title']], index_patterns ))) > 0
  def get_fields_for_wildcard(self, index_pattern):
      self.logger.debug(f'Getting fields for wildcards [{index_pattern}]')
      response = self._client.get(f'/api/index_patterns/_fields_for_wildcard?pattern={index_pattern}&meta_fields=_source&meta_fields=_index')
      fields = response['fields']
      self.logger.debug(f'Fields for wildcards [{fields}]')
      return fields
  def create(self, id, title, fields = []):
      data = {
        'attributes': {
            'title': title,
            'fields': json.dumps(fields, separators=(',', ':'))
        },
        'references': []
      }

      self.logger.debug(f'Creating index pattern [{id}][{title}]: [{data}]')
      return self._client.post(f'/api/saved_objects/{OpenSearchDashboardsSavedObjectsIndexPatterns.saved_object_type}/{id}', data=json.dumps(data))
  def delete(self, id):
      self.logger.debug(f'Deleting index pattern [{id}]')
      return self._client.delete(f'/api/saved_objects/{OpenSearchDashboardsSavedObjectsIndexPatterns.saved_object_type}/{id}')


def helpers_create_index_pattern(client, index_pattern_name):
  if client.saved_objects.index_patterns.exists(index_pattern_name):
      client.logger.info(f'Index pattern found [{index_pattern_name}]')
      should_delete_index_pattern = input_question(f'Remove the [{index_pattern_name}] index pattern? [Y/n]', {"default_value": 'Y'})
      if should_delete_index_pattern == 'Y':
        response_delete = client.saved_objects.index_patterns.delete(index_pattern_name)
        client.logger.info(f'Index pattern [{index_pattern_name}] deleted [{response_delete}]')
      else:
        client.logger.error(f'Index pattern found [{index_pattern_name}] should be removed')
        sys.exit(1)
  else:
      client.logger.info(f'Index pattern not found [{index_pattern_name}]')

  fields = client.saved_objects.index_patterns.get_fields_for_wildcard(index_pattern_name)

  respose_create_index_pattern = client.saved_objects.index_patterns.create(index_pattern_name, index_pattern_name, fields)

  client.logger.info(f'Index pattern [index_pattern_name] created')

