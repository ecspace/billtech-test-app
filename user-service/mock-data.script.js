import { faker } from '@faker-js/faker';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const users = client.db('testdb').collection('users');


const count = process.env.COUNT ? parseInt(process.env.COUNT) : 1000;
console.log(`Seeding ${count} users...`);
const batch = [];
for (let i = 0; i < count; i++) {
  batch.push({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    country: faker.location.country(),
    city: faker.location.city()
  });
  if (batch.length === 1000) { await users.insertMany(batch); batch.length = 0; }
}

if (batch.length) await users.insertMany(batch);

console.log('Done');
await client.close();
