import os


def setup_anythingllm_storage():
    """
    Initializes persistent storage for AnythingLLM. Reads storage location from
    the environment. If the required directory and/or .env file don't already 
    exist, it creates the directory and ensures an empty .env file is present within it.
    """
    
    if data_dir := os.getenv("UI_STORAGE_LOCATION"):
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            print(f"Created directory: {data_dir}")
        else:
            print(f"Directory already exists: {data_dir}")
        
        env_file = os.path.join(data_dir, ".env")
        if not os.path.exists(env_file):
            open(env_file, "w").close()  # Create empty file
            print(f"Created empty file: {env_file}")
        else:
            print(f"File already exists: {env_file}")
    else:
        raise ValueError("UI_STORAGE_LOCATION not found in environment variables")


if __name__ == "__main__":
    setup_anythingllm_storage()