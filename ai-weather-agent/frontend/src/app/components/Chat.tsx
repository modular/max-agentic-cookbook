'use client';
import React, { useState, useRef, useEffect } from 'react';
import WeatherCard from './WeatherCard';
import LoadingSpinner from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    data?: any;
    timings?: Array<{
        operation: string;
        duration_ms: number;
    }>;
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentTimings, setCurrentTimings] = useState<Array<{
        operation: string;
        duration_ms: number;
    }>>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setIsLoading(true);
        setCurrentTimings([]);

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const response = await fetch('http://localhost:8001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message,
                    data: data.data,
                    timings: data.timings
                }]);
                setCurrentTimings(data.timings || []);
            } else {
                throw new Error(data.detail || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="bg-blue-500 text-white px-4 py-3">
                <h2 className="font-semibold">Weather Assistant</h2>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-lg font-medium mb-2">👋 Ask me about the weather!</p>
                        <div className="text-sm">
                            <p className="mb-2">Try questions like:</p>
                            <ul className="space-y-1">
                                <li>"What's the weather in London?"</li>
                                <li>"Is it raining in Tokyo?"</li>
                                <li>"Weather forecast for New York"</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    messages.map((message, idx) => (
                        <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100'
                                }`}>
                                <ReactMarkdown
                                    className={`prose ${message.role === 'user' ? 'prose-invert' : ''} max-w-none`}
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                                {message.data && <WeatherCard data={message.data} />}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <LoadingSpinner isLoading={isLoading} timings={currentTimings} />

            {/* Input area */}
            <div className="border-t bg-white p-3">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="What's the weather in Tokyo?"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                                 disabled:opacity-50 transition-colors duration-200"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
