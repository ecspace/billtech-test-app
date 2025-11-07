import Fastify from 'fastify';
import amqp from 'amqplib';

import users from './routes/users.js';
import config from './config.js';

const fastify = Fastify({ logger: true });

let channel;

const start = async () => {
  const connection = await amqp.connect(config.rabbitUrl);

  channel = await connection.createChannel();
  await channel.assertExchange(config.exchange, 'direct', { durable: true });
  
  fastify.decorate('mqChannel', channel);
  fastify.decorate('exchange', config.exchange);
  
  users(fastify);

  return fastify.listen({ port: config.port, host: '0.0.0.0' });
};


setTimeout(start, 1000);
// start();
