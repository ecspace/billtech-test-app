import amqp from 'amqplib';
import { MongoClient, ObjectId } from 'mongodb';

import config from './config.js';

const EXCHANGE = config.exchange;
const userListRouteKey = 'user.get';
const userTotalRouteKey = 'user.totals';
const userByIdRouteKey = 'user.get_by_id';
const ROUTING_BINDINGS = [
  userListRouteKey,
  userTotalRouteKey,
  userByIdRouteKey
];

// Mongo
const client = new MongoClient(config.mongoUrl);
await client.connect();
const users = client.db('testdb').collection('users');

// AMQP
const connection = await amqp.connect(config.rabbitUrl);
const channel = await connection.createChannel();
await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
const q = await channel.assertQueue('user-service-queue', { durable: true });

for (const key of ROUTING_BINDINGS) {
  await channel.bindQueue(q.queue, EXCHANGE, key);
}

channel.consume(q.queue, async (msg) => {
  if (!msg) return;
  try {
    const routingKey = msg.fields.routingKey;

    if (ROUTING_BINDINGS.includes(routingKey) < 0) {
      throw 'routing not found';
    }
    const body = JSON.parse(msg.content.toString());
    console.log('Consume body', body, routingKey);

    let response = null;
    
    if (routingKey === userByIdRouteKey) {
      response = await users.findOne({ _id: new ObjectId(body.id) }, { projection: { password: 0 } });
      console.log('list response', response);
    }
    
    if (routingKey === userListRouteKey) {
      const { page = 1, limit = 10, country, city } = body || {};
      const query = {};

      if (country) query.country = country;
      if (city) query.city = city;

      const count = await users.countDocuments(query);
      const data = await users.find(query).sort({ _id: 1 }) .skip((page - 1) * limit).limit(limit).project({ password: 0 }).toArray();

      response = { count, data };
      console.log('getUser response', response);
    }
    
    if (routingKey === userTotalRouteKey) {
      response = await users.aggregate([
        { $group: { _id: { country: '$country', city: '$city' }, usersCount: { $sum: 1 } } },
        { $project: { _id: 0, country: '$_id.country', city: '$_id.city', usersCount: 1 } }
      ]).toArray();
      console.log('getTotals response', response);
    }

    if (msg.properties.replyTo) {
      channel.publish('', msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
        correlationId: msg.properties.correlationId
      });
    }
    
    channel.ack(msg);
  } catch (err) {
    console.error('user-service error', err);
    channel.nack(msg, false, false);
  }
});

console.log('Started user service');
