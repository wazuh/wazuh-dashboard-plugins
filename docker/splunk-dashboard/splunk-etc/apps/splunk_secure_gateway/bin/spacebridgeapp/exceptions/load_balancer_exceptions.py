"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Named Exceptions related to load balancer support
"""


class LoadBalancerError(Exception):
    pass


class GetConfigError(LoadBalancerError):
    def __init__(self, message="Failed to get key from securegateway.conf"):
        self.message = message


class AddressVerificationError(LoadBalancerError):
    def __init__(self, message="Failed to verify load balancer address"):
        self.message = message
