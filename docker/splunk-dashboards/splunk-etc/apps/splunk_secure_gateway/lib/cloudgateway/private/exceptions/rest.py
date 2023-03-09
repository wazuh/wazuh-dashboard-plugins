"""
(C) 2019 Splunk Inc. All rights reserved.

Error classes for describing Spacebridge REST actions
"""


class CloudgatewayRestError(Exception):
    def __init__(self, message="Cloudgateway Error", status=500):
        self.message = message
        self.status = status

    def __str__(self):
        return self.message


class CloudgatewayServerError(CloudgatewayRestError):
    pass


class CloudgatewayKvstoreError(CloudgatewayRestError):
    pass


class CloudgatewayProtobufError(CloudgatewayRestError):
    pass


class CloudgatewayMaxRetriesError(CloudgatewayRestError):
    pass