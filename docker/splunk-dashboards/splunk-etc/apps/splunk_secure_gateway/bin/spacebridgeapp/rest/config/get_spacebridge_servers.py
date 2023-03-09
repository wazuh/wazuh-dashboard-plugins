"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for getting spacebridge regions
"""
import base64
import json
import sys
import requests
import time

import splunk
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.discovery import query_discovery_instances
from spacebridgeapp.rest.base_endpoint import BaseRestHandler

from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, AUTHTOKEN, SESSION, STATUS, PAYLOAD, SPACEBRIDGE_SERVER, \
    HTTP_DOMAIN, INSTANCE_CONFIG_COLLECTION_NAME, SERVER, RT
from spacebridge_protocol import discovery_pb2
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.exceptions.key_not_found_exception import KeyNotFoundError
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore
from itertools import groupby
from operator import itemgetter
from statistics import mean
import concurrent.futures

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_spacebridge_servers")
DEFAULT_SPACEBRIDGE_SERVER = config.get_spacebridge_server()

class SpacebridgeServers(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the spacebridge_servers endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
          This will return the list of spacebridge servers from spacebridge discovery.

          :param request
          :return:
          """

        # Setup
        system_authtoken = request['system_authtoken']
        session_token = request[SESSION][AUTHTOKEN]
        encryption_context = SplunkEncryptionContext(system_authtoken, SPACEBRIDGE_APP_NAME, SodiumClient(LOGGER))

        # Get spacebridge server
        current_spacebridge_server_url = get_current_spacebridge_server(session_token)

        # Get all possible spacebridge servers from discovery
        spacebridge_instances_response = query_discovery_instances(encryption_context, config)

        spacebridge_instances = discovery_pb2.SpacebridgeInstancesResponse()
        spacebridge_instances.ParseFromString(spacebridge_instances_response.instances)

        # Get spacebridge response times
        response_times = get_spacebridge_response_times(spacebridge_instances.instances)

        # Construct all spacebridge instance objects from discovery
        spacebridge_instances_array = [{'http_domain': x.httpDomain,
                                        'grpc_domain': x.grpcDomain,
                                        'region': x.region,
                                        'label': x.regionLabel,
                                        'description': x.regionDescription,
                                        'instance_id': x.instanceId,
                                        'id': x.id,
                                        'current': x.httpDomain == current_spacebridge_server_url, 
                                        'response_time': response_times[x.httpDomain]}
                                       for x in spacebridge_instances.instances]

        return {
            STATUS: HTTPStatus.OK,
            PAYLOAD: {'result': 'ok', 'payload': spacebridge_instances_array}
        }


def get_current_spacebridge_server(session_token: str) -> str:
    try:
        spacebridge_bundle = get_current_spacebridge_server_bundle(session_token)
        spacebridge_server_url = spacebridge_bundle.get(HTTP_DOMAIN, DEFAULT_SPACEBRIDGE_SERVER)
    except Exception as e:
        LOGGER.debug(str(e))
        spacebridge_server_url = DEFAULT_SPACEBRIDGE_SERVER

    return spacebridge_server_url

def get_current_spacebridge_server_bundle(session_token: str) -> dict:
    try:
        kvstore_service = kvstore(collection=INSTANCE_CONFIG_COLLECTION_NAME,
                                  session_key=session_token)
        response, result = kvstore_service.get_item_by_key(SPACEBRIDGE_SERVER)
        result_json = json.loads(result)

        return result_json

    except splunk.RESTException as e:
        LOGGER.error("Unable to fetch current spacebridge bundle, error: {}".format(str(e)))

        return {STATUS: HTTPStatus.INTERNAL_SERVER_ERROR}

def get_spacebridge_response_times(spacebridge_instances):
    n_requests = 5 
    if not spacebridge_instances: 
        return {}

    # For each server, make multiple get requests and record response times 
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        tasks = []
        for instance in spacebridge_instances:
            for _ in range(n_requests):
                tasks.append(executor.submit(get_spacebridge_response_time, instance.httpDomain))
        # As requests are completed, add results to list
        all_response_times = [task.result() for task in concurrent.futures.as_completed(tasks)]

    # Get average response times for each server
    avg_response_times = {}
    for server, response_times in groupby(all_response_times, key=itemgetter(SERVER)):
        # Get only non-null response times 
        defined_response_times = [x[RT] for x in response_times if x[RT] != None]
        if len(defined_response_times): 
            avg_response_times[server] = mean(defined_response_times)
        else: 
            avg_response_times[server] = None

    return avg_response_times

def get_spacebridge_response_time(serverHttpDomain: str) -> dict:
    request_timeout = 3
    try:
        # Perform GET request to spacebridge server health endpoint
        serverURL = 'https://{}/health_check'.format(serverHttpDomain)
        response = requests.get(
            serverURL, proxies=config.get_proxies(), timeout=request_timeout)
        response_time = response.elapsed.total_seconds()
        
        # Raise exception for bad status codes
        response.raise_for_status()
    except requests.exceptions.HTTPError as err:
        LOGGER.info("Error reaching {}: {}".format(serverURL, err))
        response_time = None

    return {SERVER: serverHttpDomain, RT: response_time}