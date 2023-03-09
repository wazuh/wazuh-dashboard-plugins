"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Utility module to help in processing Dashboard tags
"""
import xml.etree.ElementTree as ET
from http import HTTPStatus
from semver import VersionInfo
import urllib.parse as urllib
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, REGISTERED_DEVICES_COLLECTION_NAME, \
    TAGGING_CONFIG_COLLECTION_NAME, KEY
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.dashboard.dashboard_helpers import parse_dashboard_id
from spacebridgeapp.dashboard.parse_data import get_root_element
from spacebridgeapp.dashboard.parse_helpers import get_text
from spacebridgeapp.util.string_utils import append_path_to_uri
from spacebridgeapp.util.app_info import get_app_tag
from spacebridgeapp.tags.dashboard_tag import DashboardTag

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_dashboard_tag_util.log", "dashboard_tag_util")
DEVICE_ID = 'device_id'
APP_ID = 'app_id'
GENERATOR = 'generator'
VERSION = 'version'
ENABLED = 'enabled'
MIN_SPLUNK_VERSION_FOR_TAGS = '8.2.2105'
__SPLUNK_VERSION__ = None
OUTPUT_MODE_JSON = {'output_mode': 'json'}


async def get_app_id_from_device_id(auth_header, device_id, user, async_kvstore_client):
    """
    Get app_id for device given it's device id
    :param auth_header:
    :param user:
    :param device_id:
    :param async_kvstore_client:
    :return:
    """
    response = await async_kvstore_client.async_kvstore_get_request(
        REGISTERED_DEVICES_COLLECTION_NAME, auth_header=auth_header, owner=user)

    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        for device in response_json:
            if device[DEVICE_ID] == device_id:
                return device.get(APP_ID)

    LOGGER.error(f"Unable to fetch app_id for device={device_id}, code={response.code}")
    return None


def is_dashboard_tagging_supported(splunk_version):
    if splunk_version:
        # To handle non-semver version number, only care about major.minor.patch MSB-2280
        ver = splunk_version.split('.')[:3]
        major_minor_patch = VersionInfo(*ver)
        return major_minor_patch.compare(MIN_SPLUNK_VERSION_FOR_TAGS) >= 0
    return False


async def get_tagging_config_map(request_context, async_kvstore_client):
    """
    Get tagging_config settings as a map by _key
    :param request_context:
    :param async_kvstore_client:
    :return:
    """
    response = await async_kvstore_client.async_kvstore_get_request(collection=TAGGING_CONFIG_COLLECTION_NAME,
                                                                    auth_header=request_context.auth_header)
    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        return {config.get(KEY): config for config in response_json}
    return {}


async def get_dashboard_tags(request_context, async_splunk_client, async_kvstore_client):
    """
    Utility method to get the dashboard tag associated with device_id
    :param request_context:
    :param async_splunk_client:
    :param async_kvstore_client:
    :return:
    """

    splunk_version = await async_splunk_client.async_get_splunk_version(auth_header=request_context.auth_header)
    if not is_dashboard_tagging_supported(splunk_version):
        LOGGER.debug(f"Dashboard Tagging is not supported for Splunk version={splunk_version}")
        return None

    app_id = await get_app_id_from_device_id(auth_header=request_context.auth_header,
                                             device_id=request_context.device_id,
                                             user=request_context.current_user,
                                             async_kvstore_client=async_kvstore_client)
    if not app_id:
        LOGGER.debug("Unable to fetch APP_ID for Dashboard Tag Filtering.")
        return None

    return [get_app_tag(app_id)]


def validate_tags_list(tags):
    """
    List of tags to validate.  Will throw SpacebridgeAPIRequestError when list is not valid
    :param tags:
    :return: True if valid, will raise SpacebridgeApiRequestError is not
    """
    # Validate proper format and non-empty
    if not tags or not isinstance(tags, dict):
        raise SpacebridgeApiRequestError(
            message="Invalid tags format specified.  Must be a list and not empty.",
            status_code=HTTPStatus.BAD_REQUEST
        )

    # Validate tag values are expected values
    for tag in tags:
        if not DashboardTag.has_value(tag):
            raise SpacebridgeApiRequestError(
                message=f"The tag={tag} is not a valid value.",
                status_code=HTTPStatus.BAD_REQUEST
            )

    return True


async def get_dashboard_edit_link_and_xml_root_element(request_context, async_splunk_client, dashboard_id):
    """
    Helper method use to validate a dashboard_id and return the edit_link and xml root_element used to modify values in
    the dashboard xml.  Will through SpacebridgeApiRequestError exceptions if data returned is invalid.
    :param request_context:
    :param async_splunk_client:
    :param dashboard_id:
    :return:
    """
    # Validate dashboard_id and Read dashboard view
    owner, app_name, dashboard_name = parse_dashboard_id(dashboard_id)
    response = await async_splunk_client.async_get_dashboard_request(owner=owner, app_name=app_name,
                                                                     auth_header=request_context.auth_header,
                                                                     params=OUTPUT_MODE_JSON,
                                                                     dashboard_name=dashboard_name)

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(message=response_text, status_code=response.code)

    # Read dashboard edit link and eai:data content
    response_json = await response.json()
    entry_json_list = response_json.get('entry')

    if not entry_json_list:
        raise SpacebridgeApiRequestError(message="Unable to read entry info for dashboard.",
                                         status_code=HTTPStatus.NOT_FOUND)

    entry_json = entry_json_list[0]

    # Edit xml
    dashboard_xml_data = entry_json.get('content', {}).get('eai:data')
    root_element = get_root_element(dashboard_xml_data)
    if not root_element:
        raise SpacebridgeApiRequestError(message="Unable to read dashboard xml data.",
                                         status_code=HTTPStatus.NOT_FOUND)

    edit_link = entry_json.get('links', {}).get('edit')
    if not edit_link:
        raise SpacebridgeApiRequestError(message="Unable to read dashboard edit link",
                                         status_code=HTTPStatus.NOT_FOUND)

    return edit_link, root_element


def edit_tags_xml(root_element, tags):
    """
    Helper method that will remove dashboard tag values from root_element <tags> node if remove is True, otherwise will
    add tag value to <tags> node.  If no update is required this method will return False, otherwise True.
    :param root_element:
    :param tags:
    :return:
    """
    tags_element = root_element.find('tags')
    tags_text = get_text(tags_element)
    tags_list = tags_text.split(',') if tags_text else []

    # Perform operation on tags
    for tag, enabled in tags.items():
        if enabled:
            # Add to tags_list
            if tag not in tags_list:
                tags_list.append(tag)
        else:
            # Remove from tags_list
            if tag in tags_list:
                tags_list.remove(tag)

    # No update required
    if tags_element is None and not tags_list:
        return False

    # Create new comma separated string
    if not tags_list:
        root_element.remove(tags_element)
    else:
        # Create new tags_element if not yet created
        if tags_element is None:
            # No tags element detected insert one at top of root_element
            tags_element = ET.Element('tags')
            tags_element.tail = root_element[0].tail if root_element else '\n\t'
            root_element.insert(0, tags_element)

        tags_text = ','.join(tags_list)
        tags_element.text = tags_text
    return True


async def edit_dashboard_xml(request_context, async_splunk_client, edit_link, root_element):
    """
    Helper method to send POST request to edit_link to update eai:data field.  This method will raise any Exceptions if
    POST request doesn't return successful.
    :param request_context:
    :param async_splunk_client:
    :param edit_link:
    :param root_element:
    :return:
    """
    eai_data = "eai:data=" + urllib.quote(ET.tostring(root_element, encoding='unicode', method='xml'))
    # Example edit_link: "/servicesNS/nobody/search/data/ui/views/single_value_test"
    # Remove the leading '/' from edit_link as append_path_to_uri expects path without it
    uri = append_path_to_uri(base_uri=async_splunk_client.uri, path=edit_link[1:])
    response = await async_splunk_client.async_post_request(auth_header=request_context.auth_header,
                                                            uri=uri, params=OUTPUT_MODE_JSON, data=eai_data)

    # Return any request errors from the last operation
    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(message=response_text, status_code=response.code)

    return uri, eai_data


async def edit_dashboard_tags(request_context, async_splunk_client, dashboard_id, tags):
    """
    This method will call all the steps required to update dashboard tags.
    1. Validate Tags
    2. Validate and get information to edit xml on dashboard
    3. Modify the tags
    4. Post to edit the xml on dashboard
    :param request_context:
    :param async_splunk_client:
    :param dashboard_id:
    :param tags: dictionary of tag and enabled boolean
    :return:
    """
    # Validate Tags, will raise Exceptions
    validate_tags_list(tags)

    # Get edit_link and xml root_element, will raise Exceptions
    edit_link, root_element = await get_dashboard_edit_link_and_xml_root_element(
        request_context=request_context, async_splunk_client=async_splunk_client, dashboard_id=dashboard_id)

    # Will update the xml in root_element directly
    write_xml = edit_tags_xml(root_element=root_element, tags=tags)
    if not write_xml:
        return

    # Write xml dashboard in eai:data, will raise Exceptions
    await edit_dashboard_xml(request_context=request_context, async_splunk_client=async_splunk_client,
                             edit_link=edit_link, root_element=root_element)
