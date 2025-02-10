# Offline Inference with MAX

Modern AI development doesn't need to require external API's or complex infrastructure. With MAX, you can run state of the art AI models using only a few lines of Python code. This recipe shows you how to pair MAX with Hugging Face, the leading platform for open-source AI models, to perform inference locally and efficiently. Whether you're a developer experimenting with AI or an enterprise running offline batch inference jobs, MAX provides a simple path to get up and running.

In this recipe you will:

- Use MAX to run inference with models from Hugging Face
- Generate text completions using the Llama 3.1 model

## Install Magic

To proceed, please install the Magic🪄 CLI:

```bash
curl -ssL https://magic.modular.com/ | bash
```

Or update it via:

```bash
magic self-update
```

## Get the Code

Download the code for this recipe using git:

```bash
git clone https://github.com/modular/max-recipes.git
cd max-recipes/max-offline-inference
```

## Set up Hugging Face access

Before we can begin, you must obtain an access token from Hugging Face to download models hosted there. Follow the instructions in the [Hugging Face documentation](https://huggingface.co/docs/hub/en/security-tokens) to obtain one.

Once you have your Hugging Face token, rename the file `.env.example` to `.env`, then open it in your code editor. It will look like this:

```bash
HUGGING_FACE_HUB_TOKEN=YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the one from Hugging Face.

## Run the Sample Code

To run the inference example:

```bash
magic run app
```

This will execute the sample script which loads the LLama 3.1 model and generates text from a single prompt.

## Understanding the Code

Let's break down the key components of the sample code.

### Configure and initialize model

```python
# Load environment and register model architectures
register_all_models()
huggingface_repo_id = "modularai/llama-3.1"

# Initialize the model
pipeline_config = PipelineConfig(huggingface_repo_id)
llm = LLM(pipeline_config)
```

This initial block:

- Registers available model architectures
- Configures and initializes the Large Language Model

Don't let the *Modular* name in the `huggingface_repo_id` limit you---MAX works with any PyTorch model from Hugging Face. Through the MAX Graph API, certain model architectures (like [LlamaForCausalLM](https://huggingface.co/docs/transformers/v4.48.0/en/model_doc/llama#transformers.LlamaForCausalLM)) receive automatic performance optimizations when run with MAX.

### Run inference with the model

```python
# Define prompts
prompts = [
    "The winner of the World Series in 2016 was",
]

# Generate text
responses = llm.generate(prompts, max_new_tokens=50)
```

The inference code:

- Defines one or more prompts for the model
- Uses the `generate(...)` method to create text completions
- Limits response length with `max_new_tokens`

The complete sample code includes additional features like handling of the Hugging Face access token and formatting output for display. You can find the full implementation in: `src/max_offline_inference/__main__.py`

## What's Next?

Now that you've run offline inference with MAX, you can explore more features and join our developer community:

- [Get started with MAX](https://docs.modular.com/max/get-started)
- Explore [MAX Serve](https://docs.modular.com/max/serve) and [MAX Container](https://docs.modular.com/max/container/)
- Learn more about `magic` CLI in this [Magic tutorial](https://docs.modular.com/max/tutorials/magic)
- Join the [Modular forum](https://forum.modular.com/)
