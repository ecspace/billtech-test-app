import * as users_schema from '../schemas/users_schema.js';

export default function (fastify) {
  const { mqChannel, exchange } = fastify;

  fastify.get('/users', users_schema.getUsersSchema, async (req, reply) => {
    try {
      const correlationId = crypto.randomUUID();
      const queue = await mqChannel.assertQueue('', { exclusive: true });

      return new Promise((resolve) => {
        mqChannel.consume(queue.queue, msg => {
          if (msg.properties.correlationId === correlationId) {
            const data = JSON.parse(msg.content.toString());

            resolve(reply.send(data));
          }
        }, { noAck: true });
        
        mqChannel.publish(exchange, 'user.get', Buffer.from(JSON.stringify(req.query)), {
          correlationId,
          replyTo: queue.queue,
        });
      });
    } catch (err) {
      console.log(err);

      return reply.status(500).send({ error: err });
    }
  });
  
  fastify.get('/users/:id', users_schema.getUserByIdSchema, async (req, reply) => {
    try {
      const correlationId = crypto.randomUUID();
      const queue = await mqChannel.assertQueue('', { exclusive: true });
      const id = req.params.id;

      return new Promise((resolve) => {
        mqChannel.consume(queue.queue, msg => {
          if (msg.properties.correlationId === correlationId) {
            const data = JSON.parse(msg.content.toString());
            
            if (!data) reply.code(404).send({ message: 'User not found' });

            else resolve(reply.send(data));
          }
        }, { noAck: true });
        
        mqChannel.publish(exchange, 'cache.user.get_by_id', Buffer.from(JSON.stringify({ id })), {
          correlationId,
          replyTo: queue.queue,
        });
      });
    } catch (err) {
      console.log(err);

      return reply.status(500).send({ error: err });
    }
  });
  
  fastify.get('/users/totals', async (req, reply) => {
    try {
      const correlationId = crypto.randomUUID();
      const queue = await mqChannel.assertQueue('', { exclusive: true });
      
      return new Promise((resolve) => {
        mqChannel.consume(queue.queue, msg => {
          if (msg.properties.correlationId === correlationId) {
            const data = JSON.parse(msg.content.toString());

            resolve(reply.send(data));
          }
        }, { noAck: true });
        
        mqChannel.publish(exchange, 'user.totals', Buffer.from(JSON.stringify('')), {
          correlationId,
          replyTo: queue.queue,
        });
      });
    } catch (err) {
      console.log(err);

      return reply.status(500).send({ error: err });
    }
  });
}
