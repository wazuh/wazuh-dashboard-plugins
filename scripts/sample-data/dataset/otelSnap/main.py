from datetime import timedelta, datetime
import random
import sys
import os.path
import json
from opensearchpy import helpers
from pathlib import Path

index_template_file='template.json'
default_count='10000'
default_index_name='otel-v1-apm-span-test'
asset_identifier='otel-v1-apm-span'

def generateRandomDate(days_interval=10):
    start_date = datetime.now()
    end_date = start_date - timedelta(days=days_interval)
    random_date = start_date + (end_date - start_date) * random.random()
    return(random_date.strftime("%Y-%m-%dT%H:%M:%S.{}Z".format(random.randint(0, 999))))

def generate_document(params):
  id_int = int(params["id"])
  top_limit = id_int - 1 if id_int - 1 > -1 else 0

  data = {
    "traceId": f'f151842ced0cd956ec005da19942433{random.choice(["0", "1", "2", "3"])}',
    "spanId": f'fc28883b621642e2{random.choice(["0", "1", "2", "3"])}',
    "traceState": "",
    "parentSpanId": f'fc28883b621642e2{random.choice(["0", "1", "2", "3"])}',
    "name": f'HTTP {random.choice(["GET", "POST", "PUT", "DELETE"])}',
    "kind": "SPAN_KIND_SERVER",
    "startTime": generateRandomDate(),
    "endTime": generateRandomDate(),
    "durationInNanos": random.randint(0, 1000000),
    "serviceName": f'order{random.choice(["1","2","3"])}',
    "events": [],
    "links": [],
    "droppedAttributesCount": random.randint(0, 100),
    "droppedEventsCount": random.randint(0, 100),
    "droppedLinksCount": random.randint(0, 100),
    "traceGroup": f'HTTP {random.choice(["GET", "POST", "PUT", "DELETE"])}',
    "traceGroupFields.endTime": generateRandomDate(),
    "traceGroupFields.statusCode": random.choice([0, 2]),
    "traceGroupFields.durationInNanos": random.randint(0, 1000000),
    "span.attributes.net@peer@ip": f'{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}',
    "instrumentationLibrary.version": "0.14b0",
    "resource.attributes.telemetry@sdk@language": "python",
    "span.attributes.host@port": random.randint(0, 1000),
    "span.attributes.http@status_text": f'{random.choice(["OK", "Not Found", "Service Unavailable"])}',
    "resource.attributes.telemetry@sdk@version": "0.14b0",
    "resource.attributes.service@instance@id": f'{random.randint(0, 100000000)}',
    "resource.attributes.service@name": f'order{random.choice(["1","2","3"])}',
    "span.attributes.component": "http",
    "status.code": random.choice([0, 2]),
    "instrumentationLibrary.name": "opentelemetry.instrumentation.flask",
    "span.attributes.http@method": f'{random.choice(["GET", "POST", "PUT", "DELETE"])}',
    "span.attributes.http@user_agent": "python-requests/2.6.0 CPython/2.7.5 Linux/3.10.0-1160.15.2.el7.x86_64",
    "span.attributes.net@peer@port": random.randint(0, 1000),
    "resource.attributes.telemetry@sdk@name": "opentelemetry",
    "span.attributes.http@server_name": "0.0.0.0",
    "span.attributes.http@host": f'{random.randint(0, 255)}-{random.randint(0, 255)}-{random.randint(0, 255)}-{random.randint(0, 255)}:{random.randint(0, 1000)}',
    "span.attributes.http@target": f'/ws/v1/cluster/apps/new-application{random.choice(["1","2","3"])}',
    "span.attributes.http@scheme": "http",
    "resource.attributes.host@hostname": f'ip-{random.randint(0, 255)}-{random.randint(0, 255)}-{random.randint(0, 255)}-{random.randint(0, 255)}.ec2.internal",',
    "span.attributes.http@flavor": "1.1",
    "span.attributes.http@status_code": f'{random.choice([200, 404, 503])}',
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
