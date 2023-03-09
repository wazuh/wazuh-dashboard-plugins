"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module used to determine access control for modular_inputs
"""
from spacebridgeapp.rest.opt_in.opt_in_handler import is_opt_in, DEFAULT_OPT_IN
from spacebridgeapp.rest.services.splunk_service import is_fips_mode
from solnlib.server_info import ServerInfo
from spacebridgeapp.util.config import secure_gateway_config as config


def allow_access(session_key):
    """
    Helper method to return logic on if access to Spacebridge should be granted

    +============+===========+==============+
    |     -      |  Non-FIPS |     FIPS     |
    +============+===========+==============+
    | Cloud      |   opt-in  | oia + opt-in |
    +------------+-----------+--------------+
    | Enterprise |        opt-in            |
    +------------+-----------+--------------+

    :return: True if access is granted
    """
    opt_in = is_opt_in(DEFAULT_OPT_IN, session_key)

    # Check if user has acknowledged lack of fips compliance in Spacebridge
    fips_mode = is_fips_mode(session_key)
    is_cloud = ServerInfo(session_key).is_cloud_instance()

    if is_cloud and fips_mode:
        opt_in_approved = config.get_oia()
        return opt_in and opt_in_approved
    return opt_in
