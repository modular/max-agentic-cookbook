import sys
import os
import subprocess
from pathlib import Path


def run_tests_for_directory(directory: str) -> bool:
    """
    Run tests for a specific directory.
    Returns True if all tests pass, False otherwise.
    """
    print(f"Running tests for {directory}...")
    original_dir = os.getcwd()
    os.chdir(directory)

    # Check for project file in order of preference after changing directory
    project_files = ["pixi.toml", "pyproject.toml", "mojoproject.toml"]
    project_file = next((f for f in project_files if Path(f).exists()), None)

    if project_file:
        print("PIXI_PROJECT_MANIFEST: ", str(Path(project_file).absolute()))
        os.environ["PIXI_PROJECT_MANIFEST"] = str(Path(project_file).absolute())

    try:
        subprocess.run(["magic", "run", "tests"], check=True)
        success = True
    except subprocess.CalledProcessError as e:
        print(f"Test failed: {e}")
        success = False

    os.chdir(original_dir)
    return success


def main():
    if len(sys.argv) < 2 or not sys.argv[1]:
        directories = [
            d
            for d in os.listdir()
            if os.path.isdir(d) and d not in [".git", "scripts", ".github", ".magic"]
        ]
    else:
        directories = sys.argv[1:]

    print(f"Testing directories: {directories}")
    failed = False

    for directory in directories:
        if not run_tests_for_directory(directory):
            failed = True

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
