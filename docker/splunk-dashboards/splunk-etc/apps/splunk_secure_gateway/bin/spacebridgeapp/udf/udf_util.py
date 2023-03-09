"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
import base64
import hashlib
from functools import partial
from enum import Enum
from http import HTTPStatus
from cloudgateway.private.encryption.encryption_handler import encrypt_for_send
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.util.constants import SPLUNK_DASHBOARD_APP, SPLUNK_DASHBOARD_STUDIO, ITSI, SA_ITOA, \
    UDF_IMAGE_RESOURCE_COLLECTION, UDF_ICON_RESOURCE_COLLECTION, ITSI_FILES_COLLECTION, ITSI_ICON_COLLECTION

# UDF Hosted Image Constants
HOSTED_KVSTORE_PREFIX = "splunk-enterprise-kvstore://"
ICON_VISUALIZATION_TYPE = "icon"
IMAGE_VISUALIZATION_TYPE = "image"
DATA_URI = 'dataURI'
DATA = 'data'
SVG_PATH = 'svg_path'
METADATA = 'metadata'
TYPE = 'type'

# Resource Source List
UDF_ICON_RESOURCE_LIST = [
    (SPLUNK_DASHBOARD_STUDIO, UDF_ICON_RESOURCE_COLLECTION),
    (SA_ITOA, ITSI_ICON_COLLECTION),
    (SPLUNK_DASHBOARD_APP, UDF_ICON_RESOURCE_COLLECTION)
]
UDF_IMAGE_RESOURCE_LIST = [
    (SPLUNK_DASHBOARD_STUDIO, UDF_IMAGE_RESOURCE_COLLECTION),
    (SA_ITOA, ITSI_FILES_COLLECTION),
    (SPLUNK_DASHBOARD_APP, UDF_IMAGE_RESOURCE_COLLECTION)
]


class HostedResourceType(Enum):
    """
    Enum to enumerate different types of hosted resources such as whether the resource is hosted in kv store
    """

    UNKNOWN = 0
    URL = 1
    KVSTORE = 2
    LOCAL = 3


def parse_hosted_resource_path(resource_path):
    """
    Given a resource path string, parse the string to return the type of the resource and return a tuple of the
    resource type and the parsed resource path
    :param resource_path:
    :return: (HostedResourceType, Resource Path String)
    """
    resource_path = resource_path.strip()
    if resource_path.startswith(HOSTED_KVSTORE_PREFIX):
        return HostedResourceType.KVSTORE, resource_path[len(HOSTED_KVSTORE_PREFIX):]
    elif resource_path.startswith("http://") or resource_path.startswith("https://"):
        return HostedResourceType.URL, resource_path
    elif resource_path.startswith("/"):
        return HostedResourceType.LOCAL, resource_path
    else:
        return HostedResourceType.UNKNOWN, resource_path


def parse_svg_path_resource(data_jsn):
    """
    Parse the response from an svg_path response for stored resources
    :param data_jsn:
    :return: (String, Bytes) containing the mime-type of the resource and the raw bytes of the resource respectively
    """
    svg_path = data_jsn[SVG_PATH]
    svg_bytes = bytes(f'<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
                      f'<svg xmlns="http://www.w3.org/2000/svg">'
                      f'<path d="{svg_path}"></path>'
                      f'</svg>', 'utf-8')
    svg_mime = 'data:image/svg+xml'
    return svg_mime, svg_bytes


def parse_data_kvstore_resource(data_jsn, data_key):
    """
    Parse the response from KV Store for stored resources
    :param data_jsn:
    :param data_key:
    :return: (String, Bytes) containing the mime-type of the resource and the raw bytes of the resource respectively
    """
    metadata_version = data_jsn.get(METADATA, {}).get('version')
    if metadata_version == 'V1':
        mime = f'data:{data_jsn.get(TYPE)}'
        data_payload = data_jsn.get(data_key)
    else:
        data_uri = data_jsn[data_key]
        d = data_uri.split(",")
        data_meta = d[0]
        data_payload = d[1]
        mime, encoding = data_meta.split(";")

        if encoding != 'base64':
            raise SpacebridgeApiRequestError(
                "Unexpected data encoding type. Expected base64 but got encoding={}".format(encoding),
                status_code=HTTPStatus.BAD_REQUEST)

    resource_bytes = base64.b64decode(data_payload)
    return mime, resource_bytes


def parse_udf_kvstore_resource(data_jsn):
    """
    Parse the response from KV Store for stored resources
    :param data_jsn:
    :return: (String, Bytes) containing the mime-type of the resource and the raw bytes of the resource respectively
    """

    if SVG_PATH in data_jsn:
        return parse_svg_path_resource(data_jsn)
    elif DATA_URI in data_jsn:
        return parse_data_kvstore_resource(data_jsn, DATA_URI)
    elif DATA in data_jsn:
        return parse_data_kvstore_resource(data_jsn, DATA)

    return None, None


def build_encrypted_resource(resource_bytes, device_encrypt_public_key, encryption_context):
    """
    Takes resource_bytes and returns the encrypted bytes of the resource encrypted with the client device's public key
    :param resource_bytes
    :param device_encrypt_public_key:
    :param encryption_context:
    :return: Bytes
    """
    encryptor = partial(encrypt_for_send, encryption_context.sodium_client, device_encrypt_public_key)
    return encryptor(resource_bytes)


def get_kvstore_sources_from_resource_type(resource_type):
    """
    Give a resource type for a KV Store Collection Resource, map it to the corresponding list of sources to iterate.
    :param resource_type:
    :return:
    """
    if resource_type.lower() == ICON_VISUALIZATION_TYPE:
        return UDF_ICON_RESOURCE_LIST
    return UDF_IMAGE_RESOURCE_LIST


def generate_cache_key(device_id, hosted_resource_type, parsed_path, resource_type):
    """
    Helper function to generate a cache_key based off of hosted resource params
    :param device_id:
    :param hosted_resource_type:
    :param parsed_path:
    :param resource_type:
    :return:
    """
    values_to_hash = []

    if device_id:
        values_to_hash.append(device_id)

    if hosted_resource_type:
        values_to_hash.append(str(hosted_resource_type))

    if parsed_path:
        values_to_hash.append(parsed_path)

    if resource_type:
        values_to_hash.append(resource_type)

    hash_object = hashlib.md5()
    for val in values_to_hash:
        hash_object.update(val.encode('utf-8'))
    return hash_object.hexdigest()
