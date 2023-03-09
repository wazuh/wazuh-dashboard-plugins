"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
utils used within the app_list module
"""
from spacebridgeapp.rest.util import errors as Errors
from spacebridgeapp.util.constants import APP_LIST
from urllib.parse import unquote, parse_qsl


def get_app_dict(app_list):
    """
    Create app dict from list of apps
    """
    return {app.app_name: app.display_app_name for app in app_list}


def invalid_apps(total_app_list, selected_app_list):
    """
    tests if any apps in an app list
    are invalid based on the viewable apps using
    the permissions of the authtoken from the supplied request

    :param selected_app_list: The app list being tested
    :param total_app_list: The list of all valid apps
    :return invalid_apps: The list of invalid apps
    """

    app_name_dict = get_app_dict(total_app_list)
    invalid_app_list = [app for app in selected_app_list if app not in app_name_dict]
    return invalid_app_list


def validate_write_request(request, total_app_list):
    """
    Common validation for put and post
    methods

    :param request: The HTTP request
    :param total_app_list: The list of all valid apps
    :return app_list: The app list to write to kvstore
    """

    # MSB-1482 - keep_blank_values is required to ensure app_list field was passed in and not return as None
    params = {k: unquote(v) for k, v in dict(parse_qsl(request['payload'], keep_blank_values=True)).items()}
    app_list = params.get(APP_LIST)
    if app_list is None:
        raise Errors.SpacebridgeRestError('Error: Post request must have an app_list', 400)

    # MSB-1482 - str.split(',') will return an array with an empty string which isn't desired so we special case it
    app_list = app_list.split(',') if len(app_list) > 0 else []
    invalid_app_list = invalid_apps(total_app_list, app_list)

    if invalid_app_list:
        raise Errors.SpacebridgeRestError(f'Error: Could not find app(s)={invalid_app_list}', 400)

    return app_list
