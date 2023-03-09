"""
Error classes for describing Spacebridge REST actions
"""


class SpacebridgeRestError(Exception):
    def __init__(self, message="Spacebridge Error", status=500):
        self.message = message
        self.status = status

    def __str__(self):
        return self.message


class SpacebridgeServerError(SpacebridgeRestError):
    pass


class SpacebridgeKvstoreError(SpacebridgeRestError):
    pass


class SpacebridgePermissionsError(SpacebridgeRestError):
    pass


class SpacebridgeProtobufError(SpacebridgeRestError):
    pass
