import os
from dotenv import load_dotenv
from max.entrypoints import LLM
from max.pipelines import PipelineConfig
from max.pipelines.architectures import register_all_models


def setup():
    load_dotenv()
    
    if not os.getenv('HUGGING_FACE_HUB_TOKEN'):
        raise ValueError("HUGGING_FACE_HUB_TOKEN not found in .env file")
    
    register_all_models()


def load_model() -> LLM:
    huggingface_repo_id = "modularai/Llama-3.1-8B-Instruct-GGUF"
    print(f"Loading model: '{huggingface_repo_id}'... ", end='')
    
    pipeline_config = PipelineConfig(huggingface_repo_id)
    return LLM(pipeline_config)


def generate_responses(llm: LLM, prompts: list[str]) -> list[str]:
    return llm.generate(prompts, max_new_tokens=35)


def print_responses(responses: list[str]):
    for i, response in enumerate(responses):
        print(f"========== Response {i} ==========")
        print(f'{response}')
        print()
        

def main():
    setup()
    llm = load_model()
    
    prompts = [
        "The winner of the World Series in 2016 was: ",
        "The winner of the World Series in 2020 was: ",
    ]

    responses = generate_responses(llm, prompts)
    print_responses(responses)


if __name__ == "__main__":
    main()
