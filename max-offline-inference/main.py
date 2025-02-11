import os
from dotenv import load_dotenv
from max.entrypoints import LLM
from max.pipelines import PipelineConfig
from max.pipelines.architectures import register_all_models


def main():
    # Load environment variables from .env file
    load_dotenv()
    
    # Get the Hugging Face token from .env
    hf_token = os.getenv('HUGGING_FACE_HUB_TOKEN')
    if not hf_token:
        raise ValueError("HUGGING_FACE_HUB_TOKEN not found in .env file")

    # Register all available model architectures
    register_all_models()

    # Specify which model to use from Hugging Face
    huggingface_repo_id = "modularai/llama-3.1"
    print(f"Loading model: {huggingface_repo_id}")
    
    # Initialize the model with basic configuration
    pipeline_config = PipelineConfig(huggingface_repo_id)
    llm = LLM(pipeline_config)

    # Define the list of prompts to send to the model
    prompts = [
        "The winner of the World Series in 2016 was",
    ]

    # Generate responses for all prompts
    print("Generating responses...")
    responses = llm.generate(prompts, max_new_tokens=50)  # Limit response length to 250 tokens

    # Print each prompt and its corresponding response
    for i, (prompt, response) in enumerate(zip(prompts, responses)):
        print(f"========== Response {i} ==========")
        print(f'{prompt}\n{response}')
        print()

if __name__ == "__main__":
    main()
