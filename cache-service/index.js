import amqp from 'amqplib';

import config from './config.js';
import cache from './cache.js';

const EXCHANGE = config.exchange;
const userByIdCacheKey = 'cache.user.get_by_id';
const userByIdRouteKey = 'user.get_by_id';

// AMQP
const connection = await amqp.connect(config.rabbitUrl);
const channel = await connection.createChannel();
await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
const q = await channel.assertQueue('cache-service-queue', { durable: true });

await channel.bindQueue(q.queue, EXCHANGE, userByIdCacheKey);

const replyQueue = await channel.assertQueue('', { exclusive: true });
const pendingRequests = new Map();
const inProgress = new Map();

channel.consume(replyQueue.queue, msg => {
  const { correlationId } = msg.properties;
  const data = JSON.parse(msg.content.toString());
  const resolver = pendingRequests.get(correlationId);
  if (resolver) {
    resolver(data);
    pendingRequests.delete(correlationId);
  }
}, { noAck: true });

channel.consume(q.queue, async msg => {
  try {
    const { id } = JSON.parse(msg.content.toString());
    const { correlationId, replyTo } = msg.properties;

    console.log('CACHE service:', id);

    const cached = cache.get(id);
    if (cached) {
      console.log('CACHE HIT', id);
      channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(cached)), { correlationId });
      return channel.ack(msg);
    }

    if (inProgress.has(id)) {
      console.log('Request already in progress for', id);
      const result = await inProgress.get(id);

      channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), { correlationId });

      return channel.ack(msg);
    }

    const fetchPromise = new Promise((resolve) => {
      pendingRequests.set(correlationId, resolve);
    });

    inProgress.set(id, fetchPromise);

    channel.publish(EXCHANGE, userByIdRouteKey, Buffer.from(JSON.stringify({ id })), {
      correlationId,
      replyTo: replyQueue.queue
    });

    const data = await fetchPromise;
    cache.set(id, data);
    console.log('CACHE MISS — FETCHED & SAVED', id);

    channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(data)), { correlationId });
    inProgress.delete(id);
    channel.ack(msg);
  } catch (err) {
    console.error('cache-service error', err);
    channel.nack(msg, false, false);
  }
});

console.log('Started cache service');
