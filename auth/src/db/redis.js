const { Redis } = require('ioredis');

// During tests we don't want to connect to a production Redis instance.
// Use an in-memory mock when running under Jest (NODE_ENV === 'test')
// or when explicitly requested via USE_REDIS_MOCK.
const useMock = process.env.NODE_ENV === 'test' || process.env.USE_REDIS_MOCK === 'true';

if (useMock) {
    // Simple in-memory Redis-like mock implementing async set/get/del and basic EX handling.
    const store = new Map();
    const timers = new Map();

    const redisMock = {
        async set(key, value, ...args) {
            store.set(key, value);
            // handle EX ttl: set(key, value, 'EX', seconds)
            for (let i = 0; i < args.length; i++) {
                if (args[i] === 'EX') {
                    const seconds = Number(args[i + 1]) || 0;
                    if (timers.has(key)) clearTimeout(timers.get(key));
                    if (seconds > 0) {
                        const t = setTimeout(() => {
                            store.delete(key);
                            timers.delete(key);
                        }, seconds * 1000);
                        timers.set(key, t);
                    }
                }
            }
            return 'OK';
        },
        async get(key) {
            return store.has(key) ? store.get(key) : null;
        },
        async del(key) {
            if (timers.has(key)) {
                clearTimeout(timers.get(key));
                timers.delete(key);
            }
            return store.delete(key) ? 1 : 0;
        },
        on() {
            // noop for events like 'connect'
        },
        async quit() {
            // noop
        },
        async disconnect() {
            // noop
        },
    };

    module.exports = redisMock;
} else {
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    redis.on('connect', () => {
        console.log('Connected to Redis!');
    });

    module.exports = redis;
}