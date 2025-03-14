from typing import Dict, Any, Optional
import os
import requests
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from dotenv import load_dotenv
import httpx
import logging

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHERAPI_API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI(base_url="http://0.0.0.0:8077/v1", api_key="local")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    type: str
    message: str
    data: Optional[Dict[str, Any]] = None


async def get_weather(city: str) -> Dict[str, Any]:
    """Get weather data for a city"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={city}"
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, detail="Weather API error"
            )

        data = response.json()
        return {
            "location": data["location"]["name"],
            "temperature": data["current"]["temp_c"],
            "condition": data["current"]["condition"]["text"],
        }


async def get_air_quality(city: str) -> Dict[str, Any]:
    """Get air quality data for a city"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={city}&aqi=yes"
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, detail="Air quality API error"
            )

        data = response.json()
        aqi = data["current"].get("air_quality", {})
        return {
            "location": data["location"]["name"],
            "aqi": aqi.get("us-epa-index", 0),
            "pm2_5": aqi.get("pm2_5", 0),
        }


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_air_quality",
            "description": "Get air quality for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                },
                "required": ["city"],
            },
        },
    },
]


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info("Received request: %s", request.message)

        logger.info("Calling LLM...")
        response = await client.chat.completions.create(
            model="modularai/Llama-3.1-8B-Instruct-GGUF",
            messages=[
                {
                    "role": "system",
                    "content": "You are a weather assistant. Use the available functions to get weather and air quality data.",
                },
                {"role": "user", "content": request.message},
            ],
            tools=TOOLS,
            tool_choice="auto",
        )
        logger.info("LLM response received")

        message = response.choices[0].message

        if message.tool_calls:
            logger.info("Processing tool call...")
            tool_call = message.tool_calls[0]
            function_name = tool_call.function.name
            logger.info("Function called: %s", function_name)
            function_args = eval(tool_call.function.arguments)

            if function_name == "get_weather":
                data = await get_weather(function_args["city"])
                return ChatResponse(
                    type="weather", message="Here's the weather data", data=data
                )
            elif function_name == "get_air_quality":
                data = await get_air_quality(function_args["city"])
                return ChatResponse(
                    type="air_quality", message="Here's the air quality data", data=data
                )
            else:
                raise HTTPException(status_code=400, detail="Unknown function call")

        return ChatResponse(type="chat", message=message.content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test")
async def test():
    try:
        response = await client.chat.completions.create(
            model="modularai/Llama-3.1-8B-Instruct-GGUF",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10,
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8078)
