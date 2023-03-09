# pylint: disable=missing-function-docstring,missing-class-docstring
from abc import abstractmethod
from typing import Any

class ProcessMatch:
    @abstractmethod
    def may_match(self, other : Any) -> bool:
        pass

    @abstractmethod
    def get_pid(self) -> int:
        pass

    @abstractmethod
    def get_custom_display_name(self) -> str:
        pass

    def get_match_score(self, other : 'ProcessMatch') -> int:
        score = 0
        for attr in self.__dict__:
            if self.__dict__[attr] == other.__dict__[attr]:
                score += 1
        return score

    @abstractmethod
    def get_process_type(self) -> str:
        pass

    @abstractmethod
    def get_process_name(self) -> str:
        pass

    @abstractmethod
    def get_process_arguments(self) -> str:
        pass
