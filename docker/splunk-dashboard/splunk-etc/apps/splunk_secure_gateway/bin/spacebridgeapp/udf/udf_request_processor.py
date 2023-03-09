"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
Module for processing UDF HostedResource requests
"""
from asyncache import cached
from splunk import getWebServerInfo
from cloudgateway.private.encryption.encryption_handler import sign_detached
from http import HTTPStatus
from spacebridge_protocol import http_pb2
from spacebridgeapp.cache.udf_hosted_resource_cache import UdfHostedResourceCache
from spacebridgeapp.udf.udf_util import parse_hosted_resource_path, HostedResourceType, build_encrypted_resource, \
    get_kvstore_sources_from_resource_type, parse_udf_kvstore_resource, generate_cache_key
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, KEY
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.messages.util import fetch_device_info
from spacebridgeapp.request.request_processor import SpacebridgeAuthHeader

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_udf_request_processor.log", "udf_request_processor")

_resource_url_cache = UdfHostedResourceCache(maxsize=32)


async def fetch_kvstore_resource(request_context,
                                 resource_key,
                                 resource_type,
                                 async_kvstore_client=None):
    """
    Fetch kvstore resource given resource_key
    :param request_context:
    :param resource_key:
    :param resource_type:
    :param async_kvstore_client:
    :return:
    """
    resource_source_list = get_kvstore_sources_from_resource_type(resource_type)

    for app, collection in resource_source_list:
        r = await async_kvstore_client.async_kvstore_get_request(collection=collection,
                                                                 auth_header=request_context.system_auth_header,
                                                                 key_id=resource_key,
                                                                 app=app)
        if r.code == HTTPStatus.NOT_FOUND:
            continue

        # Exit loop if anything other than NOT_FOUND is encountered
        break

    if r.code != HTTPStatus.OK:
        response = await r.text()
        raise SpacebridgeApiRequestError(
            f"Exception fetching resource from KV Store with error_code={r.code}, error_msg={response}",
            status_code=r.code)

    response_json = await r.json()
    mime, resource_bytes = parse_udf_kvstore_resource(response_json)

    # Raise exception if unable to parse response_json
    if not mime and not resource_bytes:
        raise SpacebridgeApiRequestError(
            f"Unrecognized image source format.  app={app}, collection={collection}, {KEY}={response_json[KEY]}, "
            f"fields={response_json.keys()}",
            status_code=HTTPStatus.BAD_REQUEST)

    return mime, resource_bytes


async def fetch_local_resource(request_context, resource_uri, async_client):
    """
    Fetch the bytes of a local image resource_uri
    :param request_context:
    :param resource_uri:
    :param async_client:
    :return:
    """
    web_hostname = getWebServerInfo()
    uri = f'{web_hostname}{resource_uri}'
    response = await async_client.async_get_request(uri=uri, auth_header=request_context.auth_header)

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(
            f"Exception fetching local resource with error_code={response.code}, error_msg={response_text}",
            status_code=response.code)

    # Get image content-type
    content_type = response.headers['content-type']

    # When getting the response through the SDK we need to get the raw bytes directly from the response using _body
    # Since read() is not idempotent we aren't able to call it due to it already being called in Spacebridge SDK
    return content_type, response._body


async def fetch_encrypted_resource_url(request_context, mime, resource_bytes, encryption_context,
                                       async_kvstore_client=None, async_spacebridge_client=None):
    """
    Encrypt and store the resource_bytes in Spacebridge asset storage and return the encrypted resource url
    :param request_context:
    :param mime:
    :param resource_bytes:
    :param encryption_context:
    :param async_kvstore_client:
    :param async_spacebridge_client:
    :return:
    """
    # Fetch device_info to get public key
    device_info = await fetch_device_info(device_id=request_context.raw_device_id,
                                          async_kvstore_client=async_kvstore_client,
                                          system_auth_header=request_context.system_auth_header)

    payload = build_encrypted_resource(resource_bytes=resource_bytes,
                                       device_encrypt_public_key=device_info.encrypt_public_key,
                                       encryption_context=encryption_context)

    signature = sign_detached(encryption_context.sodium_client, encryption_context.sign_private_key(), payload)
    sender_id = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)

    r = await async_spacebridge_client.async_send_storage_request(payload=payload,
                                                                  content_type=mime,
                                                                  signature=signature,
                                                                  auth_header=SpacebridgeAuthHeader(sender_id),
                                                                  request_id=request_context.request_id)

    if r.code != HTTPStatus.OK:
        response = await r.text()
        raise SpacebridgeApiRequestError(
            f"Exception storing resource to Spacebridge with code={r.code}, error_msg={response}",
            status_code=r.code)

    # When getting the response through the SDK we need to get the raw bytes directly from the response using _body
    # Since read() is not idempotent we aren't able to call it due to it already being called in Spacebridge SDK
    storage_response = http_pb2.StorageResponse()
    storage_response.ParseFromString(r._body)

    return storage_response.payload.readUri, storage_response.payload.readUriExpiresAt


@cached(cache=_resource_url_cache,
        key=lambda request_context, async_kvstore_client, async_spacebridge_client, encryption_context,
                   hosted_resource_type, parsed_path, resource_type:
        generate_cache_key(request_context.device_id, hosted_resource_type, parsed_path, resource_type))
async def get_udf_hosted_resource(request_context,
                                  async_kvstore_client,
                                  async_spacebridge_client,
                                  encryption_context,
                                  hosted_resource_type,
                                  parsed_path,
                                  resource_type):
    """
    Given hosted_resource_type return a resource_url and url_expires_at time.  This method is annotated with @cached
    which will cache the results from spacebridge asset storage endpoint.
    :param request_context:
    :param async_kvstore_client:
    :param async_spacebridge_client:
    :param encryption_context:
    :param hosted_resource_type:
    :param parsed_path:
    :param resource_type:
    :return:
    """
    resource_url = ""
    url_expires_at = ""

    if hosted_resource_type == HostedResourceType.KVSTORE:
        mime, resource_bytes = await fetch_kvstore_resource(request_context=request_context,
                                                            resource_key=parsed_path,
                                                            resource_type=resource_type,
                                                            async_kvstore_client=async_kvstore_client)
    elif hosted_resource_type == HostedResourceType.LOCAL:
        # Just need to pass in any AsyncNonSslClient
        mime, resource_bytes = await fetch_local_resource(request_context=request_context,
                                                          resource_uri=parsed_path,
                                                          async_client=async_kvstore_client)
    elif hosted_resource_type == HostedResourceType.URL:
        raise SpacebridgeApiRequestError("Fetching URLs resource from Spacebridge is not currently supported",
                                         status_code=HTTPStatus.METHOD_NOT_ALLOWED)
    else:
        raise SpacebridgeApiRequestError("Exception fetching hosted resource, unknown resource type",
                                         status_code=HTTPStatus.BAD_REQUEST)

    if mime and resource_bytes:
        resource_url, url_expires_at = await fetch_encrypted_resource_url(
            request_context=request_context, mime=mime, resource_bytes=resource_bytes, 
            encryption_context=encryption_context, async_kvstore_client=async_kvstore_client,
            async_spacebridge_client=async_spacebridge_client)

    return resource_url, url_expires_at


async def process_udf_hosted_resource_get(request_context,
                                          client_single_request,
                                          server_single_response,
                                          async_kvstore_client=None,
                                          async_spacebridge_client=None,
                                          encryption_context=None):
    """
    Process a UDF hosted resource get request. This used for fetching assets which are used within UDF dashboards
    such as images.
    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_kvstore_client:
    :param async_spacebridge_client:
    :param encryption_context:
    """
    resource_path = client_single_request.udfHostedResourceRequest.resourceUrl
    resource_type = client_single_request.udfHostedResourceRequest.resourceType
    hosted_resource_type, parsed_path = parse_hosted_resource_path(resource_path)

    LOGGER.debug("UdfHostedResourceCache Contents: hosted_resource_type=%s, resource_path=%s, resource_type=%s, "
                 "max_size=%s, current_cache_size=%s, cache_keys=%s",  hosted_resource_type, resource_path,
                 resource_type, _resource_url_cache.maxsize, _resource_url_cache.currsize,
                 list(_resource_url_cache.keys()))
    resource_url, url_expires_at = await get_udf_hosted_resource(request_context=request_context,
                                                                 async_kvstore_client=async_kvstore_client,
                                                                 async_spacebridge_client=async_spacebridge_client,
                                                                 encryption_context=encryption_context,
                                                                 hosted_resource_type=hosted_resource_type,
                                                                 parsed_path=parsed_path,
                                                                 resource_type=resource_type)

    LOGGER.debug("Processing UdfHostedResourceRequest: "
                 "resource_path=%s, resource_type=%s, resourse_url=%s, url_expires_at=%s",
                 resource_path, resource_type, resource_url, url_expires_at)
    server_single_response.udfHostedResourceResponse.encryptedResourceUrl = resource_url
    server_single_response.udfHostedResourceResponse.resourceUrlExpiresAt = url_expires_at
