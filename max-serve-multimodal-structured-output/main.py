import os
from typing import List, Literal, Union
from pydantic import BaseModel, Field
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
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

MODEL_NAME = "meta-llama/Llama-3.2-11B-Vision-Instruct"
BASE_URL = os.getenv("BASE_URL", "http://0.0.0.0:8010/v1")
API_KEY = "local"

client = OpenAI(base_url=BASE_URL, api_key=API_KEY)


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

class Player(BaseModel):
    name: str = Field(description="Player name on jersey")
    number: int = Field(description="Player number on jersey")

class Players(BaseModel):
    players: List[Player] = Field(description="List of players visible in the image")


def main():
    wait_for_healthy(BASE_URL)
    completion = client.beta.chat.completions.parse(
        model=MODEL_NAME,
    messages=[
        {"role": "system", "content": "Extract player information from the image."},
        {"role": "user", "content": [
            {
                "type": "text",
                "text": "Please provide a list of players visible in this photo with their jersey numbers."
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://ei.marketwatch.com/Multimedia/2019/02/15/Photos/ZH/MW-HE047_nbajer_20190215102153_ZH.jpg?width=600&height=656&fit=crop&format=pjpg&auto=webp"
                }
            }
        ]},
    ],
    response_format=Players,
)

    players = completion.choices[0].message.parsed
    logger.info(f"Players: {players}")
    assert len(players.players) == 3

if __name__ == "__main__":
    main()
