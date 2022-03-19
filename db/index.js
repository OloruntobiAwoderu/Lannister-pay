import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config()

const redisClient = createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT
});

redisClient.on('error', (err) => console.error(`REDIS_ERROR ===== ${JSON.stringify(err)}`));

export { redisClient };