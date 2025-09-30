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
                NODE_ENV: 'production',
            },
        },
        {
            name: 'nextjs-app',
            script: 'npx',
            args: 'wait-on http://localhost:8000/health -t 600000 && npm start',
            interpreter: 'bash',
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
