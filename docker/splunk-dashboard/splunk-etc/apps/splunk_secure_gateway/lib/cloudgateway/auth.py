import sys

from cloudgateway import py23
import json
from abc import ABCMeta, abstractmethod
from spacebridge_protocol import http_pb2


class UserAuthCredentials(object):
    """
    Interface for defining user authentication credentials.
    """
    __metaclass__ = ABCMeta

    @abstractmethod
    def get_username(self):
        """
        :return user associated with credentials
        """
        raise NotImplementedError

    @abstractmethod
    def validate(self):
        """
        Validate the provided auth credentials
        :return:
        """
        raise NotImplementedError

    @abstractmethod
    def get_expiration(self):
        """
        Get expiration date of token / credentials
        :return:
        """
        raise NotImplementedError

    @abstractmethod
    def get_token_type(self):
        """
        Get type of token
        :return:
        """
        raise NotImplementedError

    @abstractmethod
    def get_credentials(self):
        """
        returns ecnrypted credentials
        """
        raise NotImplementedError


class SimpleUserCredentials(UserAuthCredentials):
    """
    Simple implementation of user credentials which is just a json of username and password
    """

    def __init__(self, username, password):
        self.username = username
        self.password = password

    def get_username(self):
        return self.username

    def validate(self):
        pass

    def get_expiration(self):
        return 0

    def get_token_type(self):
        return http_pb2.TokenType.Value('SESSION')

    def get_credentials(self):
        return json.dumps({
            'username': self.username,
            'password': self.password,
        })