"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from spacebridgeapp.logging import setup_logging
from semver import parse_version_info, format_version as format_semver
from spacebridgeapp.util import constants

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_version_request_processor", "version_request_processor")

DEFAULT_VERSION = '0.0.0'

CLIENT_VERSION_LOWER = 'lower'

PRERELEASE_TAG_FAIL = 'fail'

MINIMUM_BUILDS = {
    'fail.local': 9999
}


def format_version(semver_str, build_number):
    version_info = parse_version_info(DEFAULT_VERSION)

    try:
        version_info = parse_version_info(semver_str)
    except (TypeError, ValueError):
        pass

    return format_semver(version_info.major,
                         version_info.minor,
                         version_info.patch,
                         version_info.prerelease,
                         build_number)


def minimum_build(app_id):
    """
    Determines the minimum build for the supplied app id, returns 0 if not configured
    :param app_id:
    :return: the configured build minimum, 0 if not configured
    """
    build_number = int(MINIMUM_BUILDS.get(app_id, 0))
    return build_number


def is_version_ok(app_id, client_semver_str):
    """
    :param app_id:
    :param client_semver_str:
    :return: True if the version passes the configured minimum, False otherwise
    """
    version_info = parse_version_info(DEFAULT_VERSION)

    app_minimum_build = minimum_build(app_id)

    try:
        version_info = parse_version_info(client_semver_str)
        client_build_number = int(version_info.build)
    except (TypeError, ValueError) as e:
        LOGGER.info("Client provided invalid version app_id={}, version={}, error={}".format(app_id, client_semver_str, e))
        # if the client passes an invalid semver string, assume they know what they're doing
        client_build_number = app_minimum_build

    version_cmp = client_build_number - app_minimum_build

    LOGGER.debug("Client build_number={}, minimum_build={}".format(client_build_number, app_minimum_build))

    if version_info.prerelease == PRERELEASE_TAG_FAIL:
        version_cmp = -1

    return version_cmp >= 0
