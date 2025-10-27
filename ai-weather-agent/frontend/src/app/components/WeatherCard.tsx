'use client';
import React from 'react';

interface WeatherData {
    weather: {
        location: {
            name: string;
            country: string;
            localtime: string;
        };
        current: {
            temperature: number;
            condition: string;
            feels_like: number;
            humidity: number;
            wind_kph: number;
            wind_dir: string;
            pressure_mb: number;
            precip_mm: number;
            uv: number;
        };
        forecast: Array<{
            date: string;
            max_temp: number;
            min_temp: number;
            condition: string;
            chance_of_rain: number;
        }>;
    };
    air_quality: {
        aqi: number;
        pm2_5: number;
        pm10: number;
        no2: number;
        o3: number;
        co: number;
    };
    space_weather: {
        kp_index: number;
        aurora_visible: boolean;
        solar_radiation: string;
        forecast: string;
        estimated_kp?: number;
        time_tag?: string;
    };
}

interface WeatherCardProps {
    data: WeatherData;
}

export default function WeatherCard({ data }: WeatherCardProps) {
    if (!data?.weather?.location) {
        return <div className="p-4 text-gray-500">Loading weather data...</div>;
    }

    const { weather, air_quality, space_weather } = data;
    const { location, current, forecast } = weather;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-lg">
            {/* Current Weather */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Current Weather
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Temperature</p>
                        <p className="text-2xl font-semibold text-gray-800">
                            {current.temperature}°C
                            <span className="text-base text-gray-500 ml-1">
                                ({current.temperature * 9 / 5 + 32}°F)
                            </span>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Condition</p>
                        <p className="text-lg text-gray-800">{current.condition}</p>
                    </div>
                </div>
            </div>

            {/* Forecast */}
            {forecast && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">3-Day Forecast</h4>
                    <div className="space-y-3">
                        {forecast.map((day: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-gray-700">{day.date}</p>
                                    <p className="text-sm text-gray-600">{day.condition}</p>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    <span className="text-red-500">↑{day.max_temp}°C</span>
                                    <span className="mx-2">|</span>
                                    <span className="text-blue-500">↓{day.min_temp}°C</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Air Quality */}
            {data.air_quality && Object.keys(data.air_quality).length > 0 ? (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Air Quality</h4>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            {data.air_quality.aqi && (
                                <div>
                                    <p className="text-sm text-gray-600">AQI</p>
                                    <p className="text-lg font-medium text-gray-800">{data.air_quality.aqi}</p>
                                </div>
                            )}
                            {data.air_quality.pm2_5 && (
                                <div>
                                    <p className="text-sm text-gray-600">PM2.5</p>
                                    <p className="text-lg font-medium text-gray-800">{data.air_quality.pm2_5} μg/m³</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Air Quality</h4>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500 italic">
                            Air quality data temporarily unavailable
                        </p>
                    </div>
                </div>
            )}

            {/* Space Weather */}
            {data.space_weather && (
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Space Weather</h4>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-600">KP Index</p>
                                <p className="text-lg font-medium text-gray-800">
                                    {data.space_weather.kp_index}
                                    <span className="text-sm text-gray-500 ml-2">
                                        (Estimated: {data.space_weather.estimated_kp || 'N/A'})
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Aurora Visibility</p>
                                <p className="text-lg font-medium text-gray-800">
                                    {Number(data.space_weather.kp_index) > 4 ?
                                        'Possible aurora activity' :
                                        'Low probability of aurora'
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Last Updated</p>
                                <p className="text-sm text-gray-500">
                                    {data.space_weather.time_tag ?
                                        new Date(data.space_weather.time_tag).toLocaleString() :
                                        'N/A'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
