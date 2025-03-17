from dotenv import load_dotenv
from max.entrypoints.llm import LLM
from max.pipelines import PipelineConfig
from max.pipelines.architectures import register_all_models
from max.serve.config import Settings

MODEL_NAME = "modularai/Llama-3.1-8B-Instruct-GGUF"


def main():
    load_dotenv()
    register_all_models()

    print(f"Loading model: {MODEL_NAME}")
    settings = Settings()
    pipeline_config = PipelineConfig(model_path=MODEL_NAME)
    llm = LLM(settings, pipeline_config)

    prompts = [
        "The winner of the World Series in 2016 was: ",
        "The winner of the World Series in 2020 was: ",
        "The winner of the World Series in 2024 was: ",
        "The winner of the World Series in 2025 will be: ",
    ]

    print("Generating responses...")
    responses = llm.generate(prompts, max_new_tokens=35)

    for i, (prompt, response) in enumerate(zip(prompts, responses)):
        print(f"========== Response {i} ==========")
        print(prompt + response)
        print()


if __name__ == "__main__":
    main()
