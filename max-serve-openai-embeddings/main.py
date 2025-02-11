import os
from openai import OpenAI
from tenacity import (
    retry,
    stop_after_attempt,
    wait_fixed,
    retry_if_exception_type,
    retry_if_result,
)
import requests
import logging


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"  #1
BASE_URL=os.getenv('BASE_URL', 'http://0.0.0.0:8000/v1')
API_KEY="local"

client = OpenAI(base_url=BASE_URL, api_key=API_KEY)  #2

def wait_for_healthy(base_url: str):
    @retry(
        stop=stop_after_attempt(20),
        wait=wait_fixed(30),
        retry=(
            retry_if_exception_type(requests.RequestException)
            | retry_if_result(lambda r: r.status_code != 200)
        ),
        before_sleep=lambda retry_state: logger.info(
            f"Waiting for server at {base_url} to start (attempt {retry_state.attempt_number}/20)..."
        ),
    )
    def _check_health():
        return requests.get(f"{base_url}/health", timeout=5)

    return _check_health()

def main():
    wait_for_healthy(BASE_URL)
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
        logger.info("\n=== Generated embeddings with OpenAI client ===")
        logger.info("Successfully generated embeddings!")
        logger.info(f"Number of embeddings: {len(response.data)}")  #5
        logger.info(f"Embedding dimension: {len(response.data[0].embedding)}")
        logger.info(f"First embedding, first few values: {response.data[0].embedding[:5]}")
    except Exception as e:
        logger.error(f"Error using client: {str(e)}")


if __name__ == "__main__":
    main()
