"""Utility for reading source code files."""

import os
from typing import Dict


def read_source_file(file_path: str) -> Dict[str, str]:
    """
    Read a source code file and return its contents with metadata.

    Args:
        file_path: Absolute path to the source file to read

    Returns:
        Dictionary with:
        - content: The file contents as a string
        - language: The programming language (derived from extension)
        - filename: The basename of the file

    Raises:
        FileNotFoundError: If the file doesn't exist
        PermissionError: If the file can't be read
        Exception: For other file reading errors
    """
    # Verify file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file not found: {file_path}")

    # Verify it's a file (not a directory)
    if not os.path.isfile(file_path):
        raise ValueError(f"Path is not a file: {file_path}")

    # Read file contents
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except PermissionError:
        raise PermissionError(f"Permission denied reading file: {file_path}")
    except Exception as e:
        raise Exception(f"Error reading file: {str(e)}")

    # Determine language from extension
    _, ext = os.path.splitext(file_path)
    language_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.jsx': 'jsx',
        '.json': 'json',
        '.md': 'markdown',
        '.mdx': 'mdx',
    }
    language = language_map.get(ext.lower(), 'text')

    # Get filename
    filename = os.path.basename(file_path)

    return {
        'content': content,
        'language': language,
        'filename': filename
    }
