import yaml
import json
import sys
from pathlib import Path
from jsonschema import validate, ValidationError

EXCLUDED_DIRS = {"scripts", ".github", ".git"}

schema = {
    "type": "object",
    "required": [
        "version",
        "long_title",
        "short_title",
        "author",
        "author_image",
        "author_url",
        "github_repo",
        "date",
        "difficulty",
        "tags",
        "tasks",
    ],
    "properties": {
        "version": {"type": "number"},
        "long_title": {"type": "string", "minLength": 1},
        "short_title": {"type": "string", "minLength": 1},
        "author": {"type": "string", "minLength": 1},
        "author_image": {"type": "string", "minLength": 1},
        "author_url": {"type": "string", "minLength": 1},
        "github_repo": {"type": "string", "minLength": 1},
        "date": {"type": "string", "minLength": 1},
        "difficulty": {
            "type": "string",
            "enum": ["beginner", "intermediate", "advanced"],
        },
        "tags": {
            "type": "array",
            "minItems": 1,
            "items": {"type": "string", "minLength": 1},
        },
        "tasks": {
            "type": "array",
            "minItems": 1,
            "items": {"type": "string", "minLength": 1},
        },
    },
}


def check_metadata_exists():
    has_error = False
    root = Path(".")
    subdirs = [
        d
        for d in root.glob("*/")
        if d.is_dir() and not d.name.startswith(".") and d.name not in EXCLUDED_DIRS
    ]

    for subdir in subdirs:
        metadata_file = subdir / "metadata.yaml"
        if not metadata_file.exists():
            print(f"❌ {subdir} is missing metadata.yaml")
            has_error = True

    return has_error


def validate_metadata_files():
    has_error = False
    root = Path(".")

    # Only check metadata.yaml files in depth 1 subdirectories
    for metadata_file in root.glob("*/metadata.yaml"):
        try:
            with open(metadata_file) as f:
                data = yaml.safe_load(f)
                validate(instance=data, schema=schema)
                print(f"✅ {metadata_file} is valid")
        except yaml.YAMLError as e:
            print(f"❌ {metadata_file} has invalid YAML syntax:")
            print(e)
            has_error = True
        except ValidationError as e:
            print(f"❌ {metadata_file} failed schema validation:")
            print(e)
            has_error = True

    return has_error


if __name__ == "__main__":
    missing_metadata = check_metadata_exists()
    invalid_metadata = validate_metadata_files()
    if missing_metadata or invalid_metadata:
        sys.exit(1)
