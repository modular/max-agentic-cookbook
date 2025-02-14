import yaml
import json
import sys
from pathlib import Path
from jsonschema import validate, ValidationError

# Define the schema
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


def validate_metadata_files():
    has_error = False

    for metadata_file in Path(".").rglob("metadata.yaml"):
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
    has_error = validate_metadata_files()
    if has_error:
        sys.exit(1)
