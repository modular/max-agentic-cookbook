module.exports = {
    apps: [
        {
            name: 'max-llm',
            script: '/bin/bash',
            args: [
                '-c',
                'exec python -m max.entrypoints.pipelines serve --model-path "${MAX_MODEL:-google/gemma-3-27b-it}" --trust-remote-code',
            ],
            interpreter: 'none',
            autorestart: true,
            watch: false,
            max_memory_restart: '4G',
            env: {
                MODULAR_STRUCTURED_LOGGING: 'False',
                MAX_SERVE_PORT: 8000,
            },
        },
        {
            name: 'web-app',
            script: '/bin/bash',
            args: [
                '-c',
                'wait-on http-get://0.0.0.0:8000/v1/health -t 600000 -i 2000 && cd backend && uv run uvicorn src.main:app --host 0.0.0.0 --port 8010',
            ],
            interpreter: 'none',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                COOKBOOK_ENDPOINTS: JSON.stringify([
                    {
                        id: 'max',
                        baseUrl: 'http://0.0.0.0:8000/v1',
                        apiKey: 'EMPTY',
                    },
                ]),
            },
        },
    ],
}
