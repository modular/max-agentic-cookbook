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
