import 'dotenv/config';

export default {
  port: process.env.ORCHESTRATOR_PORT || 3000,
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchange: process.env.EXCHANGE_NAME || 'users_exchange',
};
