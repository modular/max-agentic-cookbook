import os
from typing import List, Dict
import logging
import json
import openai
import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_fixed,
    retry_if_exception_type,
    retry_if_result,
)
import gradio as gr
from fastapi import FastAPI
from gradio.routes import mount_gradio_app
from transformers import AutoTokenizer
import click


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ChatConfig:
    def __init__(self, base_url: str, max_context_window: int):
        self.base_url = base_url
        self.max_context_window = max_context_window
        self.model_repo_id = "modularai/Llama-3.1-8B-Instruct-GGUF"
        self.tokenizer_id = "meta-llama/Meta-Llama-3.1-8B-Instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(self.tokenizer_id)

    def count_tokens(self, messages: List[Dict]) -> int:
        """Count tokens for a list of messages using Llama tokenizer"""
        num_tokens = 0
        for message in messages:
            text = f"<|im_start|>{message['role']}\n{message['content']}<|im_end|>\n"
            num_tokens += len(self.tokenizer.encode(text))
        return num_tokens


def is_not_healthy(response):
    return response.status_code != 200


def wait_for_healthy(base_url: str):
    @retry(
        stop=stop_after_attempt(20),
        wait=wait_fixed(60),
        retry=(
            retry_if_exception_type(requests.RequestException)
            | retry_if_result(is_not_healthy)
        ),
        before_sleep=lambda retry_state: logger.info(
            f"Waiting for server at {base_url} to start (attempt {retry_state.attempt_number}/20)..."
        ),
    )
    def _check_health():
        return requests.get(f"{base_url}/health", timeout=5)

    return _check_health()


def create_interface(
    config: ChatConfig, client, system_prompt, concurrency_limit: int = 1
):
    with gr.Blocks(theme="soft") as iface:
        gr.Markdown(
            "# Chat with Llama 3 model\n\nPowered by Modular [MAX](https://docs.modular.com/max/) 🚀"
        )

        chatbot = gr.Chatbot(height=400)
        msg = gr.Textbox(label="Message", placeholder="Type your message here...")
        clear = gr.Button("Clear")

        initial_usage = f"**Total Tokens Generated**: 0 | Context Window: {config.max_context_window}"
        token_display = gr.Markdown(initial_usage)

        async def respond_wrapped(message, chat_history):
            async for response in respond(
                message, chat_history, config, client, system_prompt
            ):
                yield response

        msg.submit(
            respond_wrapped, [msg, chatbot], [chatbot, token_display], api_name="chat"
        ).then(lambda: "", None, msg)

        def clear_fn():
            return (
                [],
                f"**Total Tokens Generated**: 0 | Context Window: {config.max_context_window}",
            )

        clear.click(clear_fn, None, [chatbot, token_display], api_name="clear")

        iface.queue(
            default_concurrency_limit=concurrency_limit,
        )
    return iface


async def respond(message, chat_history, config: ChatConfig, client, system_prompt):
    chat_history = chat_history or []

    if not isinstance(message, str) or not message.strip():
        yield chat_history, f"**Active Context**: 0/{config.max_context_window}"
        return

    messages = [system_prompt]
    current_message = {"role": "user", "content": message}

    system_tokens = config.count_tokens([system_prompt])
    base_tokens = system_tokens + config.count_tokens([current_message])
    running_total = base_tokens

    history_messages = []
    if chat_history:
        for user_msg, bot_msg in reversed(chat_history):
            new_messages = [
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": bot_msg},
            ]
            history_tokens = config.count_tokens(new_messages)
            if running_total + history_tokens <= config.max_context_window:
                history_messages = new_messages + history_messages
                running_total += history_tokens
            else:
                break

    messages.extend(history_messages)
    messages.append(current_message)

    chat_history = chat_history + [[message, None]]
    bot_message = ""

    try:
        response = await client.chat.completions.create(
            model=config.model_repo_id,
            messages=messages,
            stream=True,
            max_tokens=config.max_context_window,
        )

        try:
            async for chunk in response:
                logger.debug(f"Received chunk: {chunk}")
                content = chunk.choices[0].delta.content
                if content is not None:
                    bot_message += content
                    chat_history[-1][1] = bot_message
                    yield (
                        chat_history,
                        f"**Active Context**: {running_total}/{config.max_context_window}",
                    )

        except json.JSONDecodeError as je:
            logger.error(
                f"JSON decode error in streaming response: {str(je)}", exc_info=True
            )
            error_message = "Error: Invalid response format from server"
            chat_history[-1][1] = error_message
            yield chat_history, f"**Active Context**: {running_total}/{config.max_context_window}"

        except Exception as stream_error:
            logger.error(
                f"Error during response streaming: {str(stream_error)}", exc_info=True
            )
            error_message = f"Error during chat: {str(stream_error)}"
            chat_history[-1][1] = error_message
            yield chat_history, f"**Active Context**: {running_total}/{config.max_context_window}"

    except Exception as e:
        logger.error(f"Error during chat completion: {str(e)}", exc_info=True)
        error_message = f"❌ Error starting chat: {str(e)}"
        gr.Error(error_message)
        chat_history[-1][1] = error_message
        yield chat_history, f"**Active Context**: {running_total}/{config.max_context_window}"

    # If we got no response at all
    if not bot_message:
        logger.warning("No response generated from the model")
        chat_history[-1][1] = "Error: No response generated"
        yield chat_history, f"**Active Context**: {running_total}/{config.max_context_window}"


@click.command()
@click.option("--base-url", default=os.getenv("BASE_URL", "http://0.0.0.0:8000/v1"))
@click.option(
    "--max-context-window", default=int(os.getenv("MAX_CONTEXT_WINDOW", 4096))
)
@click.option("--concurrency-limit", default=int(os.getenv("CONCURRENCY_LIMIT", 1)))
@click.option(
    "--system-prompt",
    default=os.getenv("SYSTEM_PROMPT", "You are a helpful AI assistant."),
)
@click.option("--port", default=int(os.getenv("PORT", 7860)))
@click.option("--api-key", default=os.getenv("API_KEY", "test"))
def main(base_url, max_context_window, concurrency_limit, system_prompt, port, api_key):
    """Launch the Llama Chat interface"""
    logger.info(
        f"Initializing chat interface with base_url={base_url}, max_context_window={max_context_window}"
    )
    config = ChatConfig(base_url, max_context_window)
    system_prompt = {"role": "system", "content": system_prompt}
    wait_for_healthy(base_url)
    logger.info("MAX server is healthy and ready to process requests")

    client = openai.AsyncOpenAI(base_url=config.base_url, api_key=api_key)

    iface = create_interface(config, client, system_prompt, concurrency_limit)

    app = FastAPI()
    mount_gradio_app(app=app, blocks=iface, path="/")
    logger.info(f"Starting Gradio interface on port {port}")

    iface.launch(server_port=port, server_name="0.0.0.0", show_error=True)


if __name__ == "__main__":
    main()
