# Use AnythingLLM and DeepSeek R1 with MAX Serve

Building on the solid foundation MAX provides, adding a robust user interface is a natural next step.

In this recipe you will:

- Use MAX Serve to provide an OpenAI-compatible endpoint for [DeepSeek R1](https://api-docs.deepseek.com/news/news250120)
- Set up [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) to provide a robust chat interface

## About AnythingLLM

AnythingLLM is a powerful platform offering a familiar chat interface for interacting with open-source AI models. Like MAX, AnythingLLM empowers users to maintain complete ownership of their AI infrastructure, avoiding vendor lock-in risks, and enhancing privacy. With [over 30,000 stars on GitHub](https://github.com/Mintplex-Labs/anything-llm), AnythingLLM has become one of the most popular solutions for private AI deployment. The platform's versatility allows it to work perfectly with MAX to create a complete end-to-end AI solution.

## Requirements

Please make sure your system meets our [system requirements](https://docs.modular.com/max/get-started).

### Magic 🪄

To proceed, ensure you have the `magic` CLI installed:

```bash
curl -ssL https://magic.modular.com/ | bash
```

...or update `magic` to the latest version:

```bash
magic self-update
```

### Hugging Face

A valid [Hugging Face token](https://huggingface.co/settings/tokens) ensures access to the model and weights.

### Docker

We’ll use Docker to run the AnythingLLM container. Follow the instructions in the [Docker documentation](https://docs.docker.com/desktop/) if you need to install it.

## Get the code

Download the code for this recipe using git:

```bash
git clone https://github.com/modular/max-recipes.git
cd max-recipes/max-serve-open-webui
```

Next, include your Hugging Face token in a `.env` file by running:

```bash
cp .env.example .env
```

...then add your token in the `.env` file:

```bash
HUGGING_FACE_HUB_TOKEN=
```

## Quick start: Run the app

You can start MAX and AnythingLLM with one command:

```bash
magic run app
```

This command is defined in the `pyproject.toml` file which we will cover later.

MAX Serve is ready once you see a line containing the following in the log output:

```plaintext
max.serve: Server ready on http://0.0.0.0:3002/
```

AnythingLLM is ready once you see a line like the following in the log output:

```plaintext
Primary server in HTTP mode listening on port 3001
```

Once both servers are ready, launch AnythingLLM in your browser at [http://localhost:3001](http://localhost:3001)

## Using AnythingLLM

When you run the command `magic run app`, the Python script `main.py` will create a `data` folder if one doesn't exist. AnythingLLM uses this folder as persistent storage for your settings, chat history, etc. The location of the folder is configurable within `pyproject.toml` by changing the value of `UI_STORAGE_LOCATION`.

The first time you [launch AnythingLLM in your browser](http://localhost:3001), you will see a welcome screen. Choose *Get Started*, then complete the following steps:

1. Select *Generic OpenAI* as the LLM provider, then enter:
    - Base URL = `http://host.docker.internal:3002/v1`
    - API Key = `local`
    - Chat Model Name = `deepseek-ai/DeepSeek-R1-Distill-Llama-8B`
    - Token Context Window = `16384`
    - Max Tokens = `1024`
2. Next, for User Setup, choose *Just me* or *My team*, and set an admin password
3. If asked to fill in a survey, you may participate or skip this step. (The survey data goes to the AnythingLLM project, not Modular.)
4. Enter a workspace name

## Understand the project

Let's explore how the key components of this project work together.

### Configuration with `pyproject.toml`

The project is configured in the `pyproject.toml` file, which defines:

1. **Environment variables** to control the ports and storage locations:

   ```bash
   MAX_LLM_PORT = "3002"  # Port for MAX Serve
   UI_PORT = "3001"       # Port for AnythingLLM
   UI_STORAGE_LOCATION = "./data"  # Persistent storage for AnythingLLM
   UI_CONTAINER_NAME = "anythingllm-max"  # Docker container name
   ```

2. **Tasks** you can run with the `magic run` command:
   - `app`: Runs the main Python script that coordinates both services
   - `ui`: Launches the AnythingLLM Docker container
   - `llm`: Starts MAX Serve with DeepSeek R1
   - `clean`: Cleans up network resources for both services

3. **Dependencies** for running both services:
   - MAX Serve runs via the `max-pipelines` CLI
   - AnythingLLM runs in a Docker container, keeping its dependencies isolated
   - Additional dependencies to orchestrate both services

### Orchestration with `main.py`

When you run `magic run app`, the `main.py` script coordinates everything necessary to start and shutdown both services:

1. **Initialization** takes places in the `initial_setup()` function:
   - Reads the configuration from `pyproject.toml`
   - Creates the data directory for AnythingLLM if it doesn't exist
   - Ensures an empty `.env` file is present for AnythingLLM settings

2. **Running the Services** occurs in the `run_tasks()` function:
   - Uses Honcho to run multiple `magic run` tasks concurrently
   - Starts both the MAX Serve LLM backend and AnythingLLM UI

3. **Cleanup** happens at exit:
   - `cleanup()` fnction is registered with `atexit` to ensure it runs when the script exits
   - Runs the `clean` task to terminate all processes and remove containers

## What's next?

Now that you're up and running with Open WebUI on MAX, you can explore more features and join our developer community. Here are some resources to help you continue your journey:

- [Get started with MAX](https://docs.modular.com/max/get-started)
- Explore [MAX Serve](https://docs.modular.com/max/serve) and [MAX Container](https://docs.modular.com/max/container/)
- Learn more about `magic` CLI in this [Magic tutorial](https://docs.modular.com/max/tutorials/magic)
- Join the [Modular forum](https://forum.modular.com/)
