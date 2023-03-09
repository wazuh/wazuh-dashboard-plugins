import ast
import importlib.machinery
import logging
import os
import re
from collections import deque

from .ast_info_query import Any

logger = logging.getLogger(__name__)

__all__ = [
    "find_imports",
    "find_pkg_path",
    "get_from_import_module_name",
    "relative_import_dump",
]

import hashlib


def get_hash_file(file_content):
    """
    :return: sha256 hash of an zipped app package file
    """
    assert isinstance(file_content, bytes)
    sha256 = hashlib.sha256()
    sha256.update(file_content)
    return sha256.hexdigest()


def find_pkg_path(filepath_perfroming_import, pkg_name, libs=None):
    """
    Given the package name and the filepath performing import, return
    the absolute package path of the package.

    If a dir path is assigned to filepath_perfroming_import,
    this function will try to find the module path within the
    parent dir path of the dir.

    Args:
        filepath_perfroming_import (String): The path to the python
        file performing importing.
        pkg_name (String): The package name.
        persistent_lib (List): If package is not found in filepath_perfroming_import,
        persistent_lib is the next place to search.

    Returns:
        pkg_path (String): The package path. If package cannot be
        found, this value will be None.
    """
    if libs is None:
        libs = []
    libs = list(map(lambda e: os.path.join(e, "path_placeholder.strange_format"), libs))
    # py2 and py3 use different search strategy
    search_paths = [filepath_perfroming_import] + libs + [filepath_perfroming_import]
    for search_path in search_paths:
        pkg_path = _find_pkg_path_helper(search_path, pkg_name)
        if pkg_path:
            return pkg_path
    return None


def _find_pkg_path_helper(search_path, pkg_name):
    assert pkg_name
    search_path = os.path.abspath(search_path)
    pkg_names = pkg_name.split(".")
    parentdir = os.path.dirname(search_path)
    for name in pkg_names:
        pkg = importlib.machinery.PathFinder().find_spec(
            name, [os.path.realpath(parentdir)]
        )
        if not pkg:
            break

        pkg_path = pkg.origin

        if not pkg_path:
            break
        parentdir = os.path.dirname(pkg_path)
    else:
        if pkg_path.startswith("/private"):
            pkg_path = pkg_path[8:]
        return pkg_path

    return None


def find_imports(filepath, libs=None):
    """Find all the `import` & `from xxx import` &
    __import__ in ast tree, return the payload defined
    as (pkg_name, prefix_to_ref, object_name, pkg_path,
        line_number)

    Args:
        filepath (String): The path to the python
        file.

    Returns:
        imports (List): A list contains tuples. The
        tuples are (pkg_name, prefix_to_ref, object_name, pkg_path,
        line_number)

    Please refer to unit test for examples.
    """
    imports = []
    try:
        python_code_string = open(filepath, "r", encoding="utf-8-sig").read()
    except UnicodeDecodeError:
        import chardet

        raw_bytes = open(filepath, "rb").read()
        encoding = chardet.detect(raw_bytes)["encoding"]
        python_code_string = raw_bytes.decode(encoding=encoding)

    code_lines = python_code_string.splitlines()  # Used for relative import check
    try:
        ast_tree = ast.parse(python_code_string)
    except SyntaxError as ex:
        raise SyntaxError("The file is {filepath}, error={ex}".format(filepath=filepath,ex=ex))

    for ast_node in ast.walk(ast_tree):
        if isinstance(ast_node, ast.Call) and isinstance(ast_node.func, ast.Name):
            if ast_node.func.id == "__import__":
                if len(ast_node.args) != 1 or not isinstance(ast_node.args[0], ast.Str):
                    continue
                pkg_name = ast_node.args[0].s
                pkg_file_path = find_pkg_path(filepath, pkg_name, libs)
                imports.append(
                    (pkg_name, pkg_name, None, pkg_file_path, ast_node.lineno)
                )
        elif isinstance(ast_node, ast.Import):
            imports += _visit_import_node(ast_node, filepath, libs)
        else:
            if isinstance(ast_node, ast.ImportFrom):
                import_chain = get_from_import_module_name(ast_node, code_lines)
                _, importing_path = relative_import_dump(import_chain, filepath)
                if ast_node.module is None:
                    # from .. import xxx / from . import xxx
                    imports += _visit_import_node(ast_node, importing_path)
                else:
                    # from xxx import xxx / From ..xxx import xxx / from .xxx import xxx
                    pkg_name = ast_node.module
                    if import_chain.startswith("."):
                        # Relative importing doesn't consider persistent libs
                        pkg_file_path = find_pkg_path(importing_path, pkg_name)
                    else:
                        pkg_file_path = find_pkg_path(importing_path, pkg_name, libs)
                    if pkg_file_path and pkg_file_path != filepath:
                        # This is a package that within the filepath directory
                        # Ignore the self import
                        for target_import_obj in ast_node.names:
                            last_item_path = find_pkg_path(
                                pkg_file_path, target_import_obj.name
                            )
                            if last_item_path:
                                imports.append(
                                    (
                                        pkg_name,
                                        target_import_obj.name,
                                        None,
                                        last_item_path,
                                        ast_node.lineno,
                                    )
                                )
                            else:
                                imports.append(
                                    (
                                        pkg_name,
                                        None,
                                        target_import_obj.name,
                                        pkg_file_path,
                                        ast_node.lineno,
                                    )
                                )
                    else:
                        # The pkg cannot be found within the filepath dir will be ignored
                        pass
    return imports


def _visit_import_node(ast_node, filepath, libs=None):
    imports = []
    for ast_alias in ast_node.names:
        pkg_file_path = find_pkg_path(filepath, ast_alias.name, libs=libs)
        if not pkg_file_path or pkg_file_path == filepath:
            return imports
        imports.append(
            (ast_alias.name, ast_alias.name, None, pkg_file_path, ast_node.lineno)
        )
    return imports


def relative_import_dump(import_chain, filepath):
    """Return the dot stripped import_chain and the actual importing path.

    Args:
        import_chain (String): The import chain. E.g. pkg_a.mod_b.obj_c.
        filepath (String): The processed filepath considering relative
        importing.

    Returns:
        import_chain (String): The import chain with leading dots stripped.
        importing_path (String): The actual importing path.
    """
    importing_path = filepath
    if import_chain.startswith("."):
        import_chain = import_chain[1:]
    while import_chain.startswith("."):
        importing_path = os.path.dirname(importing_path)
        import_chain = import_chain[1:]
    return import_chain, importing_path


def get_from_import_module_name(node, code_lines):
    """Get import chain from ast.ImportFrom node.

    Args:
        node (ast.ImportFrom): The ast.ImportFrom node.
        code_lines (List): Original code content.

    Returns:
        import_chain (String): The import chain. E.g.
        pkg_a.mod_b.obj_c.

    The reason for having this function is that ast cannot
    correctly parse the relative import statement. Thus
    we use regex to capture any `from import` statement.
    """
    # from xxx import yyy, return xxx

    pattern = "from(.+)import"
    # try all lines one by one
    for i in range(node.lineno - 1, len(code_lines)):
        # from node.lineno - 1 to i
        string = "".join(code_lines[node.lineno - 1 : i + 1])
        string = string.replace("\xef\xbb\xbf", "")
        string = string.replace("\xfe\xff", "")
        string = re.sub(r"\\", "", string).strip()
        match_result = re.search(pattern, string)
        if match_result:
            import_chain = match_result.group(1)
            import_chain = re.sub(r"\s", "", import_chain).strip()
            return import_chain

    raise Exception("parse from import node failed, module name is unknown")


def get_name_list_from_attribute_chain(node):
    name_list = []
    while isinstance(node, (ast.Name, ast.Attribute)):
        name_list.append(get_node_name_or_attr(node))
        if hasattr(node, "value"):
            node = node.value
        else:
            break
    name_list.reverse()
    return name_list


def get_name_from_attribute_chain(node):
    """
    concatenate strings in attribute chain

    eg: a.b.c        return a.b.c
        a.b.func()   return a.b.func
    """
    name_list = get_name_list_from_attribute_chain(node)
    # it is a legal name
    return ".".join(name_list) if name_list else None


def get_node_name_or_attr(node):
    """
    get string value from ast.Name or ast.Attribute
    """
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    raise Exception(
        "Only ast.Name and ast.Attribute could be passed to get_node_name_or_attr"
    )


def is_same_ast_tree(node1, node2, node1_extra=False):  # noqa: C901
    r"""
        Here `SAME` means two AST trees have same tree structure, and when
        node type is Name, Str, Num, Attr, their value should be same
        eg:
                node1                   node2
                  1                       1
                /   \                   /   \
               2     3                 2     3
        function will return True

        node1_extra means if node1 AST tree can contain more tree node
        eg:
                node1                   node2
                  1                       1
                /   \                    /
               2     3                  2
        if node1_extra = True, function will return True

    """
    queue = deque()
    queue.append((node1, node2))
    while queue:
        current = queue.popleft()
        # if None node is found
        if current[0] is None or current[1] is None:
            # only one None node
            if current[0] != current[1]:
                # first node is None
                if current[0] is None:
                    return False
                # second node is None
                if not node1_extra:
                    return False
        else:
            # at least type should be same
            if current[0].__class__ == current[1].__class__:
                if isinstance(current[0], list):
                    if len(current[0]) == len(current[1]):
                        for n1, n2 in zip(current[0], current[1]):
                            queue.append((n1, n2))
                    else:
                        return False
                else:
                    # check current node
                    if isinstance(current[0], ast.Name):
                        if current[0].id != current[1].id:
                            return False
                    elif isinstance(current[0], ast.Attribute):
                        if current[0].attr != current[1].attr:
                            return False
                    elif isinstance(current[0], ast.Num):
                        if current[0].n != current[1].n:
                            return False
                    elif isinstance(current[0], ast.Str):
                        # use regex in string comparision, add ^ and $ to
                        # enforce complete match
                        pattern = re.compile("^{}$".format(current[1].s))
                        if not pattern.match(current[0].s):
                            return False
                    else:
                        # Ignore other type's value now, since I don't know how to
                        # compare them. Compare node type is enough
                        pass

                    child_nodes1 = [
                        child_node for child_node in ast.iter_child_nodes(current[0])
                    ]
                    child_nodes2 = [
                        child_node for child_node in ast.iter_child_nodes(current[1])
                    ]

                    if len(child_nodes1) == len(child_nodes2):
                        for child_node_1, child_node_2 in zip(
                            child_nodes1, child_nodes2
                        ):
                            queue.append((child_node_1, child_node_2))
                    else:
                        return False
            else:
                return False

    return True


def fetch_all_nodes_belonging_to_given_subtree(ast_root, node_set):
    """
    fetch all nodes both exist in ast_root subtree and node_set
    """
    if hasattr(node_set, "__iter__"):
        node_set = set(node_set)
        return {node for node in ast.walk(ast_root) if node in node_set}

    raise Exception("Node set should be iterable")


def find_python_function_in_loop(ast_info, module_name, function_name):
    """
    find the python checks in the loop
    """
    # find some thread checks in the for or while loop, like `os.fork`, `os.forkpty` etc,
    # it is considered questionable when in the loop
    query = ast_info.query()
    query.reset()
    function_call_nodes = ast_info.get_module_function_call_usage(
        module_name, function_name
    )
    for_nodes = (
        query.propagate_nodes(ast.For).filter(Any(function_call_nodes)).collect()
    )
    query.reset()
    while_nodes = (
        query.propagate_nodes(ast.While).filter(Any(function_call_nodes)).collect()
    )

    # Target to a node specific location
    loop_node = set()
    for ast_root in for_nodes + while_nodes:
        loop_node |= fetch_all_nodes_belonging_to_given_subtree(
            ast_root, function_call_nodes
        )
    return loop_node
