"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Method used to help generate random guids
"""

import uuid


def get_guid():
    """
    Helper method to generate a unique guid
    :return:
    """
    return str(uuid.uuid4())
