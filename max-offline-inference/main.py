from max.entrypoints import LLM
from max.pipelines import PipelineConfig
from max.pipelines.architectures import register_all_models
from dotenv import load_dotenv

MODEL_NAME = "modularai/Llama-3.1-8B-Instruct-GGUF"

load_dotenv()


def main():
    register_all_models()
    print(f"Loading model: '{MODEL_NAME}'... ", end="")
    max_batch_size = 2
    pipeline_config = PipelineConfig(MODEL_NAME, max_batch_size=max_batch_size)
    llm = LLM(pipeline_config)

    prompts = [
        "The winner of the World Series in 2016 was: ",
        "The winner of the World Series in 2020 was: ",
        "The winner of the World Series in 2024 was: ",
        "The winner of the World Series in 2025 will be: ",
    ]

    responses = llm.generate(prompts, max_new_tokens=35)
    for i in range(0, len(responses), max_batch_size):
        batch_responses = responses[i : i + max_batch_size]
        print(f"========== Batch {i // max_batch_size} ==========")
        for j, response in enumerate(batch_responses):
            print(f"Response {i + j}: {response}")
        print()


if __name__ == "__main__":
    main()
