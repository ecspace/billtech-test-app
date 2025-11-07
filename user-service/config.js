import 'dotenv/config';

export default {
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchange: process.env.EXCHANGE_NAME || 'users_exchange'
};