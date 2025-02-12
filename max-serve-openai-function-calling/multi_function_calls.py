from openai import OpenAI


client = OpenAI(base_url="http://0.0.0.0:8000/v1", api_key="local")


def get_weather(city: str) -> str:
    """Mock weather function that returns a simple response."""
    return f"The weather in {city} is sunny with a temperature of 72°F"


def get_air_quality(city: str) -> str:
    """Mock air quality function that returns a simple response."""
    return f"The air quality in {city} is good with a PM2.5 of 10µg/m³"


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather and forecast data for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city name to get weather for",
                    }
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_air_quality",
            "description": "Get air quality data for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city name to get air quality for",
                    }
                },
                "required": ["city"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
]


def llm_function_call(user_message: str) -> str:
    print("User message:", user_message)
    response = client.chat.completions.create(
        model="modularai/Llama-3.1-8B-Instruct-GGUF",
        messages=[{"role": "user", "content": user_message}],
        tools=TOOLS,
        tool_choice="auto",
    )
    output = response.choices[0].message
    print("Output:", output)
    print("Tool calls:", output.tool_calls)

    if output.tool_calls:
        for tool_call in output.tool_calls:
            if tool_call.function.name == "get_weather":
                city = eval(tool_call.function.arguments)["city"]
                weather_response = get_weather(city)
                print("\nWeather response:", weather_response)

            elif tool_call.function.name == "get_air_quality":
                city = eval(tool_call.function.arguments)["city"]
                air_quality_response = get_air_quality(city)
                print("\nAir quality response:", air_quality_response)
            else:
                print(f"Unknown tool call: {tool_call.function.name}")

    return output.content


def main():
    user_messages = [
        "What's the weather like in San Francisco?",
        "What's the air quality like in San Francisco?",
    ]

    for user_message in user_messages:
        print(llm_function_call(user_message))


if __name__ == "__main__":
    main()
