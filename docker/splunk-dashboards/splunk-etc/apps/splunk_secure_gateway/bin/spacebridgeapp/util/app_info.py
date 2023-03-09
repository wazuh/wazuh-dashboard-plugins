"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Helpers to get related app info entry objects given an app_name or objects from which we
can parse out an app_name
"""

from http import HTTPStatus
from spacebridgeapp.tags.dashboard_tag import DashboardTag
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import ALERTS_IOS, APPLE_TV, AR_PLUS, VR, IOS, ANDROID, SPLUNK_VR, SPLUNK_TV, \
    FIRE_TV, ANDROID_TV, SPLUNK_TV_COMPANION, ITSI, ITSI_DISPLAY_APP_NAME, \
    IPAD_OS, SPLUNK_IPAD, SPLUNK_IPAD_DEV

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + '_dashboard_app_info.log', 'dashboard_app_info')

# Hard-coded and cached display names
DISPLAY_APP_NAMES = {
    ITSI: ITSI_DISPLAY_APP_NAME
}

# META Data Indicies
APP_NAME = 0
PLATFORM = 1
TAG = 2


async def fetch_display_app_name(request_context, app_name, async_splunk_client):
    """
        Use the client to fetch the display app name. If the fetch fails (i.e. no
        client is provided, or none of the entry response objects match the target
        app_name), returns the provided app_name.

    :param request_context:
    :param app_name: The app name to use for display_app_name lookup
    :param async_splunk_client: The client to use for getting the app info entries
    :return:
    """

    if app_name in DISPLAY_APP_NAMES:
        return DISPLAY_APP_NAMES[app_name]

    if async_splunk_client is None:
        return app_name

    try:
        app_info_response = await async_splunk_client.async_get_app_info(app_name=app_name,
                                                                         auth_header=request_context.auth_header)

        if app_info_response.code != HTTPStatus.OK:
            error = await app_info_response.text()
            LOGGER.warning("Fetch for app info failed. status_code={}, error={}".format(app_info_response.code, error))
            return app_name

        app_info_json = await app_info_response.json()
        info_entry = app_info_json['entry'][0]
        display_app_name = info_entry['content']['label']
        DISPLAY_APP_NAMES[app_name] = display_app_name
        LOGGER.info("Fetched Display App Name: app_name={}, display_app_name={}".format(app_name, display_app_name))
        return display_app_name
    except Exception:
        LOGGER.exception("Unable to fetch display app name for app_name=%s", app_name)

    # If all else fails just return app_name
    return app_name


APP_ID_TO_META_MAP = {
    "com.splunk.mobile.Stargate": [ALERTS_IOS, IOS, DashboardTag.MOBILE.value],
    "com.splunk.mobile.Alerts": [ALERTS_IOS, IOS, DashboardTag.MOBILE.value],
    "com.splunk.android.alerts": [ALERTS_IOS, ANDROID, DashboardTag.MOBILE.value],
    "com.splunk.android.alerts.debug": [ALERTS_IOS, ANDROID, DashboardTag.MOBILE.value],
    "com.splunk.mobile.Ribs": [ALERTS_IOS, IOS, DashboardTag.MOBILE.value],
    "com.splunk.DashKit.Example": [ALERTS_IOS, IOS, DashboardTag.MOBILE.value],
    "com.splunk.mobile.SplunkTV": [SPLUNK_TV, APPLE_TV, DashboardTag.TV.value],
    "com.splunk.mobile.SplunkTvOS": [SPLUNK_TV, APPLE_TV, DashboardTag.TV.value],
    "com.splunk.mobile.ARDemo": [AR_PLUS, IOS, DashboardTag.AR.value],
    "com.splunk.mobile.SplunkAR": [AR_PLUS, IOS, DashboardTag.AR.value],
    "com.splunk.mobile.vrtest": [SPLUNK_VR, VR, DashboardTag.VR.value],
    "com.splunk.mobile.vr": [SPLUNK_VR, VR, DashboardTag.VR.value],
    "com.splunk.mobile.DroneTV": [SPLUNK_TV_COMPANION, IPAD_OS, DashboardTag.TV.value],
    "com.splunk.mobile.DroneController": [SPLUNK_TV_COMPANION, IPAD_OS, DashboardTag.TV.value],
    "com.splunk.android.tv": [SPLUNK_TV, ANDROID_TV, DashboardTag.TV.value],
    "com.splunk.android.tv.debug": [SPLUNK_TV, ANDROID_TV, DashboardTag.TV.value],
    "com.splunk.amazon.tv": [SPLUNK_TV, FIRE_TV, DashboardTag.TV.value],
    "com.splunk.amazon.tv.debug": [SPLUNK_TV, FIRE_TV, DashboardTag.TV.value],
    "com.splunk.mobile.Splunk-iPad": [SPLUNK_IPAD, IPAD_OS, DashboardTag.MOBILE.value],
    "com.splunk.mobile.Asgard": [SPLUNK_IPAD_DEV, IPAD_OS, DashboardTag.MOBILE.value]
}


def get_app_id_meta(app_id, meta_type):
    """
    Function returns app_id metadata by type
    :param app_id:
    :param meta_type:
    :return:
    """
    app_id_meta = APP_ID_TO_META_MAP.get(app_id)
    return app_id_meta[meta_type] if app_id_meta else None


def resolve_app_name(app_id):
    """
    Function maps app id to app category
    :param app_id:
    :return:
    """
    return get_app_id_meta(app_id, APP_NAME)


def get_app_platform(app_id):
    """
    Function maps app id to app platform
    :param app_id:
    :return:
    """
    return get_app_id_meta(app_id, PLATFORM)


def get_app_tag(app_id):
    """
    Function maps app id to app tag
    :param app_id:
    :return:
    """
    return get_app_id_meta(app_id, TAG)
