import sys
import honcho.manager
import subprocess
import atexit
import os
import tomli
import click
from dotenv import load_dotenv


@click.command()
@click.argument("tasks", nargs=-1, help="Tasks to run concurrently. One or more task names must be specified.")
@click.option("--pre", multiple=True, help="Tasks to run sequentially before app tasks.")
@click.option("--post", multiple=True, help="Tasks to run sequentially after app tasks complete.")
def main(tasks, pre, post):
    """Run multiple Magic tasks concurrently, preceded and/or followed by other tasks."""
    if not tasks:
        click.echo("Error: At least one task must be specified.", err=True)
        click.echo("Example: python main.py llm ui --pre setup --post clean", err=True)
        sys.exit(1)
    
    # Run pre-tasks
    for task in pre:
        run_task(task)
    
    # Register post-tasks to run at exit
    for task in post:
        atexit.register(run_task, task)
    
    # Run app tasks
    run_app(tasks)


def run_app(tasks: list[str]):
    """
    Runs the tasks specified in the tasks list. This includes loading environment
    variables, setting up the task manager, and starting the tasks.
    """   
    try:
        if secrets_location := os.getenv("MAX_SECRETS_LOCATION"):
            load_dotenv(secrets_location)
        env = os.environ.copy()
        
        manager = honcho.manager.Manager()

        for task in tasks:
            manager.add_process(task, f"magic run {task}", env=env)

        manager.loop()
        sys.exit(manager.returncode)
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def run_task(task: str):
    """Runs a Magic task."""

    with open("pyproject.toml", "rb") as f:
        pyproject_data = tomli.load(f)
        tasks = pyproject_data.get("tool", {}).get("pixi", {}).get("tasks", {})
        
        if task in tasks:
            print(f"Running {task} task...")
            subprocess.run(["magic", "run", task])


if __name__ == "__main__":
    main()
