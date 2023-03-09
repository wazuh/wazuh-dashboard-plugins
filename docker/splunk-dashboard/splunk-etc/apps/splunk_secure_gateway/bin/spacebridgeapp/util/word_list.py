"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import random
import os

__vowels = ['a', 'e', 'i', 'o', 'u']

__words = []

__dir = os.path.dirname(os.path.realpath(__file__))
file_path = os.path.join(__dir, 'word_list.txt')

with open(file_path) as __f:
    for line in __f:
        __words.append(line[:-1])


def random_words(n=1):
    result = []
    for i in range(0, n):
        result.append(random.choice(__words))
    return result
