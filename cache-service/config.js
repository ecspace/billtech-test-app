import 'dotenv/config';

export default {
  ttl: parseInt(process.env.CACHE_TTL) || 60000,
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchange: process.env.EXCHANGE_NAME || 'users_exchange'
};
