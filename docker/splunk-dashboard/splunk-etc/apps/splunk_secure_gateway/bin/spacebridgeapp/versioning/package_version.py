"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import os
import sys

from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.logging import setup_logging

from splunk.clilib import cli_common as cli
from os.path import dirname, isfile
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + '_modular_input.log', 'ssg_subscription_modular_input.app')
from semver import parse_version_info

APP_DIR = dirname(dirname(dirname(dirname(__file__))))


def _read_conf_stanza(file_name, stanza):
    default_path = os.path.join(APP_DIR, "default", file_name)

    stanza_config = {}
    if isfile(default_path):
        default_conf = cli.readConfFile(default_path)
        stanza_config = default_conf[stanza]

    return stanza_config


def _cache_version_info():
    try:
        launcher_stanza = _read_conf_stanza('app.conf', 'launcher')
        install_stanza = _read_conf_stanza('app.conf', 'install')

        semver_str = launcher_stanza['version']
        build_str = install_stanza['build']
        prerelease_str = ''

        build_str = int(build_str)
        LOGGER.info("Release build %s %s", semver_str, build_str)
    except (KeyError, ValueError) as e:
        LOGGER.info("Local build: {}".format(e))
        # running locally
        semver_str = '999.999.999'
        prerelease_str = '-local'
        build_str = '999999'

    full_str = '%s%s+%s' % (semver_str, prerelease_str, build_str)
    version_info = parse_version_info(full_str)
    return version_info


_VERSION_INFO = _cache_version_info()
LOGGER.info("Build version is %s" % _VERSION_INFO)


_STUB_FOR_TEST = False


def stub_for_tests():
    global _STUB_FOR_TEST
    _STUB_FOR_TEST = True


def enable_for_tests():
    global _STUB_FOR_TEST
    _STUB_FOR_TEST = False


def app_version():
    if _STUB_FOR_TEST:
        return parse_version_info('0.0.0-local+0')
    return _VERSION_INFO
