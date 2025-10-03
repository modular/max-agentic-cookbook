module.exports = {
    apps: [
        {
            name: 'max-llm',
            script: 'max',
            args: `serve --model ${process.env.MAX_MODEL || 'google/gemma-3-27b-it'} --trust-remote-code`,
            interpreter: 'none',
            autorestart: true,
            watch: false,
            max_memory_restart: '4G',
            env: {
                MODULAR_STRUCTURED_LOGGING: 'False',
                MAX_SERVE_PORT: 8000,
                NODE_ENV: 'production',
            },
        },
        {
            name: 'web-app',
            script: '/bin/bash',
            args: [
                '-c',
                'wait-on http-get://0.0.0.0:8000/health -t 600000 -i 2000 && npm start',
            ],
            interpreter: 'none',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
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
