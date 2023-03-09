"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Utilities for debug handlers
"""

def create_splunk_resp(jsn):
    """We need to wrap our response in a particular splunk rest api format so that the | rest command can consume the
    results"""
    return {"entry": [{"content": jsn}]}
