import { createClient } from 'redis';

// Create Redis client using environment variable
const redisClient = createClient({
  url: process.env.REDIS_URL || process.env.KV_REST_API_URL
});

// Connect to Redis
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Initialize connection
let isConnected = false;

async function getRedisClient() {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
  return redisClient;
}

export { getRedisClient };
