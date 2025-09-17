import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.NEXT_PUBLIC_MONGO_URI || 'mongodb://localhost:27017/';
const client = new MongoClient(uri);

let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getTrendsCollection(): Promise<Collection> {
  const c = await getMongoClient();
  const db: Db = c.db('trends');
  return db.collection('daily_trends');
}
