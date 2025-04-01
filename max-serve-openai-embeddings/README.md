# Learn How to Generate Embeddings with MAX Serve

Embeddings are a crucial component of intelligent agents, enabling efficient search and retrieval of proprietary information. MAX supports creation of embeddings using an OpenAI-compatible API, including the ability to run the popular `sentence-transformers/all-mpnet-base-v2` model from Hugging Face. When you run MPNet on MAX, you'll be serving a high-performance implementation of the model built by Modular engineers with the MAX Graph API.

In this recipe you will:

- Run an OpenAI-compatible embeddings endpoint on MAX Serve with Docker
- Generate embeddings with MPNet using the OpenAI Python client

## About MPNet

MPNet works by encoding not only tokens (words and parts of words) but also positional data about where those tokens appear in a sentence. Upon its [publication in 2020](https://arxiv.org/abs/2004.09297), MPNet met or exceeded the capability of popular predecessors, BERT and XLNet. Today, it is one of the most popular open-source models for generating embeddings.

## Requirements

Please make sure your system meets our [system requirements](https://docs.modular.com/max/get-started).

To proceed, ensure you have the `magic` CLI installed with the `magic --version` to be **0.7.2** or newer:

```bash
curl -ssL https://magic.modular.com/ | bash
```

or update it via:

```bash
magic self-update
```

Then install `max-pipelines` via:

```bash
magic global install -u max-pipelines
```

For this recipe, you will need a valid [Hugging Face token](https://huggingface.co/settings/tokens) to access the model.
Once you have obtained the token, include it in `.env` by:

```bash
cp .env.example .env
```

then add your token in `.env`

```bash
HUGGING_FACE_HUB_TOKEN=<YOUR_HUGGING_FACE_HUB_TOKEN_HERE>
```

## Quick start

1. Download the code for this recipe using the `magic` CLI:

    ```bash
    magic init max-serve-openai-embeddings --from modular/max-recipes/max-serve-openai-embeddings
    cd max-serve-openai-embeddings
    ```

2. Run the embedding application

    **Make sure the port `8000` is available. You can adjust the port settings in [Procfile](./Procfile).**

    ```bash
    magic run server
    ```

    This command is defined in the `pyproject.toml` file and invokes the `max-pipelines` CLI.

    MAX Serve is ready once you see a line containing the following output:

    ```plaintext
    Server running on http://0.0.0.0:8000/
    ```

3. Run the embedding code in `main.py` with `magic`:

    ```bash
    magic run main
    ```

    And you should see output like this:

    ```plaintext
    === Generated embeddings with OpenAI client ===
    Successfully generated embeddings!
    Number of embeddings: 5
    Embedding dimension: 768
    1st few values of 1st embedding: [0.36384445428848267, -0.7647817730903625, ...]
    ```

4. And once done with the app, to clean up the resources run:

    ```bash
    magic run clean
    ```

## Understand the code

The code for this recipe is intentionally simple — we're excited for you to start building *your own* project on MAX.

Open up `main.py` in your code editor. At the top of the file, you'll see the following:

```python
from openai import OpenAI

MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"  #1
BASE_URL="http://localhost:8000/v1"
API_KEY="local"

client = OpenAI(base_url=BASE_URL, api_key=API_KEY)  #2

def main():
    """Test embeddings using OpenAI client"""
    sentences = [  #3
        "Rice is often served in round bowls.",
        "The juice of lemons makes fine punch.",
        "The bright sun shines on the old garden.",
        "The soft breeze came across the meadow.",
        "The small pup gnawed a hole in the sock."
    ]

    try:
        response = client.embeddings.create(  #4
            model=MODEL_NAME,
            input=sentences
        )
        print("\n=== Generated embeddings with OpenAI client ===")
        print("Successfully generated embeddings!")
        print(f"Number of embeddings: {len(response.data)}")  #5
        print(f"Embedding dimension: {len(response.data[0].embedding)}")
        print(f"First embedding, first few values: {response.data[0].embedding[:5]}")
    except Exception as e:
        print(f"Error using client: {str(e)}")

if __name__ == "__main__":
    main()

```

Here's what the code does:

1. Sets constants for the model name, MAX Serve URL and API key. (Note: You can use any value for `API_KEY`; MAX Serve does not use one, but the OpenAI client requires this value not be blank.)
2. Initializes the OpenAI client.
3. Defines a list of sample sentences. (The samples here are taken from the [Harvard Sentences](https://en.wikipedia.org/wiki/Harvard_sentences).)
4. Uses the OpenAI client with MAX Serve to generate the embeddings.
5. Accesses the embeddings the OpenAI client returns.

Note how the code is a drop-in replacement for the proprietary OpenAI API---this is a key advantage of building with MAX!

## What's next?

Now that you've created embeddings with MAX Serve, you can explore more features and join our developer community. Here are some resources to help you continue your journey:

- [Get started with MAX](https://docs.modular.com/max/get-started)
- Explore [MAX Serve](https://docs.modular.com/max/serve) and [MAX Container](https://docs.modular.com/max/container/)
- Learn more about `magic` CLI in this [Magic tutorial](https://docs.modular.com/max/tutorials/magic)
- Join the [Modular forum](https://forum.modular.com/)
