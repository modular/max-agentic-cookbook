from typing import List, Optional, Dict, Any, Tuple
import os
import logging
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import asyncio
import time
from asyncio import Lock
import signal
import socket
import psutil

from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from openai import AsyncOpenAI
import httpx
from dotenv import load_dotenv
from tenacity import (
    retry,
    stop_after_attempt,
    wait_fixed,
    wait_exponential,
    retry_if_exception_type,
    retry_if_result,
)
import numpy as np


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

shutdown_event = asyncio.Event()

CACHE_TTL = os.getenv("CACHE_TTL", 3600)  # 1 hour

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://0.0.0.0:8010/v1")
LLM_HEALTH_URL = os.getenv("LLM_HEALTH_URL", "http://0.0.0.0:8010/v1/health")
LLM_API_KEY = os.getenv("LLM_API_KEY", "local")
LLM_MODEL = os.getenv("LLM_MODEL", "modularai/Llama-3.1-8B-Instruct-GGUF")
EMBEDDING_SERVER_URL = os.getenv("EMBEDDING_SERVER_URL", "http://0.0.0.0:7999/v1")
EMBEDDING_HEALTH_URL = os.getenv("EMBEDDING_HEALTH_URL", "http://0.0.0.0:7999/v1/health")
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY", "local")
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2"
)


def signal_handler(sig, frame):
    print("\nReceived shutdown signal, cleaning up...")
    shutdown_event.set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("Starting up backend server...")
    try:
        await wait_for_healthy(LLM_SERVER_URL, "LLM server", LLM_HEALTH_URL)
        logger.info("LLM server is healthy, starting application...")
        await wait_for_healthy(EMBEDDING_SERVER_URL, "Embedding server", EMBEDDING_HEALTH_URL)
        logger.info("Embedding server is healthy, starting application...")
        yield
    finally:
        print("Cleaning up backend resources...")

        try:
            await asyncio.wait_for(shutdown_event.wait(), timeout=2.0)
        except asyncio.TimeoutError:
            print("Timeout waiting for cleanup, forcing exit...")

        tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
        for task in tasks:
            task.cancel()

        if tasks:
            print(f"Waiting for {len(tasks)} tasks to cancel...")
            await asyncio.gather(*tasks, return_exceptions=True)

        print("Backend shutdown complete")


app = FastAPI(title="Personal Weather Station API", lifespan=lifespan)
app.add_middleware(
    GZipMiddleware, minimum_size=1000
)  # Only compress responses larger than 1KB

llm_client = AsyncOpenAI(base_url=LLM_SERVER_URL, api_key=LLM_API_KEY)
embedding_client = AsyncOpenAI(base_url=EMBEDDING_SERVER_URL, api_key=EMBEDDING_API_KEY)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=CACHE_TTL,  # Cache preflight requests for 1 hour
)

load_dotenv()

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
                "additionalProperties": False,
            },
            "strict": True,
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
    {
        "type": "function",
        "function": {
            "name": "get_space_weather",
            "description": "Get current space weather conditions",
            "parameters": {
                "type": "object",
                "properties": {},  # No parameters needed
                "required": [],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
]

INTENT_PROMPT = """You are a comprehensive weather assistant. Your task is to:
1. First determine if the user is asking about:
   - Weather information (respond with exactly: "WEATHER_QUERY")
   - General chat (respond with exactly: "GENERAL_CHAT")
2. Only respond with one of these two options, nothing else.
"""

CITY_NORMALIZATION_PROMPT = """You are a helpful assistant that normalizes city names to their full form including country/region when needed to avoid ambiguity.
Examples:
Input: 'NYC' -> Output: 'New York, United States'
Input: 'vancooooover' -> Output: 'Vancouver, Canada'
Input: 'london' -> Output: 'London, United Kingdom'
Input: 'paris' -> Output: 'Paris, France'
Input: 'yvr' -> Output: 'Vancouver, Canada'

Return ONLY the normalized city name for the location mentioned in the user's weather query, nothing else. If no country/region is specified,
assume the most well-known city (e.g., Vancouver = Vancouver, Canada).

Do not include any extra text, just return the normalized city name with country."""

WEATHER_ANALYSIS_PROMPT = """Given the user request about weather:
User: {user}

Respond by analyzing the following weather data and provide a summary and trends:
Weather data: {weather_data}

Focus on the most important parts.
"""


class ChatRequest(BaseModel):
    message: str


class OperationTiming(BaseModel):
    operation: str
    duration_ms: float


class ChatResponseWithTiming(BaseModel):
    type: str
    message: str
    data: Optional[Dict[str, Any]] = None
    timings: List[OperationTiming] = []


class WeatherRequest(BaseModel):
    city: str


class WeatherResponse(BaseModel):
    location: Dict[str, Any]
    current: Dict[str, Any]
    forecast: List[Dict[str, Any]]


class SpaceWeatherResponse(BaseModel):
    kp_index: float
    aurora_visible: bool
    solar_radiation: str


class TimingCollector:
    def __init__(self):
        self.timings: List[OperationTiming] = []
        self._lock = Lock()

    async def add_timing(self, operation: str, duration_ms: float):
        async with self._lock:
            self.timings.append(
                OperationTiming(operation=operation, duration_ms=duration_ms)
            )

    async def get_timings(self) -> List[OperationTiming]:
        async with self._lock:
            return self.timings.copy()


def track_operation_time(operation_name: str):
    def decorator(func):
        async def wrapper(*args, timing_collector: TimingCollector, **kwargs):
            start_time = time.perf_counter()
            result = await func(*args, timing_collector=timing_collector, **kwargs)
            duration = time.perf_counter() - start_time
            await timing_collector.add_timing(operation_name, duration * 1000)
            return result

        return wrapper

    return decorator


def create_retry_decorator():
    return retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(
            (httpx.HTTPError, httpx.RequestError, httpx.ReadTimeout)
        ),
        before_sleep=lambda retry_state: logger.warning(
            f"Retrying API call after error: {retry_state.outcome.exception()}"
        ),
    )


@asynccontextmanager
async def get_http_client():
    """Connection pooling: Shared http client for better connection reuse."""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=10.0),
        limits=httpx.Limits(max_keepalive_connections=5),
    ) as client:
        yield client


@create_retry_decorator()
async def get_weather(city: str, timing_collector: TimingCollector) -> Dict[str, Any]:
    """Get current weather and forecast from WeatherAPI.com"""
    api_key = os.getenv("WEATHERAPI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    url = f"http://api.weatherapi.com/v1/forecast.json?key={api_key}&q={city}&days=3&aqi=yes"

    async with get_http_client() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            return {
                "location": {
                    "name": data["location"]["name"],
                    "region": data["location"]["region"],
                    "country": data["location"]["country"],
                    "localtime": data["location"]["localtime"],
                },
                "current": {
                    "temperature": data["current"]["temp_c"],
                    "condition": data["current"]["condition"]["text"],
                    "feels_like": data["current"]["feelslike_c"],
                    "humidity": data["current"]["humidity"],
                    "wind_kph": data["current"]["wind_kph"],
                    "wind_dir": data["current"]["wind_dir"],
                    "pressure_mb": data["current"]["pressure_mb"],
                    "precip_mm": data["current"]["precip_mm"],
                    "uv": data["current"]["uv"],
                    "air_quality": data["current"].get("air_quality", {}),
                },
                "forecast": [
                    {
                        "date": day["date"],
                        "max_temp": day["day"]["maxtemp_c"],
                        "min_temp": day["day"]["mintemp_c"],
                        "condition": day["day"]["condition"]["text"],
                        "chance_of_rain": day["day"]["daily_chance_of_rain"],
                        "sunrise": day["astro"]["sunrise"],
                        "sunset": day["astro"]["sunset"],
                    }
                    for day in data["forecast"]["forecastday"]
                ],
            }
        except (httpx.HTTPStatusError, httpx.ReadTimeout) as e:
            logger.error(f"HTTP error occurred: {e}")
            if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 404:
                raise HTTPException(
                    status_code=404, detail=f"Unable to fetch weather for {city}"
                )
            raise
        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            raise HTTPException(status_code=500, detail="Weather service error")


@create_retry_decorator()
async def get_air_quality(
    city: str, timing_collector: TimingCollector
) -> Dict[str, Any]:
    """Get air quality data from WeatherAPI.com"""
    api_key = os.getenv("WEATHERAPI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={city}&aqi=yes"

    async with get_http_client() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            aqi_data = data["current"].get("air_quality", {})
            return {
                "city": data["location"]["name"],
                "country": data["location"]["country"],
                "aqi": aqi_data.get("us-epa-index", 0),
                "pm2_5": aqi_data.get("pm2_5", 0),
                "pm10": aqi_data.get("pm10", 0),
                "no2": aqi_data.get("no2", 0),
                "o3": aqi_data.get("o3", 0),
                "co": aqi_data.get("co", 0),
            }
        except Exception as e:
            logger.error(f"Error fetching air quality: {e}")
            raise HTTPException(status_code=500, detail="Air quality service error")


class ttlcache:
    def __init__(self, seconds=CACHE_TTL):
        self.seconds = seconds
        self.cache = {}
        self.timestamps = {}

    def __call__(self, func):
        async def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            now = datetime.now()

            if key in self.cache:
                if now - self.timestamps[key] < timedelta(seconds=self.seconds):
                    return self.cache[key]
                else:
                    del self.cache[key]
                    del self.timestamps[key]

            result = await func(*args, **kwargs)
            self.cache[key] = result
            self.timestamps[key] = now
            return result

        return wrapper


@ttlcache(seconds=CACHE_TTL)
@create_retry_decorator()
async def get_space_weather(timing_collector: TimingCollector) -> Dict[str, Any]:
    """Fetch solar activity and aurora forecasts from NOAA"""
    async with get_http_client() as client:
        try:
            response = await client.get(
                "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
            )
            response.raise_for_status()
            data = response.json()

            # Add error handling for the Kp index conversion
            try:
                kp_index = float(data[0]["kp"])
            except (ValueError, KeyError):
                logger.warning("Invalid Kp index value, using default")
                kp_index = 0.0

            return {
                "kp_index": kp_index,
                "aurora_visible": kp_index >= 5,
                "solar_radiation": "normal" if kp_index < 4 else "elevated",
                "forecast": (
                    "Aurora may be visible"
                    if kp_index >= 5
                    else "Aurora not likely visible"
                ),
            }
        except Exception as e:
            logger.error(f"Error fetching space weather: {e}")
            return {
                "kp_index": 0.0,
                "aurora_visible": False,
                "solar_radiation": "normal",
                "forecast": "Space weather data temporarily unavailable",
            }


class SemanticCache:
    def __init__(self, threshold=0.75, ttl_seconds=CACHE_TTL):
        self.threshold = threshold
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[Tuple[float, ...], Tuple[Any, datetime]] = {}
        self._lock = Lock()

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    async def _compute_embedding(self, text: str) -> np.ndarray:
        response = await embedding_client.embeddings.create(
            model=EMBEDDING_MODEL, input=text
        )
        # OpenAI-compatible clients return embeddings in a list
        embedding = np.array(response.data[0].embedding)
        return embedding

    async def get(self, text: str, normalized_city: str = None) -> Tuple[bool, Any]:
        async with self._lock:
            now = datetime.now()
            # Clean expired entries
            expired = []
            for embedding_tuple, (value, timestamp) in self.cache.items():
                if (now - timestamp).total_seconds() > self.ttl_seconds:
                    expired.append(embedding_tuple)
            for emb in expired:
                del self.cache[emb]

            # Use normalized city if provided, otherwise use original text
            query_text = normalized_city if normalized_city else text
            query_embedding = await self._compute_embedding(query_text)
            query_tuple = tuple(query_embedding.tolist())

            # Find most similar cached query
            max_similarity = 0
            best_match = None

            for cached_embedding_tuple, (value, _) in self.cache.items():
                cached_embedding = np.array(cached_embedding_tuple)
                similarity = self._cosine_similarity(query_embedding, cached_embedding)
                logger.debug(f"Cache similarity for query '{query_text}': {similarity}")
                if similarity > max_similarity:
                    max_similarity = similarity
                    best_match = value

            if max_similarity > self.threshold:
                logger.info(
                    f"Cache hit for '{query_text}' with similarity {max_similarity}"
                )
                return True, best_match
            logger.info(
                f"Cache miss for '{query_text}' (max similarity: {max_similarity})"
            )
            return False, None

    async def set(self, text: str, value: Any, normalized_city: str = None):
        async with self._lock:
            # Use normalized city if provided, otherwise use original text
            cache_text = normalized_city if normalized_city else text
            embedding = await self._compute_embedding(cache_text)
            embedding_tuple = tuple(embedding.tolist())
            self.cache[embedding_tuple] = (value, datetime.now())


def semantic_cache(threshold=0.75, ttl_seconds=CACHE_TTL):
    cache = SemanticCache(threshold=threshold, ttl_seconds=ttl_seconds)

    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get the request message from either args or kwargs
            request_message = args[0] if args else kwargs.get("request_message")
            if not request_message:
                raise ValueError("No request message provided")

            # Extract normalized city from weather_data if available
            normalized_city = None
            if "weather_data" in kwargs:
                try:
                    normalized_city = f"{kwargs['weather_data']['weather']['location']['name']}, {kwargs['weather_data']['weather']['location']['country']}"
                    logger.info(f"Using normalized city for cache: {normalized_city}")
                except (KeyError, TypeError):
                    pass

            # Try to get from cache using normalized city
            hit, value = await cache.get(request_message, normalized_city)
            if hit:
                return value

            # If not in cache, compute and store
            result = await func(*args, **kwargs)
            await cache.set(request_message, result, normalized_city)
            return result

        return wrapper

    return decorator


@track_operation_time("intent_detection")
async def detect_intent(request_message: str, timing_collector: TimingCollector):
    return await llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": INTENT_PROMPT},
            {"role": "user", "content": request_message},
        ],
        temperature=0,
    )


@track_operation_time("city_normalization")
async def normalize_city(
    request_message: str, timing_collector: TimingCollector
) -> str:
    """Normalize city name using LLM"""
    city_response = await llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": CITY_NORMALIZATION_PROMPT},
            {"role": "user", "content": request_message},
        ],
        max_tokens=50,
        temperature=0,
    )

    # Extract just the city name from the LLM response
    normalized_city = city_response.choices[0].message.content.strip()
    # Remove any extra text the LLM might add
    if "'" in normalized_city:
        normalized_city = normalized_city.split("'")[
            1
        ]  # Get the part between first set of quotes
    if "is" in normalized_city:
        normalized_city = normalized_city.split("is")[-1].strip()
    normalized_city = normalized_city.strip(".' ")

    if not normalized_city:
        raise HTTPException(
            status_code=400, detail="Could not determine city from request"
        )

    logger.info(f"Normalized city name: {normalized_city}")
    return normalized_city


@track_operation_time("weather_data_fetch")
async def fetch_all_weather_data(
    request_message: str, timing_collector: TimingCollector
):
    """Fetch all weather-related data using function calling"""
    normalized_city = await normalize_city(
        request_message=request_message, timing_collector=timing_collector
    )

    weather_data, air_quality_data, space_weather_data = await asyncio.gather(
        get_weather(normalized_city, timing_collector),
        get_air_quality(normalized_city, timing_collector),
        get_space_weather(timing_collector),
    )

    return {
        "weather": weather_data,
        "air_quality": air_quality_data,
        "space_weather": space_weather_data,
        "normalized_city": normalized_city,
    }


weather_analysis_cache = SemanticCache(threshold=0.75, ttl_seconds=CACHE_TTL)


@track_operation_time("weather_analysis")
async def analyze_weather_data(
    request_message: str, weather_data: dict, timing_collector: TimingCollector
):
    """Generate weather analysis using normalized city name and user's question"""
    # First get the normalized city from the weather data
    normalized_city = weather_data["normalized_city"]

    # Create cache key using normalized city and request
    cache_key = f"{normalized_city} | {request_message}"
    logger.info(f"Using cache key: {cache_key}")

    # Try to get from cache using normalized city
    hit, cached_result = await weather_analysis_cache.get(cache_key)
    if hit:
        logger.info(f"Cache hit for: {cache_key}")
        return cached_result

    # If not in cache, generate new analysis
    content = WEATHER_ANALYSIS_PROMPT.format(
        user=request_message, weather_data=str(weather_data)
    )
    logger.info(f"Cache miss for {cache_key}, generating new analysis")

    response = await llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "system", "content": content}],
        max_tokens=512,
        temperature=0,
    )
    result = response.choices[0].message.content

    # Cache using normalized city in the key
    await weather_analysis_cache.set(cache_key, result)
    return result


@semantic_cache(threshold=0.90, ttl_seconds=CACHE_TTL)
@track_operation_time("chat_response")
async def generate_chat_response(
    request_message: str, timing_collector: TimingCollector
):
    """Generate a general chat response"""
    response = await llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a friendly weather assistant. Provide helpful and concise responses.",
            },
            {"role": "user", "content": request_message},
        ],
        max_tokens=256,
        temperature=0,
    )
    return response.choices[0].message.content


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/chat", response_model=ChatResponseWithTiming)
async def chat(request: ChatRequest):
    """Main chat endpoint with cleaner structure"""
    try:
        timing_collector = TimingCollector()
        logger.info(f"Received message: {request.message}")

        intent_response = await detect_intent(
            request.message, timing_collector=timing_collector
        )
        intent = intent_response.choices[0].message.content.strip()
        logger.info(f"Detected intent: {intent}")

        if intent == "WEATHER_QUERY":
            weather_data = await fetch_all_weather_data(
                request.message, timing_collector=timing_collector
            )
            analysis = await analyze_weather_data(
                request.message, weather_data, timing_collector=timing_collector
            )
            return ChatResponseWithTiming(
                type="weather",
                message=analysis,
                data=weather_data,
                timings=await timing_collector.get_timings(),
            )
        else:
            message = await generate_chat_response(
                request_message=request.message, timing_collector=timing_collector
            )

            return ChatResponseWithTiming(
                type="chat",
                message=message,
                data=None,
                timings=await timing_collector.get_timings(),
            )

    except Exception as e:
        logger.exception("Error in chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code, content={"detail": str(exc.detail)}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


def wait_for_healthy(base_url: str, service_name: str, health_url: str):
    """Wait for a service to be healthy with configurable retry settings."""
    @retry(
        stop=stop_after_attempt(60),
        wait=wait_fixed(20),
        retry=(
            retry_if_exception_type(httpx.RequestError)
            | retry_if_result(lambda r: r.status_code != 200)
        ),
        before_sleep=lambda retry_state: logger.info(
            f"Waiting for {service_name} at {health_url} to start (attempt {retry_state.attempt_number}/60)..."
        ),
    )
    async def _check_health(health_url: str):
        async with httpx.AsyncClient() as client:
            return await client.get(health_url, timeout=5)

    return _check_health(health_url)


def check_port(port: int) -> bool:
    """Check if a port is in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("0.0.0.0", port))
            return True
        except OSError:
            return False


def cleanup_port(port: int) -> None:
    """Force cleanup of a port if it's in use."""
    for proc in psutil.process_iter(["pid", "name", "connections"]):
        try:
            for conn in proc.connections():
                if conn.laddr.port == port:
                    print(f"Killing process {proc.pid} using port {port}")
                    psutil.Process(proc.pid).terminate()
                    try:
                        psutil.Process(proc.pid).wait(timeout=3)
                    except psutil.TimeoutExpired:
                        psutil.Process(proc.pid).kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8001, reload=True)
