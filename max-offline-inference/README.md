# Offline Inference with MAX

Modern AI development doesn't need to require external API's or complex infrastructure. With MAX, you can run state of the art AI models using only a few lines of Python code. This recipe shows you how to pair MAX with Hugging Face, the leading platform for open-source AI models, to perform inference locally and efficiently. Whether you're a developer experimenting with AI or an enterprise running offline batch inference jobs, MAX provides a simple path to get up and running.

In this recipe you will:

- Use MAX to run inference with models from Hugging Face
- Generate text completions using the Llama 3.1 model

## Requirements

To proceed, ensure you have the `magic` CLI installed:

```bash
curl -ssL https://magic.modular.com/ | bash
```

Or update it via:

```bash
magic self-update
```

A valid [Hugging Face token](https://huggingface.co/settings/tokens) is required to access the model.
Once you have obtained the token, include it in `.env` by:

```bash
cp .env.example .env
```

then add your token in `.env`

```bash
HUGGING_FACE_HUB_TOKEN=<YOUR_HUGGING_FACE_HUB_TOKEN_HERE>
```

## Get the code

Download the code for this recipe using git:

```bash
git clone https://github.com/modular/max-recipes.git
cd max-recipes/max-offline-inference
```

## Quick start: run inference

To run the inference example:

```bash
magic run app
```

This will execute the sample script which loads the LLama 3.1 model and generates text from a single prompt, like so:

```plaintext
Loading model: modularai/llama-3.1
Generating responses...

========== Response 0 ==========
The winner of the World Series in 2016 was
 the Chicago Cubs. They defeated the Cleveland Indians in the series 4 games to 3. The Cubs had not won a World Series in 108 years, ending the Curse of the Billy Goat. The series was played from October 25 to November
```

## Understanding the code

Let's break down the key components of the sample code.

### Configure and initialize model

```python
#1
register_all_models()
huggingface_repo_id = "modularai/llama-3.1"

#2
pipeline_config = PipelineConfig(huggingface_repo_id)
llm = LLM(pipeline_config)
```

This initial block:

1. Registers available model architectures
2. Configures and initializes the Large Language Model

Don't let the *Modular* name in the `huggingface_repo_id` limit you---MAX works with any PyTorch model from Hugging Face. Through the MAX Graph API, certain model architectures (like [LlamaForCausalLM](https://huggingface.co/docs/transformers/v4.48.0/en/model_doc/llama#transformers.LlamaForCausalLM)) receive automatic performance optimizations when run with MAX.

### Run inference with the model

```python
#1
prompts = [
    "The winner of the World Series in 2016 was",
]

#2
responses = llm.generate(prompts, max_new_tokens=50)  #3
```

The inference code:

1. Defines one or more prompts for the model
2. Uses the `generate(...)` method to create text completions
3. Limits response length with `max_new_tokens`

The complete sample code includes additional features like handling of the Hugging Face access token and formatting output for display. You can find the full implementation in: `src/max_offline_inference/__main__.py`

## What's next?

Now that you've run offline inference with MAX, you can explore more features and join our developer community:

- [Get started with MAX](https://docs.modular.com/max/get-started)
- Explore [MAX Serve](https://docs.modular.com/max/serve) and [MAX Container](https://docs.modular.com/max/container/)
- Learn more about `magic` CLI in this [Magic tutorial](https://docs.modular.com/max/tutorials/magic)
- Join the [Modular forum](https://forum.modular.com/)
