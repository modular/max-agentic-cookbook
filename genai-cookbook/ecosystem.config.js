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
                NODE_ENV: 'production',
            },
        },
        {
            name: 'nextjs-app',
            script: '/bin/bash',
            args: [
                '-c',
                'node_modules/.bin/wait-on http://localhost:8000/health -t 600000 -i 5000 -v && npm start',
            ],
            interpreter: 'none',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
        },
    ],
}
