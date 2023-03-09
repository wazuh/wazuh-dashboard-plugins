# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
from abc import ABCMeta, abstractmethod
from collections.abc import Iterable
from typing import Dict, Any, Type, List, Union

import re
from splunklib import six

INVALID_FILE_CHARS = r'[\\/:*?"<>|]'
PYTHON_ESCAPE_CHARS = r'[\n\t\r\x0b\x0c]'

# mypy currently not allowing cyclic definitions and there's no built in JSON type
JsonObject = Dict[str, Any]

Base = six.with_metaclass(ABCMeta, object) # type: Any

class Serializable(Base):
    classes : Dict[str, Type['Serializable']] = {}

    @abstractmethod
    def to_json_obj(self) -> JsonObject:
        pass

    @staticmethod
    @abstractmethod
    def validate_json(obj : JsonObject) -> None:
        pass

    @staticmethod
    @abstractmethod
    def from_json_obj(obj : JsonObject) -> 'Serializable':
        pass

    @staticmethod
    def check_value_in_range(value : Union[float, int], field_range : List[Union[float, int]], key : str) -> None:
        """Validates the value in given range

        Parameters
        ----------
        value : number
            Value of variable
        field_range : array
            minimum and maximum bounds for the value
        key : string
            key of dict

        Raises
        ------
        ValueError
            raises exception when value doesn't fall in between the range
        """
        if not field_range[0] <= value <= field_range[1]:
            raise ValueError(str(key) + " : value should be at least " + str(field_range[0]) +
                             " and at most " + str(field_range[1]) + ".")

    @staticmethod
    def check_data_type(value : Any, data_type : Any, key : str) -> None:
        """Validates data type of value

        Parameters
        ----------
        value : any
            value of variable
        data_type : tuple
             valid data types for value
        key : string
            key of dict

        Raises
        ------
        TypeError
            raises exception when value doesn't have valid data type
        """
        if not isinstance(value, data_type):
            if isinstance(data_type, Iterable):
                type_str = ', or '.join([t.__name__ for t in data_type])
            else:
                type_str = data_type.__name__
            raise TypeError(str(key) + ': Invalid data type, expected ' + type_str + '.')

    @staticmethod
    def check_string_value(value : str, key : str) -> None:
        """method check if string contains any invalid characters or vulnerable code

        Parameters
        ----------
        value : [string]
            value of the field
        key : [string]
            name of field

        Raises
        ------
        ValueError
            if string contains invalid chars
        """

        if re.search(INVALID_FILE_CHARS, value):
            raise ValueError(str(value) + " " + str(type(value)) + ": contains invalid character(s).")

        if re.search(PYTHON_ESCAPE_CHARS, value):
            raise ValueError(str(key) + ": contains invalid escape character(s).")

        if value in ('.', '..'):
            raise ValueError(str(key) + ": contains invalid character(s).")

    @staticmethod
    def register(klass : Type['Serializable']) -> None:
        class_spec = klass.__module__ + '.' + klass.__name__
        Serializable.classes[class_spec] = klass

    @staticmethod
    def json_decode(json_dict : JsonObject) -> 'Serializable':
        if '__class__' not in json_dict:
            raise KeyError("Error decoding json object '%s': key '__class__' not found." % str(json_dict))
        if json_dict['__class__'] not in Serializable.classes:
            raise NotImplementedError("Error decoding json object '%s' : serialization class '%s' not registered." %
                    (str(json_dict), json_dict['__class__']))
        Serializable.classes[json_dict['__class__']].validate_json(json_dict)
        return Serializable.classes[json_dict['__class__']].from_json_obj(json_dict)

    @staticmethod
    def json_encode(obj : 'Serializable') -> JsonObject:
        if callable(getattr(obj, "to_json_obj", None)):
            json_obj = obj.to_json_obj()
            class_spec = obj.__class__.__module__ + '.' + obj.__class__.__name__
            if '__class__' in json_obj and json_obj['__class__']!=class_spec:
                raise TypeError('Invalid __class__={!s} for object of type "{!s}"'.format(json_obj['__class__'], class_spec))
            json_obj['__class__'] = class_spec
            return json_obj
        raise TypeError('Can\'t serialize "{!s}"={!s}'.format(type(obj), obj))
