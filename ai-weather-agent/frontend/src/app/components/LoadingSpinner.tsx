'use client';
import React from 'react';

interface OperationTiming {
    operation: string;
    duration_ms: number;
}

interface LoadingSpinnerProps {
    isLoading: boolean;
    timings?: OperationTiming[];
}

const operationLabels: Record<string, string> = {
    'intent_detection': 'Analyzing question',
    'city_normalization': 'Normalizing city name',
    'weather_data_fetch': 'Getting weather data',
    'weather_analysis': 'Creating weather report',
    'chat_response': 'Generating chat response'
};

export default function LoadingSpinner({ isLoading, timings }: LoadingSpinnerProps) {
    if (!isLoading && !timings?.length) {
        return null;
    }

    return (
        <div className="flex flex-col space-y-2 p-4 bg-white/50 rounded-lg backdrop-blur-sm">
            {isLoading && (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">Processing request...</span>
                </div>
            )}

            {timings && timings.length > 0 && (
                <div className="space-y-1.5 text-sm">
                    {timings.map((timing, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-600">
                            <span>{operationLabels[timing.operation] || timing.operation}</span>
                            <span className="text-gray-400">{timing.duration_ms.toFixed(0)}ms</span>
                        </div>
                    ))}
                    <div className="flex justify-between items-center text-gray-700 font-medium pt-1 border-t border-gray-100">
                        <span>Total Time</span>
                        <span>{timings.reduce((acc, t) => acc + t.duration_ms, 0).toFixed(0)}ms</span>
                    </div>
                </div>
            )}
        </div>
    );
}
